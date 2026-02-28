"""
MongoDB数据库操作模块
"""

import os
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from pymongo import MongoClient, UpdateOne
from pymongo.errors import DuplicateKeyError
from bson.objectid import ObjectId
from utils.logger import get_logger

logger = get_logger(__name__)


class MongoDB:
    """MongoDB数据库操作类"""

    def __init__(self):
        """初始化数据库连接"""
        self.client = None
        self.db = None
        self.connect()

    def connect(self):
        """连接数据库"""
        try:
            # 优先从 Flask config 读取，如果没有则从环境变量读取
            db_host = None
            db_port = 27017
            db_name = 'manga_db'

            # 尝试从 config.py 读取
            try:
                from config import Config
                db_host = getattr(Config, 'MONGO_HOST', None)
                db_port = getattr(Config, 'MONGO_PORT', 27017)
                db_name = getattr(Config, 'MONGO_DB_NAME', 'manga_db')

                if db_host:
                    logger.info(f"使用 config.py 中的数据库配置: {db_host}:{db_port}/{db_name}")
            except (ImportError, AttributeError):
                logger.info("config.py 中未找到数据库配置，尝试使用环境变量")

            # 如果 config.py 中没有，从环境变量读取
            if not db_host:
                mongo_uri = os.getenv('MONGO_URI', '')
                if mongo_uri:
                    # 从 URI 中解析
                    if '://' in mongo_uri:
                        db_host = mongo_uri.split('://')[1].split(':')[0].split('/')[0]
                        if ':' in mongo_uri.split('://')[1]:
                            db_port = int(mongo_uri.split(':')[2].split('/')[0])
                        if '/' in mongo_uri:
                            db_name = mongo_uri.split('/')[-1] or db_name
                    db_name = os.getenv('DB_NAME', db_name)
                else:
                    # 使用默认值
                    db_host = 'localhost'
                    logger.warning("未找到数据库配置，使用默认值: localhost:27017/manga_db")

            # 构建 URI
            mongo_uri = f"mongodb://{db_host}:{db_port}/"

            # 添加超时配置，防止连接卡死
            self.client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=5000,  # 5秒超时
                connectTimeoutMS=5000,
                socketTimeoutMS=30000
            )
            self.db = self.client[db_name]

            # 测试连接
            self.client.admin.command('ping')
            logger.info(f"MongoDB连接成功: {db_host}:{db_port}/{db_name}")
            return True
        except Exception as e:
            logger.error(f"MongoDB连接失败: {e}")
            self.client = None
            self.db = None
            return False

    def close(self):
        """关闭数据库连接"""
        if self.client:
            self.client.close()
            logger.info("MongoDB连接已关闭")

    def get_collection(self, collection_name: str):
        """获取集合"""
        if self.db is None:
            raise ValueError("数据库未连接")
        return self.db[collection_name]

    @staticmethod
    def _serialize_mongo_data(obj):
        """
        序列化MongoDB数据，将ObjectId等特殊类型转换为可JSON序列化的格式

        Args:
            obj: 要序列化的对象（dict、list、单个值）

        Returns:
            序列化后的对象
        """
        if obj is None:
            return None

        if isinstance(obj, ObjectId):
            return str(obj)

        if isinstance(obj, datetime):
            return obj.isoformat()

        if isinstance(obj, dict):
            return {key: MongoDB._serialize_mongo_data(value) for key, value in obj.items()}

        if isinstance(obj, list):
            return [MongoDB._serialize_mongo_data(item) for item in obj]

        return obj

    # ==================== 漫画主表操作 ====================

    def save_manga_list(self, manga_list: List[Dict], source_site: str = "cm") -> Tuple[int, int]:
        """
        批量保存漫画列表数据（使用upsert自动去重）

        Args:
            manga_list: 已转换格式的漫画列表数据
            source_site: 来源站点 (cm/jm等)

        Returns:
            (created_count, updated_count): 创建数量和更新数量
        """
        if not manga_list:
            return 0, 0

        # 检查连接
        if self.db is None:
            logger.error("MongoDB未连接，无法保存数据")
            return 0, 0

        # 表名格式：{site}_manga_main
        collection_name = f"{source_site}_manga_main"
        collection = self.get_collection(collection_name)
        operations = []

        for manga_data in manga_list:
            # 使用 upsert=True，MongoDB会自动判断插入或更新
            operations.append(UpdateOne(
                {'aid': manga_data['aid']},
                {'$set': manga_data},
                upsert=True
            ))

        # 批量执行
        if operations:
            try:
                result = collection.bulk_write(operations, ordered=False)
                logger.info(f"保存漫画列表完成: {collection_name}, 插入={result.upserted_count}, 更新={result.modified_count}")
                return result.upserted_count, result.modified_count
            except Exception as e:
                logger.error(f"批量保存漫画列表失败: {e}")
                return 0, 0

        return 0, 0

    # ==================== 章节表操作 ====================

    def save_chapter_list(self, aid: int, chapter_list: List[Dict], source_site: str = "cm") -> Tuple[int, int]:
        """
        批量保存章节列表数据（使用upsert自动去重）

        Args:
            aid: 漫画ID
            chapter_list: 已转换格式的章节列表数据
            source_site: 来源站点 (cm/jm等)

        Returns:
            (created_count, updated_count): 创建数量和更新数量
        """
        if not chapter_list:
            return 0, 0

        # 检查连接
        if self.db is None:
            logger.error("MongoDB未连接，无法保存章节数据")
            return 0, 0

        # 表名格式：{site}_manga_chapters
        collection_name = f"{source_site}_manga_chapters"
        collection = self.get_collection(collection_name)
        operations = []

        for chapter_data in chapter_list:
            # 使用 upsert=True，MongoDB会自动判断插入或更新
            operations.append(UpdateOne(
                {'aid': chapter_data['aid'], 'pid': chapter_data['pid']},
                {'$set': chapter_data},
                upsert=True
            ))

        # 批量执行
        if operations:
            try:
                result = collection.bulk_write(operations, ordered=False)
                logger.info(f"保存章节列表完成: {collection_name}, aid={aid}, 插入={result.upserted_count}, 更新={result.modified_count}")
                return result.upserted_count, result.modified_count
            except Exception as e:
                logger.error(f"批量保存章节列表失败: aid={aid}, error={e}")
                return 0, 0

        return 0, 0

    # ==================== 查询操作 ====================

    def get_manga_by_aid(self, aid: int, source_site: str = "cm") -> Optional[Dict]:
        """根据aid查询漫画"""
        collection_name = f"{source_site}_manga_main"
        collection = self.get_collection(collection_name)
        result = collection.find_one({'aid': aid})
        return self._serialize_mongo_data(result) if result else None

    def get_chapters_by_aid(self, aid: int, source_site: str = "cm") -> List[Dict]:
        """根据aid查询所有章节"""
        collection_name = f"{source_site}_manga_chapters"
        collection = self.get_collection(collection_name)
        result = list(collection.find({'aid': aid}).sort('order', 1))
        return self._serialize_mongo_data(result)

    def get_pending_manga_for_info(self, source_site: str = "cm", limit: int = 1000) -> List[Dict]:
        """获取需要爬取info的漫画（没有info_update或已过期）"""
        collection_name = f"{source_site}_manga_main"
        collection = self.get_collection(collection_name)
        query = {
            '$or': [
                {'info_update': None},
                {'info_update': {'$lt': datetime.now() - timedelta(hours=24)}}
            ]
        }
        result = list(collection.find(query).limit(limit).sort('list_update', -1))
        return self._serialize_mongo_data(result)

    def get_pending_chapters_for_content(self, source_site: str = "cm", limit: int = 10000) -> List[Dict]:
        """获取需要爬取content的章节"""
        collection_name = f"{source_site}_manga_chapters"
        collection = self.get_collection(collection_name)
        query = {
            '$or': [
                {'content_update': None},
                {'content_update': {'$lt': datetime.now() - timedelta(hours=24)}}
            ]
        }
        result = list(collection.find(query).limit(limit).sort('info_update', -1))
        return self._serialize_mongo_data(result)

    def get_pending_manga_for_cover(self, source_site: str = "cm", limit: int = 1000) -> List[Dict]:
        """获取需要下载封面的漫画"""
        collection_name = f"{source_site}_manga_main"
        collection = self.get_collection(collection_name)
        query = {
            '$or': [
                {'cover_load': 0},
                {'cover_load': None}
            ],
            'cover_path': {'$ne': '', '$exists': True}
        }
        result = list(collection.find(query).limit(limit).sort('list_update', -1))
        return self._serialize_mongo_data(result)

    # ==================== 图片库操作 ====================

    def save_image(self, file_path: str, source_url: str, source_aid: int, source_pid: Optional[int] = None,
                   source_type: str = "content", file_offset: int = 0, file_length: int = 0) -> Optional[ObjectId]:
        """
        保存图片到图片库（支持复用，通过MD5判断是否为同一图片）

        Args:
            file_path: 临时文件路径
            source_url: 来源URL
            source_aid: 来源漫画ID
            source_pid: 来源章节ID（封面图为None）
            source_type: 图片类型 (cover/thumbnail/content)
            file_offset: 文件偏移量（字节）
            file_length: 文件长度（字节）

        Returns:
            图片记录的_id，如果失败返回None
        """
        if self.db is None:
            logger.error("MongoDB未连接，无法保存图片")
            return None

        try:
            # 计算MD5
            md5_hash = self._calculate_md5(file_path)

            # 获取图片信息
            img_info = self._get_image_info(file_path)

            collection = self.get_collection('image_library')

            # 检查是否已存在（图片复用）
            existing = collection.find_one({'md5': md5_hash})

            if existing:
                # 图片已存在，复用记录，增加引用计数
                collection.update_one(
                    {'_id': existing['_id']},
                    {'$inc': {'ref_count': 1}}
                )
                logger.debug(f"图片复用: md5={md5_hash}, ref_count={existing.get('ref_count', 0) + 1}")
                return existing['_id']

            # 新图片，插入记录
            doc = {
                'md5': md5_hash,
                'file_path': file_path,
                'offset': file_offset,
                'length': file_length,
                'file_size': os.path.getsize(file_path),
                'mime_type': img_info['mime_type'],
                'width': img_info['width'],
                'height': img_info['height'],
                'source_url': source_url,
                'source_aid': source_aid,
                'source_pid': source_pid,
                'source_type': source_type,
                'ref_count': 1,
                'download_time': datetime.now(),
                'status': 'active'
            }

            result = collection.insert_one(doc)
            logger.debug(f"保存新图片: md5={md5_hash}, _id={result.inserted_id}")
            return result.inserted_id

        except DuplicateKeyError:
            # 并发情况：其他线程已插入相同MD5的图片，查询并复用
            logger.debug(f"并发插入相同MD5图片，尝试复用: md5={md5_hash}")
            collection = self.get_collection('image_library')
            existing = collection.find_one({'md5': md5_hash})
            if existing:
                collection.update_one(
                    {'_id': existing['_id']},
                    {'$inc': {'ref_count': 1}}
                )
                return existing['_id']
            return None
        except Exception as e:
            logger.error(f"保存图片失败: {e}")
            return None

    def _calculate_md5(self, file_path: str) -> str:
        """计算文件MD5"""
        md5 = hashlib.md5()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                md5.update(chunk)
        return md5.hexdigest()

    def _get_image_info(self, file_path: str) -> Dict:
        """获取图片信息"""
        try:
            from PIL import Image
            with Image.open(file_path) as img:
                return {
                    'width': img.width,
                    'height': img.height,
                    'mime_type': Image.MIME.get(img.format, 'image/jpeg')
                }
        except Exception as e:
            logger.warning(f"获取图片信息失败: {e}")
            return {
                'width': 0,
                'height': 0,
                'mime_type': 'image/jpeg'
            }

    def get_image_by_md5(self, md5: str) -> Optional[Dict]:
        """根据MD5查询图片"""
        if self.db is None:
            return None
        collection = self.get_collection('image_library')
        result = collection.find_one({'md5': md5})
        return self._serialize_mongo_data(result) if result else None

    def decrease_image_ref(self, image_id: ObjectId) -> bool:
        """
        减少图片引用计数

        Args:
            image_id: 图片_id

        Returns:
            是否成功
        """
        if self.db is None:
            return False

        try:
            collection = self.get_collection('image_library')
            result = collection.update_one(
                {'_id': image_id},
                {'$inc': {'ref_count': -1}}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"减少图片引用计数失败: {e}")
            return False



# 全局数据库实例（延迟初始化）
_mongo_db_instance = None


def get_mongo_db() -> MongoDB:
    """获取MongoDB实例（延迟初始化）"""
    global _mongo_db_instance
    if _mongo_db_instance is None:
        _mongo_db_instance = MongoDB()
    return _mongo_db_instance


# 向后兼容：直接访问 mongo_db 属性
class _MongoDBProxy:
    """MongoDB代理类，支持延迟初始化"""

    def __getattr__(self, name):
        return getattr(get_mongo_db(), name)


mongo_db = _MongoDBProxy()
