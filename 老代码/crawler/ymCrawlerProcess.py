# ym
from crawler.crawlerProcess import CrawlerProcess
from config.configParse import config
from networking import httpType
from lxml import etree
from util import typeChange
import json
from util import timeFormat
from logger.logger import logger
from bson.objectid import ObjectId
from datetime import datetime
from networking.proxy import ProxyState
from urllib.parse import urlencode
from plugin import mgDecoder
from plugin.yymgDecoder import Yymanga
import re

# ************************************** list爬虫 **************************************
class YmCrawlerProcess(CrawlerProcess):

    def _load(self):
        super()._load()

    def getUseProxy(self):
        """
        获取是否要使用代理
        Returns:

        """
        # use_proxy = self.use_proxy if hasattr(self, "use_proxy") else True
        use_proxy = self.use_proxy if hasattr(self, "use_proxy") else False
        return use_proxy

    def _httpComplete(self, response, url, kwargs):
        """
        httpComplete
        判断http是否真的完成，即使返回200，有时也会被墙屏蔽
        不要直接调用此方法，将此方法传递给webrequest使用
        :return:
        """
        re_count = 0
        msg = "获取成功"
        txt = response.get("text", "")

        if "yymanhua" in txt:
            complete = True
        else:
            msg = f"获取失败,不正常页"
            complete = False

        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, msg, url, re_count)
        return complete


    def _getCrawlerData(self):
        return range(1, self.list_count)

    def _getUrl(self, value):

        return f"{self.url}/manga-list-p{self.crawler_data[value]}/"

    def _webGet(self, web, url, index):
        use_proxy = self.getUseProxy()
        return web.get(url, header=self.header, cookie=self.cookie,  web_index=index,
                            timeout=15, retry_interval=3, retry_limit=8,
                       use_proxy=use_proxy, proxy_state=ProxyState.INCLUD_DOMESTIC)

    def _getInfo(self, web, index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        data = []
        try:
            tree = web.tree
            for item in tree.xpath(".//ul[@class='mh-list']/li"):
                title = "".join(item.xpath(".//h2[@class='title']/a/text()"))
                chapter_status = "".join(item.xpath(".//p[@class='chapter']/span/text()"))
                chapter_last = "".join(item.xpath(".//p[@class='chapter']/a/text()"))
                aid = "".join(item.xpath(".//h2[@class='title']/a/@href")).replace("yy", "").replace("/", "")
                aid = int(aid)
                pic = "".join(item.xpath(".//div[@class='mh-item']/a/img/@src"))
                data.append({
                    "aid": aid,
                    "title": title,
                    "pic": pic,
                    "chapter_status": chapter_status,
                    "chapter_last": chapter_last,
                    "index_update": timeFormat.getNowTime()
                })

            self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)



# ************************************** info爬虫 **************************************
class YmInfoCrawlerProcess(YmCrawlerProcess):

    def _getCrwalerField(self):
        return {"aid": 1, "title": 1}
    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        field = self._getCrwalerField()
        # 获取没有info的数据
        find_update1 = {}
        limit = 100
        data = self.db.getItems(self.main_table, find_update1, field=field, limit=limit, order="index_update",
                                       order_type=-1)  # limit = 1000
        find_update2 = {"list_update": {"$in": [None, False]}}
        # 获取没有内容的记录
        data2 = self.db.getItems(self.main_table, find_update2, field=field, limit=100000)
        # 获取收藏的记录 *********************************** 未完成
        data3 = []


        data = typeChange.vstack("_id", data, data2, data3)
        return data

    def _getUrl(self, value):
        aid = self.crawler_data[value]["aid"]
        return f"{self.url}/{aid}yy/"


    def _webGet(self, web, url, crawler_data_index):
        use_proxy = self.getUseProxy()

        return web.get(url, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=5, use_proxy=use_proxy,
                       proxy_state=ProxyState.INCLUD_DOMESTIC)


    def _getInfo(self, web, index):
        try:

            aid = self.crawler_data[index]["aid"]
            tree = web.tree

            data = []
            for item in tree.xpath(".//div[@id='chapterlistload']/a"):
                title = ''.join(item.xpath("./text()")).strip()
                page = ''.join(item.xpath("./span/text()")).strip()
                page = typeChange.findnum(page)
                pid = ''.join(item.xpath("./@href")).strip().replace("/", "").replace("m", "")
                pid = int(pid)
                data.append({
                    "aid": aid,
                    "pid": pid,
                    "title": title,
                    "page": page,
                })
            data.reverse()
            order = 0
            for i in data:
                order += 1
                i["order"] = order
            # print(data)
            plot = ''.join(tree.xpath(".//div[@class='detail-info']//p[@class='detail-info-content']/text()"))
            author = tree.xpath(".//div[@class='detail-info']//p[@class='detail-info-tip']/span[1]/a/text()")
            tags = tree.xpath(".//div[@class='detail-info']//p[@class='detail-info-tip']/span[3]/span/text()")


            # 先插入list
            info = {"aid": aid, "list_update": timeFormat.getNowTime()}
            info["plot"] = plot
            info["author"]: author
            info["tags"] = tags
            self.db.processItems(self.list_table, data, [self.main_id, self.list_id])
            self.db.processItems(self.main_table, info, self.main_id)
        except Exception as error:

            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {error}", web.url)


# ************************************** 章节爬虫 **************************************
class YmChapterCrawlerProcess(YmCrawlerProcess):
    pass

