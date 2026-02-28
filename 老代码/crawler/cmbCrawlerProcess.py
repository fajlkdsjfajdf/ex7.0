# cm 的blogs
from crawler.crawlerProcess import CrawlerProcess
from config.configParse import config
from networking import httpType
from lxml import etree
from util import typeChange
import json
from util import timeFormat
from logger.logger import logger
from bson.objectid import ObjectId
from plugin.cmDecode import CmDecode
from datetime import datetime
from networking.proxy import ProxyState

# ************************************** list爬虫 **************************************
class CbCrawlerProcess(CrawlerProcess):

    def _load(self):
        super()._load()
        self.cm_decode = CmDecode()
        self.url = config.read("CM", "url")
        self.cookie = config.read("CM", "cookie")
        self.header = config.read("CM", "header")
        self.cdn = config.read("CM", "cdn")
        self.ips = [self.cdn.replace("https://", "")]


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

        if "禁漫天堂" in txt:
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

        return range(1, self.list_count + 1)

    def _getUrl(self, value):
        # ex的索引页不用关心crawler_data  特例
        return f"{self.url}/blogs?page={self.crawler_data[value]}"

    def _webGet(self, web, url, index):

        return web.get(url, header=self.header, cookie=self.cookie,  web_index=index,
                            timeout=30, retry_interval=3, retry_limit=5,
                       use_proxy=self.getUseProxy(), proxy_state=ProxyState.INCLUD_DOMESTIC)

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
            for div in tree.xpath(".//div[contains(@class, 'game-main')]"):
                data_dict = {}
                url = ".".join(
                    div.xpath(".//a[contains(@href, '/blog/')]/@href")).strip()
                data_dict["aid"] = int(url[url.rindex('/', 0, len(url) - 1) + 1:].replace("/", ""))
                data_dict["pic"] = "".join(div.xpath(".//img/@src")).strip()
                data_dict["title"] = "".join(div.xpath(".//div[@class='title']/text()")).strip()
                data_dict["author"] = "".join(div.xpath(".//div[@class='gamelib_name_block']/a/text()")).strip()
                update = "".join(div.xpath(".//span[@class='pull-right']/text()")).strip()
                data_dict["update_time"] = typeChange.extractFirstDate(update) if update else ""

                data_dict["index_update"] = timeFormat.getNowTime()
                data.append(data_dict)
            self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)



# ************************************** info爬虫 **************************************
class CbInfoCrawlerProcess(CbCrawlerProcess):

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
        limit = 1000
        data = self.db.getItems(self.main_table, find_update1, field=field, limit=limit, order="index_update",
                                       order_type=-1)  # limit = 1000
        find_update2 = {"list_update": {"$in": [None, False]}}
        # 获取没有内容的记录
        data2 = self.db.getItems(self.main_table, find_update2, field=field, limit=99999)
        # 获取收藏的记录 *********************************** 未完成
        data3 = []
        # bookmark_data = self.db.getItems(self.bookmark_table, {}, limit=10000)
        # if bookmark_data:
        #     id_list = [d['item_id'] for d in bookmark_data]
        #     data3 = self.db.getItems(self.main_table, {"_id": {"$in": id_list}}, limit=10000)
        #
        # find_update3 = {"bookmark": 1}
        # data3 = self.db.getItems(self.main_table, find_update3, field=field, limit=999999)


        data = typeChange.vstack("_id", data, data2, data3)
        return data

    def _getUrl(self, value):
        data = self.crawler_data[value]
        if "aid" in data:
            return f"{self.url}/album/{data['aid']}/"
        else:
            return None

    def _webGet(self, web, url, crawler_data_index):
        use_proxy = self.getUseProxy()
        use_proxy = False
        return web.get(url, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=5, use_proxy=use_proxy,
                       proxy_state=ProxyState.INCLUD_MYDOMESTIC)


    def _getInfo(self, web, index):
        try:
            if web.text and "album_missing" in web.text:
                # 项目已被删除
                aid = self.crawler_data[index]["aid"]
                if aid:
                    # pass
                    self.db.removeOneById(self.main_table, {"aid": int(aid)})
                    self.db.removeItems(self.list_table, {"aid": int(aid)}, limit=999)
                    self._setRunData(index, httpType.TYPE_UNkNOW, f"删除了不存在的项目 {aid}")
                return
            tree = web.tree
            data = {}
            photo_list = []
            data["aid"] = int("".join(tree.xpath(".//input[@id='album_id']/@value")))
            data["works"] = tree.xpath(".//div[contains(@class,'hidden-lg')]//span[@data-type='%s']/a/text()" % "works")
            data["actor"] = tree.xpath(".//div[contains(@class,'hidden-lg')]//span[@data-type='%s']/a/text()" % "actor")
            data["tags"] = tree.xpath(".//div[contains(@class,'hidden-lg')]//span[@data-type='%s']/a/text()" % "tags")
            data["author"] = tree.xpath(
                ".//div[contains(@class,'hidden-lg')]//span[@data-type='%s']/a/text()" % "author")
            data["summary"] = "".join(tree.xpath(
                ".//div[contains(@class,'hidden-lg')]//div[@class='p-t-5 p-b-5' and contains(text(),'叙述')]/text()"))
            data["filecount"] = typeChange.findnum(tree.xpath(
                ".//div[contains(@class,'visible-lg')]//div[@class='p-t-5 p-b-5' and contains(text(),'页数')]/text()"))
            data["create_time"] = self.timeFinder.getTime(tree.xpath(
                ".//div[contains(@class,'visible-lg')]//div[@class='p-t-5 p-b-5']/span[contains(text(),'上架日期')]/text()"))
            data["update_time"] = self.timeFinder.getTime(tree.xpath(
                ".//div[contains(@class,'visible-lg')]//div[@class='p-t-5 p-b-5']/span[contains(text(),'更新日期')]/text()"))
            data["readers"] = typeChange.findnum(tree.xpath(
                ".//div[contains(@class,'visible-lg')]//div[@class='p-t-5 p-b-5']/span[contains(text(),'更新日期')]//following-sibling::span[1]/span[1]/span[1]/text()"))
            data["list_update"] = timeFormat.getNowTime()
            if ("完結" in "".join(data["tags"])) or ("完结" in "".join(data["tags"])):
                data["is_end"] = True
            # 转换到简体

            data["tags"] = typeChange.toJianti(data["tags"])
            # print(data)

            for index, list in  enumerate(tree.xpath(".//div[contains(@class,'visible-lg')]//div[@class='episode']//a")):

                item = {}
                item["aid"] = data["aid"]
                item["pid"] = typeChange.findnum(list.xpath("./@data-album"))
                item["title"] = ("".join(list.xpath("./li/text()"))).replace("\n", "").strip()
                item["update_time"] = self.timeFinder.getTime(list.xpath("./li/span/text()"))
                item["order"] = index
                photo_list.append(item)
            if len(photo_list) == 0:
                photo_list = [
                    {"aid": data["aid"], "pid": data["aid"], "title": "单本", "update_time": data["update_time"]}]
            # 转换到简体
            photo_list = typeChange.toJianti(photo_list)
            data["list_count"] = len(photo_list)
            # 先插入list
            self.db.processItems(self.list_table, photo_list, self.list_id)
            self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:

            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {error}", web.url)

