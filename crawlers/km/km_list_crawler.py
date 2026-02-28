"""
KM列表页爬虫 - 宅漫畫 (komiic.com)
使用GraphQL API获取漫画列表数据
"""

from typing import Dict, List, Any
from datetime import datetime
from crawlers.km.km_base_crawler import KMBaseCrawler
from utils.logger import get_logger
from database.mongodb import mongo_db

logger = get_logger(__name__)


class KMListCrawler(KMBaseCrawler):
    """列表页爬虫 - 获取漫画列表"""

    # GraphQL查询语句
    COMIC_BY_CATEGORIES_QUERY = """
query comicByCategories($categoryId: [ID!]!, $pagination: Pagination!) {
  comicByCategories(categoryId: $categoryId, pagination: $pagination) {
    id
    title
    status
    year
    imageUrl
    authors {
      id
      name
      __typename
    }
    categories {
      id
      name
      __typename
    }
    dateUpdated
    monthViews
    views
    favoriteCount
    lastBookUpdate
    lastChapterUpdate
    __typename
  }
}
"""

    @staticmethod
    def _convert_manga_data(raw_data: Dict) -> Dict[str, Any]:
        """
        转换KM站漫画数据格式为数据库格式（与CM字段完全对应）

        Args:
            raw_data: KM API返回的原始数据

        Returns:
            转换后的数据库文档
        """
        # 提取作者
        authors = []
        if raw_data.get('authors'):
            authors = [author.get('name', '') for author in raw_data['authors'] if author.get('name')]

        # 提取分类
        categories = []
        if raw_data.get('categories'):
            categories = [cat.get('name', '') for cat in raw_data['categories'] if cat.get('name')]

        # 合并标签（作者 + 分类）
        tags = authors + categories

        # 处理图片路径
        image_path = raw_data.get('imageUrl', '')

        # 解析时间
        update_time = KMBaseCrawler.parse_iso_datetime(raw_data.get('dateUpdated'))

        # 判断是否完结
        is_end = raw_data.get('status', '') == 'ENDED'

        # 构建文档（与CM字段完全对应）
        doc = {
            'aid': int(raw_data['id']),  # 确保是整数
            'title': raw_data.get('title', ''),
            'title_alias': [],  # KM无此字段，留空
            'summary': '',  # KM列表页无简介，留空
            'author': authors,
            'actors': [],  # KM无此字段，留空
            'create_time': None,  # KM无此字段，留空
            'update_time': update_time,
            'readers': 0,  # KM无此字段，留空
            'likes': 0,  # KM无此字段，留空
            'favorites': raw_data.get('favoriteCount', 0),
            'shares': 0,  # KM无此字段，留空
            'total_photos': 0,  # KM无此字段，留空
            'list_count': 0,  # 后续从章节表统计
            'types': categories,
            'tags': tags,
            'cover_path': image_path,
            'series_id': 0,  # KM无此字段，默认0
            'is_end': is_end,
            'status': raw_data.get('status', 'active'),
            'list_update': datetime.now(),
            'info_update': None,
            'cover_load': 0,
            'views': raw_data.get('views', 0)
        }

        return doc

    def crawl(self, page: int = 1, page_size: int = 1000) -> Dict[str, Any]:
        """
        爬取列表页并保存到数据库

        Args:
            page: 页码（从1开始）
            page_size: 每页数量

        Returns:
            包含调试信息和结果的标准字典
        """
        try:
            logger.info(f"开始爬取KM列表页: page={page}, page_size={page_size}")

            # 计算offset（KM从0开始）
            offset = (page - 1) * page_size

            # 构建GraphQL变量
            variables = {
                "categoryId": [],
                "pagination": {
                    "limit": page_size,
                    "offset": offset,
                    "orderBy": "DATE_UPDATED",
                    "asc": False,
                    "status": ""
                }
            }

            # 发送GraphQL请求
            response_data = self.make_graphql_request(
                operation_name="comicByCategories",
                variables=variables,
                query=self.COMIC_BY_CATEGORIES_QUERY
            )

            # 解析响应
            if 'data' in response_data and 'comicByCategories' in response_data['data']:
                content_list = response_data['data']['comicByCategories']

                logger.info(f"KM列表页爬取成功: 获取 {len(content_list)} 条记录")

                # 转换数据格式并保存到数据库
                if content_list:
                    try:
                        # 转换为数据库格式
                        converted_list = [self._convert_manga_data(item) for item in content_list]
                        # 保存到数据库
                        created, updated = mongo_db.save_manga_list(converted_list, source_site="km")
                        logger.info(f"KM列表页数据保存完成: 创建={created}, 更新={updated}")
                    except Exception as e:
                        logger.error(f"KM列表页数据保存失败: {e}", exc_info=True)

                # 使用通用方法创建成功结果
                return self.create_result(
                    success=True,
                    data=content_list,
                    page=page,
                    count=len(content_list)
                )

            error_msg = "KM列表页爬取失败: 响应数据格式错误"
            logger.warning(f"{error_msg}, page={page}")
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                page=page
            )

        except Exception as e:
            error_msg = f"KM列表页爬取异常: {e}"
            logger.error(f"{error_msg}, page={page}", exc_info=True)
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
        logger.info(f"获取KM列表页爬取数据: site={site_id}, max_pages={max_pages}")
        return [{"page": i} for i in range(1, max_pages + 1)]
