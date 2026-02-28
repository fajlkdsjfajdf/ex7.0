"""
爬虫基类（抽象）
定义爬虫的通用接口和基础功能
"""

import time
import random
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Tuple
from utils.logger import get_logger
from crawlers.base.request_handler import RequestHandler, ProxyMode

logger = get_logger(__name__)


class BaseCrawler(ABC):
    """爬虫基类（抽象）"""

    def __init__(self, site_id: str):
        """
        初始化爬虫

        Args:
            site_id: 站点ID（如 'cm'）
        """
        self.site_id = site_id
        self.site_config = None

        # 网络请求处理器
        self.request_handler = RequestHandler(site_id)

        # 加载站点配置
        self._load_site_config()

    def _load_site_config(self):
        """加载站点配置"""
        self.site_config = self.request_handler.site_config
        logger.info(f"爬虫初始化完成: {self.site_id}")

    def get_best_url(self) -> str:
        """获取最佳URL"""
        return self.request_handler.get_best_url()

    def get_best_cdn(self) -> Optional[str]:
        """获取最佳CDN URL"""
        return self.request_handler.get_best_cdn()

    def get_proxy_mode(self) -> ProxyMode:
        """获取代理模式"""
        return self.request_handler.get_proxy_mode()

    # ==================== 便捷的请求方法 ====================

    def request(
        self,
        method: str,
        url: str,
        proxy_mode: Optional[ProxyMode] = None,
        **kwargs
    ):
        """
        发送HTTP请求（代理到RequestHandler）

        Args:
            method: HTTP方法
            url: URL
            proxy_mode: 代理模式（None则使用站点配置）
            **kwargs: 其他参数

        Returns:
            requests.Response对象
        """
        return self.request_handler.request(method, url, proxy_mode=proxy_mode, **kwargs)

    def get(self, url: str, proxy_mode: Optional[ProxyMode] = None, **kwargs):
        """GET请求"""
        return self.request_handler.get(url, proxy_mode=proxy_mode, **kwargs)

    def post(self, url: str, proxy_mode: Optional[ProxyMode] = None, **kwargs):
        """POST请求"""
        return self.request_handler.post(url, proxy_mode=proxy_mode, **kwargs)

    def download(self, url: str, proxy_mode: Optional[ProxyMode] = None, **kwargs) -> bytes:
        """下载二进制数据"""
        return self.request_handler.download(url, proxy_mode=proxy_mode, **kwargs)

    # ==================== 抽象方法 ====================

    @abstractmethod
    def crawl(self, **kwargs) -> Dict[str, Any]:
        """
        爬取数据的主方法

        每个具体爬虫必须实现此方法

        Args:
            **kwargs: 爬虫参数

        Returns:
            包含success、data、error等字段的标准字典
        """
        pass

    @abstractmethod
    def get_crawler_data(self, **kwargs) -> List[Dict[str, Any]]:
        """
        获取需要爬取的数据列表

        Args:
            **kwargs: 查询参数

        Returns:
            待爬取的数据列表
        """
        pass

    # ==================== 工具方法 ====================

    def create_result(
        self,
        success: bool,
        data: Any = None,
        error: str = None,
        **extra_info
    ) -> Dict[str, Any]:
        """
        创建标准结果字典

        Args:
            success: 是否成功
            data: 返回的数据
            error: 错误信息
            **extra_info: 额外信息

        Returns:
            标准结果字典
        """
        result = {
            'success': success,
            'data': data,
            'error': error,
            'site_id': self.site_id,
            **extra_info
        }
        return result

    def execute_with_debug(
        self,
        crawl_func: callable,
        *args,
        **kwargs
    ) -> Dict[str, Any]:
        """
        通用执行爬虫并自动记录调试信息

        Args:
            crawl_func: 爬虫函数
            *args, **kwargs: 传递给爬虫函数的参数

        Returns:
            包含调试信息和结果的标准字典
        """
        try:
            # 执行爬虫函数
            result_data = crawl_func(*args, **kwargs)

            # 创建成功结果
            return self.create_result(
                success=True,
                data=result_data
            )
        except Exception as e:
            # 创建失败结果
            return self.create_result(
                success=False,
                data=None,
                error=str(e)
            )

    def close(self):
        """关闭爬虫，释放资源"""
        if self.request_handler:
            self.request_handler.close()

    def __enter__(self):
        """支持with语句"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """支持with语句"""
        self.close()
