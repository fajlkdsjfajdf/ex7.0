"""
图片数据迁移脚本 - 从 DAT 文件迁移到 GridFS

功能：
1. 从旧的 DAT 文件存储读取图片数据
2. 迁移到新的 GridFS 存储
3. 更新 image_library 数据库中的 storage_id 引用

使用方式：
    python test/migrate_images_to_gridfs.py --site cm --type content
    python test/migrate_images_to_gridfs.py --all
"""

import sys
import os
import argparse
import time
from datetime import datetime
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient, ASCENDING
from bson.objectid import ObjectId
from utils.logger import get_logger
from config import Config

logger = get_logger(__name__)


class ImageMigrator:
    """图片数据迁移器"""

    def __init__(self):
        """初始化迁移器"""
        # 连接数据库
        self._connect_databases()

        # 统计信息
        self.stats = {
            'total_images': 0,
            'migrated': 0,
            'skipped': 0,
            'failed': 0,
            'start_time': None,
            'end_time': None
        }

    def _connect_databases(self):
        """连接数据库"""
        # 1. 连接 image_library 数据库（索引库）- 固定使用 image_library
        self.library_client = MongoClient(
            f"mongodb://{Config.MONGO_HOST}:{Config.MONGO_PORT}/",
            serverSelectionTimeoutMS=5000
        )
        self.library_db = self.library_client['image_library']

        # 2. 连接 image_storage 数据库（GridFS 存储）
        self.storage_client = MongoClient(
            f"mongodb://{Config.IMAGE_STORAGE_HOST}:{Config.IMAGE_STORAGE_PORT}/",
            serverSelectionTimeoutMS=5000
        )
        self.storage_db = self.storage_client[Config.IMAGE_STORAGE_DB_NAME]

        logger.info("数据库连接成功")

    def get_storage_collection(self, site_id: str):
        """获取 storage 集合（旧的）"""
        return self.library_db[f"{site_id}_storage"]

    def get_images_collection(self, site_id: str):
        """获取 images 集合"""
        return self.library_db[f"{site_id}_images"]

    def get_gridfs_files_collection(self, site_id: str, image_type: str):
        """获取 GridFS files 集合"""
        bucket_name = f"{site_id}_{image_type}"
        return self.storage_db[f"{bucket_name}.files"]

    def migrate_site(self, site_id: str, image_type: str = None, dry_run: bool = False):
        """
        迁移指定站点的图片

        Args:
            site_id: 站点ID (cm/km等)
            image_type: 图片类型 (cover/thumbnail/content)，None 表示全部
            dry_run: 是否只检查不实际迁移
        """
        logger.info(f"开始迁移站点: {site_id}, 类型: {image_type or '全部'}")

        # 获取要迁移的图片类型
        if image_type:
            types = [image_type]
        else:
            types = ['cover', 'thumbnail', 'content']

        total_migrated = 0

        for img_type in types:
            migrated = self._migrate_by_type(site_id, img_type, dry_run)
            total_migrated += migrated

        logger.info(f"站点 {site_id} 迁移完成，共迁移 {total_migrated} 张图片")
        return total_migrated

    def _migrate_by_type(self, site_id: str, image_type: str, dry_run: bool):
        """
        按类型迁移图片

        Args:
            site_id: 站点ID
            image_type: 图片类型
            dry_run: 是否只检查不实际迁移

        Returns:
            迁移数量
        """
        images_collection = self.get_images_collection(site_id)
        storage_collection = self.get_storage_collection(site_id)

        # 查询该类型的图片
        cursor = images_collection.find({'image_type': image_type}).sort('created_at', 1)

        total = images_collection.count_documents({'image_type': image_type})
        logger.info(f"  类型 {image_type}: 共 {total} 张图片")

        migrated = 0
        skipped = 0
        failed = 0

        for idx, image in enumerate(cursor):
            self.stats['total_images'] += 1

            if (idx + 1) % 100 == 0:
                logger.info(f"    进度: {idx + 1}/{total}")

            storage_id = image.get('storage_id')
            if not storage_id:
                logger.warning(f"    图片无 storage_id: aid={image.get('aid')}")
                failed += 1
                continue

            try:
                # 检查是否已经是 GridFS ID（长度检查）
                if len(str(storage_id)) == 24 and str(storage_id).isalnum():
                    # 可能已经是 GridFS ID，检查 GridFS 中是否存在
                    gridfs_files = self.get_gridfs_files_collection(site_id, image_type)
                    exists = gridfs_files.find_one({'_id': ObjectId(storage_id)})
                    if exists:
                        skipped += 1
                        continue

                # 获取旧的 storage 记录
                storage = storage_collection.find_one({'_id': ObjectId(storage_id)})
                if not storage:
                    logger.warning(f"    Storage 记录不存在: {storage_id}")
                    failed += 1
                    continue

                # 读取 DAT 文件中的图片数据
                from models.image_storage import ImageStorage
                dat_storage = ImageStorage(site_id)

                image_data = dat_storage.read_image_raw(
                    dat_file=storage['dat_file'],
                    offset=storage['offset'],
                    length=storage['length']
                )

                if not image_data:
                    logger.warning(f"    无法读取图片数据: storage_id={storage_id}")
                    failed += 1
                    continue

                if dry_run:
                    logger.info(f"    [DRY RUN] 将迁移: aid={image.get('aid')}, size={len(image_data)}")
                    migrated += 1
                    continue

                # 保存到 GridFS
                from models.image_storage import get_gridfs_image_storage
                gridfs_storage = get_gridfs_image_storage(site_id, image_type)

                # 使用 MD5 作为文件名保存
                import hashlib
                md5_hash = hashlib.md5(image_data).hexdigest()

                result = gridfs_storage.save_image(image_data, image_id=md5_hash)
                new_file_id = result['file_id']

                # 更新 images 集合中的 storage_id
                images_collection.update_one(
                    {'_id': image['_id']},
                    {'$set': {'storage_id': new_file_id}}
                )

                migrated += 1

                if migrated % 10 == 0:
                    logger.info(f"    已迁移: {migrated}, 跳过: {skipped}, 失败: {failed}")

            except Exception as e:
                logger.error(f"    迁移失败: aid={image.get('aid')}, error={e}")
                failed += 1

        logger.info(f"  类型 {image_type} 完成: 迁移={migrated}, 跳过={skipped}, 失败={failed}")

        self.stats['migrated'] += migrated
        self.stats['skipped'] += skipped
        self.stats['failed'] += failed

        return migrated

    def cleanup_old_storage(self, site_id: str, confirm: bool = False):
        """
        清理旧的 storage 集合

        Args:
            site_id: 站点ID
            confirm: 是否确认删除
        """
        if not confirm:
            logger.warning("清理操作需要 --confirm 参数")
            return

        storage_collection = self.get_storage_collection(site_id)
        count = storage_collection.count_documents({})

        logger.info(f"准备删除 {site_id}_storage 集合，共 {count} 条记录")

        # 删除集合
        self.library_db.drop_collection(f"{site_id}_storage")
        logger.info(f"已删除 {site_id}_storage 集合")

    def print_summary(self):
        """打印迁移摘要"""
        duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds() if self.stats['end_time'] else 0

        print("\n" + "="*50)
        print("迁移摘要")
        print("="*50)
        print(f"总图片数:     {self.stats['total_images']}")
        print(f"已迁移:       {self.stats['migrated']}")
        print(f"已跳过:       {self.stats['skipped']}")
        print(f"失败:         {self.stats['failed']}")
        print(f"耗时:         {duration:.2f} 秒")
        if duration > 0:
            print(f"速度:         {self.stats['migrated']/duration:.2f} 张/秒")
        print("="*50)

    def close(self):
        """关闭数据库连接"""
        if hasattr(self, 'library_client'):
            self.library_client.close()
        if hasattr(self, 'storage_client'):
            self.storage_client.close()


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='图片数据迁移脚本')
    parser.add_argument('--site', type=str, help='站点ID (cm/km等)')
    parser.add_argument('--type', type=str, choices=['cover', 'thumbnail', 'content'], help='图片类型')
    parser.add_argument('--all', action='store_true', help='迁移所有站点')
    parser.add_argument('--dry-run', action='store_true', help='只检查不实际迁移')
    parser.add_argument('--cleanup', action='store_true', help='迁移后清理旧 storage 集合')
    parser.add_argument('--confirm', action='store_true', help='确认危险操作（如清理）')

    args = parser.parse_args()

    migrator = ImageMigrator()
    migrator.stats['start_time'] = datetime.now()

    try:
        if args.all:
            # 迁移所有站点
            from utils.config_loader import load_sites_config
            sites_config = load_sites_config()
            site_ids = list(sites_config.keys())

            for site_id in site_ids:
                migrator.migrate_site(site_id, args.type, args.dry_run)

        elif args.site:
            # 迁移指定站点
            migrator.migrate_site(args.site, args.type, args.dry_run)

            # 清理旧数据
            if args.cleanup:
                if args.type:
                    logger.warning("清理操作不支持指定类型，请手动清理整个 storage 集合")
                else:
                    migrator.cleanup_old_storage(args.site, args.confirm)
        else:
            parser.print_help()
            return

    except KeyboardInterrupt:
        logger.info("用户中断迁移")
    except Exception as e:
        logger.error(f"迁移过程出错: {e}")
        import traceback
        traceback.print_exc()
    finally:
        migrator.stats['end_time'] = datetime.now()
        migrator.print_summary()
        migrator.close()


if __name__ == '__main__':
    main()
