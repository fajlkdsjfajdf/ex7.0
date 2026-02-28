"""
图片库模型 - 独立数据库，两层表结构

数据库结构:
- image_library (独立数据库)
  ├── {site}_images    # 图片索引表（每张图一条记录）
  └── {site}_storage   # 存储表（MD5去重）

使用方式:
    image_library = get_image_library('cm')
    image_library.save_image(image_data, aid=123, pid=456, page_num=1, image_type='content')
    image_library.get_image(aid=123, pid=456, page_num=1, image_type='content')
"""

import hashlib
import io
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple
from bson.objectid import ObjectId
from PIL import Image

from database.image_library_db import get_image_library_db
from models.image_storage import get_image_storage
from utils.logger import get_logger

logger = get_logger(__name__)


class ImageLibrary:
    """
    图片库模型 - 独立数据库，两层表结构

    核心特性:
    - 独立数据库 image_library
    - 两层表结构: images (索引) + storage (存储)
    - 每张图片一条独立记录
    - MD5 去重在 storage 层实现
    - 通过 (aid, pid, page_num, image_type) 精确定位
    """

    def __init__(self, site_id: str):
        """
        初始化图片库

        Args:
            site_id: 站点ID (cm/km等)
        """
        self.site_id = site_id
        self._db = get_image_library_db()

        # 获取集合
        self._images_collection = None
        self._storage_collection = None

        # DAT 文件存储
        self._storage = get_image_storage(site_id)

    @property
    def images_collection(self):
        """获取图片索引表"""
        if self._images_collection is None:
            self._images_collection = self._db.get_images_collection(self.site_id)
        return self._images_collection

    @property
    def storage_collection(self):
        """获取存储表"""
        if self._storage_collection is None:
            self._storage_collection = self._db.get_storage_collection(self.site_id)
        return self._storage_collection

    # ==================== 索引创建 ====================

    @staticmethod
    def create_indexes_for_site(site_id: str):
        """
        为指定站点创建索引

        Args:
            site_id: 站点ID
        """
        db = get_image_library_db()
        images_collection = db.get_images_collection(site_id)
        storage_collection = db.get_storage_collection(site_id)

        # images 表索引
        # 联合唯一索引：精确定位图片
        images_collection.create_index(
            [('aid', 1), ('pid', 1), ('page_num', 1), ('image_type', 1)],
            unique=True,
            name='idx_business_key'
        )
        # 存储引用索引
        images_collection.create_index([('storage_id', 1)], name='idx_storage_id')
        # MD5 索引（用于去重查询）
        images_collection.create_index([('md5', 1)], name='idx_md5')

        # storage 表索引
        # MD5 唯一索引
        storage_collection.create_index([('md5', 1)], unique=True, name='idx_md5_unique')
        # 引用计数索引（用于清理）
        storage_collection.create_index([('ref_count', 1)], name='idx_ref_count')

        logger.info(f"图片库索引创建完成: {site_id}")

    @staticmethod
    def create_all_indexes(site_ids: list = None):
        """
        为所有站点创建索引

        Args:
            site_ids: 站点ID列表，如果为None则从站点配置读取
        """
        if site_ids is None:
            from utils.config_loader import load_sites_config
            sites_config = load_sites_config()
            site_ids = list(sites_config.keys())

        for site_id in site_ids:
            try:
                ImageLibrary.create_indexes_for_site(site_id)
            except Exception as e:
                logger.error(f"创建索引失败: {site_id}, {e}")

    # ==================== 核心方法 ====================

    def save_image(
        self,
        image_data: bytes,
        aid: int,
        pid: int = None,
        page_num: int = None,
        image_type: str = 'content',
        source_url: str = ''
    ) -> Optional[str]:
        """
        保存图片到图片库

        工作流程:
        1. 检查 images 表是否已存在该图片（业务去重）
        2. 计算 MD5
        3. 查 storage 表是否存在相同 MD5
        4. 存在：复用 storage，ref_count++
        5. 不存在：写入 DAT，创建 storage 记录
        6. 创建 images 记录

        Args:
            image_data: 图片二进制数据
            aid: 漫画ID
            pid: 章节ID (封面/缩略图为 None)
            page_num: 页码 (封面/缩略图为 None)
            image_type: 图片类型 (cover/thumbnail/content)
            source_url: 原始URL

        Returns:
            image_id (images 表的 _id 字符串)，失败返回 None
        """
        try:
            # 1. 检查 images 表是否已存在
            existing_image = self.images_collection.find_one({
                'aid': aid,
                'pid': pid,
                'page_num': page_num,
                'image_type': image_type
            })

            if existing_image:
                logger.debug(f"图片已存在，跳过: aid={aid}, pid={pid}, page={page_num}, type={image_type}")
                return str(existing_image['_id'])

            # 2. 计算 MD5
            md5_hash = hashlib.md5(image_data).hexdigest()

            # 3. 获取图片信息
            img_info = self._get_image_info(image_data)

            # 4. 查或创建 storage 记录
            storage_id = self._get_or_create_storage(md5_hash, image_data, len(image_data))

            if not storage_id:
                logger.error(f"创建 storage 记录失败: md5={md5_hash}")
                return None

            # 5. 创建 images 记录
            doc = {
                'aid': aid,
                'pid': pid,
                'page_num': page_num,
                'image_type': image_type,
                'storage_id': ObjectId(storage_id),
                'md5': md5_hash,
                'source_url': source_url,
                'file_size': len(image_data),
                'width': img_info['width'],
                'height': img_info['height'],
                'mime_type': img_info['mime_type'],
                'created_at': datetime.now()
            }

            result = self.images_collection.insert_one(doc)
            image_id = str(result.inserted_id)

            logger.debug(f"保存图片成功: image_id={image_id}, aid={aid}, pid={pid}, page={page_num}, type={image_type}")

            return image_id

        except Exception as e:
            logger.error(f"保存图片失败: aid={aid}, pid={pid}, page={page_num}, type={image_type}, error={e}")
            return None

    def _get_or_create_storage(self, md5_hash: str, image_data: bytes, file_size: int) -> Optional[str]:
        """
        获取或创建 storage 记录

        Args:
            md5_hash: MD5 哈希值
            image_data: 图片二进制数据
            file_size: 文件大小

        Returns:
            storage_id (字符串)，失败返回 None
        """
        try:
            # 查找是否已存在
            existing_storage = self.storage_collection.find_one({'md5': md5_hash})

            if existing_storage:
                # 复用现有 storage，增加引用计数
                self.storage_collection.update_one(
                    {'_id': existing_storage['_id']},
                    {'$inc': {'ref_count': 1}}
                )
                logger.debug(f"复用 storage: md5={md5_hash}, ref_count={existing_storage['ref_count'] + 1}")
                return str(existing_storage['_id'])

            # 写入 DAT 文件
            storage_info = self._storage.save_image(image_data=image_data, image_id=md5_hash)

            # 创建 storage 记录
            storage_doc = {
                'md5': md5_hash,
                'ref_count': 1,
                'dat_file': storage_info['dat_file'],
                'offset': storage_info['offset'],
                'length': storage_info['length'],
                'file_path': storage_info['file_path'],
                'created_at': datetime.now()
            }

            result = self.storage_collection.insert_one(storage_doc)
            storage_id = str(result.inserted_id)

            logger.debug(f"创建 storage: md5={md5_hash}, storage_id={storage_id}")

            return storage_id

        except Exception as e:
            logger.error(f"获取或创建 storage 失败: md5={md5_hash}, error={e}")
            return None

    def _get_image_info(self, image_data: bytes) -> Dict[str, Any]:
        """
        获取图片信息

        Args:
            image_data: 图片二进制数据

        Returns:
            包含 width, height, mime_type 的字典
        """
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                mime_map = {
                    'JPEG': 'image/jpeg',
                    'PNG': 'image/png',
                    'GIF': 'image/gif',
                    'WEBP': 'image/webp',
                    'BMP': 'image/bmp'
                }
                return {
                    'width': img.width,
                    'height': img.height,
                    'mime_type': mime_map.get(img.format, 'image/jpeg')
                }
        except Exception as e:
            logger.warning(f"获取图片信息失败: {e}")
            return {
                'width': 0,
                'height': 0,
                'mime_type': 'image/jpeg'
            }

    # ==================== 查询方法 ====================

    def image_exists(
        self,
        aid: int,
        pid: int = None,
        page_num: int = None,
        image_type: str = 'content'
    ) -> bool:
        """
        检查图片是否存在

        Args:
            aid: 漫画ID
            pid: 章节ID
            page_num: 页码
            image_type: 图片类型

        Returns:
            是否存在
        """
        count = self.images_collection.count_documents({
            'aid': aid,
            'pid': pid,
            'page_num': page_num,
            'image_type': image_type
        })
        return count > 0

    def get_image(
        self,
        aid: int = None,
        pid: int = None,
        page_num: int = None,
        image_type: str = 'content',
        file_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        获取图片信息

        支持两种方式：
        1. 通过 file_id (MongoDB _id) 获取
        2. 通过业务参数 (aid, pid, page_num, image_type) 获取

        Args:
            aid: 漫画ID
            pid: 章节ID
            page_num: 页码
            image_type: 图片类型
            file_id: 图片ID (MongoDB _id)

        Returns:
            图片信息字典，不存在返回 None
        """
        # 方式1: 通过 file_id 获取
        if file_id:
            try:
                image = self.images_collection.find_one({'_id': ObjectId(file_id)})
            except Exception:
                return None
        # 方式2: 通过业务参数获取
        else:
            image = self.images_collection.find_one({
                'aid': aid,
                'pid': pid,
                'page_num': page_num,
                'image_type': image_type
            })

        if image:
            image['_id'] = str(image['_id'])
            if 'storage_id' in image and image['storage_id']:
                image['storage_id'] = str(image['storage_id'])

        return image

    def get_image_by_id(self, file_id: str) -> Optional[Dict[str, Any]]:
        """
        通过 file_id 获取图片信息

        Args:
            file_id: 图片ID (MongoDB _id)

        Returns:
            图片信息字典，不存在返回 None
        """
        return self.get_image(file_id=file_id)

    def get_image_data(
        self,
        aid: int,
        pid: int = None,
        page_num: int = None,
        image_type: str = 'content'
    ) -> Optional[bytes]:
        """
        获取图片二进制数据

        Args:
            aid: 漫画ID
            pid: 章节ID
            page_num: 页码
            image_type: 图片类型

        Returns:
            图片二进制数据，不存在返回 None
        """
        # 1. 获取图片信息
        image_info = self.get_image(aid, pid, page_num, image_type)

        if not image_info:
            return None

        # 2. 获取 storage 信息
        storage_id = image_info.get('storage_id')

        if not storage_id:
            return None

        storage = self.storage_collection.find_one({'_id': ObjectId(storage_id)})

        if not storage:
            logger.error(f"Storage 记录不存在: storage_id={storage_id}")
            return None

        # 3. 从 DAT 文件读取
        image_data = self._storage.read_image_raw(
            dat_file=storage['dat_file'],
            offset=storage['offset'],
            length=storage['length']
        )

        return image_data

    def get_image_data_by_info(self, image_info: Dict[str, Any]) -> Optional[bytes]:
        """
        根据图片信息获取二进制数据

        Args:
            image_info: 图片信息（包含 storage_id）

        Returns:
            图片二进制数据
        """
        storage_id = image_info.get('storage_id')

        if not storage_id:
            return None

        storage = self.storage_collection.find_one({'_id': ObjectId(storage_id)})

        if not storage:
            return None

        return self._storage.read_image_raw(
            dat_file=storage['dat_file'],
            offset=storage['offset'],
            length=storage['length']
        )

    # ==================== 批量方法 ====================

    def get_chapter_images(
        self,
        aid: int,
        pid: int,
        image_type: str = 'content'
    ) -> List[Dict[str, Any]]:
        """
        获取章节的所有图片

        Args:
            aid: 漫画ID
            pid: 章节ID
            image_type: 图片类型

        Returns:
            图片列表
        """
        cursor = self.images_collection.find({
            'aid': aid,
            'pid': pid,
            'image_type': image_type
        }).sort('page_num', 1)

        results = []
        for img in cursor:
            img['_id'] = str(img['_id'])
            if 'storage_id' in img and img['storage_id']:
                img['storage_id'] = str(img['storage_id'])
            results.append(img)

        return results

    def get_manga_images(
        self,
        aid: int,
        image_type: str = None
    ) -> List[Dict[str, Any]]:
        """
        获取漫画的所有图片

        Args:
            aid: 漫画ID
            image_type: 图片类型（None 表示所有类型）

        Returns:
            图片列表
        """
        query = {'aid': aid}
        if image_type:
            query['image_type'] = image_type

        cursor = self.images_collection.find(query)

        results = []
        for img in cursor:
            img['_id'] = str(img['_id'])
            if 'storage_id' in img and img['storage_id']:
                img['storage_id'] = str(img['storage_id'])
            results.append(img)

        return results

    def batch_check_exists(
        self,
        items: List[Dict[str, Any]]
    ) -> Dict[str, Dict[str, Any]]:
        """
        批量检查图片是否存在

        Args:
            items: 检查项列表，每项包含 {aid, pid, page_num, image_type}

        Returns:
            字典: {"aid_pid_page_type": image_info or None}
        """
        if not items:
            return {}

        # 构建查询条件
        or_conditions = []
        for item in items:
            condition = {
                'aid': item['aid'],
                'image_type': item['image_type']
            }
            if item.get('pid') is not None:
                condition['pid'] = item['pid']
            else:
                condition['pid'] = None
            if item.get('page_num') is not None:
                condition['page_num'] = item['page_num']
            else:
                condition['page_num'] = None
            or_conditions.append(condition)

        # 批量查询
        cursor = self.images_collection.find({'$or': or_conditions})

        results = {}
        for img in cursor:
            # 构建key
            pid_str = str(img.get('pid', 'none'))
            page_str = str(img.get('page_num', 'none'))
            key = f"{img['aid']}_{pid_str}_{page_str}_{img['image_type']}"

            img['_id'] = str(img['_id'])
            if 'storage_id' in img and img['storage_id']:
                img['storage_id'] = str(img['storage_id'])

            results[key] = img

        return results

    # ==================== 删除方法 ====================

    def delete_image(
        self,
        aid: int,
        pid: int = None,
        page_num: int = None,
        image_type: str = 'content'
    ) -> bool:
        """
        删除图片（减少 storage 引用计数）

        Args:
            aid: 漫画ID
            pid: 章节ID
            page_num: 页码
            image_type: 图片类型

        Returns:
            是否成功
        """
        try:
            # 1. 获取图片信息
            image = self.images_collection.find_one({
                'aid': aid,
                'pid': pid,
                'page_num': page_num,
                'image_type': image_type
            })

            if not image:
                return False

            storage_id = image.get('storage_id')

            # 2. 删除 images 记录
            self.images_collection.delete_one({'_id': image['_id']})

            # 3. 减少 storage 引用计数
            if storage_id:
                result = self.storage_collection.update_one(
                    {'_id': ObjectId(storage_id)},
                    {'$inc': {'ref_count': -1}}
                )

                # 如果 ref_count 为 0，可以考虑清理（暂不自动清理）
                storage = self.storage_collection.find_one({'_id': ObjectId(storage_id)})
                if storage and storage.get('ref_count', 0) <= 0:
                    logger.info(f"Storage 引用计数为 0，可清理: storage_id={storage_id}")

            logger.info(f"删除图片成功: aid={aid}, pid={pid}, page={page_num}, type={image_type}")
            return True

        except Exception as e:
            logger.error(f"删除图片失败: aid={aid}, pid={pid}, page={page_num}, error={e}")
            return False

    def delete_chapter_images(self, aid: int, pid: int) -> int:
        """
        删除章节所有图片

        Args:
            aid: 漫画ID
            pid: 章节ID

        Returns:
            删除数量
        """
        try:
            # 查找章节所有图片
            images = list(self.images_collection.find({
                'aid': aid,
                'pid': pid
            }))

            deleted_count = 0

            for image in images:
                storage_id = image.get('storage_id')

                # 删除 images 记录
                self.images_collection.delete_one({'_id': image['_id']})
                deleted_count += 1

                # 减少 storage 引用计数
                if storage_id:
                    self.storage_collection.update_one(
                        {'_id': ObjectId(storage_id)},
                        {'$inc': {'ref_count': -1}}
                    )

            logger.info(f"删除章节图片: aid={aid}, pid={pid}, count={deleted_count}")
            return deleted_count

        except Exception as e:
            logger.error(f"删除章节图片失败: aid={aid}, pid={pid}, error={e}")
            return 0

    def delete_manga_images(self, aid: int) -> int:
        """
        删除漫画所有图片

        Args:
            aid: 漫画ID

        Returns:
            删除数量
        """
        try:
            # 查找漫画所有图片
            images = list(self.images_collection.find({'aid': aid}))

            deleted_count = 0

            for image in images:
                storage_id = image.get('storage_id')

                # 删除 images 记录
                self.images_collection.delete_one({'_id': image['_id']})
                deleted_count += 1

                # 减少 storage 引用计数
                if storage_id:
                    self.storage_collection.update_one(
                        {'_id': ObjectId(storage_id)},
                        {'$inc': {'ref_count': -1}}
                    )

            logger.info(f"删除漫画图片: aid={aid}, count={deleted_count}")
            return deleted_count

        except Exception as e:
            logger.error(f"删除漫画图片失败: aid={aid}, error={e}")
            return 0

    # ==================== 统计方法 ====================

    def get_statistics(self) -> Dict[str, Any]:
        """
        获取图片库统计信息

        Returns:
            统计信息字典
        """
        # images 表统计
        total_images = self.images_collection.count_documents({})

        # 按 image_type 统计
        type_stats = list(self.images_collection.aggregate([
            {'$group': {
                '_id': '$image_type',
                'count': {'$sum': 1},
                'total_size': {'$sum': '$file_size'}
            }}
        ]))

        type_distribution = {}
        for stat in type_stats:
            image_type = stat['_id'] or 'unknown'
            type_distribution[image_type] = {
                'count': stat['count'],
                'size_mb': round(stat['total_size'] / (1024 * 1024), 2)
            }

        # storage 表统计
        total_storage = self.storage_collection.count_documents({})
        total_ref = list(self.storage_collection.aggregate([
            {'$group': {'_id': None, 'total': {'$sum': '$ref_count'}}}
        ]))
        total_ref_count = total_ref[0]['total'] if total_ref else 0

        # 计算去重率
        dedup_rate = 0
        if total_ref_count > 0:
            dedup_rate = round((1 - total_storage / total_ref_count) * 100, 2)

        return {
            'site_id': self.site_id,
            'total_images': total_images,
            'total_storage_records': total_storage,
            'total_ref_count': total_ref_count,
            'dedup_rate': dedup_rate,
            'type_distribution': type_distribution
        }

    def find_unused_storage(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        查找未使用的 storage 记录（ref_count <= 0）

        Args:
            limit: 返回数量限制

        Returns:
            未使用的 storage 列表
        """
        cursor = self.storage_collection.find({'ref_count': {'$lte': 0}}).limit(limit)

        results = []
        for storage in cursor:
            storage['_id'] = str(storage['_id'])
            results.append(storage)

        return results


# 便捷函数
def get_image_library(site_id: str) -> ImageLibrary:
    """
    获取指定站点的图片库实例

    Args:
        site_id: 站点ID

    Returns:
        ImageLibrary 实例
    """
    return ImageLibrary(site_id)
