"""
数据库模块
提供数据库连接和模型
"""

import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from utils.logger import get_logger
from utils.config_loader import load_system_config

logger = get_logger(__name__)


class Database:
    """数据库管理类"""

    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """初始化数据库连接"""
        if not hasattr(self, 'initialized'):
            self._connect()
            self.initialized = True

    def _connect(self):
        """连接数据库"""
        try:
            # 优先从 Flask config 读取，如果没有则从 system_config.json 读取
            try:
                from config import Config
                db_host = getattr(Config, 'MONGO_HOST', None)
                db_port = getattr(Config, 'MONGO_PORT', None)
                db_name = getattr(Config, 'MONGO_DB_NAME', None)

                if db_host and db_port and db_name:
                    logger.info(f"使用 config.py 中的数据库配置")
                else:
                    raise AttributeError("Config 中缺少数据库配置，尝试使用 system_config.json")
            except (ImportError, AttributeError):
                # 从配置文件读取数据库配置
                config = load_system_config()
                db_config = config.get('database', {})

                db_host = db_config.get('host', 'localhost')
                db_port = db_config.get('port', 27017)
                db_name = db_config.get('name', 'manga_site')
                logger.info(f"使用 system_config.json 中的数据库配置")

            # 创建连接（带自动重连配置）
            connect_str = f"mongodb://{db_host}:{db_port}/"

            # MongoClient 配置说明：
            # - maxPoolSize: 连接池最大连接数（默认100）
            # - minPoolSize: 连接池最小连接数（默认0）
            # - serverSelectionTimeoutMS: 服务器选择超时（默认30秒）
            # - socketTimeoutMS: Socket超时（默认None，即永不超时）
            # - connectTimeoutMS: 连接超时（默认20秒）
            # - heartbeatFrequencyMS: 心跳频率（默认10秒）
            # - retryWrites: 自动重试写操作（默认True）
            # - retryReads: 自动重试读操作（默认True）
            self._client = MongoClient(
                connect_str,
                maxPoolSize=50,
                minPoolSize=5,
                serverSelectionTimeoutMS=5000,
                socketTimeoutMS=30000,
                connectTimeoutMS=10000,
                heartbeatFrequencyMS=10000,
                retryWrites=True,
                retryReads=True
            )

            self.db = self._client[db_name]

            logger.info(f"数据库连接成功: {db_host}:{db_port}/{db_name}")
            logger.info("数据库已启用自动重连机制")

        except Exception as e:
            logger.error(f"数据库连接失败: {e}")
            raise

    def get_collection(self, collection_name: str):
        """
        获取集合

        Args:
            collection_name: 集合名称

        Returns:
            MongoDB集合对象
        """
        return self.db[collection_name]

    def close(self):
        """关闭数据库连接"""
        if self._client:
            self._client.close()
            logger.info("数据库连接已关闭")


# 全局数据库实例
db = Database()


def get_db() -> Database:
    """获取数据库实例"""
    return db
