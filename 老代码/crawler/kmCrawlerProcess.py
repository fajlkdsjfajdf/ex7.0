# mg
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
from plugin.bilibli_manga import BilibliManga
import re

# ************************************** list爬虫 **************************************
class KmCrawlerProcess(CrawlerProcess):

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

        if "data" in txt:
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
        return f"{self.url}/api/query"


    def _getPostData(self, page):
        page = page - 1 # 从0开始
        page_size = 1000
        data = {
            "operationName": "comicByCategories",
            "variables": {
                "categoryId": [],
                "pagination": {
                    "limit": page_size,
                    "offset": page * page_size,
                    "orderBy": "DATE_UPDATED",
                    "asc": False,
                    "status": ""
                }
            },
            "query": "query comicByCategories($categoryId: [ID!]!, $pagination: Pagination!) {\n  comicByCategories(categoryId: $categoryId, pagination: $pagination) {\n    id\n    title\n    status\n    year\n    imageUrl\n    authors {\n      id\n      name\n      __typename\n    }\n    categories {\n      id\n      name\n      __typename\n    }\n    dateUpdated\n    monthViews\n    views\n    favoriteCount\n    lastBookUpdate\n    lastChapterUpdate\n    __typename\n  }\n}"
        }
        return json.dumps(data)

    def _changeDateFormat(self, time_str):
        return datetime.fromisoformat(time_str.replace("Z", "+00:00"))

    def _webGet(self, web, url, index):
        use_proxy = self.getUseProxy()
        self.header["Content-Type"] = "application/json";
        data = self._getPostData(self.crawler_data[index])
        return web.post(url, data, header=self.header, cookie=self.cookie,  web_index=index,
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
            json_data = web.json
            if "data" in json_data and "comicByCategories" in json_data["data"]:
                for item in json_data["data"]["comicByCategories"]:
                    item["aid"] = int(item["id"])
                    del item["id"]
                    tags = [i["name"] for i in item["authors"]]
                    tags += [i["name"] for i in item["categories"]]
                    item["tags"] = tags
                    item["index_update"] = timeFormat.getNowTime()
                    item["update_time"] = self._changeDateFormat(item["dateUpdated"])
                    del item["dateUpdated"]
                    data.append(item)
            print(data)
            # self.crawler_data[crawler_data_index]["items"] = data
            self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)



# ************************************** info爬虫 **************************************
class KmInfoCrawlerProcess(KmCrawlerProcess):

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
        return f"{self.url}/api/query"

    def _getPostData(self, info):
        id = info["aid"]
        data = {
                "operationName": "chapterByComicId",
                "variables":
                    {"comicId": str(id)},
                "query":"query chapterByComicId($comicId: ID!) {\n  chaptersByComicId(comicId: $comicId) {\n    id\n    serial\n    type\n    dateCreated\n    dateUpdated\n    size\n    __typename\n  }\n}"
                }
        return json.dumps(data)

    def _webGet(self, web, url, crawler_data_index):
        use_proxy = self.getUseProxy()
        self.header["Content-Type"] = "application/json";
        data = self._getPostData(self.crawler_data[crawler_data_index])
        return web.post(url, data, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=5, use_proxy=use_proxy,
                       proxy_state=ProxyState.INCLUD_DOMESTIC)


    def _getInfo(self, web, index):
        try:
            json_data = web.json
            data = []
            aid = self.crawler_data[index]["aid"]
            if "data" in json_data and "chaptersByComicId" in json_data["data"]:
                order = 0
                for item in json_data["data"]["chaptersByComicId"]:
                    order += 1
                    data.append({
                        "aid": aid,
                        "pid": int(item["id"]),
                        "title": item["serial"],
                        "type": item["type"],
                        "order": order,
                        "size": int(item["size"]),
                        "update": self._changeDateFormat(item["dateUpdated"])
                    })
            # print(data)
            # 先插入list
            info = {"aid": aid, "list_update": timeFormat.getNowTime()}

            self.db.processItems(self.list_table, data, [self.main_id, self.list_id])
            self.db.processItems(self.main_table, info, self.main_id)
        except Exception as error:

            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {error}", web.url)


# ************************************** 章节爬虫 **************************************
class KmChapterCrawlerProcess(KmCrawlerProcess):
    pass

# ************************************** 图片列表爬虫 **************************************
class KmPageCrawlerProcess(KmCrawlerProcess):
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

        data = self.db.getItems(self.list_table, find, field=field, limit=50000)
        return data

    def _getUrl(self, crawler_data_index):
        return f"{self.url}/api/query"

    def _getPostData(self, info):
        id = info["pid"]
        data = {"operationName": "imagesByChapterId",
                "variables":
                    {
                        "chapterId": str(id)
                    },
                "query":"query imagesByChapterId($chapterId: ID!) {\n  imagesByChapterId(chapterId: $chapterId) {\n    id\n    kid\n    height\n    width\n    __typename\n  }\n}"
                }
        return json.dumps(data)

    def _webGet(self, web, url, crawler_data_index):
        use_proxy = self.getUseProxy()
        self.header["Content-Type"] = "application/json";
        data = self._getPostData(self.crawler_data[crawler_data_index])
        return web.post(url, data, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
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
            pid = self.crawler_data[crawler_data_index]["pid"]
            aid = self.crawler_data[crawler_data_index]["aid"]
            json_data = web.json
            if "data" in json_data and "imagesByChapterId" in json_data["data"]:
                imgs = []
                for item in json_data["data"]["imagesByChapterId"]:
                    imgs.append(item)
                data = {"aid": aid, "pid": pid, "images": imgs}
                self.db.processItems(self.list_table, data, [self.main_id, self.list_id])
        except Exception as error:
            msg = f"{self.name} 获取第{crawler_data_index}页出错, 错误原因{error}"
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)



# ************************************** 首页图片爬虫 **************************************
class KmThumbCrawlerProcess(KmCrawlerProcess):
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
class KmNailCrawlerProcess(KmCrawlerProcess):
    pass

# ************************************** 内容图片爬虫 **************************************
class KmImagesCrawlerProcess(KmCrawlerProcess):
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
        pic = f"{self.cdn}{pic}"
        # pic = pic.replace("_3x4.jpg", ".jpg")
        return pic

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        
        return web.get(url, header=self.header, web_index=crawler_data_index,
                       timeout=10, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy(),
                       proxy_state=ProxyState.INCLUD_DOMESTIC)

    def _getInfo(self, web, crawler_data_index):
        try:

            aid = self.crawler_data[crawler_data_index]["aid"]
            pid = self.crawler_data[crawler_data_index]["pid"]
            page = self.crawler_data[crawler_data_index]["page"]
            content = web.content
            if content is not None and len(content) > 100 and "html" not in str(content):
                img = content
                bucket, thumb = self._getMinioFile(pid, page)
                upload_success = self.minio.uploadImage(bucket, thumb, img)
                if upload_success:
                    self._checkImages(crawler_data_index)
                    logger.info(f"{aid} {pid} 第{page}页 下载完成")
                else:
                    logger.info(f"{aid} {pid} 第{page}页 下载失败")
            else:
                self._setRunData(index, httpType.TYPE_UNkNOW, f"aid={aid}, 图片过小")
        except Exception as error:
            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")

# ************************************** 评论页爬虫 **************************************
class KmCommentsCrawlerProcess(KmCrawlerProcess):
    pass

# ************************************** 下载器 **************************************
class KmDownCrawlerProcess(KmCrawlerProcess):
    pass


