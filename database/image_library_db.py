"""
图片库独立数据库连接模块
连接到独立的 image_library 数据库
"""

from pymongo import MongoClient
from utils.logger import get_logger
from utils.config_loader import load_system_config

logger = get_logger(__name__)


class ImageLibraryDB:
    """图片库数据库管理类（独立数据库）"""

    _instance = None
    _client = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """初始化图片库数据库连接"""
        if not hasattr(self, 'initialized'):
            self._connect()
            self.initialized = True

    def _connect(self):
        """连接到独立的图片库数据库"""
        try:
            # 从系统配置读取 MongoDB 连接信息
            config = load_system_config()
            db_config = config.get('database', {})

            db_host = db_config.get('host', 'localhost')
            db_port = db_config.get('port', 27017)

            # 图片库使用独立的数据库名
            image_library_db_name = 'image_library'

            # 创建连接
            connect_str = f"mongodb://{db_host}:{db_port}/"

            self._client = MongoClient(
                connect_str,
                maxPoolSize=30,
                minPoolSize=2,
                serverSelectionTimeoutMS=5000,
                socketTimeoutMS=30000,
                connectTimeoutMS=10000,
                heartbeatFrequencyMS=10000,
                retryWrites=True,
                retryReads=True
            )

            self._db = self._client[image_library_db_name]

            logger.info(f"图片库数据库连接成功: {db_host}:{db_port}/{image_library_db_name}")

        except Exception as e:
            logger.error(f"图片库数据库连接失败: {e}")
            raise

    def get_images_collection(self, site_id: str):
        """获取指定站点的图片索引表"""
        return self._db[f"{site_id}_images"]

    def get_storage_collection(self, site_id: str):
        """获取指定站点的存储表"""
        return self._db[f"{site_id}_storage"]

    def get_db(self):
        """获取数据库实例"""
        return self._db

    def close(self):
        """关闭数据库连接"""
        if self._client:
            self._client.close()
            logger.info("图片库数据库连接已关闭")


# 全局实例
_image_library_db = None


def get_image_library_db() -> ImageLibraryDB:
    """获取图片库数据库实例"""
    global _image_library_db
    if _image_library_db is None:
        _image_library_db = ImageLibraryDB()
    return _image_library_db