# ************************************** 图片列表爬虫 **************************************
class YmPageCrawlerProcess(YmCrawlerProcess):
    def getCrawlerDataById(self, id_list):
        """
        通过id列表获取对应的crawler数据 需要重写
        Args:
            id_list:
        Returns:
        """
        self._load()
        id_list = typeChange.convertObjectId(id_list)
        if id_list:
            find = {"_id": {"$in": id_list}}
            data = self.db.getItems(self.list_table, find, field=self._getCrwalerField(), limit=9999999)

            data = sorted(data,
                          key=lambda x: id_list.index(ObjectId(x['_id'])) if ObjectId(x['_id']) in id_list else len(
                              id_list))
            data = self._changeCrawlerData(data)
            return data
        else:
            return {}

    def _getCrwalerField(self):
        return {"pid": 1, "title": 1, "aid": 1}

    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        self.page_data = {}
        field = self._getCrwalerField()
        # # 获取没有page的数据

        find = {"$and": [
            {"images": {"$in": [None, False, 0]}}
        ]}

        data = self.db.getItems(self.list_table, find, field=field, limit=1000)
        return data

    def _getUrl(self, crawler_data_index):
        pid = self.crawler_data[crawler_data_index]["pid"]
        return f"{self.url}/m{pid}/"



    def _webGet(self, web, url, crawler_data_index):
        use_proxy = self.getUseProxy()
        return web.curl_get(url, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=5, use_proxy=use_proxy,
                       proxy_state=ProxyState.INCLUD_DOMESTIC)

    def _getInfo(self, web, crawler_data_index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """

        try:
            text = web.text
            # print(text)
            cookies = web.requests_cookies
            aid = self.crawler_data[crawler_data_index]["aid"]
            pid = self.crawler_data[crawler_data_index]["pid"]
            ymd = Yymanga(aid, pid, use_proxies=True, proxies_state=ProxyState.FLASK_DOMESTIC, run_type=self.run_type)
            imgs = ymd.get_imgs_by_content(web.url, web.text, web.requests_cookies)
            if imgs:
                self.crawler_data[crawler_data_index]["images"] = imgs
                data = {"aid": aid, "pid": pid, "images": imgs}
                self.db.processItems(self.list_table, data, [self.main_id, self.list_id])
            else:
                msg = f"{self.name} 获取第{crawler_data_index}页出错, 错误原因 imgs数量不正常 {web.url}"
                self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)
        except Exception as error:
            msg = f"{self.name} 获取第{crawler_data_index}页出错, 错误原因{error}"
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)



# ************************************** 首页图片爬虫 **************************************
class YmThumbCrawlerProcess(YmCrawlerProcess):
    def _httpComplete(self, response, url, kwargs):
        """
        httpComplete
        判断http是否真的完成，即使返回200，有时也会被墙屏蔽
        不要直接调用此方法，将此方法传递给webrequest使用
        :return:
        """
        re_count = 0
        msg = "获取成功"
        content = response.get("content", "")
        text = response.get("text", "")
        complete = False
        if content == "" or content == None or len(content) < 10:
            msg = "图片大小为0"
            complete = False
        elif "html" in text:
            msg = "图片为html页"
            complete = False
        else:
            complete = True
        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, msg, url, re_count)
        return complete

    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        field = self._getCrwalerField()
        # 获取没有thumb的数据
        find_update = {"$and": [{"thumb_load": {"$in": [None, False, 0]}},
                                {"pic": {"$nin": [None, False]}}]}
        data = self.db.getItems(self.main_table, find_update, field=field, limit=1000)  # limit = self.count
        # print(data)
        return data

    def _getCrwalerField(self):
        return {"aid": 1, "pic": 1}

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        pic = data["pic"]
        return pic

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        
        return web.get(url, web_index=crawler_data_index,
                       timeout=10, retry_interval=3, retry_limit=3,
                       use_proxy=self.getUseProxy(), proxy_state=ProxyState.INCLUD_DOMESTIC)

    def _getInfo(self, web, crawler_data_index):
        try:
            aid = self.crawler_data[crawler_data_index]["aid"]
            content = web.content
            if content is not None and len(content) > 100 and "html" not in str(content):
                id = int(aid)
                bucket, thumb = self._getMinioFile(aid)
                upload_success = self.minio.uploadImage(bucket, thumb, content)
                if upload_success:
                    data = {"aid": int(aid), "thumb_load": 2}
                    # ogger.info(f"{aid} 上传thumb成功")
                    self.db.processItems(self.main_table, data, self.main_id)
                else:
                    logger.info(f"{aid}  上传thumb失败")
                    self._setRunData(index, httpType.TYPE_UNkNOW, f"aid={aid}, 错误的图片")
            else:
                self._setRunData(index, httpType.TYPE_UNkNOW, f"aid={aid}, 图片过小")
        except Exception as error:
            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")

# ************************************** 缩略图片爬虫 **************************************
class YmNailCrawlerProcess(YmCrawlerProcess):
    pass

# ************************************** 内容图片爬虫 **************************************
class YmImagesCrawlerProcess(YmCrawlerProcess):
    pass

# ************************************** 评论页爬虫 **************************************
class YmCommentsCrawlerProcess(YmCrawlerProcess):
    pass

# ************************************** 下载器 **************************************
class YmDownCrawlerProcess(YmCrawlerProcess):
    pass


