# Bk
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
from plugin.bkTool import BkTool, ToolUtil
from networking.proxy import ProxyState

# ************************************** list爬虫 **************************************
class BkCrawlerProcess(CrawlerProcess):

    def _load(self):
        super()._load()
        self.url = config.read(self.prefix, "url") + "/"
        self.cdn = config.read(self.prefix, "cdn")
        self.tool = ToolUtil()
        self.bktool = BkTool()


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

        if "docs" in txt or "comic" in txt:
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

        return range(1, 101)

        # 全文检索
        # pages, total = self.bktool.getIndexPages()
        # return range(1, pages + 1)

    def _getUrl(self, value):
        # ex的索引页不用关心crawler_data  特例
        return f"{self.url}comics?s=dd&page={self.crawler_data[value]}"


    def _webGet(self, web, url, index):
        
        # return web.get(url, header=self.header, cookie=self.cookie,  web_index=index,
        #                     timeout=30, retry_interval=3, retry_limit=5, use_proxy=self.getUseProxy())
        method = "GET"
        self.header = self.tool.GetHeader(url, method)

        return web.get(url,  header=self.header,  web_index=index,
                            timeout=30, retry_interval=3, retry_limit=100, use_proxy=self.getUseProxy())

    def _getInfo(self, web, index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        data = []
        try:
            rd = json.loads(web.content)
            if "data" in rd and "comics" in rd["data"] and "docs" in rd["data"]["comics"]:
                docs = rd["data"]["comics"]["docs"]
                for d in docs:
                    d.pop("_id")
                    d["cid"] = ObjectId(d["id"])
                    d.pop("id")
                    if "categories" in d:
                        d["categories"] = typeChange.toJianti(d["categories"])
                    d["index_update"] = datetime.now()
                    data.append(d)
            self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)



