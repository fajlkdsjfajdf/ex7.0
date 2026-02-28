"""
漫画模型 - 按站点分表
"""
from datetime import datetime
from database import get_db


class Comic:
    """漫画模型 - 按站点分表"""

    def __init__(self, site_id: str):
        """
        初始化漫画模型

        Args:
            site_id: 站点ID（如 cm, jm）
        """
        self.site_id = site_id
        self.db = get_db()

        # CM和KM站点使用{site_id}_manga_main，其他站点使用{site_id}_comics
        if site_id in ['cm', 'km']:
            self.collection_name = f'{site_id}_manga_main'
        else:
            self.collection_name = f"{site_id}_comics"

        self.collection = self.db.get_collection(self.collection_name)

    def get_comics_list(self, page: int = 1, per_page: int = 20, skip: int = 0, limit: int = None):
        """
        获取漫画列表

        Args:
            page: 页码（从1开始）
            per_page: 每页数量
            skip: 跳过的数量
            limit: 限制返回数量（如果指定，则忽略per_page）

        Returns:
            dict: {
                'comics': list,  # 漫画列表
                'total': int,    # 总数
                'page': int,     # 当前页
                'pages': int     # 总页数
            }
        """
        try:
            # 获取总数
            total = self.collection.count_documents({})

            # 计算分页
            if limit is not None:
                actual_limit = limit
                actual_skip = skip
            else:
                actual_limit = per_page
                actual_skip = (page - 1) * per_page

            # 获取漫画列表
            cursor = self.collection.find(
                {},
                {
                    # 排除大字段
                    'description': 0,
                    'chapters': 0
                }
            ).sort('created_at', -1).skip(actual_skip).limit(actual_limit)

            comics = []
            for doc in cursor:
                comic = self._format_comic(doc)
                comics.append(comic)

            # 计算总页数
            if limit is not None:
                pages = 1
            else:
                pages = (total + per_page - 1) // per_page if total > 0 else 1

            return {
                'comics': comics,
                'total': total,
                'page': page,
                'pages': pages
            }

        except Exception as e:
            print(f"获取漫画列表失败: {e}")
            return {
                'comics': [],
                'total': 0,
                'page': page,
                'pages': 0
            }

    def get_comic_by_aid(self, aid: int):
        """
        根据原站ID获取漫画详情

        Args:
            aid: 原站漫画ID

        Returns:
            dict: 漫画详情，如果不存在返回None
        """
        try:
            doc = self.collection.find_one({'aid': aid})
            if doc:
                return self._format_comic(doc)
            return None
        except Exception as e:
            print(f"获取漫画详情失败: {e}")
            return None

    def get_comic_by_id(self, comic_id: str):
        """
        根据MongoDB ID获取漫画详情

        Args:
            comic_id: MongoDB文档ID

        Returns:
            dict: 漫画详情，如果不存在返回None
        """
        try:
            from bson import ObjectId
            doc = self.collection.find_one({'_id': ObjectId(comic_id)})
            if doc:
                return self._format_comic(doc)
            return None
        except Exception as e:
            print(f"获取漫画详情失败: {e}")
            return None

    def get_comics_by_aids(self, aids: list):
        """
        根据原站ID批量获取漫画详情

        Args:
            aids: 原站漫画ID列表

        Returns:
            list: 漫画详情列表
        """
        try:
            cursor = self.collection.find({'aid': {'$in': aids}})
            # 使用字典去重，对于相同的 aid，只保留一条
            comics_dict = {}
            for doc in cursor:
                comic = self._format_comic(doc)
                aid = comic.get('aid')
                if aid:
                    aid_str = str(aid)
                    if aid_str not in comics_dict:
                        comics_dict[aid_str] = comic
            return list(comics_dict.values())
        except Exception as e:
            print(f"批量获取漫画详情失败: {e}")
            return []

    def search_comics(self, keyword: str = None, tags: list = None, page: int = 1, per_page: int = 20):
        """
        搜索漫画

        Args:
            keyword: 关键词（搜索标题和描述）
            tags: 标签列表
            page: 页码
            per_page: 每页数量

        Returns:
            dict: 搜索结果
        """
        try:
            # 构建查询条件
            query = {}

            # 关键词搜索
            if keyword:
                query['$or'] = [
                    {'title': {'$regex': keyword, '$options': 'i'}},
                    {'description': {'$regex': keyword, '$options': 'i'}}
                ]

            # 标签筛选
            if tags and len(tags) > 0:
                query['types'] = {'$in': tags}

            # 获取总数
            total = self.collection.count_documents(query)

            # 获取结果
            skip = (page - 1) * per_page
            cursor = self.collection.find(
                query,
                {
                    'description': 0,
                    'chapters': 0
                }
            ).sort('created_at', -1).skip(skip).limit(per_page)

            comics = []
            for doc in cursor:
                comic = self._format_comic(doc)
                comics.append(comic)

            # 计算总页数
            pages = (total + per_page - 1) // per_page if total > 0 else 1

            return {
                'comics': comics,
                'total': total,
                'page': page,
                'pages': pages
            }

        except Exception as e:
            print(f"搜索漫画失败: {e}")
            return {
                'comics': [],
                'total': 0,
                'page': page,
                'pages': 0
            }

    def _format_comic(self, doc: dict) -> dict:
        """
        格式化漫画数据供前端使用

        Args:
            doc: MongoDB文档

        Returns:
            dict: 格式化后的漫画数据
        """
        # 处理author字段（可能是数组或字符串）
        author = doc.get('author', '')
        if isinstance(author, list):
            author = ', '.join(author) if author else ''
        elif not author:
            author = '未知作者'

        # 处理简介字段（CM站点用summary，其他站点用description）
        description = doc.get('summary') or doc.get('description', '')

        pic_url = doc.get('pic', '')

        # 构建漫画数据
        comic = {
            'id': str(doc.get('_id', '')),
            'aid': doc.get('aid', 0),
            'title': doc.get('title', ''),
            'description': description,
            'author': author,
            'types': doc.get('types', []),
            'tags': doc.get('tags', []),
            'status': doc.get('status', ''),
            'is_end': doc.get('is_end', False),
            'list_count': doc.get('list_count', 0),
            'readers': doc.get('readers', 0),
            'pic': pic_url,
            'created_at': doc.get('created_at') or doc.get('info_update'),
            'updated_at': doc.get('updated_at') or doc.get('cover_update'),
            'info_update': doc.get('info_update'),  # 用于判断是否需要爬取详情页
            'cover_update': doc.get('cover_update'),
            'list_update': doc.get('list_update')
        }

        # 处理封面图片URL - 使用业务参数，不再用file_id
        # 格式: /api/media/image?site=km&aid=5644&type=cover
        aid = doc.get('aid', 0)
        comic['cover_url'] = f"/api/media/image?site={self.site_id}&aid={aid}&type=cover"

        return comic


def get_comic_model(site_id: str) -> Comic:
    """
    获取漫画模型实例

    Args:
        site_id: 站点ID

    Returns:
        Comic: 漫画模型实例
    """
    return Comic(site_id)
