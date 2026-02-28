"""
CM列表页爬虫
获取漫画列表数据
"""

from typing import Dict, List, Any
from crawlers.cm.cm_base_crawler import CMBaseCrawler
from utils.logger import get_logger
from database.mongodb import mongo_db

logger = get_logger(__name__)


class CMListCrawler(CMBaseCrawler):
    """列表页爬虫 - 获取漫画列表"""

    @staticmethod
    def _convert_manga_data(raw_data: Dict) -> Dict[str, Any]:
        """
        转换CM站漫画数据格式为数据库格式

        Args:
            raw_data: CM API返回的原始数据

        Returns:
            转换后的数据库文档
        """
        from datetime import datetime

        # 提取类型信息
        types = []
        if raw_data.get('category', {}).get('title'):
            types.append(raw_data['category']['title'])
        if raw_data.get('category_sub', {}).get('title'):
            types.append(raw_data['category_sub']['title'])

        # 处理作者（转换为数组）
        author = raw_data.get('author', '')
        authors = [author] if author else []

        # 处理图片路径
        image_path = raw_data.get('image', '')

        # 时间戳转换
        update_time = None
        if raw_data.get('update_at'):
            try:
                update_time = datetime.fromtimestamp(raw_data['update_at'])
            except (TypeError, ValueError):
                logger.warning(f"无效的时间戳: {raw_data.get('update_at')}")

        # 构建文档
        doc = {
            'aid': int(raw_data['id']),  # 确保是整数
            'title': raw_data.get('name', ''),
            'title_alias': [],
            'summary': '',
            'author': authors,
            'actors': [],
            'create_time': None,
            'update_time': update_time,
            'readers': 0,
            'likes': 1 if raw_data.get('liked') else 0,
            'favorites': 1 if raw_data.get('is_favorite') else 0,
            'shares': 0,
            'total_photos': 0,
            'list_count': 0,
            'types': types,
            'tags': [],
            'cover_path': image_path,
            'series_id': None,  # list阶段没有这个信息
            'is_end': False,
            'status': 'active',
            'list_update': datetime.now(),
            'info_update': None,
            'cover_load': 0,
            'views': 0
        }

        return doc

    def crawl(self, page: int = 1) -> Dict[str, Any]:
        """
        爬取列表页并保存到数据库

        Args:
            page: 页码

        Returns:
            包含调试信息和结果的标准字典
        """
        try:
            base_url = self.get_best_url()
            url = f"{base_url}/categories/filter?page={page}&o=&c="

            logger.info(f"开始爬取列表页: page={page}")
            response_data = self.make_authenticated_request(url)

            if response_data.get('code') == 200:
                data = response_data.get('data', {})
                if isinstance(data, dict):
                    content_list = data.get('content', [])
                elif isinstance(data, list):
                    content_list = data
                else:
                    content_list = []

                logger.info(f"列表页爬取成功: 获取 {len(content_list)} 条记录")

                # 转换数据格式并保存到数据库
                if content_list:
                    try:
                        # 转换为数据库格式
                        converted_list = [self._convert_manga_data(item) for item in content_list]
                        # 保存到数据库
                        created, updated = mongo_db.save_manga_list(converted_list, source_site="cm")
                        logger.info(f"列表页数据保存完成: 创建={created}, 更新={updated}")
                    except Exception as e:
                        logger.error(f"列表页数据保存失败: {e}", exc_info=True)

                # 使用通用方法创建成功结果
                return self.create_result(
                    success=True,
                    data=content_list,
                    page=page,
                    count=len(content_list)
                )

            error_msg = f"列表页爬取失败: code={response_data.get('code')}"
            logger.warning(f"{error_msg}, page={page}")
            # 使用通用方法创建失败结果
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                page=page
            )

        except Exception as e:
            error_msg = f"列表页爬取异常: {e}"
            logger.error(f"{error_msg}, page={page}", exc_info=True)
            # 使用通用方法创建失败结果
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                page=page
            )

    def get_crawler_data(self, site_id: str, max_pages: int = 100) -> List[Dict[str, Any]]:
        """
        获取需要爬取的列表页数据

        Args:
            site_id: 站点ID
            max_pages: 最大页数

        Returns:
            页码字典列表 [{"page": 1}, {"page": 2}, ...]
        """
        logger.info(f"获取列表页爬取数据: site={site_id}, max_pages={max_pages}")
        return [{"page": i} for i in range(1, max_pages + 1)]
