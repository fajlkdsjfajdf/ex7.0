"""
统一日志系统
提供应用级的日志记录功能
"""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from datetime import datetime


class Logger:
    """日志管理器"""

    _instance = None
    _loggers = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """初始化日志系统"""
        if not hasattr(self, 'initialized'):
            self.initialized = True
            self._setup_log_directory()
            self._setup_root_logger()

    def _setup_log_directory(self):
        """设置日志目录"""
        # 获取项目根目录
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        log_dir = os.path.join(project_root, 'data', 'logs')

        # 创建日志目录
        os.makedirs(log_dir, exist_ok=True)

        self.log_dir = log_dir

    def _setup_root_logger(self):
        """设置根日志记录器"""
        # 创建根日志记录器
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.DEBUG)

        # 清除现有的处理器
        root_logger.handlers.clear()

        # 创建格式化器
        formatter = logging.Formatter(
            '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

        # 控制台处理器
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

        # 通用日志文件处理器（所有级别）
        general_log = os.path.join(self.log_dir, 'app.log')
        file_handler = RotatingFileHandler(
            general_log,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

        # 错误日志文件处理器（只记录ERROR及以上）
        error_log = os.path.join(self.log_dir, 'error.log')
        error_handler = RotatingFileHandler(
            error_log,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        root_logger.addHandler(error_handler)

        self._loggers['root'] = root_logger

    def get_logger(self, name=None):
        """
        获取指定名称的日志记录器

        Args:
            name: 日志记录器名称，通常使用__name__

        Returns:
            logging.Logger: 日志记录器实例
        """
        if name is None:
            name = 'root'

        if name not in self._loggers:
            logger = logging.getLogger(name)
            self._loggers[name] = logger

        return self._loggers[name]

    def debug(self, message, logger_name='root'):
        """记录DEBUG级别日志"""
        logger = self.get_logger(logger_name)
        logger.debug(message)

    def info(self, message, logger_name='root'):
        """记录INFO级别日志"""
        logger = self.get_logger(logger_name)
        logger.info(message)

    def warning(self, message, logger_name='root'):
        """记录WARNING级别日志"""
        logger = self.get_logger(logger_name)
        logger.warning(message)

    def error(self, message, logger_name='root', exc_info=False):
        """记录ERROR级别日志"""
        logger = self.get_logger(logger_name)
        logger.error(message, exc_info=exc_info)

    def critical(self, message, logger_name='root', exc_info=False):
        """记录CRITICAL级别日志"""
        logger = self.get_logger(logger_name)
        logger.critical(message, exc_info=exc_info)


# 创建全局日志实例
_logger_instance = None


def get_logger(name=None):
    """
    获取日志记录器的便捷函数

    Args:
        name: 日志记录器名称，通常使用__name__

    Returns:
        logging.Logger: 日志记录器实例
    """
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = Logger()
    return _logger_instance.get_logger(name)


def log_debug(message, logger_name='root'):
    """记录DEBUG级别日志的便捷函数"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = Logger()
    _logger_instance.debug(message, logger_name)


def log_info(message, logger_name='root'):
    """记录INFO级别日志的便捷函数"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = Logger()
    _logger_instance.info(message, logger_name)


def log_warning(message, logger_name='root'):
    """记录WARNING级别日志的便捷函数"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = Logger()
    _logger_instance.warning(message, logger_name)


def log_error(message, logger_name='root', exc_info=False):
    """记录ERROR级别日志的便捷函数"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = Logger()
    _logger_instance.error(message, logger_name, exc_info)


def log_critical(message, logger_name='root', exc_info=False):
    """记录CRITICAL级别日志的便捷函数"""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = Logger()
    _logger_instance.critical(message, logger_name, exc_info)


# 便捷的模块级导入
class SystemLogger:
    """系统日志器，用于模块级导入"""

    def __init__(self, name):
        self.logger = get_logger(name)

    def debug(self, message, *args, **kwargs):
        self.logger.debug(message, *args, **kwargs)

    def info(self, message, *args, **kwargs):
        self.logger.info(message, *args, **kwargs)

    def warning(self, message, *args, **kwargs):
        self.logger.warning(message, *args, **kwargs)

    def error(self, message, *args, **kwargs):
        self.logger.error(message, *args, **kwargs)

    def critical(self, message, *args, **kwargs):
        self.logger.critical(message, *args, **kwargs)