# ************************************** info爬虫 **************************************
class BkInfoCrawlerProcess(BkCrawlerProcess):

    def _getCrwalerField(self):
        return {"cid": 1, "epsCount": 1}
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
        find_update2 = {"$or": [
            {"info_update": {"$in": [None, False]}},
            {"list_update": {"$in": [None, False]}},
        ]}
        # 获取没有内容的记录
        data2 = self.db.getItems(self.main_table, find_update2, field=field, limit=99999)
        # 获取收藏的记录 *********************************** 未完成
        data3 = []

        data = typeChange.vstack("_id", data, data2, data3)
        return data

    def _getUrl(self, value):
        data = self.crawler_data[value]
        epsCount = data["epsCount"]
        urls = [f"{self.url}comics/{data['cid']}"] # info
        if type(epsCount) == int:
            page_numbers = list(range(1, epsCount // 40 + 2, 1))
            for p in page_numbers:
                urls.append(f"{self.url}comics/{data['cid']}/eps?page={p}")
        return urls

    def _webGet(self, web, url, crawler_data_index):
        method = "GET"
        self.header = self.tool.GetHeader(url, method)
        return web.get(url, header=self.header,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=20, use_proxy=self.getUseProxy())

    def _getInfo(self, web, index):
        try:
            rd = json.loads(web.content)
            if "data" in rd and "comic" in rd["data"]:
                item = rd["data"]["comic"]
                item["cid"] = ObjectId(item["_id"])
                item.pop("_id")
                item["info_update"] = datetime.now()
                if "tags" in item:
                    item["tags"] = typeChange.toJianti(item["tags"])
                if "description" in item:
                    item["description"] = typeChange.toJianti(item["description"])
                if "chineseTeam" in item:
                    item["chineseTeam"] = typeChange.toJianti(item["chineseTeam"])
                self.db.processItems(self.main_table, item, self.main_id)
            elif "data" in rd and "eps" in rd["data"]:
                docs = rd["data"]["eps"]["docs"]
                list = []
                cid = ObjectId(self.crawler_data[index]["cid"])
                for item in docs:
                    item.pop("_id")
                    item["cid"] = cid
                    item[self.list_id] = ObjectId(item["id"])
                    item.pop("id")
                    list.append(item)
                self.db.processItems(self.list_table, list, self.list_id)
                data = {"cid": cid, "list_update": datetime.now()}
                self.db.processItems(self.main_table, data, self.main_id)

        except Exception as error:
            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {error}")


# ************************************** 章节爬虫 **************************************
class BkChapterCrawlerProcess(BkCrawlerProcess):
    pass

# ************************************** 图片列表爬虫 **************************************
class BkPageCrawlerProcess(BkCrawlerProcess):
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
        return {"pid": 1, "title": 1, "cid": 1, "order": 1}

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

        # 先获取第一页, 获知一共多少页
        data = self.crawler_data[crawler_data_index]
        cid = data["cid"]
        order = data["order"]
        pages, total = self.bktool.getImageSplitPages(cid, order)
        if pages:
            urls = [self.url + f"comics/{cid}/order/{order}/pages?page={p}" for p in range(1, pages + 1)]
            self.crawler_data[crawler_data_index]["pages"] = pages
            self.crawler_data[crawler_data_index]["total"] = total
            self.crawler_data[crawler_data_index]["data"] = []
            return urls

        return None
        # data = self.crawler_data[crawler_data_index]
        # pid = data["pid"]
        # return f"{self.url}/photo/{pid}/"

    def _webGet(self, web, url, index):
        
        method = "GET"
        header = ToolUtil.GetHeader(url, method)
        return web.get(url, header=header, cookie=self.cookie,  web_index=index,
                            timeout=30, retry_interval=3, retry_limit=5, use_proxy=self.getUseProxy())


    def _checkImages(self, crawler_data_index):
        # 判断是否所有page都搜集完成
        pages = self.crawler_data[crawler_data_index]["pages"]
        data = self.crawler_data[crawler_data_index]["data"]
        total = self.crawler_data[crawler_data_index]["total"]
        if len(data) == pages:
            # 当前完成数量等于pages, 都搜集完成了
            pid = self.crawler_data[crawler_data_index]["pid"]
            images = []
            for d in data:
                images += d
            if len(images) == int(total):
                data = {"pid": pid, "images": images, "image_count": int(total)}
                self.db.processItems(self.list_table, data, "pid")
                self.crawler_data[crawler_data_index]["images"] = images
            else:
                logger.warning(f"bk获取图片列表失败, 图片总数不正确 {len(images)} / {int(total)}")


    def _getInfo(self, web, crawler_data_index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        data = []
        try:
            json_data = web.json
            if "data" in json_data and "pages" in json_data["data"] and "docs" in json_data["data"]["pages"]:
                images = json_data["data"]["pages"]["docs"]
                imgs = []
                for m in images:
                    img = {
                        "id": m["_id"],
                        "file": m["media"]["originalName"],
                        "image": m["media"]["path"]
                    }
                    imgs.append(img)
                self.crawler_data[crawler_data_index]["data"].append(imgs)
                self._checkImages(crawler_data_index)

        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)



# ************************************** 首页图片爬虫 **************************************
class BkThumbCrawlerProcess(BkCrawlerProcess):
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
                                {"thumb": {"$nin": [None, False]}}]}
        data = self.db.getItems(self.main_table, find_update, field=field, limit=1000)  # limit = self.count
        # print(data)
        return data

    def _getCrwalerField(self):
        return {"cid": 1, "thumb": 1}

    def _dataCheck(self, index):
        """
        判断数据是否需要网络去爬， 一般都是false 像
        Args:
            index:

        Returns:

        """
        id = self.crawler_data[index][self.main_id]

        bucket, path = self._getMinioFile(id)
        if self.minio.existImage(bucket, path):
            self.db.processItem(self.main_table, {self.main_id: id, "thumb_load": 2}, self.main_id)
            return True
        else:
            return False

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        url = f"{self.cdn}/static/{data['thumb']['path']}"
        return url

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        
        return web.get(url, web_index=crawler_data_index,
                       timeout=10, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy())

    def _getInfo(self, web, crawler_data_index):
        try:
            id = self.crawler_data[crawler_data_index][self.main_id]
            content = web.content
            if content is not None and len(content) > 100 and "html" not in str(content):
                bucket, thumb = self._getMinioFile(id)
                upload_success = self.minio.uploadImage(bucket, thumb, content)
                if upload_success:
                    data =  {self.main_id: id, "thumb_load": 2}

                    self.db.processItems(self.main_table, data, self.main_id)
                else:
                    logger.info(f"{id}  上传thumb失败")
                    self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, f"cid={id}, 错误的图片")
            else:
                self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, f"cid={id}, 图片过小")
        except Exception as error:
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")

# ************************************** 缩略图片爬虫 **************************************
class BkNailCrawlerProcess(BkCrawlerProcess):
    pass

