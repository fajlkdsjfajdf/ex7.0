"""
CM站点加密解密工具类
处理请求认证、响应数据解密等功能
"""

import time
import hashlib
import base64
import json
from Crypto.Cipher import AES
from utils.logger import get_logger

logger = get_logger(__name__)


class CMCryptoTool:
    """CM站点加密解密工具"""

    # CM站点配置常量
    APP_VERSION = "1.7.9"
    APP_TOKEN_SECRET = "18comicAPP"
    APP_DATA_SECRET = "185Hcomic3PAPP7R"

    # 请求头模板
    APP_HEADERS_TEMPLATE = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
    }

    @classmethod
    def md5hex(cls, key: str) -> str:
        """
        计算MD5哈希值

        Args:
            key: 待哈希的字符串

        Returns:
            MD5哈希值（十六进制）
        """
        return hashlib.md5(key.encode("utf-8")).hexdigest()

    @classmethod
    def get_timestamp(cls) -> int:
        """
        获取当前时间戳（秒）

        Returns:
            Unix时间戳
        """
        return int(time.time())

    @classmethod
    def generate_token(cls, ts: int = None) -> tuple:
        """
        生成请求认证token

        Args:
            ts: 时间戳，如果为None则使用当前时间

        Returns:
            (token, tokenparam) 元组
        """
        if ts is None:
            ts = cls.get_timestamp()

        # tokenparam: 格式为 "时间戳,版本号"
        tokenparam = f'{ts},{cls.APP_VERSION}'

        # token: MD5(ts + secret)
        token = cls.md5hex(f'{ts}{cls.APP_TOKEN_SECRET}')

        return token, tokenparam

    @classmethod
    def get_request_headers(cls, ts: int = None) -> tuple:
        """
        获取带认证的请求头

        Args:
            ts: 时间戳，如果为None则使用当前时间

        Returns:
            (headers, timestamp) 元组
        """
        if ts is None:
            ts = cls.get_timestamp()

        token, tokenparam = cls.generate_token(ts)

        headers = cls.APP_HEADERS_TEMPLATE.copy()
        headers.update({
            'token': token,
            'tokenparam': tokenparam
        })

        return headers, ts

    @classmethod
    def decrypt_response(cls, data: str, ts: int) -> str:
        """
        解密响应数据

        Args:
            data: 加密的Base64字符串
            ts: 请求时使用的时间戳

        Returns:
            解密后的JSON字符串

        Raises:
            Exception: 解密失败时抛出异常
        """
        try:
            # 1. Base64解码
            data_b64 = base64.b64decode(data)

            # 2. 生成AES密钥：MD5(timestamp + secret)
            key = cls.md5hex(f'{ts}{cls.APP_DATA_SECRET}').encode('utf-8')

            # 3. AES-ECB解密
            cipher = AES.new(key, AES.MODE_ECB)
            data_aes = cipher.decrypt(data_b64)

            # 4. 移除PKCS7 padding（最后一个字节的值表示padding长度）
            data_unpadded = data_aes[:-data_aes[-1]]

            # 5. 解码为UTF-8字符串（JSON格式）
            # 使用错误处理来避免编码异常
            try:
                result = data_unpadded.decode('utf-8')
            except UnicodeDecodeError:
                # 如果UTF-8解码失败，尝试其他编码
                try:
                    result = data_unpadded.decode('gbk')
                except UnicodeDecodeError:
                    # 如果还是失败，使用replace模式
                    result = data_unpadded.decode('utf-8', errors='replace')
                    logger.warning(f"解密数据包含非UTF-8/GBK字符，已使用replace模式处理")

            return result

        except Exception as e:
            logger.error(f"解密响应数据失败: {e}, 数据长度: {len(data) if data else 0}, 时间戳: {ts}")
            raise

    @classmethod
    def decrypt_response_json(cls, data: str, ts: int) -> dict:
        """
        解密响应数据并解析为JSON

        Args:
            data: 加密的Base64字符串
            ts: 请求时使用的时间戳

        Returns:
            解密后的字典对象

        Raises:
            Exception: 解密或JSON解析失败时抛出异常
        """
        decrypted_str = cls.decrypt_response(data, ts)

        # 记录解密后的原始数据（用于调试）
        if len(decrypted_str) == 0:
            logger.error(f"解密后数据为空！原始加密数据长度: {len(data)}, 时间戳: {ts}")
            raise ValueError("解密后数据为空")

        if len(decrypted_str) < 10:
            logger.error(f"解密后数据过短，可能不是JSON！内容: {repr(decrypted_str)}, 长度: {len(decrypted_str)}, 时间戳: {ts}")
            raise ValueError(f"解密后数据过短或无效: {decrypted_str}")

        try:
            return json.loads(decrypted_str)
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败！解密后的内容（前200字符）: {decrypted_str[:200]}, 完整长度: {len(decrypted_str)}, 时间戳: {ts}")
            raise

    @classmethod
    def verify_response(cls, response_data: dict) -> bool:
        """
        验证响应数据的有效性

        Args:
            response_data: 响应数据字典

        Returns:
            True if valid, False otherwise
        """
        if not isinstance(response_data, dict):
            return False

        # 检查code字段
        code = response_data.get('code')
        if code != 200:
            logger.warning(f"响应code异常: {code}")
            return False

        return True


if __name__ == '__main__':
    # 测试代码
    print("=== CM加密解密工具测试 ===")

    # 测试token生成
    ts = CMCryptoTool.get_timestamp()
    token, tokenparam = CMCryptoTool.generate_token(ts)
    print(f"时间戳: {ts}")
    print(f"Token: {token}")
    print(f"TokenParam: {tokenparam}")

    # 测试请求头生成
    headers, req_ts = CMCryptoTool.get_request_headers()
    print(f"\n请求头:")
    for key, value in headers.items():
        print(f"  {key}: {value}")
