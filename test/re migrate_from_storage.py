"""
从 cm_storage 重新迁移到 GridFS

由于之前的迁移已将 cm_images.storage_id 更新为 GridFS 格式，
现在需要直接从 cm_storage 读取并重新上传。
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from bson.objectid import ObjectId
from models.image_storage import ImageStorage, get_gridfs_image_storage
from utils.logger import get_logger

logger = get_logger(__name__)


def remigrate_from_storage(site_id: str = 'cm'):
    """从 cm_storage 重新迁移到 GridFS"""
    # 连接数据库
    client = MongoClient('mongodb://192.168.1.222:27017/')
    db = client['image_library']

    storage_col = db[f'{site_id}_storage']
    images_col = db[f'{site_id}_images']

    # 获取所有 storage 记录
    storages = list(storage_col.find())
    logger.info(f"Found {len(storages)} storage records")

    # 创建存储实例
    dat_storage = ImageStorage(site_id)

    migrated = 0
    failed = 0

    # 存储 old_id -> new_id 的映射
    id_mapping = {}

    for storage in storages:
        old_id = str(storage['_id'])

        try:
            # 从 DAT 文件读取图片数据
            image_data = dat_storage.read_image_raw(
                dat_file=storage['dat_file'],
                offset=storage['offset'],
                length=storage['length']
            )

            if not image_data:
                logger.error(f"Failed to read: {storage['dat_file']}, offset={storage['offset']}")
                failed += 1
                continue

            # 上传到 GridFS (自动 MD5 去重)
            gridfs_storage = get_gridfs_image_storage(site_id, 'content')
            result = gridfs_storage.save_image(image_data)

            new_id = result['file_id']
            id_mapping[old_id] = new_id

            migrated += 1

            if migrated % 100 == 0:
                logger.info(f"Migrated: {migrated}/{len(storages)}")

        except Exception as e:
            logger.error(f"Error migrating {old_id}: {e}")
            failed += 1

    logger.info(f"Migration complete: {migrated} migrated, {failed} failed")

    # 更新 cm_images 中的 storage_id
    logger.info("Updating cm_images storage_id...")
    updated = 0
    for old_id, new_id in id_mapping.items():
        result = images_col.update_many(
            {'storage_id': old_id},
            {'$set': {'storage_id': new_id}}
        )
        updated += result.modified_count

    logger.info(f"Updated {updated} image records")

    return migrated, failed


if __name__ == '__main__':
    remigrate_from_storage('cm')
