"""
缩略图爬虫
"""

from typing import Dict, Any, List
from crawlers.cm.cm_base_crawler import CMBaseCrawler
from utils.logger import get_logger

logger = get_logger(__name__)


class CMThumbnailCrawler(CMBaseCrawler):
    """缩略图爬虫 - 下载缩略图"""

    def __init__(self):
        super().__init__()

    def crawl_batch(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        批量下载缩略图

        Args:
            items: 漫画列表，每项包含aid和thumb字段

        Returns:
            包含调试信息和结果的标准字典
        """
        saved_file_ids = []
        failed_items = []

        try:
            for item in items:
                try:
                    aid = item.get('id') or item.get('aid')
                    thumb_url = item.get('thumb')

                    if not aid or not thumb_url:
                        failed_items.append({'item': item, 'error': '缺少aid或thumb_url'})
                        continue

                    file_id, download_error = self.download_image(
                        thumb_url,
                        aid=aid,
                        pid=None,  # 缩略图没有章节ID
                        image_type='thumbnail',
                        decode=True
                    )

                    if file_id:
                        saved_file_ids.append(file_id)
                        logger.debug(f"缩略图下载成功: aid={aid}, file_id={file_id}")
                    else:
                        error_detail = download_error or "未知下载错误"
                        failed_items.append({'item': item, 'error': error_detail})

                except Exception as e:
                    logger.error(f"缩略图下载失败: {item}, {e}")
                    failed_items.append({'item': item, 'error': str(e)})
                    continue

            logger.info(f"缩略图批量下载完成: 成功 {len(saved_file_ids)}/{len(items)}")
            # 使用通用方法创建结果
            return self.create_result(
                success=len(saved_file_ids) > 0,
                data={'saved_file_ids': saved_file_ids, 'failed_items': failed_items},
                error=None if len(saved_file_ids) > 0 else f"全部失败: 成功{len(saved_file_ids)}/{len(items)}",
                total_count=len(items),
                success_count=len(saved_file_ids),
                failed_count=len(failed_items)
            )

        except Exception as e:
            error_msg = f"缩略图批量下载异常: {e}"
            logger.error(error_msg, exc_info=True)
            # 使用通用方法创建失败结果
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                total_count=len(items)
            )

    def get_crawler_data(self, site_id: str, max_count: int = 1000) -> List[Dict[str, Any]]:
        """
        获取需要下载缩略图的漫画数据

        Args:
            site_id: 站点ID
            max_count: 最大处理数量

        Returns:
            漫画数据字典列表 [{"aid": 123, "thumb_url": "..."}, ...]
        """
        from database import get_db

        logger.info(f"获取缩略图爬取数据: site={site_id}, max_count={max_count}")

        db = get_db()
        collection_name = f"{site_id}_manga_main"
        main_collection = db.get_collection(collection_name)

        # 查询漫画（缩略图现在通常从封面或第一页内容图获取）
        comics = list(main_collection.find({})
                      .sort('list_update', 1)
                      .limit(max_count))

        # 过滤出需要下载缩略图的漫画
        result = []
        for comic in comics:
            aid = comic.get('aid')
            if not aid:
                continue

            # 暂时使用封面路径作为缩略图
            thumb_url = comic.get('cover_path', '')
            if thumb_url:
                result.append({"aid": aid, "thumb_url": thumb_url})

        logger.info(f"获取到 {len(result)} 个需要下载缩略图的漫画")
        return result
