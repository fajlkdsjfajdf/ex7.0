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
class MgCrawlerProcess(CrawlerProcess):

    def _load(self):
        super()._load()
        self.cdn = config.read(self.prefix, "cdn")
        self.ips = [self.cdn.replace("https://", "")]
        self.host = config.read(self.prefix, "host")


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

        if "看漫畫" in txt or "看漫画" in txt:
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

        return range(1, 51)

    def _getUrl(self, value):
        if self.mode == "search":
            return f"{self.url}/s/{self.search_txt}_p{self.crawler_data[value]}.html"
        else:
            return f"{self.url}/list/update_p{self.crawler_data[value]}.html"





    def _webGet(self, web, url, index):
        use_proxy = True
        proxy_state = ProxyState.INCLUD_FOREIGN
        if not self.getUseProxy():
            proxy_state = ProxyState.FLASK_FOREIGN

        # proxy_state = ProxyState.INCLUD_MYFOREIGN
        return web.get(url, header=self.header, cookie=self.cookie,  web_index=index,
                            timeout=15, retry_interval=3, retry_limit=8,
                       use_proxy=use_proxy, proxy_state=proxy_state)

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
            # 判断页面模式
            page_mode_text =  (tree.xpath(".//div[contains(@class, 'book-sort')]//strong/text()") or [""])[0]
            if page_mode_text == "搜索结果":
                # 搜索模式
                for li in tree.xpath(".//div[@class='book-result']/ul/li"):
                    data_dict = {}
                    a = typeChange.getFristElement(li, ".//a[contains(@href, '/comic/')]")
                    if a is not None:
                        url = typeChange.getFristElement(a, "./@href")
                        data_dict["aid"] = int(url[url.rindex('/', 0, len(url) - 1) + 1:].replace("/", "")) if url else ""
                        pic = typeChange.getFristElement(a, "./img/@src")
                        if pic is None:
                            pic = typeChange.getFristElement(a, "./img/@data-src")
                        data_dict["pic"] = f"https:{pic}" if pic else ""
                        data_dict["title"] = typeChange.getFristElement(a, "./@title")

                        data_dict["ep_status"] = typeChange.getFristElement(a, "./span[@class='tt']/text()")
                        update = typeChange.getFristElement(li, ".//dd[contains(@class, 'tags')]/span/span[@class='red']/text()", 1)
                        if not update:
                            update =typeChange.getFristElement(li, ".//dd[contains(@class, 'tags')]/span/span[@class='red']/text()", 0)
                        data_dict["update_time"] = typeChange.extractFirstDate(update) if update else ""
                        rating = typeChange.getFristElement(li, ".//p[@class='score-avg']/strong/text()")
                        data_dict["rating"] = typeChange.findnum(rating) if rating else 0
                        data_dict["index_update"] = timeFormat.getNowTime()
                        data.append(data_dict)
            else:
                # 列表爬虫模式
                for li in tree.xpath(".//ul[@id='contList']/li"):
                    data_dict = {}
                    a = typeChange.getFristElement(li, ".//a[contains(@href, '/comic/')]")
                    if a is not None:
                        url = typeChange.getFristElement(a, "./@href")
                        data_dict["aid"] = int(url[url.rindex('/', 0, len(url) - 1) + 1:].replace("/", "")) if url else ""
                        pic = typeChange.getFristElement(a, "./img/@src")
                        if pic is None:
                            pic = typeChange.getFristElement(a, "./img/@data-src")
                        data_dict["pic"] = f"https:{pic}" if pic else ""
                        data_dict["title"] = typeChange.getFristElement(a, "./@title")

                        data_dict["ep_status"] = typeChange.getFristElement(a, "./span[@class='tt']/text()")
                        update = typeChange.getFristElement(li, ".//span[@class='updateon']/text()")
                        data_dict["update_time"] = typeChange.extractFirstDate(update) if update else ""
                        rating = typeChange.getFristElement(li, ".//span[@class='updateon']/em/text()")
                        data_dict["rating"] = typeChange.findnum(rating) if rating else 0
                        data_dict["index_update"] = timeFormat.getNowTime()
                        data.append(data_dict)
            # self.crawler_data[crawler_data_index]["items"] = data
            self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)



