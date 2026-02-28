from plugin.comic18 import  jm_config
import requests
import time
import random
from config.configParse import config
import json
from logger.logger import logger
from util import typeChange

class JmCryptoTool:
    """
    禁漫加解密相关逻辑
    """

    @classmethod
    def token_and_tokenparam(cls,
                             ts,
                             ver=None,
                             secret=None,
                             ):
        """
        计算禁漫接口的请求headers的token和tokenparam

        :param ts: 时间戳
        :param ver: app版本
        :param secret: 密钥
        :return (token, tokenparam)
        """

        if ver is None:
            ver = jm_config.APP_VERSION

        if secret is None:
            secret = jm_config.APP_TOKEN_SECRET

        # tokenparam: 1700566805,1.6.3
        tokenparam = '{},{}'.format(ts, ver)

        # token: 81498a20feea7fbb7149c637e49702e3
        token = cls.md5hex(f'{ts}{secret}')

        return token, tokenparam

    @classmethod
    def get_rnd_url(cls):
        """
        获取一个随机的cm网址
        Returns:

        """
        pass

    @classmethod
    def decode_resp_data(cls,
                         data: str,
                         ts,
                         secret=None,
                         ) -> str:
        """
        解密接口返回值

        :param data: resp.json()['data']
        :param ts: 时间戳
        :param secret: 密钥
        :return: json格式的字符串
        """
        if secret is None:
            secret = jm_config.APP_DATA_SECRET

        # 1. base64解码
        import base64
        data_b64 = base64.b64decode(data)

        # 2. AES-ECB解密
        key = cls.md5hex(f'{ts}{secret}').encode('utf-8')
        from Crypto.Cipher import AES
        data_aes = AES.new(key, AES.MODE_ECB).decrypt(data_b64)

        # 3. 移除末尾的padding
        data = data_aes[:-data_aes[-1]]

        # 4. 解码为字符串 (json)
        res = data.decode('utf-8')

        return res

    @classmethod
    def md5hex(cls, key: str):
        from hashlib import md5
        return md5(key.encode("utf-8")).hexdigest()

    @classmethod
    def get_ts(cls):
        return int(time.time())

    @classmethod
    def get_requests_headers(cls):
        ts = cls.get_ts()
        token, tokenparam = JmCryptoTool.token_and_tokenparam(ts)
        token = "d061faef5b567fdddd49062ac92ee2a4"
        headers = jm_config.APP_HEADERS_TEMPLATE
        headers.update({
            'token': token,
            'tokenparam': tokenparam,

        })
        return headers, ts

    @classmethod
    def get_cookies(cls, url=""):
        print(f"开始获取cm cookies")
        cookie_config = config.read("CM", "api_cookies", {})
        # cookie_config = json.loads(cookie_config)

        for i in range(5):
            try:
                if not url:
                    url = random.choice(jm_config.DOMAIN_API_LIST)
                if url in cookie_config:
                    logger.info(f"获取cm cookie 已有缓存")
                    cookies = typeChange.str_to_cookies(cookie_config[url])
                    url = f"https://{url}"
                    return url, cookies

                url = f"https://{url}"
                url2 = f"{url}/setting"
                ts = cls.get_ts()
                token, tokenparam = JmCryptoTool.token_and_tokenparam(ts)
                headers = jm_config.APP_HEADERS_TEMPLATE
                headers.update({
                    'token': token,
                    'tokenparam': tokenparam
                })
                # 发送 GET 请求（默认允许重定向）
                response = requests.get(url2, timeout=10, headers=headers)
                response.raise_for_status()
                if response.status_code == 200:
                    # 直接返回 RequestsCookieJar 对象（兼容 requests 的 cookies= 参数）
                    # 也可以转为字典：return dict_from_cookiejar(response.cookies)
                    # print(response.cookies)
                    return url, response.cookies
            except requests.RequestException as e:
                print(f"获取 cookies 失败: {e}")
                # return {}  # 返回空字典避免后续调用报错
        return None, None


if __name__ == '__main__':
    JmCryptoTool.get_cookies()