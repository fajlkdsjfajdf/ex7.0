"""
KM封面图片爬虫 - 宅漫畫 (komiic.com)
下载漫画封面图片（不需要解密）

图片库重构后：
- 不再存储 cover_file_id 到业务数据库
- 图片库通过 (site, aid, image_type='cover') 定位图片
- 前端URL: /api/media/image?site=km&aid=5644&type=cover
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from crawlers.km.km_base_crawler import KMBaseCrawler
from models.image_library import get_image_library
from utils.logger import get_logger
from database.mongodb import mongo_db

logger = get_logger(__name__)


class KMCoverImageCrawler(KMBaseCrawler):
    """封面图片爬虫 - 下载漫画封面图片"""

    def __init__(self):
        super().__init__()

    def crawl(self, aid: int, cover_url: Optional[str] = None) -> Dict[str, Any]:
        """
        下载封面图片

        Args:
            aid: 漫画ID
            cover_url: 封面图片URL（可选，如果不提供则从数据库获取）

        Returns:
            包含调试信息和结果的标准字典
        """
        try:
            # 确保 aid 是整数
            aid = int(aid)
            image_library = get_image_library(self.site_id)

            # 检查图片库是否已存在
            if image_library.image_exists(aid=aid, image_type='cover'):
                logger.info(f"封面图片已存在于图片库: aid={aid}")
                # 更新状态为已完成
                self._mark_cover_downloaded(aid)
                return self.create_result(
                    success=True,
                    data={'status': 'exists', 'message': '图片已存在'},
                    aid=aid,
                    cover_url=cover_url
                )

            # 如果没有提供cover_url，从数据库获取
            if not cover_url:
                collection = mongo_db.get_collection(f"{self.site_id}_manga_main")
                comic = collection.find_one({'aid': aid}, {'cover_path': 1})
                if comic and comic.get('cover_path'):
                    cover_url = comic['cover_path']
                else:
                    error_msg = f"未找到封面URL: aid={aid}"
                    logger.warning(error_msg)
                    return self.create_result(
                        success=False,
                        data=None,
                        error=error_msg,
                        aid=aid
                    )

            logger.info(f"开始下载KM封面图片: aid={aid}, url={cover_url}")

            # 下载图片并提交到图片库
            image_id, download_error = self.download_image(
                cover_url,
                aid=aid,
                pid=None,  # 封面图没有章节ID
                image_type='cover',
                page=1
            )

            if image_id:
                logger.info(f"KM封面图片下载成功: aid={aid}")

                # 更新数据库状态（不再存储file_id）
                self._mark_cover_downloaded(aid)

                return self.create_result(
                    success=True,
                    data={'image_id': image_id},
                    aid=aid,
                    cover_url=cover_url
                )
            else:
                error_detail = download_error or "未知下载错误"
                error_msg = f"KM封面图片下载失败: aid={aid}, 原因: {error_detail}"
                logger.warning(error_msg)
                return self.create_result(
                    success=False,
                    data=None,
                    error=error_msg,
                    aid=aid,
                    cover_url=cover_url
                )

        except Exception as e:
            error_msg = f"KM封面图片下载异常: {e}"
            logger.error(f"{error_msg}, aid={aid}", exc_info=True)
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                aid=aid
            )

    def _mark_cover_downloaded(self, aid: int):
        """标记封面已下载"""
        try:
            collection = mongo_db.get_collection(f"{self.site_id}_manga_main")
            collection.update_one(
                {'aid': aid},
                {'$set': {
                    'cover_load': 2,  # 2表示已完成
                    'cover_update': datetime.now(timezone.utc)
                }}
            )
            logger.debug(f"封面状态已更新: aid={aid}")
        except Exception as e:
            logger.error(f"更新封面状态失败: aid={aid}, {e}")

    def crawl_batch(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        批量下载封面图片

        Args:
            items: 漫画数据列表 [{"aid": 123, "cover_path": "..."}, ...]

        Returns:
            包含成功/失败统计的结果字典
        """
        success_count = 0
        failed_count = 0
        results = []

        for item in items:
            aid = item.get('aid')
            cover_url = item.get('cover_path')

            if not aid:
                continue

            result = self.crawl(aid=aid, cover_url=cover_url)

            if result.get('success'):
                success_count += 1
            else:
                failed_count += 1

            results.append({
                'aid': aid,
                'success': result.get('success'),
                'error': result.get('error') if not result.get('success') else None
            })

        logger.info(f"KM封面图片批量下载完成: 成功={success_count}, 失败={failed_count}")

        return self.create_result(
            success=True,
            data={
                'total': len(items),
                'success_count': success_count,
                'failed_count': failed_count,
                'results': results
            }
        )

    def get_crawler_data(self, site_id: str = "km", max_count: int = 500) -> List[Dict[str, Any]]:
        """
        获取需要下载封面图片的漫画数据

        Args:
            site_id: 站点ID
            max_count: 最大处理数量

        Returns:
            漫画数据字典列表 [{"aid": 123, "cover_path": "..."}, ...]
        """
        logger.info(f"获取KM封面图片爬取数据: site={site_id}, max_count={max_count}")

        collection_name = f"{site_id}_manga_main"
        main_collection = mongo_db.get_collection(collection_name)

        # 查询缺少封面图片的漫画（通过图片库检查）
        # 先查询所有有cover_path但cover_load != 2的漫画
        query = {
            '$and': [
                {'cover_path': {'$ne': None}},  # 有封面路径
                {'cover_path': {'$ne': ''}},
                {
                    '$or': [
                        {'cover_load': {'$ne': 2}},  # 不是已完成状态
                        {'cover_load': {'$exists': False}}
                    ]
                }
            ]
        }

        comics = list(main_collection.find(query, {'aid': 1, 'cover_path': 1})
                      .sort('list_update', 1)
                      .limit(max_count * 2))  # 多取一些，后面过滤

        # 检查图片库，过滤掉已存在的
        image_library = get_image_library(site_id)
        result = []
        for comic in comics:
            aid = comic.get('aid')
            cover_path = comic.get('cover_path')
            if aid and cover_path:
                # 检查图片库是否存在
                if not image_library.image_exists(aid=aid, image_type='cover'):
                    result.append({
                        "aid": aid,
                        "cover_path": cover_path
                    })
                    if len(result) >= max_count:
                        break

        logger.info(f"获取到 {len(result)} 个需要下载封面图片的KM漫画")
        return result
