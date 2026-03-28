"""
收藏模型
用于记录用户的漫画收藏
"""
from datetime import datetime
from bson import ObjectId
from utils.logger import get_logger

logger = get_logger(__name__)


class Favorite:
    """收藏模型类"""

    def __init__(self, db, site_id: str):
        """
        初始化收藏模型

        Args:
            db: MongoDB数据库实例
            site_id: 站点ID (如 cm, km)
        """
        self.db = db
        self.site_id = site_id
        self.collection_name = f"{site_id}_user_favorites"
        self.collection = db.get_collection(self.collection_name)

    def add_favorite(self, user_id, aid: int) -> bool:
        """
        添加收藏

        Args:
            user_id: 用户ID (ObjectId 或 str)
            aid: 漫画ID

        Returns:
            是否成功
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            now = datetime.now()

            # 使用 upsert，已存在则更新时间
            self.collection.update_one(
                {'user_id': user_id, 'aid': aid},
                {'$set': {'favorite_time': now}},
                upsert=True
            )

            logger.debug(f"[收藏] 添加成功: user={user_id}, site={self.site_id}, aid={aid}")
            return True

        except Exception as e:
            logger.error(f"[收藏] 添加失败: {e}")
            return False

    def remove_favorite(self, user_id, aid: int) -> bool:
        """
        取消收藏

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
            logger.error(f"[收藏] 取消失败: {e}")
            return False

    def is_favorited(self, user_id, aid: int) -> bool:
        """
        检查是否已收藏

        Args:
            user_id: 用户ID
            aid: 漫画ID

        Returns:
            是否已收藏
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            record = self.collection.find_one(
                {'user_id': user_id, 'aid': aid},
                {'_id': 1}
            )

            return record is not None

        except Exception as e:
            logger.error(f"[收藏] 检查失败: {e}")
            return False

    def get_favorite(self, user_id, aid: int) -> dict:
        """
        获取单条收藏记录

        Args:
            user_id: 用户ID
            aid: 漫画ID

        Returns:
            收藏信息，包含 favorite_time
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            record = self.collection.find_one(
                {'user_id': user_id, 'aid': aid},
                {'_id': 0, 'aid': 1, 'favorite_time': 1}
            )

            return record or {}

        except Exception as e:
            logger.error(f"[收藏] 获取失败: {e}")
            return {}

    def get_favorite_list(self, user_id, page: int = 1, per_page: int = 20) -> dict:
        """
        获取用户的收藏列表

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

            query = {'user_id': user_id}

            # 获取总数
            total_count = self.collection.count_documents(query)

            # 分页查询，按收藏时间降序
            skip = (page - 1) * per_page
            records = list(self.collection.find(
                query,
                {'_id': 0, 'aid': 1, 'favorite_time': 1}
            ).sort('favorite_time', -1).skip(skip).limit(per_page))

            # 计算总页数
            page_count = (total_count + per_page - 1) // per_page if total_count > 0 else 0

            return {
                'data': records,
                'count': total_count,
                'page': page,
                'page_count': page_count
            }

        except Exception as e:
            logger.error(f"[收藏] 获取列表失败: {e}")
            return {'data': [], 'count': 0, 'page': 1, 'page_count': 0}

    def clear_favorites(self, user_id) -> int:
        """
        清空用户的所有收藏

        Args:
            user_id: 用户ID

        Returns:
            删除的记录数
        """
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)

            result = self.collection.delete_many({'user_id': user_id})

            logger.info(f"[收藏] 清空用户收藏: user={user_id}, count={result.deleted_count}")
            return result.deleted_count

        except Exception as e:
            logger.error(f"[收藏] 清空失败: {e}")
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
            # favorite_time 降序索引
            self.collection.create_index(
                [('favorite_time', -1)],
                name='favorite_time_idx'
            )
            logger.info(f"[收藏] 索引创建成功: {self.collection_name}")
        except Exception as e:
            logger.error(f"[收藏] 创建索引失败: {e}")

    @staticmethod
    def create_all_indexes(db, site_ids: list):
        """
        为所有站点创建收藏索引

        Args:
            db: 数据库实例
            site_ids: 站点ID列表
        """
        for site_id in site_ids:
            try:
                favorite = Favorite(db, site_id)
                favorite.create_indexes()
            except Exception as e:
                logger.error(f"[收藏] 为站点 {site_id} 创建索引失败: {e}")
