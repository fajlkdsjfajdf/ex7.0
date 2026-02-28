"""
CM站点基础爬虫类
实现CM站点的通用功能（请求认证、响应解密、图片下载等）
"""

from typing import Dict, Any, Optional
from crawlers.base.base_crawler import BaseCrawler
from crawlers.base.request_handler import ProxyMode
from utils.cm_crypto import CMCryptoTool
from utils.cm_image_decoder import CMImageDecoder
from models.image_library import get_image_library
from utils.logger import get_logger

logger = get_logger(__name__)


class CMBaseCrawler(BaseCrawler):
    """CM站点基础爬虫"""

    def __init__(self):
        """初始化CM爬虫"""
        super().__init__('cm')

        # 加密工具
        self.crypto_tool = CMCryptoTool()

        # 图片解码器
        self.image_decoder = CMImageDecoder()

    def make_authenticated_request(
        self,
        url: str,
        method: str = 'GET',
        **kwargs
    ) -> Dict[str, Any]:
        """
        发送带CM认证的请求

        Args:
            url: 请求URL
            method: HTTP方法
            **kwargs: 其他requests参数

        Returns:
            响应数据字典（已解密）
        """
        try:
            # 生成认证token
            headers, ts = self.crypto_tool.get_request_headers()

            # 更新headers
            if 'headers' in kwargs:
                kwargs['headers'].update(headers)
            else:
                kwargs['headers'] = headers

            # 发送请求（使用站点配置的代理模式）
            response = self.request(method, url, **kwargs)

            # 解析响应
            response_data = response.json()

            # 检查响应状态
            if not CMCryptoTool.verify_response(response_data):
                raise Exception(f"响应验证失败: {response_data}")

            # 解密数据
            if 'data' in response_data and response_data['data']:
                encrypted_data = response_data['data']
                decrypted_data = self.crypto_tool.decrypt_response_json(encrypted_data, ts)
                response_data['data'] = decrypted_data

            return response_data

        except Exception as e:
            logger.error(f"认证请求失败: {url}, error={e}")
            raise

    def download_image(
        self,
        image_url: str,
        aid: int,
        pid: Optional[int],
        image_type: str,
        decode: bool = True,
        page: int = 1
    ) -> tuple:
        """
        下载图片并提交给图片库

        只负责：
        1. 下载图片
        2. 解密（如果需要）
        3. 验证图片
        4. 提交给图片库

        Args:
            image_url: 图片URL
            aid: 漫画ID
            pid: 章节ID（封面图为None）
            image_type: 图片类型 (cover/thumbnail/content)
            decode: 是否需要解密
            page: 页码（用于解密，默认1）

        Returns:
            (image_id, error_message) 元组
            - 成功: (image_id字符串, None)
            - 失败: (None, 错误信息字符串)
        """
        try:
            # 获取最佳CDN
            cdn_url = self.get_best_cdn()

            # 如果URL是相对路径，添加CDN前缀
            if not image_url.startswith('http'):
                if cdn_url:
                    full_url = f"{cdn_url}{image_url}"
                else:
                    base_url = self.get_best_url()
                    full_url = f"{base_url}{image_url}"
            else:
                full_url = image_url

            # 下载图片
            logger.debug(f"下载图片: {full_url}")
            response = self.get(full_url)
            image_data = response.content

            # 验证HTTP响应
            is_valid, error_msg = self.validate_image_response(response)
            if not is_valid:
                full_error = f"HTTP响应验证失败: {error_msg}"
                logger.error(f"图片下载失败: {full_error}, url={full_url}")
                return None, full_error

            # 解密图片
            if decode:
                decode_pid = pid if pid is not None else aid
                logger.debug(f"解密图片: pid={decode_pid}, page={page}")
                decoded_image = self.image_decoder.decode_image(image_data, decode_pid, page)
                image_data = decoded_image.read()

            # 验证解密后的图片
            image_data = self._validate_and_fix_image(image_data)
            if image_data is None:
                error_msg = "图片数据验证失败"
                logger.error(f"图片下载失败: {error_msg}")
                return None, error_msg

            # 提交给图片库
            image_library = get_image_library(self.site_id)
            image_id = image_library.save_image(
                image_data=image_data,
                aid=aid,
                pid=pid,
                page_num=page if image_type == 'content' else None,
                image_type=image_type,
                source_url=image_url
            )

            if image_id:
                logger.debug(f"图片已保存到图片库: image_id={image_id}")
                return image_id, None
            else:
                error_msg = "图片库保存失败"
                logger.error(f"图片下载失败: {error_msg}")
                return None, error_msg

        except Exception as e:
            error_msg = f"下载异常: {str(e)}"
            logger.error(f"下载图片失败: {image_url}, error={e}")
            return None, error_msg

    def _validate_and_fix_image(self, image_data: bytes) -> Optional[bytes]:
        """
        验证图片数据

        Args:
            image_data: 图片二进制数据

        Returns:
            验证后的图片数据，无效返回None
        """
        from PIL import Image
        import io

        try:
            test_img = Image.open(io.BytesIO(image_data))

            if test_img.format not in ['JPEG', 'PNG', 'GIF', 'WEBP', 'BMP']:
                logger.error(f"图片格式无效: {test_img.format}")
                return None

            width, height = test_img.size
            if width < 10 or height < 10 or width > 10000 or height > 10000:
                logger.error(f"图片尺寸无效: {width}x{height}")
                return None

            test_img.verify()
            logger.debug(f"图片验证通过: {test_img.format} {width}x{height}")

            return image_data

        except Exception as e:
            logger.error(f"图片验证失败: {e}")
            return None

    def validate_image_response(self, response) -> tuple[bool, str]:
        """
        验证HTTP响应是否为有效的图片

        Args:
            response: HTTP响应对象

        Returns:
            (是否有效, 错误信息) 元组
        """
        try:
            if response.status_code != 200:
                return False, f"HTTP状态码错误: {response.status_code}"

            content_type = response.headers.get('Content-Type', '')
            if not content_type.startswith('image/'):
                return False, f"Content-Type不是图片: {content_type}"

            image_data = response.content
            if len(image_data) < 1024:
                return False, f"图片数据太小: {len(image_data)} bytes"

            return True, ""

        except Exception as e:
            return False, f"图片验证异常: {str(e)}"

    def download_images(
        self,
        aid: int,
        pid: Optional[int],
        image_urls: list[str],
        image_type: str,
        decode: bool = True
    ) -> list[str]:
        """
        批量下载图片

        Args:
            aid: 漫画ID
            pid: 章节ID
            image_urls: 图片URL列表
            image_type: 图片类型 (cover/thumbnail/content)
            decode: 是否需要解密

        Returns:
            成功保存的image_id列表
        """
        saved_image_ids = []

        for idx, image_url in enumerate(image_urls, start=1):
            try:
                # 下载图片
                image_id, download_error = self.download_image(image_url, aid, pid, image_type, decode, page=idx)
                if image_id:
                    saved_image_ids.append(image_id)
                else:
                    error_detail = download_error or "未知下载错误"
                    logger.warning(f"下载图片失败: idx={idx}, url={image_url}, 原因: {error_detail}")

                # 添加延迟，避免请求过快
                import time
                time.sleep(0.3)

            except Exception as e:
                logger.error(f"下载图片失败: idx={idx}, url={image_url}, error={e}")
                continue

        logger.info(f"图片下载完成: 成功 {len(saved_image_ids)}/{len(image_urls)}")
        return saved_image_ids
