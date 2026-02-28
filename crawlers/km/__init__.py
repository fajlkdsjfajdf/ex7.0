"""
KM爬虫包 - 宅漫畫 (komiic.com)
GraphQL API，不需要加密解密
"""

# 基类
from crawlers.km.km_base_crawler import KMBaseCrawler

# 爬虫类
from crawlers.km.km_list_crawler import KMListCrawler
from crawlers.km.km_info_crawler import KMInfoCrawler
from crawlers.km.km_content_crawler import KMContentCrawler
from crawlers.km.km_cover_crawler import KMCoverImageCrawler
from crawlers.km.km_content_image_crawler import KMContentImageCrawler

__all__ = [
    'KMBaseCrawler',
    'KMListCrawler',
    'KMInfoCrawler',
    'KMContentCrawler',
    'KMCoverImageCrawler',
    'KMContentImageCrawler',
]
