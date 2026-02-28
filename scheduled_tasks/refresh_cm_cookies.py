"""
CM站点Cookie刷新定时任务
定期刷新CM站点cookies，检测最快URL和CDN
"""

import time
from datetime import datetime
from .base_task import BaseTask
import requests
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# 导入日志系统
from utils.logger import get_logger
logger = get_logger(__name__)


class RefreshCMCookiesTask(BaseTask):
    """CM站点Cookie刷新任务"""

    name = "刷新CM站点Cookie"
    description = "定期刷新CM站点的cookies，检测最快的主URL和CDN URL"
    version = "1.0.0"
    author = "System"

    def execute(self, config):
        """
        执行Cookie刷新任务

        Args:
            config: 任务配置，应包含：
                - site_id: 站点ID (默认: 'cm')
                - timeout: 测试超时时间(秒) (默认: 10)

        Returns:
            dict: 执行结果
        """
        try:


            site_id = config.get('site_id', 'cm')
            timeout = config.get('timeout', 10)

            # 加载站点配置
            from utils.config_loader import load_sites_config
            sites_config = load_sites_config()

            if site_id not in sites_config:
                return {
                    'success': False,
                    'message': f'站点 {site_id} 不存在',
                    'data': {}
                }

            site = sites_config[site_id]
            urls = site.get('urls', [])
            cdn_urls = site.get('cdn_urls', [])

            if not urls:
                return {
                    'success': False,
                    'message': '站点未配置URL',
                    'data': {}
                }

            # 检测最快的主URL
            fastest_url = None
            fastest_url_time = float('inf')
            url_results = []

            # 获取每个URL的cookies并测试速度
            url_cookies = {}
            for url in urls:
                result = self._test_url_speed(url, timeout, append_setting=True)
                url_results.append(result)

                # 尝试获取该URL的cookies
                if result['success']:
                    cookies = self._get_cookies(url, timeout)
                    if cookies:
                        url_cookies[url] = cookies
                        logger.info(f"成功获取 {url} 的cookies: {list(cookies.keys())}")

                if result['success'] and result['response_time'] < fastest_url_time:
                    fastest_url_time = result['response_time']
                    fastest_url = url

            # 检测最快的CDN URL
            fastest_cdn = None
            fastest_cdn_time = float('inf')
            cdn_results = []

            for cdn_url in cdn_urls:
                result = self._test_url_speed(cdn_url, timeout, append_setting=False)
                cdn_results.append(result)
                if result['success'] and result['response_time'] < fastest_cdn_time:
                    fastest_cdn_time = result['response_time']
                    fastest_cdn = cdn_url

            # 更新站点配置
            update_data = {
                'last_check': datetime.now().isoformat(),
                'fastest_url': fastest_url,
                'fastest_cdn': fastest_cdn,
                'url_test_results': url_results,
                'cdn_test_results': cdn_results,
                'cookies': {
                    'by_url': url_cookies
                }
            }

            # 如果没有获取到任何URL的cookies，保留原有的default cookies
            if not url_cookies and site.get('cookies', {}).get('default'):
                update_data['cookies']['default'] = site.get('cookies', {}).get('default', {})

            # 更新配置文件
            from utils.config_loader import update_site_config
            update_site_config(site_id, update_data)

            return {
                'success': True,
                'message': f'Cookie刷新完成。最快URL: {fastest_url}, 最快CDN: {fastest_cdn}',
                'data': update_data
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'执行失败: {str(e)}',
                'data': {}
            }

    def _test_url_speed(self, url, timeout=10, append_setting=True):
        """
        测试URL响应速度

        Args:
            url: 要测试的URL
            timeout: 超时时间(秒)
            append_setting: 是否在URL后添加/setting后缀 (默认: True)

        Returns:
            dict: 测试结果
        """
        try:
            # 确保URL格式正确
            if not url.startswith('http://') and not url.startswith('https://'):
                url = f'https://{url}'

            # 根据参数决定是否添加/setting后缀
            test_url = f"{url}/setting" if append_setting else url

            start_time = time.time()
            response = requests.get(test_url, timeout=timeout)
            end_time = time.time()

            response_time = end_time - start_time

            if response.status_code == 200:
                return {
                    'success': True,
                    'url': url,
                    'status_code': response.status_code,
                    'response_time': response_time
                }
            else:
                return {
                    'success': False,
                    'url': url,
                    'status_code': response.status_code,
                    'error': f'HTTP {response.status_code}'
                }

        except requests.exceptions.Timeout:
            return {
                'success': False,
                'url': url,
                'error': '连接超时'
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'url': url,
                'error': str(e)
            }
        except Exception as e:
            return {
                'success': False,
                'url': url,
                'error': str(e)
            }

    def _get_cookies(self, url, timeout=10):
        """
        获取指定URL的cookies

        Args:
            url: 目标URL
            timeout: 超时时间(秒)

        Returns:
            dict: cookies字典，失败返回None
        """
        try:
            # 确保URL格式正确
            if not url.startswith('http://') and not url.startswith('https://'):
                url = f'https://{url}'

            url = f"{url}/setting"

            # 生成token和tokenparam（参考老代码）
            ts = self._get_ts()
            token, tokenparam = self._generate_token(ts)

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'token': token,
                'tokenparam': tokenparam
            }

            response = requests.get(url, timeout=timeout, headers=headers)

            if response.status_code == 200:
                # 将cookies转为字典
                cookies_dict = {}
                for cookie in response.cookies:
                    cookies_dict[cookie.name] = cookie.value
                return cookies_dict
            else:
                return None

        except Exception as e:
            print(f"获取cookies失败: {e}")
            return None

    def _get_ts(self):
        """获取时间戳（秒）"""
        return str(int(time.time()))

    def _md5hex(self, key):
        """计算MD5哈希值"""
        from hashlib import md5
        return md5(key.encode("utf-8")).hexdigest()

    def _generate_token(self, ts):
        """
        生成token和tokenparam
        参考老代码的实现逻辑
        """
        # CM站点配置
        ver = '1.7.9'  # APP_VERSION
        secret = '18comicAPP'  # APP_TOKEN_SECRET

        # tokenparam: 格式为 "时间戳,版本号"
        tokenparam = '{},{}'.format(ts, ver)

        # token: MD5(ts + secret)
        token = self._md5hex(f'{ts}{secret}')

        return token, tokenparam