# ************************************** 内容图片爬虫 **************************************
class BkImagesCrawlerProcess(BkCrawlerProcess):
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

        data = self.db.getItems(self.list_table, {"pid": ObjectId("64532db6dac29e6f85e92f29")})
        data = self._changeCrawlerData(data)

        return data


    def _changeCrawlerData(self, data):
        # 将data 按照mpv_images 拆散
        new_data = []
        for item in data:
            if "images" in item and  len(item["images"])>0:
                images = item["images"]
                new_images = []
                for i, image in enumerate(images):
                    image["page"] = i + 1
                    new_images.append(image)

                images = typeChange.arraySplitPage(new_images, self.page, self.page_count)
                for image in images:
                    new_data.append({
                        "_id": item["_id"],
                        "cid": item["cid"],
                        "pid": item["pid"],
                        "image": image["image"],
                        "page": image["page"],
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
        return {"cid": 1, "pid": 1, "images": 1}

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        pic = data["image"]
        # pic = pic.replace("_3x4.jpg", ".jpg")
        url = f"{self.cdn}/static/{pic}"
        return url

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        
        return web.get(url, web_index=crawler_data_index,
                       timeout=10, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy())

    def _getInfo(self, web, crawler_data_index):
        try:

            cid = self.crawler_data[crawler_data_index]["cid"]
            pid = self.crawler_data[crawler_data_index]["pid"]
            page = self.crawler_data[crawler_data_index]["page"]
            content = web.content
            if content is not None and len(content) > 100 and "html" not in str(content):
                img = content
                bucket, thumb = self._getMinioFile(pid, page)
                upload_success = self.minio.uploadImage(bucket, thumb, img)
                if upload_success:
                    self._checkImages(crawler_data_index)
                    logger.info(f"{cid} {pid} 第{page}页 下载完成")
                else:
                    logger.info(f"{cid} {pid} 第{page}页 下载失败")
            else:
                self._setRunData(index, httpType.TYPE_UNkNOW, f"cid={cid}, 图片过小")
        except Exception as error:
            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")

# ************************************** 评论页爬虫 **************************************
class BkCommentsCrawlerProcess(BkCrawlerProcess):

    # def getCrawlerDataById(self, id_list):
    #     """
    #     通过id列表获取对应的crawler数据 需要重写
    #     Args:
    #         id_list:
    #     Returns:
    #     """
    #     self._load()
    #     id_list = typeChange.convertObjectId(id_list)
    #     if id_list:
    #         find = {"_id": {"$in": id_list}}
    #         data = self.db.getItems(self.list_table, find, field=self._getCrwalerField(), limit=9999999)
    #         data = sorted(data,
    #                       key=lambda x: id_list.index(ObjectId(x['_id'])) if ObjectId(x['_id']) in id_list else len(
    #                           id_list))
    #         data = self._changeCrawlerData(data)
    #         return data
    #     else:
    #         return {}
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
        data = self.db.getItems(self.list_table, {"cid": ObjectId("64532db6dac29e6f85e92f28")})
        data = self._changeCrawlerData(data)
        return data

    def _changeCrawlerData(self, data):
        # 将data 按照mpv_images 拆散
        new_data = []
        for item in data:
            # pid = item["pid"]
            page_count = 5
            for page in range(1, page_count + 1):
                new_data.append({
                    "_id": item["_id"],
                    "cid": item["cid"],
                    "page": page,
                    "page_count": page_count
                })
        self.comments_data = {}
        return new_data

    def _getCrwalerField(self):
        return {"pid": 1, "cid": 1}

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        cid = data["cid"]
        page = data["page"]
        url = f"{self.url}comics/{cid}/comments?page={page}"

        return url

    def _webGet(self, web, url, index):
        
        header = self.tool.GetHeader(url, "GET")
        return web.get(url, header=header, web_index=index,
                        timeout=10, retry_interval=1, retry_limit=2, use_proxy=self.getUseProxy())

    def _checkComments(self, index, comments):
        id = self.crawler_data[index]["_id"]
        if id not in self.comments_data:
            self.comments_data[id] = {"page_count": 0, "data": []}
        for c in comments:
            self.comments_data[id]["data"].append(c)
        page_count = self.crawler_data[index]["page_count"]
        self.comments_data[id]["page_count"] += 1
        if self.comments_data[id]["page_count"] >= page_count:
            logger.info(f"{self.getName()}  评论收集完成")
            comments = set()
            data = self.comments_data[id]["data"]
            for d in data:
                comments.add(d)
            comments = list(comments)
            info = {
                "item_id": ObjectId(id),
                "forums": comments,
                self.main_id: self.crawler_data[index][self.main_id],
                "update_comments": datetime.now()
            }
            self.db.processItem(self.comments_table, info, "item_id")

    def _getInfo(self, web, index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        try:
            # print(web.content)

            data = []
            rd = web.json
            if "data" in rd and "comments" in rd["data"] and "total" in rd["data"]["comments"]:
                for comment in rd["data"]["comments"]["docs"]:
                    data.append(typeChange.toJianti(comment["content"]))
            self._checkComments(index, data)


        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)

# ************************************** 下载器 **************************************
class BkDownCrawlerProcess(BkCrawlerProcess):
    pass