# ************************************** info爬虫 **************************************
class MgInfoCrawlerProcess(MgCrawlerProcess):

    def _getCrwalerField(self):
        return {"aid": 1, "title": 1, "r18": 1}
    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        self.thread_count = 3
        field = self._getCrwalerField()
        # 获取没有info的数据
        find_update1 = {}
        limit = 100
        data = self.db.getItems(self.main_table, find_update1, field=field, limit=limit, order="index_update",
                                       order_type=-1)  # limit = 1000
        find_update2 = {"list_update": {"$in": [None, False]}}
        # 获取没有内容的记录
        data2 = self.db.getItems(self.main_table, find_update2, field=field, limit=100)
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
            return f"{self.url}/comic/{data['aid']}/"
        else:
            return None

    def _webGet(self, web, url, crawler_data_index):
        # use_proxy = True
        # proxy_state = ProxyState.INCLUD_FOREIGN
        # if not self.getUseProxy():
        #     proxy_state = ProxyState.FLASK_FOREIGN
        info = self.crawler_data[crawler_data_index]
        use_proxy = self.getUseProxy()
        # proxy_state = ProxyState.INCLUD_DOMESTIC
        proxy_state = ProxyState.FLASK_DOMESTIC
        host = self.host[0] if self.host else ""
        if "r18" in info and info["r18"] == 1:
            # 使用海外代理
            use_proxy = True
            proxy_state = ProxyState.INCLUD_FOREIGN

        return web.get(url, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=5, use_proxy=use_proxy, host=host,
                       proxy_state=proxy_state)


    def _getInfo(self, web, index):
        try:
            encodeview = mgDecoder.infoGet(web.tree)


            chatpers = {}
            r18_tag = False

            if encodeview == None:
                content = web.tree
                for h4 in content.xpath(".//div[contains(@class,'chapter')]//h4"):
                    chapter_type = (h4.xpath("./span/text()") or [""])[0]
                    ul = h4.xpath("following-sibling::div[1]")

                    for chapter_ul in h4.xpath("following-sibling::div[contains(@class, 'chapter-list')][1]/ul"):
                        chapter_list = []
                        for chapter in chapter_ul.xpath("./li"):
                            chapter_title = (chapter.xpath("./a/@title") or [""])[0]
                            chapter_pid = (chapter.xpath("./a/@href") or [""])[0]
                            chapter_pid = (re.findall(r"/comic/\d+/(\d+)\.html", chapter_pid) or ["0"])[0]
                            chapter_page = typeChange.findnum((chapter.xpath(".//span/i/text()") or ["0"])[0])
                            chapter_list.append({"title": chapter_title, "pid": chapter_pid, "page": chapter_page})
                        chapter_list = typeChange.listReversed(chapter_list) # 翻转章节列表,使其从小到大排列
                        chatpers[chapter_type] = chatpers.get(chapter_type, []) + chapter_list
                if content.xpath(".//div[contains(@class,'chapter-tip-18')]"):
                    r18_tag = True

            else:
                # print(web.text)
                content = encodeview
                # print(content)
                for h4 in content.xpath(".//h4"):
                    chapter_type = (h4.xpath("./span/text()") or [""])[0]
                    for chapter_ul in h4.xpath("following-sibling::div[contains(@class, 'chapter-list')][1]/ul"):
                        chapter_list = []
                        for chapter in chapter_ul.xpath("./li"):
                            chapter_title = (chapter.xpath("./a/@title") or [""])[0]
                            chapter_pid = (chapter.xpath("./a/@href") or [""])[0]
                            chapter_pid = (re.findall(r"/comic/\d+/(\d+)\.html", chapter_pid) or ["0"])[0]
                            chapter_page = typeChange.findnum((chapter.xpath(".//span/i/text()") or ["0"])[0])
                            chapter_list.append({"title": chapter_title, "pid": chapter_pid, "page": chapter_page})
                        chapter_list = typeChange.listReversed(chapter_list)  # 翻转章节列表,使其从小到大排列
                        chatpers[chapter_type] = chatpers.get(chapter_type, []) + chapter_list
                if content.xpath(".//div[contains(@class,'chapter-tip-18')]"):
                    r18_tag = True

            aid = self.crawler_data[index]["aid"]

            if "根据中国法律法规" in web.text and not chatpers:
                self._setRunData(index, httpType.TYPE_UNkNOW, f"需要国外代理", web.url)
                self.db.processItem(self.main_table, {"aid": aid, "r18": 1}, self.main_id)
            if not chatpers:
                return

            aid = self.crawler_data[index]["aid"]
            tree = web.tree

            root = tree.xpath(".//ul[contains(@class,'detail-list')]")[0]
            # 获取所有标题
            title = (tree.xpath('.//div[@class="book-title"]/h1/text()') or [""])[0]
            title2 = (tree.xpath('.//div[@class="book-title"]/h2/text()') or [""])[0]
            # 获取出品年代
            publish_time = (root.xpath('//li//span/strong[text()="出品年代："]/following-sibling::a[1]/text()') or [""])[
                0]
            # 获取漫画地区
            area = (root.xpath('//li//span/strong[text()="漫画地区："]/following-sibling::a[1]/@title') or [""])[0]
            # 获取漫画tag
            tags = root.xpath('//li//span/strong[text()="漫画剧情："]/following-sibling::a/text()')
            # 获取漫画作者
            author = (root.xpath('//li//span/strong[text()="漫画作者："]/following-sibling::a[1]/text()') or [""])
            # 获取漫画别名
            alias = (root.xpath('//li//span/strong[text()="漫画别名："]/following-sibling::a[1]/text()') or [""])[0]
            # 获取漫画状态
            status = (root.xpath('//li[@class="status"]/span/span/text()') or [""])[0]
            # 获取漫画剧情
            plot = "<br>".join(tree.xpath(".//div[@id='intro-all']/p/text()"))

            if tags:
                tags.append(status)
                crumb = tree.xpath('.//div[contains(@class, "crumb")]/a/@title') or []
                crumb = [ i for i in crumb if i]    # 去除空值
                tags += crumb
                tags = list(set(tags)) # 去重
            if r18_tag:
                tags.append("R18")



            # 将信息存储在字典中
            info = {
                'aid': int(aid),
                'title': title,
                'title2': title2,
                'publish_time': publish_time,
                'area': area,
                'tags': tags,
                'author': author,
                'alias': alias,
                'status': status,
                'plot': plot,
                'chatpers': chatpers,
                'list_update': timeFormat.getNowTime()
            }
            # print(chatpers)

            photo_list = []
            # 重建chatpers列表形状
            for c_type in chatpers:
                for i, p in enumerate(chatpers[c_type]):
                    p["type"] = c_type
                    p["aid"] = aid
                    p["order"] = i + 1
                    photo_list.append(p)

            # 先插入list
            self.db.processItems(self.list_table, photo_list, self.list_id)
            self.db.processItems(self.main_table, info, self.main_id)
        except Exception as error:

            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {error}", web.url)


