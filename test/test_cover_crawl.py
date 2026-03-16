"""
测试封面爬虫
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from crawlers.cm.cm_cover_crawler import CMCoverImageCrawler
from utils.logger import get_logger

logger = get_logger(__name__)

def test_cover_crawl():
    """测试封面爬虫"""
    crawler = CMCoverImageCrawler()

    # 测试一个简单的 aid
    test_aid = 1395866

    print(f"\n=== 测试封面爬虫: aid={test_aid} ===\n")

    result = crawler.crawl(aid=test_aid)

    print(f"成功: {result['success']}")
    print(f"数据: {result.get('data')}")
    if result.get('error'):
        print(f"错误: {result['error']}")

    return result

if __name__ == '__main__':
    test_cover_crawl()
