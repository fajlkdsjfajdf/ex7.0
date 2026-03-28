"""
历史记录模型
用于记录用户的阅读历史
"""
from datetime import datetime
from bson import ObjectId
from utils.logger import get_logger

logger = get_logger(__name__)


class History:
    """历史记录模型类"""

    def __init__(self, db, site_id: str):
        """
        初始化历史记录模型

        Args:
            db: MongoDB数据库实例
            site_id: 站点ID (如 cm, km)
        """
        self.db = db
        self.site_id = site_id
        self.collection_name = f"{site_id}_user_history"
        self.collection = db.get_collection(self.collection_name)

    def record_history(self, user_id, aid: int, pid: int = None) -> bool:
        """
        记录/更新阅读历史

        Args:
            user_id: 用户ID (ObjectId 或 str)
            aid: 漫画ID
            pid: 章节ID (可选)

        Returns:
            是否成功
        """
        try:
            # 确保 user_id 是 ObjectId
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            now = datetime.now()

            # 构建更新数据
            update_data = {
                'user_id': user_id,
                'aid': aid,
                'read_time': now
            }

            # 如果有章节ID，记录章节阅读时间
            if pid is not None:
                update_data['pid'] = pid
                # 使用 $set 更新 chapter_list 中的对应章节
                chapter_key = f'chapter_list.{pid}'

                self.collection.update_one(
                    {'user_id': user_id, 'aid': aid},
                    {
                        '$set': {
                            'pid': pid,
                            'read_time': now,
                            chapter_key: now
                        }
                    },
                    upsert=True
                )
            else:
                # 只更新作品级别的阅读时间
                self.collection.update_one(
                    {'user_id': user_id, 'aid': aid},
                    {'$set': {'read_time': now}},
                    upsert=True
                )

            logger.debug(f"[历史记录] 记录成功: user={user_id}, site={self.site_id}, aid={aid}, pid={pid}")
            return True

        except Exception as e:
            logger.error(f"[历史记录] 记录失败: {e}")
            return False

    def get_history(self, user_id, aid: int) -> dict:
        """
        获取单个漫画的阅读历史

        Args:
            user_id: 用户ID
            aid: 漫画ID

        Returns:
            历史记录信息，包含 pid, read_time, chapter_list
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            record = self.collection.find_one(
                {'user_id': user_id, 'aid': aid},
                {'_id': 0, 'pid': 1, 'read_time': 1, 'chapter_list': 1}
            )

            return record or {}

        except Exception as e:
            logger.error(f"[历史记录] 获取失败: {e}")
            return {}

    def get_history_list(self, user_id, page: int = 1, per_page: int = 20) -> dict:
        """
        获取用户的阅读历史列表

        Args:
            user_id: 用户ID
            page: 页码
            per_page: 每页数量

        Returns:
            包含 data, count, page, page_count 的字典
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            # 查询条件
            query = {'user_id': user_id}

            # 获取总数
            total_count = self.collection.count_documents(query)

            # 分页查询，按阅读时间降序
            skip = (page - 1) * per_page
            records = list(self.collection.find(
                query,
                {'_id': 0, 'aid': 1, 'pid': 1, 'read_time': 1}
            ).sort('read_time', -1).skip(skip).limit(per_page))

            # 计算总页数
            page_count = (total_count + per_page - 1) // per_page if total_count > 0 else 0

            return {
                'data': records,
                'count': total_count,
                'page': page,
                'page_count': page_count
            }

        except Exception as e:
            logger.error(f"[历史记录] 获取列表失败: {e}")
            return {'data': [], 'count': 0, 'page': 1, 'page_count': 0}

    def delete_history(self, user_id, aid: int) -> bool:
        """
        删除单条历史记录

        Args:
            user_id: 用户ID
            aid: 漫画ID

        Returns:
            是否成功
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            result = self.collection.delete_one(
                {'user_id': user_id, 'aid': aid}
            )

            return result.deleted_count > 0

        except Exception as e:
            logger.error(f"[历史记录] 删除失败: {e}")
            return False

    def clear_history(self, user_id) -> int:
        """
        清空用户的所有历史记录

        Args:
            user_id: 用户ID

        Returns:
            删除的记录数
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            result = self.collection.delete_many({'user_id': user_id})

            logger.info(f"[历史记录] 清空用户历史: user={user_id}, count={result.deleted_count}")
            return result.deleted_count

        except Exception as e:
            logger.error(f"[历史记录] 清空失败: {e}")
            return 0

    def create_indexes(self):
        """创建索引"""
        try:
            # user_id + aid 复合唯一索引
            self.collection.create_index(
                [('user_id', 1), ('aid', 1)],
                unique=True,
                name='user_aid_unique'
            )
            # read_time 降序索引（用于按时间排序）
            self.collection.create_index(
                [('read_time', -1)],
                name='read_time_idx'
            )
            logger.info(f"[历史记录] 索引创建成功: {self.collection_name}")
        except Exception as e:
            logger.error(f"[历史记录] 创建索引失败: {e}")

    @staticmethod
    def create_all_indexes(db, site_ids: list):
        """
        为所有站点创建历史记录索引

        Args:
            db: 数据库实例
            site_ids: 站点ID列表
        """
        for site_id in site_ids:
            try:
                history = History(db, site_id)
                history.create_indexes()
            except Exception as e:
                logger.error(f"[历史记录] 为站点 {site_id} 创建索引失败: {e}")
