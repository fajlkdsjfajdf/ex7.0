"""
KM站点基础爬虫类 - 宅漫畫 (komiic.com)
实现KM站点的通用功能（GraphQL请求、图片下载等）
特点：使用GraphQL API，不需要加密解密
注意：图片下载需要设置 isAdult=1 cookie 和正确的 Referer
"""

import json
import tempfile
import os
import time
from typing import Dict, Any, Optional, List
from datetime import datetime
from io import BytesIO
from PIL import Image
import requests

from crawlers.base.base_crawler import BaseCrawler
from crawlers.base.request_handler import ProxyMode
from models.image_library import get_image_library
from utils.logger import get_logger

logger = get_logger(__name__)


class KMBaseCrawler(BaseCrawler):
    """KM站点基础爬虫 - 宅漫畫"""

    def __init__(self):
        """初始化KM爬虫"""
        super().__init__('km')

    def make_graphql_request(
        self,
        operation_name: str,
        variables: Dict[str, Any],
        query: str
    ) -> Dict[str, Any]:
        """
        发送GraphQL请求

        Args:
            operation_name: 操作名称
            variables: 变量参数
            query: GraphQL查询语句

        Returns:
            响应数据字典
        """
        try:
            # 获取基础URL
            base_url = self.get_best_url()
            url = f"{base_url}/api/query"

            # 构建请求体
            payload = {
                "operationName": operation_name,
                "variables": variables,
                "query": query
            }

            # 设置请求头
            headers = {
                'Content-Type': 'application/json',
                'Referer': base_url,
                'Origin': base_url
            }

            # 发送POST请求
            logger.debug(f"GraphQL请求: {operation_name}, variables={variables}")
            response = self.post(url, headers=headers, json=payload)

            # 解析响应
            response_data = response.json()

            # 检查是否有错误
            if 'errors' in response_data:
                errors = response_data['errors']
                error_msg = errors[0].get('message', str(errors)) if errors else 'Unknown GraphQL error'
                logger.error(f"GraphQL错误: {error_msg}")
                raise Exception(f"GraphQL错误: {error_msg}")

            return response_data

        except Exception as e:
            logger.error(f"GraphQL请求失败: {operation_name}, error={e}")
            raise

    def download_image(
        self,
        image_url: str,
        aid: int,
        pid: Optional[int],
        image_type: str,
        page: int = 1
    ) -> tuple:
        """
        下载图片（KM站点需要正确的Referer和isAdult cookie）

        Args:
            image_url: 图片URL（可以是相对路径或完整URL）
            aid: 漫画ID
            pid: 章节ID（封面图为None）
            image_type: 图片类型 (cover/thumbnail/content)
            page: 页码

        Returns:
            (image_id, error_message) 元组
            - 成功: (image_id字符串, None)
            - 失败: (None, 错误信息字符串)
        """
        try:
            base_url = self.get_best_url()

            # 构建完整URL
            if image_url.startswith('http'):
                full_url = image_url
            else:
                # KM站点的图片URL格式: {base_url}/api/image/{kid}
                # image_url 是 kid (UUID格式)
                cdn_url = self.get_best_cdn() or base_url
                # KM图片需要加上 /api/image/ 前缀
                if not image_url.startswith('/'):
                    full_url = f"{cdn_url}/api/image/{image_url}"
                else:
                    # 如果已经带有路径前缀，直接拼接
                    full_url = f"{cdn_url}{image_url}"

            logger.debug(f"KM图片完整URL: {full_url}")

            # 构建章节URL作为Referer（关键！必须是完整章节页URL）
            referer = base_url
            if pid and aid:
                # 章节页格式: /comic/{aid}/chapter/{pid}/images/all
                referer = f"{base_url}/comic/{aid}/chapter/{pid}/images/all"

            # 设置请求头和cookies
            headers = {
                'Referer': referer,
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
            cookies = {'isAdult': '1'}

            # 使用基类的get方法（会自动应用代理配置）
            # task_type='content_image' 会根据配置决定是否使用代理
            resp = self.get(full_url, headers=headers, cookies=cookies, timeout=30, task_type='content_image')

            logger.debug(f"图片响应: status={resp.status_code}, size={len(resp.content)} bytes, type={resp.headers.get('Content-Type', 'N/A')}")

            if resp.status_code != 200:
                error_msg = f"HTTP状态码错误: {resp.status_code}"
                logger.error(f"下载图片失败: {error_msg}, URL: {full_url}")
                return None, error_msg

            if len(resp.content) < 100:
                error_msg = f"图片数据太小: {len(resp.content)} bytes"
                logger.error(f"下载图片失败: {error_msg}")
                return None, error_msg

            image_data = resp.content

            # 验证图片
            try:
                test_img = Image.open(BytesIO(image_data))
                if test_img.format not in ['JPEG', 'PNG', 'GIF', 'WEBP', 'BMP']:
                    error_msg = f"图片格式无效: {test_img.format}"
                    logger.error(f"下载图片失败: {error_msg}")
                    return None, error_msg

                width, height = test_img.size
                if width < 10 or height < 10 or width > 10000 or height > 10000:
                    error_msg = f"图片尺寸无效: {width}x{height}"
                    logger.error(f"下载图片失败: {error_msg}")
                    return None, error_msg

                logger.debug(f"图片验证通过: {test_img.format} {width}x{height}")

            except Exception as e:
                error_msg = f"图片验证失败: {str(e)}"
                logger.error(f"下载图片失败: {error_msg}")
                return None, error_msg

            # 提交给图片库（新API - 直接传 image_data）
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
                logger.error(f"下载图片失败: {error_msg}")
                return None, error_msg

        except Exception as e:
            error_msg = f"下载异常: {str(e)}"
            logger.error(f"下载图片失败: {image_url}, error={e}")
            return None, error_msg

    def validate_image_response(self, response) -> tuple:
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
        image_urls: List[str],
        image_type: str
    ) -> List[str]:
        """
        批量下载图片

        Args:
            aid: 漫画ID
            pid: 章节ID
            image_urls: 图片URL列表
            image_type: 图片类型 (cover/thumbnail/content)

        Returns:
            成功保存的file_id列表
        """
        import time

        saved_file_ids = []

        for idx, image_url in enumerate(image_urls, start=1):
            try:
                # 下载图片
                file_id, download_error = self.download_image(image_url, aid, pid, image_type, page=idx)
                if file_id:
                    saved_file_ids.append(file_id)
                else:
                    error_detail = download_error or "未知下载错误"
                    logger.warning(f"下载图片失败: idx={idx}, url={image_url}, 原因: {error_detail}")

                # 添加延迟，避免请求过快
                time.sleep(0.3)

            except Exception as e:
                logger.error(f"下载图片失败: idx={idx}, url={image_url}, error={e}")
                continue

        logger.info(f"图片下载完成: 成功 {len(saved_file_ids)}/{len(image_urls)}")
        return saved_file_ids

    @staticmethod
    def parse_iso_datetime(time_str: str) -> Optional[datetime]:
        """
        解析ISO格式时间字符串

        Args:
            time_str: ISO格式时间字符串

        Returns:
            datetime对象，解析失败返回None
        """
        if not time_str:
            return None
        try:
            # 处理带Z的ISO格式
            return datetime.fromisoformat(time_str.replace('Z', '+00:00'))
        except:
            return None
