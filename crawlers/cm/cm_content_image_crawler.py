"""
内容图片爬虫
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from bson.objectid import ObjectId
from crawlers.cm.cm_base_crawler import CMBaseCrawler
from models.image_library import get_image_library
from utils.logger import get_logger

logger = get_logger(__name__)


class CMContentImageCrawler(CMBaseCrawler):
    """内容图片爬虫 - 下载章节图片"""

    def __init__(self):
        super().__init__()

    def get_crawler_data(self, site_id: str = "cm", max_count: int = 30) -> List[Dict[str, Any]]:
        """
        获取待下载的内容图片列表

        工作流程：
        1. 找有 content_images 数组的章节
        2. 遍历每个章节，检查图片库中是否存在
        3. 收集不存在的图片

        Args:
            site_id: 站点ID (默认"cm")
            max_count: 最大获取章节数量

        Returns:
            待下载图片列表，每项包含：{aid, pid, page, url, chapter_title}
        """
        from database import get_db

        logger.info(f"开始查找待下载的内容图片: site_id={site_id}, max_count={max_count}")

        try:
            db = get_db()
            chapters_collection = db.get_collection(f"{site_id}_manga_chapters")
            image_library = get_image_library(site_id)

            # 查找有 content_images 数组的章节
            chapters = list(chapters_collection.find({
                'content_images': {'$exists': True, '$ne': [], '$type': 'array'}
            })
            .sort('content_update', 1)
            .limit(max_count))

            logger.info(f"找到 {len(chapters)} 个章节，开始收集待下载图片")

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

                # 检查每个图片
                for img_obj in content_images:
                    if not isinstance(img_obj, dict):
                        continue

                    page = img_obj.get('page')
                    url = img_obj.get('url')

                    if not page or not url:
                        continue

                    # 检查图片库中是否存在
                    if image_library.image_exists(
                        aid=aid,
                        pid=pid,
                        page_num=page,
                        image_type='content'
                    ):
                        continue

                    pending_images.append({
                        'aid': aid,
                        'pid': pid,
                        'page': page,
                        'url': url,
                        'chapter_title': chapter_title,
                        'total_pages': len(content_images)
                    })

            logger.info(f"收集完成: 待下载图片={len(pending_images)}")
            return pending_images

        except Exception as e:
            logger.error(f"查找待下载图片失败: {e}", exc_info=True)
            return []

    def crawl_batch(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        批量下载内容图片

        工作流程：
        1. 遍历待下载图片列表
        2. 先问图片库是否存在
        3. 存在 → 补标记
        4. 不存在 → 下载 → 存图片库 → 打标记

        Args:
            items: 待下载图片列表

        Returns:
            包含调试信息和结果的标准字典
        """
        logger.info(f"开始批量下载内容图片: 总数={len(items)}")

        image_library = get_image_library(self.site_id)

        saved_image_ids = []
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
                        logger.warning(f"图片信息不完整: {item}")
                        failed_items.append({'item': item, 'error': '信息不完整'})
                        continue

                    logger.info(f"[{idx}/{len(items)}] 处理图片: aid={aid}, pid={pid}, page={page}")

                    # 1. 先问图片库是否存在
                    image_info = image_library.get_image(
                        aid=aid,
                        pid=pid,
                        page_num=page,
                        image_type='content'
                    )

                    if image_info:
                        # 图片已存在，检查并补标记
                        logger.debug(f"图片已存在于图片库: aid={aid}, pid={pid}, page={page}")

                        if not self._is_marked(aid, pid, page):
                            self._mark_content_downloaded(aid, pid, page, image_info['_id'])
                            updated_chapters.add((aid, pid))

                        saved_image_ids.append(image_info['_id'])
                        continue

                    # 2. 不存在才下载
                    image_id, download_error = self.download_image(
                        image_url=image_url,
                        aid=aid,
                        pid=pid,
                        image_type='content',
                        decode=True,
                        page=page
                    )

                    if image_id:
                        saved_image_ids.append(image_id)
                        updated_chapters.add((aid, pid))

                        # 3. 打标记
                        self._mark_content_downloaded(aid, pid, page, image_id)

                        logger.debug(f"图片下载成功: aid={aid}, pid={pid}, page={page}")

                    else:
                        error_detail = download_error or "未知下载错误"
                        logger.warning(f"图片下载失败: aid={aid}, pid={pid}, page={page}, 原因: {error_detail}")
                        failed_items.append({'item': item, 'error': error_detail})

                except Exception as e:
                    logger.error(f"处理图片失败: {item}, {e}")
                    failed_items.append({'item': item, 'error': str(e)})
                    continue

            logger.info(f"批量下载完成: 成功 {len(saved_image_ids)}/{len(items)}")

            return self.create_result(
                success=len(saved_image_ids) > 0,
                data={
                    'saved_image_ids': saved_image_ids,
                    'failed_items': failed_items,
                    'updated_chapters': list(updated_chapters)
                },
                error=None if len(saved_image_ids) > 0 else f"全部失败: 成功{len(saved_image_ids)}/{len(items)}",
                total_count=len(items),
                success_count=len(saved_image_ids),
                failed_count=len(failed_items)
            )

        except Exception as e:
            error_msg = f"批量下载异常: {e}"
            logger.error(error_msg, exc_info=True)
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                total_count=len(items),
                success_count=0,
                failed_count=len(items)
            )

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
        image_library = get_image_library(self.site_id)

        # 单页下载模式：从数据库获取图片URL
        if page is not None and image_urls is None:
            # 确保参数类型正确
            aid = int(aid) if isinstance(aid, str) else aid
            pid = int(pid) if isinstance(pid, str) else pid
            page = int(page) if isinstance(page, str) else page

            logger.info(f"开始下载单页图片: aid={aid}, pid={pid}, page={page}")

            try:
                # 1. 先问图片库是否存在
                image_info = image_library.get_image(
                    aid=aid,
                    pid=pid,
                    page_num=page,
                    image_type='content'
                )

                if image_info:
                    # 图片已存在，检查并补标记
                    logger.info(f"图片已存在于图片库: aid={aid}, pid={pid}, page={page}")

                    if not self._is_marked(aid, pid, page):
                        self._mark_content_downloaded(aid, pid, page, image_info['_id'])

                    return self.create_result(
                        success=True,
                        data={
                            'image_id': image_info['_id'],
                            'url': f'/api/media/image?site={self.site_id}&aid={aid}&pid={pid}&page={page}&type=content',
                            'skipped': True
                        },
                        aid=aid,
                        pid=pid,
                        page=page,
                        total_count=1,
                        success_count=1,
                        failed_count=0
                    )

                # 2. 不存在，从数据库获取URL
                from database import get_db
                db = get_db()
                chapters_collection = db.get_collection(f"{self.site_id}_manga_chapters")

                chapter = chapters_collection.find_one(
                    {'aid': aid, 'pid': pid},
                    {'content_images': 1}
                )

                if not chapter:
                    return self.create_result(
                        success=False,
                        data=None,
                        error=f"章节不存在: aid={aid}, pid={pid}",
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
                        error=f"图片不存在: aid={aid}, pid={pid}, page={page}",
                        total_count=0,
                        success_count=0,
                        failed_count=1
                    )

                image_url = target_image.get('url')
                if not image_url:
                    return self.create_result(
                        success=False,
                        data=None,
                        error=f"图片URL为空: aid={aid}, pid={pid}, page={page}",
                        total_count=0,
                        success_count=0,
                        failed_count=1
                    )

                # 3. 下载图片
                image_id, download_error = self.download_image(
                    image_url=image_url,
                    aid=aid,
                    pid=pid,
                    image_type='content',
                    decode=True,
                    page=page
                )

                if image_id:
                    # 4. 打标记
                    self._mark_content_downloaded(aid, pid, page, image_id)

                    return self.create_result(
                        success=True,
                        data={
                            'image_id': image_id,
                            'url': f'/api/media/image?site={self.site_id}&aid={aid}&pid={pid}&page={page}&type=content'
                        },
                        aid=aid,
                        pid=pid,
                        page=page,
                        total_count=1,
                        success_count=1,
                        failed_count=0
                    )
                else:
                    error_detail = download_error or "未知下载错误"
                    return self.create_result(
                        success=False,
                        data=None,
                        error=f"图片下载失败: aid={aid}, pid={pid}, page={page}, 原因: {error_detail}",
                        total_count=1,
                        success_count=0,
                        failed_count=1
                    )

            except Exception as e:
                error_msg = f"单页图片下载异常: {e}"
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
            logger.info(f"开始下载章节图片: aid={aid}, pid={pid}, count={len(image_urls)}")

            try:
                saved_image_ids = self.download_images(
                    aid=aid,
                    pid=pid,
                    image_urls=image_urls,
                    image_type='content',
                    decode=True
                )

                # 批量打标记
                for idx, image_id in enumerate(saved_image_ids, start=1):
                    self._mark_content_downloaded(aid, pid, idx, image_id)

                return self.create_result(
                    success=len(saved_image_ids) > 0,
                    data={'image_ids': saved_image_ids},
                    aid=aid,
                    pid=pid,
                    total_count=len(image_urls),
                    success_count=len(saved_image_ids)
                )

            except Exception as e:
                error_msg = f"章节图片下载异常: {e}"
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

    def _is_marked(self, aid: int, pid: int, page: int) -> bool:
        """
        检查业务表是否已打标记

        Args:
            aid: 漫画ID
            pid: 章节ID
            page: 页码

        Returns:
            是否已标记
        """
        from database import get_db

        db = get_db()
        chapters_collection = db.get_collection(f"{self.site_id}_manga_chapters")

        # 检查 content_images 数组中该页的 status
        chapter = chapters_collection.find_one(
            {
                'aid': aid,
                'pid': pid,
                'content_images': {
                    '$elemMatch': {'page': page, 'status': 2}
                }
            },
            {'_id': 1}
        )

        return chapter is not None

    def _mark_content_downloaded(self, aid: int, pid: int, page: int, image_id: str):
        """
        在业务表打标记

        Args:
            aid: 漫画ID
            pid: 章节ID
            page: 页码
            image_id: 图片库中的图片ID
        """
        from database import get_db

        try:
            db = get_db()
            chapters_collection = db.get_collection(f"{self.site_id}_manga_chapters")

            # 使用 arrayFilters 精确定位要更新的数组元素
            chapters_collection.update_one(
                {'aid': aid, 'pid': pid},
                {'$set': {
                    'content_images.$[elem].status': 2,
                    'content_images.$[elem].image_id': image_id
                }},
                array_filters=[{'elem.page': page}]
            )

            # 更新 content_loaded 计数（如果没有则初始化）
            chapters_collection.update_one(
                {'aid': aid, 'pid': pid, 'content_loaded': {'$exists': False}},
                {'$set': {'content_loaded': 0}}
            )

            # 原子递增
            chapters_collection.update_one(
                {'aid': aid, 'pid': pid},
                {'$inc': {'content_loaded': 1}}
            )

            logger.debug(f"内容图片标记已更新: aid={aid}, pid={pid}, page={page}")

        except Exception as e:
            logger.error(f"更新内容图片标记失败: aid={aid}, pid={pid}, page={page}, error={e}")
