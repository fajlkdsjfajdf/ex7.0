"""
网络请求处理器
负责所有HTTP请求、代理设置、重试等
爬虫类不应该直接处理网络请求，而是通过RequestHandler
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
from utils.logger import get_logger
from utils.config_loader import load_proxy_config, load_sites_config

# 尝试导入 curl_cffi（用于绕过 Cloudflare）
try:
    from curl_cffi import requests as curl_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False
    curl_requests = None

logger = get_logger(__name__)


class ProxyMode(Enum):
    """代理模式枚举"""
    NONE = "none"                  # 不使用代理
    DOMESTIC = "domestic"          # 仅国内代理
    FOREIGN = "foreign"            # 仅国外代理
    ALL = "all"                    # 所有代理


class RequestHandler:
    """
    网络请求处理器

    负责处理所有HTTP请求，包括：
    - 代理设置（国内/国外/全部/不使用）
    - 自动重试
    - Cookie管理
    - 超时设置
    """

    # 默认请求头
    DEFAULT_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    }

    def __init__(self, site_id: str):
        """
        初始化请求处理器

        Args:
            site_id: 站点ID（如 'cm'）
        """
        self.site_id = site_id
        self.session = None
        self.site_config = None
        self.proxy_config = None

        # 加载配置
        self._load_configs()
        # 创建session
        self._init_session()

    def _load_configs(self):
        """加载站点配置和代理配置"""
        try:
            # 加载站点配置
            sites_config = load_sites_config()
            if self.site_id in sites_config:
                self.site_config = sites_config[self.site_id]
                logger.info(f"成功加载站点配置: {self.site_id}")
            else:
                raise ValueError(f"站点配置不存在: {self.site_id}")

            # 加载代理配置
            self.proxy_config = load_proxy_config()
            logger.debug(f"成功加载代理配置")

        except Exception as e:
            logger.error(f"加载配置失败: {e}")
            raise

    def _init_session(self):
        """初始化requests session"""
        self.session = requests.Session()
        self.session.headers.update(self.DEFAULT_HEADERS)

        # 设置重试配置
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

    def get_proxy_mode(self) -> ProxyMode:
        """
        获取站点的代理模式

        Returns:
            ProxyMode枚举值
        """
        if not self.site_config:
            return ProxyMode.NONE

        proxy_mode_str = self.site_config.get('proxy_mode', 'none')
        try:
            return ProxyMode(proxy_mode_str)
        except ValueError:
            logger.warning(f"无效的代理模式: {proxy_mode_str}，使用默认值")
            return ProxyMode.NONE

    def get_proxy_mode_for_task(self, task_type: str) -> ProxyMode:
        """
        根据任务类型获取代理模式

        Args:
            task_type: 任务类型（如 'list_page', 'info_page', 'content_page'等）

        Returns:
            ProxyMode枚举值
        """
        if not self.site_config:
            return ProxyMode.NONE

        # 获取细分代理配置
        proxy_overrides = self.site_config.get('proxy_overrides', {})

        # 查找该任务类型的代理覆盖配置
        override_mode = proxy_overrides.get(task_type, 'default')

        # 如果是默认值，使用站点的默认代理模式
        if override_mode == 'default':
            return self.get_proxy_mode()

        # 否则使用覆盖的代理模式
        try:
            return ProxyMode(override_mode)
        except ValueError:
            logger.warning(f"无效的代理模式: {override_mode}，使用默认值")
            return self.get_proxy_mode()

    def get_proxies(self, proxy_mode: Optional[ProxyMode] = None) -> Optional[Dict[str, str]]:
        """
        获取代理列表（支持负载均衡）

        Args:
            proxy_mode: 代理模式（如果为None，使用站点配置的模式）

        Returns:
            代理字典，格式: {'http': proxy_url, 'https': proxy_url}
            如果不需要代理，返回None
        """
        if proxy_mode is None:
            proxy_mode = self.get_proxy_mode()

        if proxy_mode == ProxyMode.NONE:
            return None

        # 从proxy_config获取代理列表
        if not self.proxy_config:
            return None

        proxies = []

        # 根据模式选择代理
        if proxy_mode == ProxyMode.DOMESTIC:
            domestic_list = self.proxy_config.get('domestic', [])
            proxies = domestic_list
        elif proxy_mode == ProxyMode.FOREIGN:
            foreign_list = self.proxy_config.get('foreign', [])
            proxies = foreign_list
        elif proxy_mode == ProxyMode.ALL:
            domestic_list = self.proxy_config.get('domestic', [])
            foreign_list = self.proxy_config.get('foreign', [])
            proxies = domestic_list + foreign_list

        # 根据权重选择代理（负载均衡）
        if proxies:
            selected_proxy = self._select_proxy_by_weight(proxies)
            proxy_url = self._build_proxy_url(selected_proxy)
            return {
                'http': proxy_url,
                'https': proxy_url
            }

        return None

    def get_proxies_for_task(self, task_type: str) -> Optional[Dict[str, str]]:
        """
        根据任务类型获取代理配置

        Args:
            task_type: 任务类型（如 'list_page', 'info_page', 'content_page'等）

        Returns:
            代理字典，格式: {'http': proxy_url, 'https': proxy_url}
            如果不需要代理，返回None
        """
        proxy_mode = self.get_proxy_mode_for_task(task_type)
        return self.get_proxies(proxy_mode)

    def _select_proxy_by_weight(self, proxies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        根据权重选择代理（负载均衡）

        Args:
            proxies: 代理列表，每个代理包含weight字段

        Returns:
            选中的代理配置
        """
        import random

        # 计算总权重
        total_weight = sum(proxy.get('weight', 1) for proxy in proxies)

        if total_weight == 0:
            return random.choice(proxies)

        # 生成随机数
        rand_val = random.random() * total_weight

        # 根据权重选择
        cumulative_weight = 0
        for proxy in proxies:
            weight = proxy.get('weight', 1)
            cumulative_weight += weight
            if rand_val <= cumulative_weight:
                return proxy

        # 默认返回最后一个
        return proxies[-1]

    def _build_proxy_url(self, proxy: Dict[str, Any]) -> str:
        """
        构建代理URL

        Args:
            proxy: 代理配置字典

        Returns:
            代理URL字符串
        """
        proxy_type = proxy.get('type', 'http')
        host = proxy.get('host', '')
        port = proxy.get('port', 0)
        username = proxy.get('username')
        password = proxy.get('password')

        # 构建认证部分
        auth_part = ''
        if username and password:
            auth_part = f"{username}:{password}@"

        # 构建代理URL
        proxy_url = f"{proxy_type}://{auth_part}{host}:{port}"
        return proxy_url

    def get_cookies(self, url: str) -> Dict[str, str]:
        """
        获取指定URL的cookies

        Args:
            url: 目标URL

        Returns:
            cookies字典
        """
        if not self.site_config:
            return {}

        cookies_config = self.site_config.get('cookies', {})
        if not cookies_config:
            return {}

        # 先查找URL特定的cookies
        by_url = cookies_config.get('by_url', {})
        if url in by_url:
            return by_url[url]

        # 如果没有URL特定的cookies，使用默认cookies
        default_cookies = cookies_config.get('default', {})
        if default_cookies:
            return default_cookies

        return {}

    def get_best_url(self) -> str:
        """
        获取最佳URL（优先使用最快的主URL）

        Returns:
            URL字符串
        """
        if not self.site_config:
            raise ValueError(f"站点 {self.site_id} 没有配置URL")

        # 优先使用fastest_url
        fastest_url = self.site_config.get('fastest_url')
        if fastest_url:
            return fastest_url

        # 否则使用第一个URL
        urls = self.site_config.get('urls', [])
        if urls:
            return urls[0]

        raise ValueError(f"站点 {self.site_id} 没有可用的URL")

    def get_best_cdn(self) -> Optional[str]:
        """
        获取最佳CDN URL

        Returns:
            CDN URL字符串，如果没有配置则返回None
        """
        if not self.site_config:
            return None

        # 优先使用fastest_cdn
        fastest_cdn = self.site_config.get('fastest_cdn')
        if fastest_cdn:
            return fastest_cdn

        # 否则使用第一个CDN
        cdn_urls = self.site_config.get('cdn_urls', [])
        if cdn_urls:
            return cdn_urls[0]

        return None

    def request(
        self,
        method: str,
        url: str,
        proxy_mode: Optional[ProxyMode] = None,
        task_type: Optional[str] = None,
        use_curl: bool = False,
        impersonate: str = "chrome120",
        **kwargs
    ) -> requests.Response:
        """
        发送HTTP请求

        Args:
            method: HTTP方法（GET/POST等）
            url: 请求URL
            proxy_mode: 代理模式（如果为None，使用站点配置）
            task_type: 任务类型（如'list_page', 'info_page'等，用于细分代理配置）
            use_curl: 是否使用 curl_cffi（用于绕过 Cloudflare）
            impersonate: 模拟的浏览器版本（仅 use_curl=True 时有效）
            **kwargs: 其他requests参数

        Returns:
            requests.Response对象

        Raises:
            RequestException: 请求失败时抛出
        """
        try:
            # 添加cookies
            if 'cookies' not in kwargs:
                cookies = self.get_cookies(url)
                if cookies:
                    kwargs['cookies'] = cookies

            # 添加代理
            if 'proxies' not in kwargs:
                # 优先使用task_type获取代理
                if task_type:
                    proxies = self.get_proxies_for_task(task_type)
                else:
                    proxies = self.get_proxies(proxy_mode)
                if proxies:
                    kwargs['proxies'] = proxies
                    logger.debug(f"使用代理: {proxies}")

            # 添加超时
            if 'timeout' not in kwargs:
                kwargs['timeout'] = 30

            # 发送请求
            logger.debug(f"发送{method}请求: {url}")

            # 如果需要使用 curl_cffi
            if use_curl:
                if not HAS_CURL_CFFI:
                    logger.warning("curl_cffi 未安装，回退到普通 requests")
                else:
                    logger.debug(f"使用 curl_cffi (impersonate={impersonate})")
                    response = curl_requests.request(
                        method, url,
                        impersonate=impersonate,
                        **kwargs
                    )
                    logger.debug(f"请求完成: status={response.status_code}")
                    return response

            # 普通请求
            response = self.session.request(method, url, **kwargs)

            logger.debug(f"请求完成: status={response.status_code}")
            return response

        except requests.RequestException as e:
            logger.error(f"请求失败: {method} {url}, error={e}")
            raise

    def get(self, url: str, proxy_mode: Optional[ProxyMode] = None, task_type: Optional[str] = None, **kwargs) -> requests.Response:
        """发送GET请求"""
        return self.request('GET', url, proxy_mode=proxy_mode, task_type=task_type, **kwargs)

    def post(self, url: str, proxy_mode: Optional[ProxyMode] = None, task_type: Optional[str] = None, **kwargs) -> requests.Response:
        """发送POST请求"""
        return self.request('POST', url, proxy_mode=proxy_mode, task_type=task_type, **kwargs)

    def download(self, url: str, proxy_mode: Optional[ProxyMode] = None, task_type: Optional[str] = None, **kwargs) -> bytes:
        """
        下载二进制数据

        Args:
            url: URL
            proxy_mode: 代理模式
            task_type: 任务类型
            **kwargs: 其他requests参数

        Returns:
            二进制数据
        """
        response = self.get(url, proxy_mode=proxy_mode, task_type=task_type, **kwargs)
        return response.content

    def close(self):
        """关闭session"""
        if self.session:
            self.session.close()
            logger.debug(f"请求处理器已关闭: {self.site_id}")

    def __enter__(self):
        """支持with语句"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """支持with语句"""
        self.close()
