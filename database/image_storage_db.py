"""
图片存储数据库连接模块 - GridFS（按站点+类型分表）
连接到独立的 image_storage 数据库（专门存储图片二进制数据）
MongoDB: 192.168.1.222:27018
使用 GridFS 存储图片，按 {site}_{type} 组织 bucket
"""

from pymongo import MongoClient
import gridfs
from utils.logger import get_logger

logger = get_logger(__name__)

# 图片类型常量
IMAGE_TYPES = ['cover', 'thumbnail', 'content']


class ImageStorageDB:
    """图片存储数据库管理类 - GridFS（按类型分表）"""

    _instance = None
    _client = None
    _db = None
    _gridfs_buckets = {}  # 缓存 GridFS bucket，key: f"{site_id}_{image_type}"

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """初始化图片存储数据库连接"""
        if not hasattr(self, 'initialized'):
            self._connect()
            self.initialized = True

    def _connect(self):
        """连接到图片存储数据库"""
        try:
            from config import Config

            db_host = Config.IMAGE_STORAGE_HOST
            db_port = Config.IMAGE_STORAGE_PORT
            db_name = Config.IMAGE_STORAGE_DB_NAME

            connect_str = f"mongodb://{db_host}:{db_port}/"

            self._client = MongoClient(
                connect_str,
                maxPoolSize=50,
                minPoolSize=5,
                serverSelectionTimeoutMS=5000,
                socketTimeoutMS=60000,
                connectTimeoutMS=10000,
                heartbeatFrequencyMS=10000,
                retryWrites=True,
                retryReads=True
            )

            self._db = self._client[db_name]
            logger.info(f"图片存储数据库连接成功 (GridFS): {db_host}:{db_port}/{db_name}")

        except Exception as e:
            logger.error(f"图片存储数据库连接失败: {e}")
            raise

    def get_gridfs_bucket(self, site_id: str, image_type: str) -> gridfs.GridFSBucket:
        """
        获取指定站点和类型的 GridFS bucket

        Args:
            site_id: 站点ID (cm/jm/ex等)
            image_type: 图片类型 (cover/thumbnail/content)

        Returns:
            GridFSBucket 实例
        """
        if image_type not in IMAGE_TYPES:
            raise ValueError(f"Invalid image_type: {image_type}, must be one of {IMAGE_TYPES}")

        bucket_name = f"{site_id}_{image_type}"

        if bucket_name not in self._gridfs_buckets:
            self._gridfs_buckets[bucket_name] = gridfs.GridFSBucket(
                self._db,
                bucket_name=bucket_name
            )
            logger.debug(f"创建 GridFS bucket: {bucket_name}")

        return self._gridfs_buckets[bucket_name]

    def get_files_collection(self, site_id: str, image_type: str):
        """获取指定站点和类型的 files 集合"""
        bucket_name = f"{site_id}_{image_type}"
        return self._db[f"{bucket_name}.files"]

    def get_chunks_collection(self, site_id: str, image_type: str):
        """获取指定站点和类型的 chunks 集合"""
        bucket_name = f"{site_id}_{image_type}"
        return self._db[f"{bucket_name}.chunks"]

    def get_all_bucket_names(self, site_id: str) -> list:
        """
        获取指定站点的所有 bucket 名称

        Args:
            site_id: 站点ID

        Returns:
            bucket 名称列表，如 ['cm_cover', 'cm_thumbnail', 'cm_content']
        """
        return [f"{site_id}_{itype}" for itype in IMAGE_TYPES]

    def close(self):
        """关闭数据库连接"""
        if self._client:
            self._client.close()
            logger.info("图片存储数据库连接已关闭")


# 全局实例
_image_storage_db = None


def get_image_storage_db() -> ImageStorageDB:
    """获取图片存储数据库实例"""
    global _image_storage_db
    if _image_storage_db is None:
        _image_storage_db = ImageStorageDB()
    return _image_storage_db