# ************************************** 章节爬虫 **************************************
class MgChapterCrawlerProcess(MgCrawlerProcess):
    pass

# ************************************** 图片列表爬虫 **************************************
class MgPageCrawlerProcess(MgCrawlerProcess):
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
        # find_update1 = {"$and": [
        #     {"images": {"$in": [None, False]}},
        #     {"pid": {"$nin": [None, False]}}
        # ]}
        # data = self.db.getItems(self.list_table, find_update1, field=field, limit=10000)  # limit = 1000
        # find_update2 = {"$and": [
        #     {"images": {"$size": 0}},
        #     {"pid": {"$nin": [None, False]}}
        # ]}
        # data2 = self.db.getItems(self.list_table, find_update2, field=field, limit=1000)  # limit = 1000
        # data = typeChange.vstack("pid", data, data2)

        # 只获取有历史记录的章节
        data = self.db.getItems(f"{self.prefix.lower()}-history", {}, limit=999999)
        history_aids = list(set([i["aid"] for i in data]))   # 通过转成set 去重

        find = {"$and": [
            {"aid": {"$in": history_aids}},
            {"images": {"$in": [None, False, 0]}}
        ]}

        data = self.db.getItems(self.list_table, find, field=field, limit=1000)
        return data

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        pid = data["pid"]
        aid = data["aid"]
        url = f"{self.url}/comic/{aid}/{pid}.html"
        return url

    def _webGet(self, web, url, index):
        # use_proxy = True
        # proxy_state = ProxyState.INCLUD_FOREIGN
        # if not self.getUseProxy():
        #     proxy_state = ProxyState.FLASK_FOREIGN
        use_proxy = self.getUseProxy()
        proxy_state = ProxyState.ALL_PROXY
        return web.get(url, header=self.header, cookie=self.cookie,  web_index=index,
                            timeout=30, retry_interval=3, retry_limit=5,
                       use_proxy=use_proxy, proxy_state=proxy_state)

    def _getInfo(self, web, crawler_data_index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        data = []
        try:
            pid = self.crawler_data[crawler_data_index]["pid"]
            data = {"pid": pid}
            photo_list = mgDecoder.get(web.text)
            data["images"] = photo_list
            self.crawler_data[crawler_data_index]["images"] = photo_list
            self.db.processItems(self.list_table, data, self.list_id)
        except Exception as error:
            msg = f"{self.name} 获取第{crawler_data_index}页出错, 错误原因{error}"
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)



# ************************************** 首页图片爬虫 **************************************
class MgThumbCrawlerProcess(MgCrawlerProcess):
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
class MgNailCrawlerProcess(MgCrawlerProcess):
    pass

# ************************************** 内容图片爬虫 **************************************
class MgImagesCrawlerProcess(MgCrawlerProcess):
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
        use_proxy = True
        proxy_state = ProxyState.FLASK_DOMESTIC
        return web.get(url, header=self.header, web_index=crawler_data_index,
                       timeout=10, retry_interval=3, retry_limit=3, use_proxy=use_proxy,
                       proxy_state=proxy_state)

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
class MgCommentsCrawlerProcess(MgCrawlerProcess):
    pass

# ************************************** 下载器 **************************************
class MgDownCrawlerProcess(MgCrawlerProcess):
    pass


