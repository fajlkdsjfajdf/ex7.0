"""
应用配置文件
"""
import os


class Config:
    """基础配置"""

    # Flask配置
    SECRET_KEY = 'jjljalksjfidojowenndsklnvjsdoanf'
    DEBUG = True

    # 路径配置
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(BASE_DIR, 'data')

    # 站点配置
    SITE_ID = 'cm'
    SITE_NAME = '暗黑漫画站'

    # 分页配置
    COMICS_PER_PAGE = 20
    ADMIN_COMICS_PER_PAGE = 50

    # 数据库配置
    MONGO_HOST = '192.168.1.222'
    MONGO_PORT = 27017
    MONGO_DB_NAME = 'manga_hub'




class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    TESTING = False

    # 生产环境密钥（必须修改）
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'change-this-in-production'


class TestingConfig(Config):
    """测试环境配置"""
    DEBUG = True
    TESTING = True

    # 测试数据库
    MONGO_DB_NAME = 'manga_hub_test'


# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
