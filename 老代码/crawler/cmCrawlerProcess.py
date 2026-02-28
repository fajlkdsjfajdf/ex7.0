# cm
import random

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
from datetime import datetime, timedelta
from networking.proxy import ProxyState

from plugin.comic18 import jm_config
from  plugin.comic18.jm_plugin import JmCryptoTool
import re

# ************************************** list爬虫 **************************************
class CmCrawlerProcess(CrawlerProcess):

    def _load(self):
        super()._load()
        self.cm_decode = CmDecode()
        self.cdn = config.read(self.prefix, "cdn")
        self.ips = [self.cdn.replace("https://", "")]

        self.header.update({"Referer": self.url})

        self.ts_data = {}
        # self.url = "https://www.cdnhth.net"
        self.url, self.cookie = self.get_url_and_cookie()

    def get_url_and_cookie(self):
        return JmCryptoTool.get_cookies()

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

        if '"code":200' in txt:
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
        #
        # return f"{self.url}/categories/filter?page={self.crawler_data[value]}&order=&c=0&o="
        page = self.crawler_data[value]
        # page = int(page) - 1
        return f"{self.url}/categories/filter?page={page}&o=&c="

    def _webGet(self, web, url, index):

        headers, ts = JmCryptoTool.get_requests_headers()

        self.ts_data[index] = ts
        return web.get(url, header=headers, cookie=self.cookie,  web_index=index,
                            timeout=30, retry_interval=3, retry_limit=5,
                       use_proxy=self.getUseProxy(), proxy_state=ProxyState.INCLUD_DOMESTIC)

    def extract_unique_types(self, data):
        titles = set()  # 使用集合自动去重

        # 检查并添加 category.title
        if "category" in data and data["category"] and "title" in data["category"]:
            category_title = data["category"]["title"]
            if category_title:  # 排除空字符串或 None
                titles.add(category_title)

        # 检查并添加 category_sub.title
        if "category_sub" in data and data["category_sub"] and "title" in data["category_sub"]:
            sub_category_title = data["category_sub"]["title"]
            if sub_category_title:  # 排除空字符串或 None
                titles.add(sub_category_title)

        # 返回去重后的列表
        return list(titles)

    def _getInfo(self, web, index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """

        try:
            db_data = []
            data = json.loads(web.text)
            ts = self.ts_data[index]
            data = JmCryptoTool.decode_resp_data(data["data"], ts)
            data = json.loads(data)
            # for i in data["content"]:
            for i in data["content"]:
                data_dict = {}
                data_dict["aid"] = int(i["id"])
                data_dict["pic"] = f"https://cdn-msp.18comic-mhws.cc/media/albums/{i['id']}_3x4.jpg?v={ts}"
                data_dict["title"] = i["name"]
                data_dict["types"] = self.extract_unique_types(i)
                data_dict["update_time"] =  datetime.fromtimestamp(i["update_at"])
                data_dict["index_update"] = timeFormat.getNowTime()
                db_data.append(data_dict)
            self.db.processItems(self.main_table, db_data, self.main_id)



        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)



# ************************************** info爬虫 **************************************
class CmInfoCrawlerProcess(CmCrawlerProcess):

    def _getCrwalerField(self):
        return {"aid": 1, "title": 1, "types": 1, "series_id": 1}
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

        """直接获取所有包含重复title的完整文档"""
        pipeline = [
            {
                "$group": {
                    "_id": "$title",
                    "count": {"$sum": 1},
                    "docs": {"$push": "$$ROOT"}  # 保存完整文档
                }
            },
            {
                "$match": {
                    "count": {"$gt": 1}
                }
            },
            {
                "$unwind": "$docs"  # 展开文档数组
            },
            {
                "$replaceRoot": {"newRoot": "$docs"}  # 将文档提升为根
            }
        ]
        # data4 = self.db.aggregate(self.main_table, pipeline)
        data4 = []



        data = typeChange.vstack("_id", data, data2, data3, data4)
        return data

    def _getUrl(self, value):
        data = self.crawler_data[value]
        if "aid" in data:
            return f"{self.url}/album?id={data['aid']}"
            # return f"{self.url}/album?id=1138577"
        else:
            return None

    def _webGet(self, web, url, crawler_data_index):
        use_proxy = self.getUseProxy()
        use_proxy = False


        headers, ts = JmCryptoTool.get_requests_headers()

        self.ts_data[crawler_data_index] = ts
        return web.get(url, header=headers, cookie=self.cookie, web_index=crawler_data_index,
                       timeout=30, retry_interval=3, retry_limit=5,
                       use_proxy=self.getUseProxy(), proxy_state=ProxyState.INCLUD_DOMESTIC)


    def _getInfo(self, web, index):
        try:

            data = json.loads(web.text)
            ts = self.ts_data[index]
            data = JmCryptoTool.decode_resp_data(data["data"], ts)
            data = json.loads(data)
            info = data

            aid = self.crawler_data[index]["aid"]
            data = {}
            data["aid"] = aid
            # 项目已被删除
            if "id" in info and info["id"] and not info["name"]:
                # pass
                self.db.removeOneById(self.main_table, {"aid": int(aid)})
                self.db.removeItems(self.list_table, {"aid": int(aid)}, limit=999)
                self._setRunData(index, httpType.TYPE_UNkNOW, f"删除了不存在的项目 {aid}")
                return
            data["title"] = info["name"]
            data["works"] = info["works"]
            data["actor"] = info["actors"]
            data["tags"] = info["tags"]
            data["author"] = info["author"]
            data["summary"] = info["description"]

            data["readers"] = typeChange.findnum(info["total_views"])
            data["albim_likes"] = typeChange.findnum(info["likes"])
            data["create_time"] = datetime.fromtimestamp(int(info["addtime"]))
            data["list_update"] = timeFormat.getNowTime()
            data["series_id"] = int(info["series_id"])
            if ("完結" in "".join(data["tags"])) or ("完结" in "".join(data["tags"])):
                data["is_end"] = True
            # 转换到简体
            data["tags"] = typeChange.toJianti(data["tags"])

            # 添加章节
            photo_list = []
            for i in info["series"]:
                item = {}
                item["aid"] = int(data["aid"])
                item["pid"] = int(i["id"])
                item["title"] = i["name"]
                item["update_time"] = ""
                item["order"] = int(i["sort"])
                photo_list.append(item)
            if len(photo_list) == 0:
                photo_list = [
                    {"aid": data["aid"], "pid": data["aid"], "title": "单本", "update_time": data["create_time"]}]
            # 转换到简体
            photo_list = typeChange.toJianti(photo_list)
            data["list_count"] = len(photo_list)
            # 先插入list
            self.db.processItems(self.list_table, photo_list, self.list_id)
            self.db.processItems(self.main_table, data, self.main_id)
            # tree = web.tree
            # aid = self.crawler_data[index]["aid"]
            # if web.text and "album_missing" in web.text:
            #     # 项目已被删除
            #     if aid:
            #         # pass
            #         self.db.removeOneById(self.main_table, {"aid": int(aid)})
            #         self.db.removeItems(self.list_table, {"aid": int(aid)}, limit=999)
            #         self._setRunData(index, httpType.TYPE_UNkNOW, f"删除了不存在的项目 {aid}")
            #     return
            # aid1 = int("".join(tree.xpath(".//input[@id='album_id']/@value")))
            # if not aid1:
            #     logger.warning(f"cm info 爬虫未找到页面aid {web.url}")
            #     return
            # if int(aid1) != int(aid):
            #     # 项目已被移动, 删除原来的项目
            #     self.db.removeOneById(self.main_table, {"aid": int(aid)})
            #     self.db.removeItems(self.list_table, {"aid": int(aid)}, limit=999)
            #     self._setRunData(index, httpType.TYPE_UNkNOW, f"删除了不存在的项目 {aid} 原因 aid不一致")
            #
            #
            #
            # data = {}
            # photo_list = []
            #
            # data["aid"] = aid1
            #
            # data["works"] = tree.xpath(".//div[contains(@class,'hidden-lg')]//span[@data-type='%s']/a/text()" % "works")
            # data["actor"] = tree.xpath(".//div[contains(@class,'hidden-lg')]//span[@data-type='%s']/a/text()" % "actor")
            # # data["tags"] = tree.xpath(".//div[contains(@class,'hidden-lg')]//span[@data-type='%s']/a/text()" % "tags")
            #
            # tags = tree.xpath(
            #     ".//div[contains(@class,'hidden-lg')]//span[@data-type='works' or @data-type='actor' or @data-type='tags' or @data-type='author']/a/text()"
            # )
            # if "types" in self.crawler_data[index] and self.crawler_data[index]["types"]:
            #     tags += self.crawler_data[index]["types"]
            # new_tags = []
            # for t in tags:
            #     t = t.replace("/r", "")
            #     t = t.replace("/n", "")
            #     t = t.strip()
            #     t = typeChange.toJianti(t)
            #     if t not in new_tags:
            #         new_tags.append(t)
            #
            #
            #
            #
            # data["tags"] = new_tags
            #
            #
            #
            # data["author"] = tree.xpath(
            #     ".//div[contains(@class,'hidden-lg')]//span[@data-type='%s']/a/text()" % "author")
            # data["summary"] = "".join(tree.xpath(
            #     ".//div[contains(@class,'hidden-lg')]//div[@class='p-t-5 p-b-5' and contains(text(),'叙述')]/text()"))
            # data["filecount"] = typeChange.findnum(tree.xpath(
            #     ".//div[contains(@class,'visible-lg')]//div[@class='p-t-5 p-b-5' and contains(text(),'页数')]/text()"))
            # data["create_time"] = self.timeFinder.getTime(tree.xpath(
            #     ".//div[contains(@class,'visible-lg')]//div[@class='p-t-5 p-b-5']/span[contains(text(),'上架日期')]/text()"))
            # data["update_time"] = self.timeFinder.getTime(tree.xpath(
            #     ".//div[contains(@class,'visible-lg')]//div[@class='p-t-5 p-b-5']/span[contains(text(),'更新日期')]/text()"))
            # data["readers"] = typeChange.findnum(tree.xpath(
            #     ".//div[contains(@class,'visible-lg')]//div[@class='p-t-5 p-b-5']/span[contains(text(),'更新日期')]//following-sibling::span[1]/span[1]/span[1]/text()"))
            # data["list_update"] = timeFormat.getNowTime()
            # if ("完結" in "".join(data["tags"])) or ("完结" in "".join(data["tags"])):
            #     data["is_end"] = True
            # # 转换到简体
            #
            # data["tags"] = typeChange.toJianti(data["tags"])
            # # print(data)
            #
            # for index, list in  enumerate(tree.xpath(".//div[contains(@class,'visible-lg')]//div[@class='episode']//a")):
            #
            #     item = {}
            #     item["aid"] = data["aid"]
            #     item["pid"] = typeChange.findnum(list.xpath("./@data-album"))
            #     item["title"] = ("".join(list.xpath("./li/text()"))).replace("\n", "").strip()
            #     item["update_time"] = self.timeFinder.getTime(list.xpath("./li/span/text()"))
            #     item["order"] = index
            #     photo_list.append(item)
            # if len(photo_list) == 0:
            #     photo_list = [
            #         {"aid": data["aid"], "pid": data["aid"], "title": "单本", "update_time": data["update_time"]}]
            #
            #
            # # 转换到简体
            # photo_list = typeChange.toJianti(photo_list)
            # data["list_count"] = len(photo_list)
            # # 先插入list
            # self.db.processItems(self.list_table, photo_list, self.list_id)
            # self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:

            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {error}", web.url)


# ************************************** 章节爬虫 **************************************
class CmChapterCrawlerProcess(CmCrawlerProcess):
    pass

# ************************************** 图片列表爬虫 **************************************
class CmPageCrawlerProcess(CmCrawlerProcess):
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
        # 获取没有page的数据
        find_update1 = {"$and": [
            {"images": {"$in": [None, False]}},
            {"pid": {"$nin": [None, False]}}
        ]}
        data = self.db.getItems(self.list_table, find_update1, field=field, limit=10000)  # limit = 1000
        find_update2 = {"$and": [
            {"images": {"$size": 0}},
            {"pid": {"$nin": [None, False]}}
        ]}
        data2 = self.db.getItems(self.list_table, find_update2, field=field, limit=1000)  # limit = 1000
        data = typeChange.vstack("pid", data, data2)
        return data

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        pid = data["pid"]
        return f"{self.url}/comic_read?id={pid}"

    def _webGet(self, web, url, index):
        use_proxy = self.getUseProxy()
        use_proxy = False
        headers, ts = JmCryptoTool.get_requests_headers()

        self.ts_data[index] = ts
        return web.get(url, header=headers, cookie=self.cookie, web_index=index,
                       timeout=30, retry_interval=3, retry_limit=5,
                       use_proxy=self.getUseProxy(), proxy_state=ProxyState.INCLUD_DOMESTIC)

    def _getImages(self, tree):
        photo_list = []
        for list in tree.xpath(".//div[contains(@class,'scramble-page')]"):
            item = {}
            item["id"] = typeChange.findnum(list.xpath("./@id"))
            if item["id"] > 0:
                item["image"] = "".join(list.xpath("./img/@data-original")).strip()
                photo_list.append(item)
        return photo_list

    def _getInfo(self, web, crawler_data_index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        data = []

        try:
            data = json.loads(web.text)
            ts = self.ts_data[crawler_data_index]
            data = JmCryptoTool.decode_resp_data(data["data"], ts)
            data = json.loads(data)
            info = data

            pid = self.crawler_data[crawler_data_index]["pid"]
            data = {"pid": pid}
            data["update_time"] = datetime.fromtimestamp(int(info["addtime"]))
            images = []
            for i, img in enumerate(info["images"]):
                images.append({
                    "id": i + 1,
                    # "image": f"https://cdn-msp.18comic-cn.xyz/media/photos/{pid}/{img}"
                    "image": img
                })
            data["images"] = images
            self.db.processItems(self.list_table, data, self.list_id)
            # tree = web.tree
            # pid = self.crawler_data[crawler_data_index]["pid"]
            # # 判断是否多页,超过300页的漫画会被分成多页
            # pagination = tree.xpath(".//ul[@class='pagination']")
            # if pagination:
            #     pages = []
            #     for page in pagination[0].xpath(".//li"):
            #         href = ''.join(page.xpath('./a/@href'))
            #         match = re.search(r'\?page=(\d+)', href)
            #         if match:
            #             page_value = int(match.group(1))
            #             if page_value not in pages:
            #                 pages.append(page_value)
            #     logger.info(f"{pid} 有{len(pages) + 1}页")

            #     images = {1 : self._getImages(tree)}

            #     for p in pages:
            #         url = f"{self.url}/photo/{pid}/?page={p}"
            #         if self._webGet(web, url, crawler_data_index):
            #             images[p] = self._getImages(web.tree)

            #     images = [i for p in images for i in images[p]]

            #     data = {"pid": pid}
            #     data["images"] = images
            #     self.crawler_data[crawler_data_index]["images"] = data["images"]
            #     self.db.processItems(self.list_table, data, self.list_id)

            # else:
            #     data = {"pid": pid}
            #     data["images"] = self._getImages(tree)
            #     self.crawler_data[crawler_data_index]["images"] = data["images"]
            #     self.db.processItems(self.list_table, data, self.list_id)
        except Exception as error:
            msg = f"{self.name} 获取第{crawler_data_index}页出错, 错误原因{error}"
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)



# ************************************** 首页图片爬虫 **************************************
class CmThumbCrawlerProcess(CmCrawlerProcess):
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
    
    def get_url_and_cookie(self):
        return "", {}

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
    
    def _dataCheck(self, index):
        """
        判断数据是否需要网络去爬， 一般都是false 像
        Args:
            index:

        Returns:

        """
        aid = self.crawler_data[index]["aid"]
        thumb_load = self.crawler_data[index]["thumb_load"] if "thumb_load" in self.crawler_data[index] else 0
        id = int(aid)
        if thumb_load == 2:
            return True
        else:
            return False

    def _getUrl(self, crawler_data_index):
        from urllib.parse import urlparse, urlunparse
        data = self.crawler_data[crawler_data_index]
        pic = data["pic"]
        # pic = pic.replace("_3x4.jpg", ".jpg")
        # 解析 URL
        # parsed_url = urlparse(pic)

        # # 随机选择一个新域名
        # new_domain = random.choice(jm_config.DOMAIN_IMAGE_LIST)

        # # 构建新的 URL
        # new_url = urlunparse((
        #     parsed_url.scheme,  # 协议 (http/https)
        #     new_domain,         # 新域名
        #     parsed_url.path,    # 路径
        #     parsed_url.params,  # 参数
        #     parsed_url.query,   # 查询字符串
        #     parsed_url.fragment # 片段
        # ))

        return pic

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        
        return web.get(url, ips=jm_config.DOMAIN_IMAGE_LIST, web_index=crawler_data_index,
                       timeout=10, retry_interval=1, retry_limit=5,
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
                    logger.info(f"{aid} 上传thumb成功")
                    self.db.processItems(self.main_table, data, self.main_id)
                else:
                    logger.info(f"{aid}  上传thumb失败")
                    self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, f"aid={aid}, 错误的图片")
            else:
                self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, f"aid={aid}, 图片过小")
        except Exception as error:
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")

# ************************************** 缩略图片爬虫 **************************************
class CmNailCrawlerProcess(CmCrawlerProcess):
    pass

# ************************************** 内容图片爬虫 **************************************
class CmImagesCrawlerProcess(CmCrawlerProcess):
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
        
    def get_url_and_cookie(self):
        return "", {}

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
        self.page = 1
        self.page_count = 30

        data = self.db.getItems(self.list_table, {"pid": 519884})
        data = self._changeCrawlerData(data)

        return data


    def _changeCrawlerData(self, data):
        # 将data 按照mpv_images 拆散
        new_data = []
        for item in data:
            if "images" in item and  len(item["images"])>0:
                images = item["images"]
                images = typeChange.arraySplitPage(images, self.page, self.page_count)
                for image in images:
                    new_data.append({
                        "_id": item["_id"],
                        "aid": item["aid"],
                        "pid": item["pid"],
                        "image": image["image"],
                        "page": image["id"],
                        "page_count": len(item["images"])
                    })
        return new_data

    def _checkImages(self, index):
        data = self.crawler_data[index]
        id = data[self.list_id]
        page_count = data["page_count"]
        bucket, path = self._getMinioFile(id, 0)
        folder = path.rsplit('/', 1)[0] if '/' in path else path
        file_count = self.minio.countFile(bucket, folder)
        if file_count >= page_count:
            logger.info(f"{self.getName()} {id} 完成所有图片")
            self.db.processItem(self.list_table, {self.list_id: data[self.list_id], "image_load": 2}, self.list_id)
    def _dataCheck(self, index):
        """
        判断数据是否需要网络去爬， 一般都是false 像
        Args:
            index:

        Returns:

        """
        id = self.crawler_data[index][self.list_id]
        page = self.crawler_data[index]["page"]
        bucket, path = self._getMinioFile(id, page)
        if self.minio.existImage(bucket, path):
            self._checkImages(index)
            return True
        else:
            return False
    def _getCrwalerField(self):
        return {"aid": 1, "pid": 1, "images": 1}

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        pic = data["image"]
        # pic = pic.replace("_3x4.jpg", ".jpg")
        if "image" in pic:
            return pic["image"]
        return pic

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        
        return web.get(url, ips=jm_config.DOMAIN_IMAGE_LIST, web_index=crawler_data_index,
                       timeout=10, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy(),
                       proxy_state=ProxyState.INCLUD_DOMESTIC)

    def _getInfo(self, web, crawler_data_index):
        try:

            aid = self.crawler_data[crawler_data_index]["aid"]
            pid = self.crawler_data[crawler_data_index]["pid"]
            page = self.crawler_data[crawler_data_index]["page"]
            content = web.content
            if content is not None and len(content) > 100 and "html" not in str(content):
                img = self.cm_decode.imageChange(content, pid, page)
                bucket, thumb = self._getMinioFile(pid, page)
                upload_success = self.minio.uploadImage(bucket, thumb, img)
                if upload_success:
                    self._checkImages(crawler_data_index)
                    logger.info(f"{aid} {pid} 第{page}页 下载完成")
                else:
                    logger.info(f"{aid} {pid} 第{page}页 下载失败")
            else:
                self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, f"aid={aid}, 图片过小")
        except Exception as error:
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")

# ************************************** 评论页爬虫 **************************************
class CmCommentsCrawlerProcess(CmCrawlerProcess):


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
        if len(text) > 5:
            complete = True
        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, msg, url, re_count)
        return complete
    def _getCrawlerData(self):

        # 计算差距时间
        check_time = datetime.now() - timedelta(days=20)

        # 构建查询条件
        find = {
            '$or': [
                {'update_comments': {'$exists': False}},
                {'update_comments': {'$lt': check_time}}
            ]
        }
        # find = {"pid": 191091}

        data = self.db.getItems(self.list_table, find, limit=5000)

        data = self._changeCrawlerData(data)
        return data

    def _changeCrawlerData(self, data):
        # 将data 按照mpv_images 拆散
        new_data = []
        for item in data:
            pid = item["pid"]
            page_count = 2
            for page in range(1, page_count + 1):
                if "aid" not in item:
                    print(item)
                else:
                    new_data.append({
                        "_id": item["_id"],
                        "aid": item["aid"],
                        "pid": item["pid"],
                        "page": page,
                        "page_count": page_count
                    })
        self.comments_data = {}
        return new_data

    def _getCrwalerField(self):
        return {"pid": 1, "aid": 1}

    def _getUrl(self, value):
        data = self.crawler_data[value]
        pid = data["pid"]
        page = data["page"]
        url = f"{self.url}/forum?page={page}&mode=all&aid={pid}"
        # url = f"{self.url}/ajax/album_pagination"
        return url

    def _webGet(self, web, url, index):
        use_proxy = self.getUseProxy()
        use_proxy = False

        headers, ts = JmCryptoTool.get_requests_headers()

        self.ts_data[index] = ts
        return web.get(url, header=headers, cookie=self.cookie, web_index=index,
                       timeout=30, retry_interval=3, retry_limit=5,
                       use_proxy=self.getUseProxy(), proxy_state=ProxyState.INCLUD_DOMESTIC)



    def _checkComments(self, index, comments):
        id = self.crawler_data[index]["_id"]
        if id not in self.comments_data:
            self.comments_data[id] = {"page_count": 0, "data": []}
        for c in comments:
            self.comments_data[id]["data"].append(c)
        page_count = self.crawler_data[index]["page_count"]
        self.comments_data[id]["page_count"] += 1

        if self.comments_data[id]["page_count"] >= page_count:
            pid = self.crawler_data[index]["pid"]
            # logger.info(f"{self.getName()}  评论收集完成")
            comments = set()
            data = self.comments_data[id]["data"]
            for d in data:
                comments.add(d)
            comments = list(comments)
            comments = [i.strip() for i in comments]
            comments_part = typeChange.cn_part(" ".join(comments))
            # print(comments_part)
            comments_part = " ".join(comments_part)
            info = {
                "item_id": ObjectId(id),
                "forums": comments,
                "_t": comments_part,
                self.main_id: self.crawler_data[index][self.main_id],
                self.list_id: self.crawler_data[index][self.list_id],
                "update_comments": datetime.now()
            }
            self.db.processItem(self.comments_table, info, "item_id")
            self.db.processItem(self.list_table, {"pid": pid, "update_comments": datetime.now()}, "pid")



    def _getInfo(self, web, index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        try:
            # print(web.content)


            data = json.loads(web.text)
            ts = self.ts_data[index]
            data = JmCryptoTool.decode_resp_data(data["data"], ts)
            data = json.loads(data)
            info = data
            data = []
            for i in info["list"]:
                content = i["content"]
                content = typeChange.remove_html_tags_regex(content)
                data.append(typeChange.toJianti(content))
            self._checkComments(index, data)
            # data = []
            # # print(web.text)
            # for fourm in web.tree.xpath(".//div[@class='timeline-content']/text()"):
            #     if fourm not in data:
            #         data.append(typeChange.toJianti(fourm))
            # self._checkComments(index, data)


        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)

# ************************************** 下载器 **************************************
class CmDownCrawlerProcess(CmCrawlerProcess):
    pass