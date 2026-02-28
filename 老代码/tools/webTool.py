# 这是web 工具
from multiprocessing.pool import ThreadPool
import _thread
from logger.logger import logger
from control.webControl import webControl
from urllib.parse import urlparse, parse_qs
from db.minio import MinioClient
from control import crawlerControl

from db.mongodb import MongoDB

"""
new_data = {
    "prefix": self.prefix,
    "tool_type": tool_type,
    "data": data
}

"""

class WebTool:
    def __init__(self, values):
        """
        开启工具
        :param values:
        """
        self.prefix = values.get("prefix")
        self.tool_type = values.get("tool_type")
        self.data = values.get("data")
        self.complete_data = {}
        self.minio = MinioClient()
        self.db = MongoDB()
        cc = crawlerControl.getCrawlerControl()
        # self.response_cls = webControl.getResponse(self.prefix)()
        crawler_cls = cc.getCrawler(self.prefix, self.tool_type)
        self.crawler = crawler_cls()
        _thread.start_new_thread(self.start, ())

    def getInfo(self):
        """
        获取所有线程的运行状态
        :return:
        """
        try:
            # logger.info(self.crawler.complete_data)
            data = self.crawler.getCrawlerData()
            return data
        except Exception as e:
            logger.warning(f"获取运行状态失败 {e}")
            return {}

    def getName(self):
        try:
            crawler_name = self.crawler.getName()
            return crawler_name
        except Exception as e:
            logger.warning(f"获取名称失败 {e}")
            return ""

    def getIsOver(self):
        try:
            return self.crawler.getCrawlerIsOver()
        except Exception as e:
            logger.warning(f"获取工具完成状态失败 {e}")
            return False

    def start(self):
        """
        开始运行
        :return:
        """
        logger.info(f"{self.prefix} {self.tool_type} 开启工具运行")
        if self.tool_type in ["images"]:
            self.splitCheck()
        elif self.tool_type == "":
            self.search()
        else:
            self.check()

    def search(self):
        """
        首页的查询
        Returns:

        """
        try:
            page = int(self.data["page"])
            search = self.data["search"]
            self.crawler.setIndexSearch(search, page)
            self.crawler.setUseProxy(False)
            self.crawler.run()
        except Exception as e:
            logger.error(f"{self.prefix} {self.tool_type} 失败 {e}")

    def check(self):
        """
        检查
        Returns:

        """

        try:
            id_list = []
            for item in self.data:
                id = item
                id_list.append(id)
            # 通过id list 获取crawler list
            crawler_data = self.crawler.getCrawlerDataById(id_list)
            if len(crawler_data)> 0:
                self.crawler.setCrawlerData(crawler_data)
                self.crawler.setUseProxy(False)
                # self.crawler.setRunType("for")
                self.crawler.run()
            else:
                logger.info(f"{self.prefix} {self.tool_type} 没有要爬取的项目")
                self.crawler.setRunOver(True)
        except Exception as e:
            logger.error(f"{self.prefix} {self.tool_type} 失败 {e}")


    def splitCheck(self):
        """
        分段检查
        data 格式如下
        {
            "id": id,
            "page": 页码，从1开始
            "page_count": 分页大小
        }
        Returns:
        """
        try:
            id_list = [self.data["id"]]
            page = self.data["page"]
            page_count = self.data["page_count"]
            self.crawler.setPage(page, page_count)
            crawler_data = self.crawler.getCrawlerDataById(id_list)
            if len(crawler_data) > 0:
                self.crawler.setCrawlerData(crawler_data)
                self.crawler.setUseProxy(False)
                self.crawler.run()
            else:
                logger.info(f"{self.prefix} {self.tool_type} 没有要爬取的项目")
                self.crawler.setRunOver(True)
        except Exception as e:
            logger.error(f"{self.prefix} {self.tool_type} 失败 {e}")










