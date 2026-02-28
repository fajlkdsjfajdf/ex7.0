"""
封面图片爬虫
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from crawlers.cm.cm_base_crawler import CMBaseCrawler
from models.image_library import get_image_library
from utils.logger import get_logger

logger = get_logger(__name__)


class CMCoverImageCrawler(CMBaseCrawler):
    """首页图片爬虫 - 下载封面/首页图片"""

    def __init__(self):
        super().__init__()

    def crawl(self, aid: int, cover_url: Optional[str] = None, use_home_url: bool = True) -> Dict[str, Any]:
        """
        下载封面/首页图片

        工作流程:
        1. 先问图片库是否存在
        2. 存在 → 检查业务表标记，没标记则补打
        3. 不存在 → 下载 → 存图片库 → 打标记

        Args:
            aid: 漫画ID
            cover_url: 封面图片URL（可选，如果不提供则使用首页图片URL）
            use_home_url: 是否使用首页图片URL格式

        Returns:
            包含调试信息和结果的标准字典
        """
        image_library = get_image_library(self.site_id)

        try:
            # 确保 aid 是整数
            aid = int(aid)

            # 如果没有提供cover_url，使用首页图片URL格式
            if not cover_url and use_home_url:
                ts = int(datetime.now().timestamp())
                cover_url = f"/media/albums/{aid}_3x4.jpg?v={ts}"

            logger.info(f"开始处理封面图片: aid={aid}")

            # 1. 先问图片库是否存在
            image_info = image_library.get_image(
                aid=aid,
                pid=None,
                page_num=None,
                image_type='cover'
            )

            if image_info:
                # 图片已存在，检查业务表标记
                logger.info(f"封面图片已存在于图片库: aid={aid}, image_id={image_info['_id']}")

                if not self._is_marked(aid):
                    # 补打标记
                    self._mark_cover_downloaded(aid, image_info['_id'])
                    logger.info(f"补打标记: aid={aid}")

                return self.create_result(
                    success=True,
                    data={'image_id': image_info['_id'], 'skipped': True},
                    aid=aid,
                    cover_url=cover_url
                )

            # 2. 不存在才下载
            logger.info(f"封面图片不存在，开始下载: aid={aid}, url={cover_url}")

            image_id, download_error = self.download_image(
                cover_url,
                aid=aid,
                pid=None,
                image_type='cover',
                decode=False  # 封面图片不需要解密
            )

            if image_id:
                # 3. 打标记
                self._mark_cover_downloaded(aid, image_id)
                logger.info(f"封面图片下载成功: aid={aid}, image_id={image_id}")

                return self.create_result(
                    success=True,
                    data={'image_id': image_id},
                    aid=aid,
                    cover_url=cover_url
                )
            else:
                error_detail = download_error or "未知下载错误"
                error_msg = f"封面图片下载失败: aid={aid}, 原因: {error_detail}"
                logger.warning(error_msg)
                return self.create_result(
                    success=False,
                    data=None,
                    error=error_msg,
                    aid=aid,
                    cover_url=cover_url
                )

        except Exception as e:
            error_msg = f"封面图片下载异常: {e}"
            logger.error(f"{error_msg}, aid={aid}", exc_info=True)
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                aid=aid,
                cover_url=cover_url
            )

    def _is_marked(self, aid: int) -> bool:
        """
        检查业务表是否已打标记

        Args:
            aid: 漫画ID

        Returns:
            是否已标记
        """
        from database import get_db

        db = get_db()
        collection = db.get_collection(f"{self.site_id}_manga_main")

        # 检查是否有 cover_image_id 或 cover_load=2
        comic = collection.find_one(
            {'aid': aid},
            {'cover_image_id': 1, 'cover_load': 1}
        )

        if not comic:
            return False

        # 有新字段 cover_image_id 或旧字段 cover_load=2 都算已标记
        if comic.get('cover_image_id'):
            return True
        if comic.get('cover_load') == 2:
            return True

        return False

    def _mark_cover_downloaded(self, aid: int, image_id: str):
        """
        在业务表打标记

        Args:
            aid: 漫画ID
            image_id: 图片库中的图片ID
        """
        from database import get_db

        try:
            db = get_db()
            collection = db.get_collection(f"{self.site_id}_manga_main")

            collection.update_one(
                {'aid': aid},
                {'$set': {
                    'cover_image_id': image_id,  # 新字段，指向图片库
                    'cover_load': 2,  # 兼容旧字段
                    'cover_update': datetime.now(timezone.utc)
                }}
            )
            logger.debug(f"封面图片标记已更新: aid={aid}")

        except Exception as e:
            logger.error(f"更新封面图片标记失败: aid={aid}, {e}")

    def get_crawler_data(self, site_id: str = "cm", max_count: int = 500) -> List[Dict[str, Any]]:
        """
        获取需要下载首页图片的漫画数据

        Args:
            site_id: 站点ID
            max_count: 最大处理数量

        Returns:
            漫画数据字典列表 [{"aid": 123}, ...]
        """
        from database import get_db
        from models.image_library import get_image_library

        logger.info(f"获取首页图片爬取数据: site={site_id}, max_count={max_count}")

        db = get_db()
        collection_name = f"{site_id}_manga_main"
        main_collection = db.get_collection(collection_name)
        image_library = get_image_library(site_id)

        # 查询所有漫画
        comics = list(main_collection.find({})
                      .sort('list_update', 1)
                      .limit(max_count))

        # 过滤出需要下载封面的漫画
        result = []
        for comic in comics:
            aid = comic.get('aid')
            if not aid:
                continue

            # 检查图片库中是否存在
            if image_library.image_exists(aid=aid, image_type='cover'):
                continue

            # 检查业务表标记（兼容旧数据）
            if comic.get('cover_image_id') or comic.get('cover_load') == 2:
                # 有标记但图片库没有，需要补图片（这种情况理论上不应该发生）
                continue

            result.append({"aid": aid})

        logger.info(f"获取到 {len(result)} 个需要下载首页图片的漫画")
        return result
