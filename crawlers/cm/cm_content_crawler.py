"""
章节内容爬虫

图片库重构后：
- 不再存储 file_id 到业务数据库
- 图片库通过 (site, aid, pid, page_num, image_type='content') 定位图片
- 前端URL: /api/media/image?site=cm&aid=xxx&pid=xxx&page=1&type=content
"""

from typing import Dict, Any, List, Optional
from crawlers.cm.cm_base_crawler import CMBaseCrawler
from models.image_library import get_image_library
from utils.logger import get_logger

logger = get_logger(__name__)


class CMContentCrawler(CMBaseCrawler):
    """
    章节内容爬虫 - 获取章节图片列表

    仿照老代码 CmPageCrawlerProcess 实现
    - API: /comic_read?id={pid}
    - 返回: images 数组（图片URL列表）
    - 保存到: {site}_manga_chapters 表
    """

    def __init__(self):
        super().__init__()

    def crawl(self, aid: int, pid: int, download_images: bool = False) -> Dict[str, Any]:
        """
        爬取章节内容（图片列表）

        Args:
            aid: 漫画ID
            pid: 章节ID
            download_images: 是否下载图片（默认只获取URL列表）

        Returns:
            包含调试信息和结果的标准字典
        """
        # 确保 aid 和 pid 是整数（从 JSON 传过来可能是字符串）
        aid = int(aid)
        pid = int(pid)

        try:
            base_url = self.get_best_url()
            url = f"{base_url}/comic_read?id={pid}"

            logger.info(f"开始爬取章节内容: aid={aid}, pid={pid}")
            response_data = self.make_authenticated_request(url)

            if response_data.get('code') == 200:
                # 解析图片列表
                data = response_data.get('data', {})
                if isinstance(data, dict):
                    # 提取图片URL列表
                    images_data = data.get('images', [])
                    if not isinstance(images_data, list):
                        images_data = []

                    # 构造图片URL列表（对象数组格式，包含page和url）
                    image_urls = []
                    content_images = []  # 新格式：[{page: 1, url: "...", status: 0}, ...]
                    for idx, img in enumerate(images_data, start=1):
                        if isinstance(img, dict):
                            img_url = img.get('image') or img.get('url')
                        elif isinstance(img, str):
                            img_url = img
                        else:
                            continue

                        if img_url:
                            image_urls.append(img_url)
                            # 新格式：保存为对象数组（不再存储file_id）
                            content_images.append({
                                'page': idx,
                                'url': img_url,
                                'status': 0  # 0=未下载 1=下载中 2=已完成
                            })

                    # 构造返回数据
                    result_data = {
                        'aid': aid,
                        'pid': pid,
                        'image_urls': image_urls,
                        'image_count': len(image_urls),
                        'update_time': data.get('addtime'),
                        'downloaded': False  # 是否已下载图片
                    }

                    # 如果需要下载图片
                    if download_images and image_urls:
                        logger.info(f"开始下载章节图片: aid={aid}, pid={pid}, count={len(image_urls)}")
                        downloaded_count = self._download_and_save_images(aid, pid, image_urls)
                        result_data['downloaded_count'] = downloaded_count
                        result_data['downloaded'] = downloaded_count > 0

                    # 自动保存到数据库
                    # 【重要】验证数据有效性：必须包含图片数据，否则不保存（防止插入无效章节如pid=1）
                    if len(image_urls) == 0:
                        error_msg = f"章节无效：没有图片数据 (aid={aid}, pid={pid})"
                        logger.warning(error_msg)
                        return self.create_result(
                            success=False,
                            data=None,
                            error=error_msg,
                            aid=aid,
                            pid=pid
                        )

                    try:
                        self.save_to_db(
                            site_id=self.site_id,
                            aid=aid,
                            pid=pid,
                            content_images=content_images
                        )
                        logger.info(f"章节内容已保存到数据库: aid={aid}, pid={pid}")
                    except Exception as e:
                        logger.error(f"章节内容保存失败: aid={aid}, pid={pid}, error={e}", exc_info=True)
                        # 继续返回成功，因为爬取本身是成功的

                    logger.info(f"章节内容爬取成功: aid={aid}, pid={pid}, images={len(image_urls)}")
                    # 使用通用方法创建成功结果
                    return self.create_result(
                        success=True,
                        data=result_data,
                        aid=aid,
                        pid=pid
                    )

            error_msg = f"章节内容爬取失败: code={response_data.get('code')}"
            logger.warning(f"{error_msg}, aid={aid}, pid={pid}")
            # 使用通用方法创建失败结果
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                aid=aid,
                pid=pid
            )

        except Exception as e:
            error_msg = f"章节内容爬取异常: {e}"
            logger.error(f"{error_msg}, aid={aid}, pid={pid}", exc_info=True)
            # 使用通用方法创建失败结果
            return self.create_result(
                success=False,
                data=None,
                error=error_msg,
                aid=aid,
                pid=pid
            )

    def _download_and_save_images(self, aid: int, pid: int, image_urls: List[str]) -> int:
        """
        下载并保存图片到图片库

        Args:
            aid: 漫画ID
            pid: 章节ID
            image_urls: 图片URL列表

        Returns:
            成功下载的数量
        """
        image_library = get_image_library(self.site_id)
        downloaded_count = 0

        for idx, image_url in enumerate(image_urls, start=1):
            try:
                # 检查图片库是否已存在
                if image_library.image_exists(aid=aid, pid=pid, page_num=idx, image_type='content'):
                    downloaded_count += 1
                    continue

                # 下载图片
                image_id, download_error = self.download_image(
                    image_url=image_url,
                    aid=aid,
                    pid=pid,
                    image_type='content',
                    decode=True,
                    page=idx
                )

                if image_id:
                    downloaded_count += 1
                else:
                    error_detail = download_error or "未知下载错误"
                    logger.error(f"下载图片失败: aid={aid}, pid={pid}, page={idx}, 原因: {error_detail}")

            except Exception as e:
                logger.error(f"下载图片失败: aid={aid}, pid={pid}, page={idx}, error={e}")

        return downloaded_count

    def get_crawler_data(self, site_id: str = "cm", max_count: int = 1000) -> List[Dict[str, Any]]:
        """
        获取需要爬取内容的章节数据

        策略：
        1. 获取没有content数据的（content_update为None 或 status='pending'/'failed'），最多 max_count 个
        2. 获取需要刷新的（content_update超过7天），最多 max_count 个
        3. 合并去重，总数可能超过 max_count

        Args:
            site_id: 站点ID
            max_count: 每种类型的最大处理数量

        Returns:
            章节数据字典列表 [{"aid": 123, "pid": 456}, ...]
        """
        from database import get_db
        from datetime import datetime, timedelta

        logger.info(f"获取章节内容爬取数据: site={site_id}, max_count={max_count}")

        result = []

        try:
            db = get_db()
            collection_name = f"{site_id}_manga_chapters"
            chapters_collection = db.get_collection(collection_name)

            # 1. 获取没有content数据的章节（最多 max_count 个）
            no_content_query = {
                '$or': [
                    {'content_update': None},
                    {'content_update': {'$exists': False}},
                    {'status': {'$in': ['pending', 'failed']}},
                    {'content_loaded': 0},
                    {'content_images': {'$size': 0}}
                ]
            }

            no_content_chapters = list(chapters_collection.find(no_content_query)
                                        .sort('info_update', -1)  # 最新添加的章节优先
                                        .limit(max_count))

            logger.info(f"找到 {len(no_content_chapters)} 个没有content数据的章节")

            # 提取 aid 和 pid
            for chapter in no_content_chapters:
                aid = chapter.get('aid')
                pid = chapter.get('pid')
                if aid and pid:
                    result.append({
                        "aid": aid,
                        "pid": pid
                    })

            # 2. 获取需要刷新的（content_update超过7天的，最多 max_count 个）
            stale_query = {
                'content_update': {
                    '$lt': datetime.now() - timedelta(days=7)
                },
                'status': 'completed'  # 只获取已完成的，避免重复pending
            }

            stale_chapters = list(chapters_collection.find(stale_query)
                                 .sort('content_update', 1)  # 最旧的优先
                                 .limit(max_count))

            logger.info(f"找到 {len(stale_chapters)} 个需要刷新content的章节")

            # 去重并添加
            existing_pairs = {(r['aid'], r['pid']) for r in result}
            for chapter in stale_chapters:
                aid = chapter.get('aid')
                pid = chapter.get('pid')
                if aid and pid and (aid, pid) not in existing_pairs:
                    result.append({
                        "aid": aid,
                        "pid": pid
                    })
                    existing_pairs.add((aid, pid))

            logger.info(f"总共获取到 {len(result)} 个需要爬取内容的章节")
            return result

        except Exception as e:
            logger.error(f"获取章节内容爬取数据失败: {e}", exc_info=True)
            return []

    def save_to_db(self, site_id: str, aid: int, pid: int, content_images: List[Dict[str, Any]]) -> bool:
        """
        保存章节内容到数据库

        更新 {site}_manga_chapters 表的 content_images 字段

        【重要】只更新已存在的章节，不创建新章节（防止插入无效数据）
        如果章节不存在，返回False而不是创建

        Args:
            site_id: 站点ID
            aid: 漫画ID
            pid: 章节ID
            content_images: 图片对象数组 [{page: 1, url: "...", status: 0}, ...]

        Returns:
            是否保存成功
        """
        from datetime import datetime, timezone
        from models.image_library import get_image_library

        try:
            from database import get_db

            db = get_db()
            collection_name = f"{site_id}_manga_chapters"
            chapters_collection = db.get_collection(collection_name)

            # 【重要】验证章节是否已存在，不创建新章节
            existing_chapter = chapters_collection.find_one({'aid': aid, 'pid': pid})
            if not existing_chapter:
                logger.warning(f"章节不存在，跳过保存: aid={aid}, pid={pid}")
                return False

            # 检查图片库，更新已下载的图片状态
            image_library = get_image_library(site_id)
            loaded_count = 0
            for img in content_images:
                page = img.get('page')
                if page and image_library.image_exists(aid=aid, pid=pid, page_num=page, image_type='content'):
                    img['status'] = 2  # 标记为已完成
                    loaded_count += 1

            # 构造更新数据
            update_data = {
                'page_count': len(content_images),
                'content_total': len(content_images),
                'content_loaded': loaded_count,
                'content_update': datetime.now(timezone.utc),
                'status': 'completed' if loaded_count == len(content_images) else 'pending',
                'error_message': None,
                'content_images': content_images  # 保存对象数组
            }

            # 更新章节（只更新已存在的章节，不创建新章节）
            result = chapters_collection.update_one(
                {'aid': aid, 'pid': pid},
                {'$set': update_data},
                upsert=False  # 【重要】改为False，不创建新章节
            )

            if result.modified_count > 0:
                logger.info(f"章节内容保存成功: aid={aid}, pid={pid}, images={len(content_images)}, loaded={loaded_count}")
                return True
            else:
                logger.warning(f"章节内容未更新: aid={aid}, pid={pid}")
                return False

        except Exception as e:
            logger.error(f"章节内容保存失败: aid={aid}, pid={pid}, error={e}", exc_info=True)
            return False
