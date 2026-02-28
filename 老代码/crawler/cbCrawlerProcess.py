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
from networking.webRequest import WebRequest
import re

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

    def downImgCache(self, src):
        """
        下载缓存的图片
        Args:
            src:

        Returns:
        """
        md5_str = typeChange.strToMd5(src) + ".jpg"
        bucket = "imgcache"
        object_name = f"cb/{md5_str}"
        if not self.minio.existImage(bucket, object_name):


            url = f"{self.cdn}{src}"
            web = WebRequest()
            if web.get(url):
                if not self.minio.uploadImage(bucket, object_name, web.content):
                    print(url)
            # print(url)
        return object_name

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
                url = ".".join(div.xpath(".//a[contains(@href, '/blog/')]/@href")).strip()
                data_dict["aid"] = int(url[url.rindex('/', 0, len(url) - 1) + 1:].replace("/", ""))

                pic = "".join(div.xpath(".//img/@data-src")).strip() or ""
                if not pic:
                    pic = "".join(div.xpath(".//img/@src")).strip() or ""
                pic = typeChange.extractPathFromUrl(pic)
                if len(pic)> 2048:
                    pic = ""
                data_dict["pic"] = pic
                if pic:
                    self.downImgCache(pic)



                data_dict["title"] = "".join(div.xpath(".//div[@class='title']/text()")).strip()
                data_dict["author"] = "".join(div.xpath(".//span[@class='gamelib_name_block']/a/text()")).strip()
                data_dict["type"] = "".join(div.xpath(".//a[@class='blog_a' or @class='gamelib_a']/text()")).strip()
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
        limit = 100
        data = self.db.getItems(self.main_table, find_update1, field=field, limit=limit, order="index_update",
                                       order_type=-1)  # limit = 1000
        find_update2 = {"info_update": {"$in": [None, False]}}
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
            return f"{self.url}/blog/{data['aid']}/"
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

            tree = web.tree
            data = {}
            photo_list = []
            data["aid"] = self.crawler_data[index]["aid"]
            content = tree.xpath(".//div[contains(@class,'blog_content')]")
            if content:
                content = content[0]
                content_html = etree.tostring(content, pretty_print=True).decode()

                # 正则表达式匹配 <img> 标签中的 src 属性
                pattern = r'<img[^>]+src="([^"]+)"'
                srcs = re.findall(pattern, content_html)
                for src in srcs:
                    origin_src = src
                    new_src = typeChange.extractPathFromUrl(src)
                    cache_path = self.downImgCache(new_src)
                    src2 = f"imgcache?path={cache_path}"
                    content_html = content_html.replace(origin_src, src2)



                data["content"] = content_html



            comments = tree.xpath(".//div[@id='comments']//div[@class='timeline-content']/text()")
            data["comments"] = [c.replace(" ", "") for c in comments]

            reco_list = tree.xpath(".//div[@class='reco_comic']//a[contains(@href,'album')]/@href")
            reco2 = []
            for r in reco_list:
                match = re.search(r'/album/(\d+)/', r)
                if match:
                    reco2.append(int(match.group(1)))
            data["reco"] = reco2
            data["info_update"] = timeFormat.getNowTime()

            self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:

            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {error}", web.url)

