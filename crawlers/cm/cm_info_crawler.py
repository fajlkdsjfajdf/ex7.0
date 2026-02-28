"""
CM详情页爬虫
获取漫画详细信息
"""

from typing import Dict, List, Any, Optional
from crawlers.cm.cm_base_crawler import CMBaseCrawler
from utils.logger import get_logger
from database.mongodb import mongo_db

logger = get_logger(__name__)


class CMInfoCrawler(CMBaseCrawler):
    """详情页爬虫 - 获取漫画详细信息"""

    @staticmethod
    def _convert_manga_info_data(raw_data: Dict, existing_data: Dict = None) -> Dict[str, Any]:
        """
        转换CM站漫画详情数据格式为数据库格式

        Args:
            raw_data: CM API返回的详情数据
            existing_data: 已有的漫画数据（用于保留list阶段的字段）

        Returns:
            转换后的数据库文档
        """
        from datetime import datetime, timezone

        # 如果有现有数据，保留list阶段的字段（但排除_id等不可变字段）
        if existing_data:
            doc = {k: v for k, v in existing_data.items() if k != '_id'}
            # 将ISO字符串格式的datetime字段转换回datetime对象
            datetime_fields = ['created_at', 'updated_at', 'update_time', 'create_time', 'info_update', 'list_update', 'cover_update']
            for field in datetime_fields:
                if field in doc and isinstance(doc[field], str):
                    try:
                        doc[field] = datetime.fromisoformat(doc[field].replace('Z', '+00:00'))
                    except:
                        # 如果转换失败，保持原值
                        pass
        else:
            # 如果没有现有数据，初始化基础字段
            doc = {}

        # 基本信息
        doc['aid'] = int(raw_data.get('id', 0))

        # 标题
        if raw_data.get('name'):
            doc['title'] = raw_data['name']
        else:
            doc.setdefault('title', '')

        # 别名
        title_alias = raw_data.get('alias', '')
        if title_alias:
            if isinstance(title_alias, str):
                doc['title_alias'] = [title_alias]
            elif isinstance(title_alias, list):
                doc['title_alias'] = title_alias
        else:
            doc.setdefault('title_alias', [])

        # 简介（转换为简体中文）
        from utils.text_utils import to_jianti
        if raw_data.get('description'):
            doc['summary'] = to_jianti(raw_data['description'])
        else:
            doc.setdefault('summary', '')

        # 作者（保持数组格式）
        author = raw_data.get('author', '')
        if author:
            if isinstance(author, str):
                doc['author'] = [author] if author else []
            elif isinstance(author, list):
                doc['author'] = author
        else:
            doc.setdefault('author', [])

        # 演员
        actors = raw_data.get('actors', [])
        if actors:
            if isinstance(actors, list):
                doc['actors'] = actors
        else:
            doc.setdefault('actors', [])

        # 统计信息
        if raw_data.get('likes'):
            doc['likes'] = int(raw_data['likes']) if isinstance(raw_data['likes'], (int, str)) else 0
        else:
            doc.setdefault('likes', 0)

        if raw_data.get('favorites'):
            doc['favorites'] = int(raw_data['favorites']) if isinstance(raw_data['favorites'], (int, str)) else 0
        else:
            doc.setdefault('favorites', 0)

        if raw_data.get('views'):
            doc['views'] = int(raw_data['views']) if isinstance(raw_data['views'], (int, str)) else 0
        else:
            doc.setdefault('views', 0)

        # 类型标签（保持原有字段）
        types = raw_data.get('categories', [])
        if types:
            if isinstance(types, list):
                doc['types'] = [t.get('title') if isinstance(t, dict) else str(t) for t in types if t]
        else:
            doc.setdefault('types', [])

        # 原始标签（保持原有字段）
        raw_tags = raw_data.get('tags', [])
        if raw_tags:
            if isinstance(raw_tags, list):
                doc['tags'] = [t.get('title') if isinstance(t, dict) else str(t) for t in raw_tags if t]
        else:
            doc.setdefault('tags', [])

        # 合并所有标签到 tags 数组（用于搜索）：
        # 包括：演员(actors)、作者(author)、分类(categories)、原始标签(tags)
        # 全部转换为简体中文并去重
        all_tags = set()  # 使用 set 自动去重

        # 无效值列表（不作为标签）
        invalid_values = {'N/A', 'NA', 'n/a', 'null', '', 'none', '无', '未知', '暂无'}

        # 添加演员
        actors = raw_data.get('actors', [])
        if isinstance(actors, list):
            for actor in actors:
                if isinstance(actor, dict):
                    actor_name = actor.get('title') or actor.get('name')
                else:
                    actor_name = str(actor)
                if actor_name and actor_name not in invalid_values:
                    all_tags.add(to_jianti(actor_name))

        # 添加作者
        author = raw_data.get('author', '')
        if author:
            if isinstance(author, str):
                if author not in invalid_values:
                    all_tags.add(to_jianti(author))
            elif isinstance(author, list):
                for a in author:
                    if a and str(a) not in invalid_values:
                        all_tags.add(to_jianti(str(a)))

        # 添加分类
        if isinstance(types, list):
            for t in types:
                if isinstance(t, dict):
                    type_name = t.get('title')
                else:
                    type_name = str(t)
                if type_name and type_name not in invalid_values:
                    all_tags.add(to_jianti(type_name))

        # 添加原始标签
        if isinstance(raw_tags, list):
            for t in raw_tags:
                if isinstance(t, dict):
                    tag_name = t.get('title')
                else:
                    tag_name = str(t)
                if tag_name and tag_name not in invalid_values:
                    all_tags.add(to_jianti(tag_name))

        # 更新 tags 为合并去重后的列表
        doc['tags'] = list(all_tags)

        # 系列ID（单本漫画为0）
        if raw_data.get('series_id'):
            doc['series_id'] = int(raw_data['series_id'])
        else:
            doc['series_id'] = 0  # 单本漫画

        # 是否完结
        if raw_data.get('is_end') is not None:
            doc['is_end'] = bool(raw_data['is_end'])
        else:
            doc.setdefault('is_end', False)

        # 总页数/章节数
        if raw_data.get('total_photos'):
            doc['total_photos'] = int(raw_data['total_photos'])
        else:
            doc.setdefault('total_photos', 0)

        if raw_data.get('list_count'):
            doc['list_count'] = int(raw_data['list_count'])
        else:
            doc.setdefault('list_count', 0)

        # 封面路径（相对路径，不含host）
        # 只有在API返回了新值时才更新，否则保留原值
        if raw_data.get('image'):
            doc['cover_path'] = raw_data['image']
        else:
            doc.setdefault('cover_path', '')

        # 时间字段转换
        # update_at: Unix时间戳（秒）
        if raw_data.get('update_at'):
            doc['update_time'] = datetime.fromtimestamp(
                int(raw_data['update_at']),
                tz=timezone.utc
            )
        else:
            doc.setdefault('update_time', None)

        # create_at: Unix时间戳（秒）
        if raw_data.get('create_at'):
            doc['create_time'] = datetime.fromtimestamp(
                int(raw_data['create_at']),
                tz=timezone.utc
            )
        else:
            doc.setdefault('create_time', None)

        # 更新info_update时间（当前时间）
        doc['info_update'] = datetime.now(timezone.utc)

        # 保留list_update（如果有现有数据）
        if not existing_data or 'list_update' not in doc:
            doc['list_update'] = datetime.now(timezone.utc)

        # 其他默认字段
        doc.setdefault('readers', 0)
        doc.setdefault('shares', 0)
        doc.setdefault('status', 'active')
        doc.setdefault('cover_load', 0)

        return doc

    @staticmethod
    def _convert_chapter_data(aid: int, raw_series: List[Dict]) -> List[Dict[str, Any]]:
        """
        转换CM站章节数据格式为数据库格式

        根据 database_design.md 中 {site}_manga_chapters 表的定义

        Args:
            aid: 漫画ID
            raw_series: CM API返回的series数组

        Returns:
            转换后的章节文档列表
        """
        from datetime import datetime

        chapter_list = []

        if raw_series and len(raw_series) > 0:
            # 有系列章节
            for item in raw_series:
                chapter = {
                    'aid': int(aid),
                    'pid': int(item.get('id', 0)),
                    'title': item.get('name', '') or item.get('title', ''),
                    'order': int(item.get('sort', 0)),
                    'page_count': 0,  # 将在content爬虫填充
                    'thumbnail_images': [],  # 将在content爬虫填充
                    'content_images': [],  # 将在content爬虫填充
                    'update_time': None,  # 章节更新时间（站点）
                    'info_update': None,  # info爬虫更新时间
                    'content_update': None,  # content爬虫更新时间
                    'thumbnail_total': 0,  # 冗余
                    'thumbnail_loaded': 0,  # 冗余
                    'content_total': 0,  # 冗余
                    'content_loaded': 0,  # 冗余
                    'status': 'pending',  # pending/failed/completed
                    'error_message': None
                }
                if not chapter['title']:
                    chapter['title'] = f"未命名 第{chapter['order']}章"
                chapter_list.append(chapter)
        else:
            # 单本漫画，创建默认章节
            chapter = {
                'aid': int(aid),
                'pid': int(aid),  # 单本漫画的pid等于aid
                'title': '单本',
                'order': 1,
                'page_count': 0,  # 将在content爬虫填充
                'thumbnail_images': [],  # 将在content爬虫填充
                'content_images': [],  # 将在content爬虫填充
                'update_time': None,
                'info_update': None,
                'content_update': None,
                'thumbnail_total': 0,
                'thumbnail_loaded': 0,
                'content_total': 0,
                'content_loaded': 0,
                'status': 'pending',
                'error_message': None
            }
            chapter_list.append(chapter)

        return chapter_list

    def crawl(self, aid: int) -> Dict[str, Any]:
        """
        爬取详情页并保存到数据库

        Args:
            aid: 漫画ID

        Returns:
            包含调试信息和结果的标准字典
        """
        # 确保 aid 是整数（从 JSON 传过来可能是字符串）
        aid = int(aid)

        try:
            base_url = self.get_best_url()
            url = f"{base_url}/album?id={aid}"

            logger.info(f"开始爬取详情页: aid={aid}")
            response_data = self.make_authenticated_request(url)

            if response_data.get('code') == 200:
                info = response_data.get('data', {})
                if isinstance(info, dict):
                    # 检查是否为无效漫画（项目已被删除）
                    # 条件：有ID但没有名称
                    info_id = info.get('id')
                    info_name = info.get('name')

                    if info_id and not info_name:
                        # 项目已被删除，删除数据库中的记录
                        logger.warning(f"检测到无效漫画（已删除）: aid={aid}")

                        try:
                            # 删除主表记录
                            main_collection = mongo_db.get_collection("cm_manga_main")
                            main_result = main_collection.delete_one({'aid': int(aid)})

                            # 删除章节表记录
                            chapters_collection = mongo_db.get_collection("cm_manga_chapters")
                            chapters_result = chapters_collection.delete_many({'aid': int(aid)})

                            logger.info(f"已删除无效漫画的数据库记录: aid={aid}, 主表={main_result.deleted_count}, 章节={chapters_result.deleted_count}")

                            # 返回成功（删除也是一种成功）
                            return self.create_result(
                                success=True,
                                data={'deleted': True, 'reason': '项目已被删除'},
                                aid=aid
                            )

                        except Exception as e:
                            logger.error(f"删除无效漫画记录失败: aid={aid}, {e}", exc_info=True)
                            return self.create_result(
                                success=False,
                                data=None,
                                error=f"删除无效漫画记录失败: {e}",
                                aid=aid
                            )

                    logger.info(f"详情页爬取成功: aid={aid}")

                    # 查询现有数据（保留list阶段的字段）
                    existing = mongo_db.get_manga_by_aid(aid, source_site="cm")

                    # 转换主表数据格式
                    manga_data = self._convert_manga_info_data(info, existing)

                    # 提取并转换章节数据
                    raw_series = info.get('series', [])
                    chapter_list = self._convert_chapter_data(aid, raw_series)

                    # 更新list_count
                    manga_data['list_count'] = len(chapter_list)

                    # 先保存章节列表
                    if chapter_list:
                        try:
                            chapter_created, chapter_updated = mongo_db.save_chapter_list(
                                aid, chapter_list, source_site="cm"
                            )
                            logger.info(f"章节列表保存完成: aid={aid}, 创建={chapter_created}, 更新={chapter_updated}")
                        except Exception as e:
                            logger.error(f"章节列表保存失败: aid={aid}, {e}", exc_info=True)

                    # 再保存主表数据
                    try:
                        collection_name = "cm_manga_main"
                        collection = mongo_db.get_collection(collection_name)

                        # 构建更新数据
                        update_data = manga_data.copy()

                        # 使用upsert更新或插入
                        collection.update_one(
                            {'aid': aid},
                            {'$set': update_data},
                            upsert=True
                        )

                        logger.info(f"详情页数据保存完成: aid={aid}")
                        # 使用通用方法创建成功结果
                        return self.create_result(
                            success=True,
                            data=manga_data,
                            aid=aid
                        )
                    except Exception as e:
                        error_msg = f"详情页数据保存失败: {e}"
                        logger.error(f"{error_msg}, aid={aid}", exc_info=True)
                        # 使用通用方法创建失败结果
                        return self.create_result(
                            success=False,
                            data=None,
                            error=error_msg,
                            aid=aid
                        )

            error_msg = f"详情页爬取失败: code={response_data.get('code')}"
            logger.warning(f"{error_msg}, aid={aid}")
            # 使用通用方法创建失败结果
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                aid=aid
            )

        except Exception as e:
            error_msg = f"详情页爬取异常: {e}"
            logger.error(f"{error_msg}, aid={aid}", exc_info=True)
            # 使用通用方法创建失败结果
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                aid=aid
            )

    def get_crawler_data(self, site_id: str = "cm", max_count: int = 100) -> List[Dict[str, Any]]:
        """
        获取需要爬取详情页的漫画数据

        策略：
        1. 获取没有info数据的（info_update为None），最多 max_count 个
        2. 获取需要刷新的（info_update超过24小时），最多 max_count 个
        3. 合并去重，总数可能超过 max_count

        Args:
            site_id: 站点ID
            max_count: 每种类型的最大处理数量

        Returns:
            漫画数据字典列表 [{"aid": 123}, ...]
        """
        logger.info(f"获取详情页爬取数据: site={site_id}, max_count={max_count}")

        result = []

        try:
            collection_name = f"{site_id}_manga_main"
            collection = mongo_db.get_collection(collection_name)

            # 1. 获取没有info数据的漫画（最多 max_count 个）
            no_info_query = {
                '$or': [
                    {'info_update': None},
                    {'info_update': {'$exists': False}}
                ]
            }

            no_info_manga = list(collection.find(no_info_query)
                                    .sort('list_update', -1)  # 最新添加的优先
                                    .limit(max_count))

            logger.info(f"找到 {len(no_info_manga)} 个没有info数据的漫画")

            # 提取 aid
            result.extend([{'aid': m['aid']} for m in no_info_manga])

            # 2. 获取需要刷新的（info_update超过24小时的，最多 max_count 个）
            from datetime import datetime, timedelta
            stale_query = {
                'info_update': {
                    '$lt': datetime.now() - timedelta(hours=24)
                }
            }

            stale_manga = list(collection.find(stale_query)
                                 .sort('info_update', 1)  # 最旧的优先
                                 .limit(max_count))

            logger.info(f"找到 {len(stale_manga)} 个需要刷新info的漫画")

            # 去重并添加
            existing_aids = {m['aid'] for m in no_info_manga}
            for m in stale_manga:
                if m['aid'] not in existing_aids:
                    result.append({'aid': m['aid']})
                    existing_aids.add(m['aid'])

            logger.info(f"总共获取到 {len(result)} 个需要爬取详情的漫画")
            return result

        except Exception as e:
            logger.error(f"获取详情页爬取数据失败: {e}", exc_info=True)
            return []
