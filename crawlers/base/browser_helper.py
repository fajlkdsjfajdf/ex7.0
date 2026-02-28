"""
浏览器辅助类
用于处理需要浏览器绕过 Cloudflare 保护的站点
"""

import time
from typing import Optional, Tuple
from io import BytesIO
from PIL import Image
from utils.logger import get_logger

logger = get_logger(__name__)

# 尝试导入 Playwright
try:
    from playwright.sync_api import sync_playwright, Browser, Page, BrowserContext
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False
    logger.warning("Playwright 未安装，需要浏览器绕过的站点将无法工作。安装: pip install playwright && playwright install chromium")


class BrowserHelper:
    """
    浏览器辅助类

    用于处理需要真实浏览器来绕过 Cloudflare 或其他反爬保护的站点
    使用 Playwright 实现无头浏览器
    """

    _instance = None
    _browser = None
    _context = None
    _page = None

    def __new__(cls):
        """单例模式"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """初始化浏览器辅助类"""
        if not HAS_PLAYWRIGHT:
            raise ImportError("Playwright 未安装")

        self.playwright = None
        self._initialized = False

    def _ensure_browser(self):
        """确保浏览器已启动"""
        if self._initialized and self._browser:
            return

        try:
            self.playwright = sync_playwright().start()
            self._browser = self.playwright.chromium.launch(headless=True)
            self._context = self._browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            self._page = self._context.new_page()
            self._initialized = True
            logger.info("浏览器已启动")
        except Exception as e:
            logger.error(f"启动浏览器失败: {e}")
            raise

    def get_page(self) -> 'Page':
        """获取浏览器页面"""
        self._ensure_browser()
        return self._page

    def download_image(
        self,
        image_url: str,
        referer: str,
        timeout: int = 30000
    ) -> Tuple[Optional[bytes], Optional[str]]:
        """
        使用浏览器下载图片

        Args:
            image_url: 图片URL
            referer: 来源页面URL
            timeout: 超时时间（毫秒）

        Returns:
            (图片数据, Content-Type) 元组，失败返回 (None, None)
        """
        try:
            self._ensure_browser()
            page = self._page

            # 使用页面的 fetch API 下载图片
            # 这样可以利用浏览器已经通过的 Cloudflare 验证
            script = f'''
            async () => {{
                try {{
                    const response = await fetch("{image_url}", {{
                        credentials: 'include',
                        headers: {{
                            'Referer': '{referer}',
                            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                        }}
                    }});

                    if (!response.ok) {{
                        return {{ status: response.status, error: 'HTTP ' + response.status }};
                    }}

                    const blob = await response.blob();
                    const buffer = await blob.arrayBuffer();
                    return {{
                        status: response.status,
                        contentType: response.headers.get('content-type'),
                        size: buffer.byteLength,
                        data: Array.from(new Uint8Array(buffer))
                    }};
                }} catch (e) {{
                    return {{ status: 0, error: e.toString() }};
                }}
            }}
            '''

            result = page.evaluate(script)

            if result.get('status') != 200:
                logger.error(f"下载图片失败: status={result.get('status')}, error={result.get('error', 'unknown')}")
                return None, None

            if result.get('size', 0) < 100:
                logger.error(f"图片数据太小: {result.get('size')} bytes")
                return None, None

            image_bytes = bytes(result['data'])
            content_type = result.get('contentType', 'image/jpeg')

            logger.debug(f"浏览器下载图片成功: {len(image_bytes)} bytes, type={content_type}")
            return image_bytes, content_type

        except Exception as e:
            logger.error(f"浏览器下载图片异常: {e}")
            return None, None

    def visit_page(self, url: str, wait_until: str = 'networkidle', timeout: int = 30000) -> bool:
        """
        访问页面（用于通过 Cloudflare 验证）

        Args:
            url: 页面URL
            wait_until: 等待条件
            timeout: 超时时间

        Returns:
            是否成功
        """
        try:
            self._ensure_browser()
            self._page.goto(url, wait_until=wait_until, timeout=timeout)
            return True
        except Exception as e:
            logger.error(f"访问页面失败: {url}, error={e}")
            return False

    def click_button(self, selector: str, timeout: int = 5000) -> bool:
        """
        点击按钮

        Args:
            selector: 按钮选择器
            timeout: 超时时间

        Returns:
            是否成功
        """
        try:
            self._ensure_browser()
            self._page.click(selector, timeout=timeout)
            return True
        except Exception as e:
            logger.debug(f"点击按钮失败: {selector}, error={e}")
            return False

    def get_cookies(self, domain: str = None) -> dict:
        """
        获取 cookies

        Args:
            domain: 域名过滤

        Returns:
            cookies 字典
        """
        try:
            self._ensure_browser()
            cookies = self._context.cookies()
            if domain:
                cookies = [c for c in cookies if domain in c.get('domain', '')]
            return {c['name']: c['value'] for c in cookies}
        except Exception as e:
            logger.error(f"获取 cookies 失败: {e}")
            return {}

    def close(self):
        """关闭浏览器"""
        try:
            if self._page:
                self._page.close()
            if self._context:
                self._context.close()
            if self._browser:
                self._browser.close()
            if self.playwright:
                self.playwright.stop()
        except:
            pass
        finally:
            self._page = None
            self._context = None
            self._browser = None
            self.playwright = None
            self._initialized = False
            BrowserHelper._instance = None
            logger.info("浏览器已关闭")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# 全局浏览器辅助实例
_browser_helper: Optional[BrowserHelper] = None


def get_browser_helper() -> Optional[BrowserHelper]:
    """
    获取浏览器辅助实例（单例）

    Returns:
        BrowserHelper 实例，如果 Playwright 未安装则返回 None
    """
    global _browser_helper

    if not HAS_PLAYWRIGHT:
        return None

    if _browser_helper is None:
        try:
            _browser_helper = BrowserHelper()
        except Exception as e:
            logger.error(f"创建浏览器辅助实例失败: {e}")
            return None

    return _browser_helper


def download_image_with_browser(
    image_url: str,
    referer: str,
    timeout: int = 30000
) -> Tuple[Optional[bytes], Optional[str]]:
    """
    使用浏览器下载图片（便捷函数）

    Args:
        image_url: 图片URL
        referer: 来源页面URL
        timeout: 超时时间

    Returns:
        (图片数据, Content-Type) 元组
    """
    helper = get_browser_helper()
    if helper is None:
        logger.error("浏览器辅助不可用")
        return None, None

    return helper.download_image(image_url, referer, timeout)
