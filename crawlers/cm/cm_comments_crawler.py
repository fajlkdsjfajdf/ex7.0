"""
评论页爬虫
"""

from typing import Dict, Any, List
from crawlers.cm.cm_base_crawler import CMBaseCrawler
from utils.logger import get_logger

logger = get_logger(__name__)


class CMCommentsCrawler(CMBaseCrawler):
    """
    评论页爬虫 - 获取章节评论

    基于老代码 CmCommentsCrawlerProcess 实现
    - API: /forum?page={page}&mode=all&aid={pid}
    - 一个章节一个评论记录
    - 支持多页爬取（默认2页）
    """

    def __init__(self):
        super().__init__()
        self.comments_cache = {}  # 缓存评论数据：{chapter_id: {page_count, comments_list}}

    def crawl(self, pid: int, max_pages: int = 2) -> Dict[str, Any]:
        """
        爬取章节评论并保存到数据库

        Args:
            pid: 章节ID
            max_pages: 最大爬取页数（默认2页）

        Returns:
            包含调试信息和结果的标准字典
        """
        try:
            base_url = self.get_best_url()

            # 获取章节信息（需要aid）
            from database.mongodb import mongo_db
            chapters_collection = mongo_db.get_collection(f"{self.site_id}_manga_chapters")
            chapter = chapters_collection.find_one({'pid': pid})

            if not chapter:
                error_msg = f"章节不存在: pid={pid}"
                logger.error(error_msg)
                return self.create_result(
                    success=False,
                    data=None,
                    error=error_msg,
                    pid=pid
                )

            aid = chapter.get('aid')
            logger.info(f"开始爬取评论: aid={aid}, pid={pid}, max_pages={max_pages}")

            # 爬取多页评论
            all_forums_raw = []  # 所有原始评论
            all_forums = []      # 所有清理后的文本
            seen_contents = set()  # 用于去重（基于内容）

            for page in range(1, max_pages + 1):
                url = f"{base_url}/forum?page={page}&mode=all&aid={pid}"
                response_data = self.make_authenticated_request(url)

                if response_data.get('code') == 200:
                    # 解密响应数据
                    data = response_data.get('data', {})
                    if isinstance(data, dict):
                        content_list = data.get('list', [])

                        # 提取评论数据（原始 + 清理后）
                        from utils.text_utils import clean_comment_content

                        for item in content_list:
                            # 提取原始数据
                            raw_comment = {
                                'content': item.get('content', ''),
                                'user': item.get('user', item.get('author', item.get('nickname', ''))),
                                'time': item.get('time', item.get('created_at', item.get('date', '')))
                            }

                            # 去重（基于内容）
                            content = raw_comment['content']
                            if content and content not in seen_contents:
                                seen_contents.add(content)
                                all_forums_raw.append(raw_comment)

                                # 清理内容用于搜索
                                cleaned_content = clean_comment_content(content)
                                if cleaned_content:
                                    all_forums.append(cleaned_content)
                else:
                    logger.warning(f"评论页爬取失败: pid={pid}, page={page}, code={response_data.get('code')}")
                    continue

            logger.info(f"评论爬取完成: aid={aid}, pid={pid}, 总评论数={len(all_forums_raw)}")

            # 保存到数据库
            if all_forums_raw:
                save_success = self._save_to_db(aid, pid, all_forums_raw, all_forums)
                if save_success:
                    logger.info(f"评论已保存到数据库: aid={aid}, pid={pid}")
                else:
                    logger.error(f"评论保存失败: aid={aid}, pid={pid}")
            else:
                logger.info(f"无评论内容，跳过保存: aid={aid}, pid={pid}")

            # 使用通用方法创建成功结果
            return self.create_result(
                success=True,
                data={
                    'aid': aid,
                    'pid': pid,
                    'forums_raw': all_forums_raw,
                    'forums': all_forums,
                    'comment_count': len(all_forums_raw)
                },
                aid=aid,
                pid=pid,
                count=len(all_forums_raw)
            )

        except Exception as e:
            error_msg = f"评论爬取异常: {e}"
            logger.error(f"{error_msg}, pid={pid}", exc_info=True)
            # 使用通用方法创建失败结果
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                pid=pid
            )

    def _save_to_db(self, aid: int, pid: int, forums_raw: List[Dict], forums: List[str]) -> bool:
        """
        保存评论到数据库

        更新 {site}_manga_comments 表和 {site}_manga_chapters 表

        Args:
            aid: 漫画ID
            pid: 章节ID
            forums_raw: 原始评论数据列表（包含 user, time, content）
            forums: 清理后的评论文本列表（用于搜索）

        Returns:
            是否保存成功
        """
        from datetime import datetime, timezone
        from database.mongodb import mongo_db

        try:
            site_id = self.site_id

            # 获取章节信息
            chapters_collection = mongo_db.get_collection(f"{site_id}_manga_chapters")
            chapter = chapters_collection.find_one({'aid': aid, 'pid': pid})

            if not chapter:
                logger.error(f"章节不存在: aid={aid}, pid={pid}")
                return False

            chapter_id = chapter.get('_id')
            if not chapter_id:
                logger.error(f"章节ID不存在: aid={aid}, pid={pid}")
                return False

            # 构造评论文档
            comments_collection = mongo_db.get_collection(f"{site_id}_manga_comments")
            comment_doc = {
                'item_id': chapter_id,  # 关联章节_id
                'aid': aid,
                'pid': pid,
                'forums_raw': forums_raw,  # 原始评论数据（包含 user, time, content）
                'forums': forums,          # 清理后的文本（用于全文搜索）
                'comment_count': len(forums_raw),
                'update_comments': datetime.now(timezone.utc)
            }

            # 使用 upsert 保存（如果存在则更新）
            comments_collection.update_one(
                {'item_id': chapter_id},
                {'$set': comment_doc},
                upsert=True
            )

            # 更新章节表的 update_comments 字段
            chapters_collection.update_one(
                {'_id': chapter_id},
                {'$set': {'update_comments': datetime.now(timezone.utc)}}
            )

            logger.info(f"评论保存成功: aid={aid}, pid={pid}, count={len(forums_raw)}")
            return True

        except Exception as e:
            logger.error(f"评论保存失败: aid={aid}, pid={pid}, error={e}", exc_info=True)
            return False

    def get_crawler_data(self, site_id: str = "cm", max_count: int = 100, days_threshold: int = 20) -> List[Dict[str, Any]]:
        """
        获取需要爬取评论的章节数据

        策略：
        1. 获取没有评论数据的（update_comments为None），最多 max_count 个
        2. 获取需要刷新的（update_comments超过days_threshold天），最多 max_count 个
        3. 合并去重

        Args:
            site_id: 站点ID（默认"cm"）
            max_count: 每种类型的最大处理数量
            days_threshold: 刷新阈值（天数）

        Returns:
            章节数据字典列表 [{"pid": 456}, ...]
        """
        from datetime import datetime, timedelta

        logger.info(f"获取评论爬取数据: site={site_id}, max_count={max_count}, days={days_threshold}")

        result = []

        try:
            from database.mongodb import mongo_db

            chapters_collection = mongo_db.get_collection(f"{site_id}_manga_chapters")

            # 计算时间阈值
            check_time = datetime.now() - timedelta(days=days_threshold)

            # 1. 获取没有评论数据的章节
            no_comments_query = {
                '$or': [
                    {'update_comments': {'$exists': False}},
                    {'update_comments': None}
                ]
            }

            no_comments_chapters = list(chapters_collection.find(no_comments_query)
                                         .sort('info_update', -1)  # 最新添加的优先
                                         .limit(max_count))

            logger.info(f"找到 {len(no_comments_chapters)} 个没有评论数据的章节")

            # 提取 pid
            for chapter in no_comments_chapters:
                pid = chapter.get('pid')
                if pid:
                    result.append({"pid": pid})

            # 2. 获取需要刷新的章节
            stale_query = {
                'update_comments': {
                    '$lt': check_time
                }
            }

            stale_chapters = list(chapters_collection.find(stale_query)
                                  .sort('update_comments', 1)  # 最旧的优先
                                  .limit(max_count))

            logger.info(f"找到 {len(stale_chapters)} 个需要刷新评论的章节")

            # 去重并添加
            existing_pids = {r['pid'] for r in result}
            for chapter in stale_chapters:
                pid = chapter.get('pid')
                if pid and pid not in existing_pids:
                    result.append({"pid": pid})
                    existing_pids.add(pid)

            logger.info(f"总共获取到 {len(result)} 个需要爬取评论的章节")
            return result

        except Exception as e:
            logger.error(f"获取评论爬取数据失败: {e}", exc_info=True)
            return []
