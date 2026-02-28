"""
爬虫模块
包含各种站点的爬虫实现
"""

# 新架构（推荐）
from crawlers.base.request_handler import RequestHandler, ProxyMode
from crawlers.base.base_crawler import BaseCrawler
from crawlers.cm.cm_base_crawler import CMBaseCrawler

# CM 爬虫类（向后兼容）
from crawlers.cm.cm_list_crawler import CMListCrawler
from crawlers.cm.cm_info_crawler import CMInfoCrawler
from crawlers.cm.cm_content_crawler import CMContentCrawler
from crawlers.cm.cm_comments_crawler import CMCommentsCrawler
from crawlers.cm.cm_cover_crawler import CMCoverImageCrawler
from crawlers.cm.cm_thumbnail_crawler import CMThumbnailCrawler
from crawlers.cm.cm_content_image_crawler import CMContentImageCrawler

__all__ = [
    # 新架构
    'RequestHandler',
    'ProxyMode',
    'BaseCrawler',
    'CMBaseCrawler',
    # CM 爬虫类
    'CMListCrawler',
    'CMInfoCrawler',
    'CMContentCrawler',
    'CMCommentsCrawler',
    'CMCoverImageCrawler',
    'CMThumbnailCrawler',
    'CMContentImageCrawler',
]
