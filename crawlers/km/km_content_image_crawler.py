"""
KM内容图片爬虫 - 宅漫畫 (komiic.com)
下载章节内容图片（不需要解密）

图片库重构后：
- 不再存储 file_id 到业务数据库
- 图片库通过 (site, aid, pid, page_num, image_type='content') 定位图片
- 前端URL: /api/media/image?site=km&aid=5644&pid=123&page=1&type=content
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from crawlers.km.km_base_crawler import KMBaseCrawler
from models.image_library import get_image_library
from utils.logger import get_logger
from database.mongodb import mongo_db

logger = get_logger(__name__)


class KMContentImageCrawler(KMBaseCrawler):
    """内容图片爬虫 - 下载章节图片"""

    def __init__(self):
        super().__init__()

    def get_crawler_data(self, site_id: str = "km", max_count: int = 30) -> List[Dict[str, Any]]:
        """
        获取待下载的内容图片列表

        工作流程：
        1. 找有 content_images 数组的章节
        2. 检查图片库是否已存在该图片
        3. 收集未下载的图片

        Args:
            site_id: 站点ID (默认"km")
            max_count: 最大获取章节数量

        Returns:
            待下载图片列表，每项包含：{aid, pid, page, url, kid, chapter_title}
        """
        logger.info(f"开始查找KM待下载的内容图片: site_id={site_id}, max_count={max_count}")

        try:
            chapters_collection = mongo_db.get_collection(f"{site_id}_manga_chapters")
            image_library = get_image_library(site_id)

            # 查找有 content_images 数组的章节
            chapters = list(chapters_collection.find({
                'content_images': {'$exists': True, '$ne': [], '$type': 'array'}
            })
            .sort('content_update', 1)
            .limit(max_count))

            logger.info(f"找到 {len(chapters)} 个KM章节，开始收集待下载图片")

            # 收集所有待下载的图片
            pending_images = []

            for chapter in chapters:
                aid = chapter.get('aid')
                pid = chapter.get('pid')
                chapter_title = chapter.get('title', '')
                content_images = chapter.get('content_images', [])

                if not aid or not pid:
                    continue

                if not isinstance(content_images, list) or len(content_images) == 0:
                    continue

                # 遍历图片数组，检查图片库是否存在
                for img_obj in content_images:
                    if not isinstance(img_obj, dict):
                        continue

                    page = img_obj.get('page')
                    url = img_obj.get('url') or img_obj.get('kid')
                    kid = img_obj.get('kid')

                    if not page or not url:
                        continue

                    # 检查图片库是否存在
                    if image_library.image_exists(aid=aid, pid=pid, page_num=page, image_type='content'):
                        continue

                    pending_images.append({
                        'aid': aid,
                        'pid': pid,
                        'page': page,
                        'url': url,
                        'kid': kid,
                        'chapter_title': chapter_title
                    })

            logger.info(f"KM收集完成: 检查章节={len(chapters)}, 待下载图片={len(pending_images)}")
            return pending_images

        except Exception as e:
            logger.error(f"查找KM待下载图片失败: {e}", exc_info=True)
            return []

    def crawl_batch(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        批量下载内容图片

        Args:
            items: 待下载图片列表

        Returns:
            包含调试信息和结果的标准字典
        """
        logger.info(f"开始批量下载KM内容图片: 总数={len(items)}")

        success_count = 0
        failed_items = []
        updated_chapters = set()

        try:
            for idx, item in enumerate(items, start=1):
                try:
                    aid = item.get('aid')
                    pid = item.get('pid')
                    page = item.get('page')
                    image_url = item.get('url')

                    if not all([aid, pid, page, image_url]):
                        logger.warning(f"KM图片信息不完整: {item}")
                        failed_items.append({'item': item, 'error': '信息不完整'})
                        continue

                    logger.info(f"[{idx}/{len(items)}] 下载KM图片: aid={aid}, pid={pid}, page={page}")

                    # 调用 download_image() 下载并保存到图片库
                    image_id, download_error = self.download_image(
                        image_url=image_url,
                        aid=aid,
                        pid=pid,
                        image_type='content',
                        page=page
                    )

                    if image_id:
                        success_count += 1
                        updated_chapters.add((aid, pid))

                        # 更新 MongoDB 中的图片状态（不再存储file_id）
                        self._mark_content_downloaded(aid, pid, page)

                        logger.debug(f"KM图片下载成功: aid={aid}, pid={pid}, page={page}")

                    else:
                        error_detail = download_error or "未知下载错误"
                        logger.warning(f"KM图片下载失败: aid={aid}, pid={pid}, page={page}, 原因: {error_detail}")
                        failed_items.append({'item': item, 'error': error_detail})

                except Exception as e:
                    logger.error(f"处理KM图片失败: {item}, {e}")
                    failed_items.append({'item': item, 'error': str(e)})
                    continue

            return self.create_result(
                success=success_count > 0,
                data={
                    'success_count': success_count,
                    'failed_items': failed_items,
                    'updated_chapters': list(updated_chapters)
                },
                error=None if success_count > 0 else f"全部失败: 成功{success_count}/{len(items)}",
                total_count=len(items),
                success_count=success_count,
                failed_count=len(failed_items)
            )

        except Exception as e:
            error_msg = f"KM批量下载异常: {e}"
            logger.error(error_msg, exc_info=True)
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                total_count=len(items),
                success_count=0,
                failed_count=len(items)
            )

    def _mark_content_downloaded(self, aid: int, pid: int, page: int):
        """标记内容图片已下载"""
        try:
            chapters_collection = mongo_db.get_collection(f"{self.site_id}_manga_chapters")

            # 更新图片状态（不再存储file_id）
            chapters_collection.update_one(
                {'aid': aid, 'pid': pid},
                {'$set': {
                    'content_images.$[elem].status': 2
                }},
                array_filters=[{'elem.page': page}]
            )

            # 更新 content_loaded 计数
            chapters_collection.update_one(
                {'aid': aid, 'pid': pid},
                {'$inc': {'content_loaded': 1}}
            )

        except Exception as e:
            logger.error(f"更新KM图片状态失败: aid={aid}, pid={pid}, page={page}, error={e}")

    def crawl(self, aid: int, pid: Optional[int], page: Optional[int] = None, image_urls: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        下载章节图片（支持单页或批量）

        支持两种调用方式：
        1. 单页下载: crawl(aid=123, pid=1, page=1) - 从数据库获取该页的URL
        2. 批量下载: crawl(aid=123, pid=1, image_urls=[...]) - 使用提供的URL列表

        Args:
            aid: 漫画ID
            pid: 章节ID
            page: 页码（单页下载时使用）
            image_urls: 图片URL列表（批量下载时使用）

        Returns:
            包含调试信息和结果的标准字典
        """
        # 单页下载模式
        if page is not None and image_urls is None:
            aid = int(aid) if isinstance(aid, str) else aid
            pid = int(pid) if isinstance(pid, str) else pid
            page = int(page) if isinstance(page, str) else page

            logger.info(f"开始下载KM单页图片: aid={aid}, pid={pid}, page={page}")

            try:
                image_library = get_image_library(self.site_id)

                # 检查图片库是否已存在
                if image_library.image_exists(aid=aid, pid=pid, page_num=page, image_type='content'):
                    logger.info(f"图片已存在于图片库: aid={aid}, pid={pid}, page={page}")
                    self._mark_content_downloaded(aid, pid, page)
                    return self.create_result(
                        success=True,
                        data={'status': 'exists', 'url': f'/api/media/image?site={self.site_id}&aid={aid}&pid={pid}&page={page}&type=content'},
                        aid=aid,
                        pid=pid,
                        page=page,
                        total_count=1,
                        success_count=1,
                        failed_count=0
                    )

                chapters_collection = mongo_db.get_collection(f"{self.site_id}_manga_chapters")

                # 查询章节的 content_images 数组
                chapter = chapters_collection.find_one(
                    {'aid': aid, 'pid': pid},
                    {'content_images': 1}
                )

                if not chapter:
                    return self.create_result(
                        success=False,
                        data=None,
                        error=f"KM章节不存在: aid={aid}, pid={pid}",
                        total_count=0,
                        success_count=0,
                        failed_count=1
                    )

                content_images = chapter.get('content_images', [])

                # 查找指定页的图片
                target_image = None
                for img_obj in content_images:
                    if img_obj.get('page') == page:
                        target_image = img_obj
                        break

                if not target_image:
                    return self.create_result(
                        success=False,
                        data=None,
                        error=f"KM图片不存在: aid={aid}, pid={pid}, page={page}",
                        total_count=0,
                        success_count=0,
                        failed_count=1
                    )

                image_url = target_image.get('url') or target_image.get('kid')
                if not image_url:
                    return self.create_result(
                        success=False,
                        data=None,
                        error=f"KM图片URL为空: aid={aid}, pid={pid}, page={page}",
                        total_count=0,
                        success_count=0,
                        failed_count=1
                    )

                # 下载图片
                image_id, download_error = self.download_image(
                    image_url=image_url,
                    aid=aid,
                    pid=pid,
                    image_type='content',
                    page=page
                )

                if image_id:
                    # 更新数据库状态（不再存储file_id）
                    self._mark_content_downloaded(aid, pid, page)

                    return self.create_result(
                        success=True,
                        data={'image_id': image_id, 'url': f'/api/media/image?site={self.site_id}&aid={aid}&pid={pid}&page={page}&type=content'},
                        aid=aid,
                        pid=pid,
                        page=page,
                        total_count=1,
                        success_count=1,
                        failed_count=0
                    )
                else:
                    # 返回具体的下载失败原因
                    error_detail = download_error or "未知下载错误"
                    return self.create_result(
                        success=False,
                        data=None,
                        error=f"KM图片下载失败: aid={aid}, pid={pid}, page={page}, 原因: {error_detail}",
                        total_count=1,
                        success_count=0,
                        failed_count=1
                    )

            except Exception as e:
                error_msg = f"KM单页图片下载异常: {e}"
                logger.error(f"{error_msg}, aid={aid}, pid={pid}, page={page}", exc_info=True)
                return self.create_result(
                    success=False,
                    data=None,
                    error=error_msg,
                    total_count=1,
                    success_count=0,
                    failed_count=1
                )

        # 批量下载模式
        elif image_urls is not None:
            logger.info(f"开始下载KM章节图片: aid={aid}, pid={pid}, count={len(image_urls)}")

            try:
                downloaded_count = 0
                last_error = None

                for idx, image_url in enumerate(image_urls, start=1):
                    image_id, download_error = self.download_image(
                        image_url=image_url,
                        aid=aid,
                        pid=pid,
                        image_type='content',
                        page=idx
                    )

                    if image_id:
                        downloaded_count += 1
                        self._mark_content_downloaded(aid, pid, idx)
                    else:
                        last_error = download_error or "未知下载错误"
                        logger.warning(f"KM图片下载失败: aid={aid}, pid={pid}, page={idx}, 原因: {last_error}")

                error_msg = None
                if downloaded_count == 0 and last_error:
                    error_msg = f"KM批量下载失败: {last_error}"

                return self.create_result(
                    success=downloaded_count > 0,
                    data={'downloaded_count': downloaded_count},
                    error=error_msg,
                    aid=aid,
                    pid=pid,
                    total_count=len(image_urls),
                    success_count=downloaded_count
                )

            except Exception as e:
                error_msg = f"KM章节图片下载异常: {e}"
                logger.error(f"{error_msg}, aid={aid}, pid={pid}", exc_info=True)
                return self.create_result(
                    success=False,
                    data=None,
                    error=error_msg,
                    aid=aid,
                    pid=pid,
                    total_count=len(image_urls)
                )
        else:
            return self.create_result(
                success=False,
                data=None,
                error="缺少必要参数：需要提供 page 或 image_urls",
                total_count=0,
                success_count=0
            )
