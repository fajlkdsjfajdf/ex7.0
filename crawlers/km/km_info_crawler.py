"""
KM详情页爬虫 - 宅漫畫 (komiic.com)
使用GraphQL API获取漫画章节信息
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
from crawlers.km.km_base_crawler import KMBaseCrawler
from utils.logger import get_logger
from database.mongodb import mongo_db

logger = get_logger(__name__)


class KMInfoCrawler(KMBaseCrawler):
    """详情页爬虫 - 获取漫画章节信息"""

    # GraphQL查询语句 - 获取章节列表
    CHAPTER_BY_COMIC_ID_QUERY = """
query chapterByComicId($comicId: ID!) {
  chaptersByComicId(comicId: $comicId) {
    id
    serial
    type
    dateCreated
    dateUpdated
    size
    __typename
  }
}
"""

    # GraphQL查询语句 - 检查漫画是否存在
    COMIC_BY_ID_QUERY = """
query comicById($comicId: ID!) {
  comicById(comicId: $comicId) {
    id
    title
    status
    __typename
  }
}
"""

    @staticmethod
    def _convert_manga_info_update(aid: int) -> Dict[str, Any]:
        """
        构建KM站漫画info更新数据

        KM站点的详细信息主要在列表页获取，这里只更新info_update时间

        Args:
            aid: 漫画ID

        Returns:
            更新数据字典
        """
        return {
            'aid': aid,
            'info_update': datetime.now(timezone.utc),
            'list_update': datetime.now(timezone.utc)  # 同时更新list_update
        }

    @staticmethod
    def _convert_chapter_data(aid: int, raw_chapters: List[Dict]) -> List[Dict[str, Any]]:
        """
        转换KM站章节数据格式为数据库格式（与CM字段完全对应）

        Args:
            aid: 漫画ID
            raw_chapters: KM API返回的chapters数组

        Returns:
            转换后的章节文档列表
        """
        chapter_list = []

        if raw_chapters and len(raw_chapters) > 0:
            # 有章节
            for order, item in enumerate(raw_chapters, start=1):
                # 解析时间
                update_time = KMBaseCrawler.parse_iso_datetime(item.get('dateUpdated'))
                create_time = KMBaseCrawler.parse_iso_datetime(item.get('dateCreated'))

                chapter = {
                    'aid': int(aid),
                    'pid': int(item.get('id', 0)),
                    'title': item.get('serial', '') or f"第{order}章",
                    'order': order,
                    'page_count': int(item.get('size', 0)),  # KM有size字段
                    'thumbnail_images': [],  # KM不使用缩略图
                    'content_images': [],  # 将在content爬虫填充
                    'update_time': update_time,  # 章节更新时间（站点）
                    'info_update': datetime.now(timezone.utc),  # info爬虫更新时间
                    'content_update': None,  # content爬虫更新时间
                    'thumbnail_total': 0,  # KM不使用
                    'thumbnail_loaded': 0,  # KM不使用
                    'content_total': 0,  # 将在content爬虫填充
                    'content_loaded': 0,  # 将在content爬虫填充
                    'status': 'pending',  # pending/failed/completed
                    'error_message': None,
                    # KM特有字段
                    'chapter_type': item.get('type', 'chapter')  # chapter/book/其他
                }
                chapter_list.append(chapter)
        else:
            # 没有章节，创建默认章节
            chapter = {
                'aid': int(aid),
                'pid': int(aid),  # 单本漫画的pid等于aid
                'title': '单本',
                'order': 1,
                'page_count': 0,
                'thumbnail_images': [],
                'content_images': [],
                'update_time': None,
                'info_update': datetime.now(timezone.utc),
                'content_update': None,
                'thumbnail_total': 0,
                'thumbnail_loaded': 0,
                'content_total': 0,
                'content_loaded': 0,
                'status': 'pending',
                'error_message': None,
                'chapter_type': 'book'
            }
            chapter_list.append(chapter)

        return chapter_list

    def _check_comic_exists(self, aid: int) -> bool:
        """
        检查漫画是否存在

        Args:
            aid: 漫画ID

        Returns:
            True 如果漫画存在，False 如果漫画已被删除
        """
        try:
            variables = {"comicId": str(aid)}
            response_data = self.make_graphql_request(
                operation_name="comicById",
                variables=variables,
                query=self.COMIC_BY_ID_QUERY
            )

            # 检查响应
            if 'errors' in response_data:
                # GraphQL 返回错误，漫画可能不存在
                return False

            if 'data' in response_data and response_data['data'].get('comicById'):
                # 漫画存在
                return True

            # comicById 返回 null，漫画不存在
            return False

        except Exception as e:
            # 请求出错，假设漫画存在（保守处理）
            logger.warning(f"检查KM漫画存在性失败: aid={aid}, error={e}")
            return True

    def _delete_comic(self, aid: int) -> bool:
        """
        删除无效漫画的数据库记录

        Args:
            aid: 漫画ID

        Returns:
            是否删除成功
        """
        try:
            # 删除主表记录
            main_collection = mongo_db.get_collection("km_manga_main")
            main_result = main_collection.delete_one({'aid': int(aid)})

            # 删除章节表记录
            chapters_collection = mongo_db.get_collection("km_manga_chapters")
            chapters_result = chapters_collection.delete_many({'aid': int(aid)})

            logger.info(f"已删除无效KM漫画的数据库记录: aid={aid}, 主表={main_result.deleted_count}, 章节={chapters_result.deleted_count}")
            return True

        except Exception as e:
            logger.error(f"删除无效KM漫画记录失败: aid={aid}, {e}", exc_info=True)
            return False

    def crawl(self, aid: int) -> Dict[str, Any]:
        """
        爬取详情页（章节信息）并保存到数据库

        Args:
            aid: 漫画ID

        Returns:
            包含调试信息和结果的标准字典
        """
        # 确保 aid 是整数
        aid = int(aid)

        try:
            logger.info(f"开始爬取KM详情页: aid={aid}")

            # 构建GraphQL变量
            variables = {
                "comicId": str(aid)
            }

            # 发送GraphQL请求
            response_data = self.make_graphql_request(
                operation_name="chapterByComicId",
                variables=variables,
                query=self.CHAPTER_BY_COMIC_ID_QUERY
            )

            # 检查是否有 GraphQL 错误（可能表示漫画已被删除）
            if 'errors' in response_data:
                errors = response_data['errors']
                error_msg = errors[0].get('message', str(errors)) if errors else 'Unknown GraphQL error'
                logger.warning(f"KM GraphQL返回错误: aid={aid}, error={error_msg}")

                # 检查漫画是否真的被删除
                if not self._check_comic_exists(aid):
                    logger.warning(f"检测到无效KM漫画（已删除）: aid={aid}")

                    # 删除数据库记录
                    if self._delete_comic(aid):
                        return self.create_result(
                            success=True,
                            data={'deleted': True, 'reason': '项目已被删除'},
                            aid=aid
                        )
                    else:
                        return self.create_result(
                            success=False,
                            data=None,
                            error="删除无效漫画记录失败",
                            aid=aid
                        )

                # 其他错误，返回失败
                return self.create_result(
                    success=False,
                    data=None,
                    error=f"GraphQL错误: {error_msg}",
                    aid=aid
                )

            # 解析响应
            if 'data' in response_data and 'chaptersByComicId' in response_data['data']:
                raw_chapters = response_data['data']['chaptersByComicId']

                # 如果 chaptersByComicId 返回 null，检查漫画是否被删除
                if raw_chapters is None:
                    logger.warning(f"KM chaptersByComicId返回null: aid={aid}")

                    if not self._check_comic_exists(aid):
                        logger.warning(f"检测到无效KM漫画（已删除）: aid={aid}")

                        if self._delete_comic(aid):
                            return self.create_result(
                                success=True,
                                data={'deleted': True, 'reason': '项目已被删除'},
                                aid=aid
                            )
                        else:
                            return self.create_result(
                                success=False,
                                data=None,
                                error="删除无效漫画记录失败",
                                aid=aid
                            )

                    # 漫画存在但没有章节数据
                    raw_chapters = []

                logger.info(f"KM详情页爬取成功: aid={aid}, 章节数={len(raw_chapters) if raw_chapters else 0}")

                # 转换章节数据
                chapter_list = self._convert_chapter_data(aid, raw_chapters or [])

                # 保存章节列表
                if chapter_list:
                    try:
                        chapter_created, chapter_updated = mongo_db.save_chapter_list(
                            aid, chapter_list, source_site="km"
                        )
                        logger.info(f"KM章节列表保存完成: aid={aid}, 创建={chapter_created}, 更新={chapter_updated}")
                    except Exception as e:
                        logger.error(f"KM章节列表保存失败: aid={aid}, {e}", exc_info=True)

                # 更新主表的info_update和list_count
                try:
                    collection_name = "km_manga_main"
                    collection = mongo_db.get_collection(collection_name)

                    update_data = {
                        'info_update': datetime.now(timezone.utc),
                        'list_count': len(chapter_list)
                    }

                    collection.update_one(
                        {'aid': aid},
                        {'$set': update_data}
                    )

                    logger.info(f"KM主表更新完成: aid={aid}, list_count={len(chapter_list)}")

                except Exception as e:
                    logger.error(f"KM主表更新失败: aid={aid}, {e}", exc_info=True)

                return self.create_result(
                    success=True,
                    data={'chapters': chapter_list},
                    aid=aid,
                    chapter_count=len(chapter_list)
                )

            error_msg = "KM详情页爬取失败: 响应数据格式错误"
            logger.warning(f"{error_msg}, aid={aid}")
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                aid=aid
            )

        except Exception as e:
            error_msg = f"KM详情页爬取异常: {e}"
            logger.error(f"{error_msg}, aid={aid}", exc_info=True)
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                aid=aid
            )

    def get_crawler_data(self, site_id: str = "km", max_count: int = 100) -> List[Dict[str, Any]]:
        """
        获取需要爬取详情页的漫画数据

        策略：
        1. 获取没有info数据的（info_update为None），最多 max_count 个
        2. 获取需要刷新的（info_update超过24小时），最多 max_count 个

        Args:
            site_id: 站点ID
            max_count: 每种类型的最大处理数量

        Returns:
            漫画数据字典列表 [{"aid": 123}, ...]
        """
        logger.info(f"获取KM详情页爬取数据: site={site_id}, max_count={max_count}")

        result = []

        try:
            collection_name = f"{site_id}_manga_main"
            collection = mongo_db.get_collection(collection_name)

            # 1. 获取没有info数据的漫画
            no_info_query = {
                '$or': [
                    {'info_update': None},
                    {'info_update': {'$exists': False}}
                ]
            }

            no_info_manga = list(collection.find(no_info_query)
                                    .sort('list_update', -1)
                                    .limit(max_count))

            logger.info(f"找到 {len(no_info_manga)} 个没有info数据的KM漫画")

            result.extend([{'aid': m['aid']} for m in no_info_manga])

            # 2. 获取需要刷新的
            stale_query = {
                'info_update': {
                    '$lt': datetime.now(timezone.utc) - timedelta(hours=24)
                }
            }

            stale_manga = list(collection.find(stale_query)
                                 .sort('info_update', 1)
                                 .limit(max_count))

            logger.info(f"找到 {len(stale_manga)} 个需要刷新info的KM漫画")

            # 去重并添加
            existing_aids = {m['aid'] for m in no_info_manga}
            for m in stale_manga:
                if m['aid'] not in existing_aids:
                    result.append({'aid': m['aid']})
                    existing_aids.add(m['aid'])

            logger.info(f"总共获取到 {len(result)} 个需要爬取详情的KM漫画")
            return result

        except Exception as e:
            logger.error(f"获取KM详情页爬取数据失败: {e}", exc_info=True)
            return []
