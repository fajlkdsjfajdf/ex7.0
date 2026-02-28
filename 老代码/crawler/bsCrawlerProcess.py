# cm
from crawler.crawlerProcess import CrawlerProcess
from config.configParse import config
from networking import httpType
from lxml import etree
from lxml.html import fromstring, tostring
from util import typeChange
import json
from util import timeFormat
from logger.logger import logger
from bson.objectid import ObjectId
from plugin.cmDecode import CmDecode
from datetime import datetime, timedelta
from networking.proxy import ProxyState
from bs4 import BeautifulSoup


# ************************************** list爬虫 **************************************
class BsCrawlerProcess(CrawlerProcess):

    def _load(self):
        super()._load()



    def getUseProxy(self):
        """
        获取是否要使用代理
        Returns:

        """
        use_proxy = self.use_proxy if hasattr(self, "use_proxy") else True

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

        if "哔哩" in txt:
            complete = True
        else:
            msg = f"获取失败,不正常页"
            # print(txt)
            complete = False
        if "內容加載失敗" in txt or "内容加载失败" in txt:
            logger.warning("BsPage 遇到cf墙")
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
        return f"{self.url}/wenku/lastupdate_0_0_0_0_0_0_0_{self.crawler_data[value]}_0.html"

    def _webGet(self, web, url, index):

        return web.curl_get(url, header=self.header, cookie=self.cookie,  web_index=index,
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
            for div in tree.xpath(".//div[contains(@class, 'bookbox')]"):
                data_dict = {}

                url = ".".join(
                    div.xpath(".//div[@class='bookimg']/a[contains(@href, '/novel/')]/@href")).strip()
                data_dict["aid"] = int(url[url.rindex('/', 0, len(url) - 1) + 1:].replace(".html", ""))
                data_dict["pic"] = "".join(div.xpath(".//div[@class='bookimg']//img/@data-original")).strip()
                if data_dict["pic"] == "":
                    data_dict["pic"] = "".join(div.xpath(".//div[@class='bookimg']//img/@src")).strip()
                data_dict["title"] = "".join(div.xpath(".//div[@class='bookname']/a/text()")).strip()

                data_dict["index_update"] = timeFormat.getNowTime()
                data.append(data_dict)
            self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)



# ************************************** info爬虫 **************************************
class BsInfoCrawlerProcess(BsCrawlerProcess):

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
        find_update2 = {"$or": [
            {"list_update": {"$in": [None, False]}},
            {"info_update": {"$in": [None, False]}}
        ]}

        # 获取没有内容的记录
        data2 = self.db.getItems(self.main_table, find_update2, field=field, limit=99999)

        data = typeChange.vstack("_id", data, data2)
        data = self._changeCrawlerData(data)
        return data

    def _changeCrawlerData(self, data):
        # 拆分为查info的和查list的
        new_data = []
        for d in data:
            new_data.append({"_id": d["_id"], "aid": d["aid"], "type": "list"})
            # new_data.append({"_id": d["_id"], "aid": d["aid"], "type": "info"})

        return new_data

    def _getUrl(self, value):
        data = self.crawler_data[value]
        if data["type"] == "info":
            return f"{self.url}/novel/{data['aid']}.html"
        else:
            return f"{self.url}/novel/{data['aid']}/catalog"

    def _webGet(self, web, url, crawler_data_index):

        use_proxy = self.getUseProxy()
        # use_proxy = False
        return web.curl_get(url, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=5, use_proxy=use_proxy,
                       proxy_state=ProxyState.MY_PROXY)


    def _getInfo(self, web, index):
        try:
            page_type = self.crawler_data[index]["type"]
            aid = self.crawler_data[index]["aid"]
            tree = web.tree
            if page_type == "info":
                data = {}
                data["aid"] = aid
                data["tags"] = tree.xpath(".//div[@class='book-info']/div[@class='book-label']//a/text()")

                data["update_time"] = self.timeFinder.getTime(tree.xpath(
                     ".//div[@class='book-info']//div[@class='nums']/span[contains(text(),'最后更新')]/text()"))
                data["likes"] = typeChange.findnum(tree.xpath(
                     ".//div[@class='book-info']//div[@class='nums']/span[contains(text(),'总推荐')]/text()"))
                summary = tree.xpath(".//div[@class='book-info']//div[contains(@class, 'book-dec')]") or ""
                if summary:
                    summary = etree.tostring(summary[0]).decode().strip()

                vol_list = []
                for v in tree.xpath(".//div[@class='book-vol-chapter']//a"):
                    vol_list.append({
                        "title": v.xpath("string(./@title)"),
                        "url": v.xpath("string(./@href)"),
                    })
                vol_list.reverse()      # 倒叙
                data["summary"] = summary
                data["vol_list"] = vol_list
                data["info_update"] = timeFormat.getNowTime()
                

                self.db.processItems(self.main_table, data, self.main_id)
            else:
                data = {}
                data["aid"] = aid
                data["author"] = " ".join(tree.xpath(".//div[@class='book-meta']//span[contains(text(), '作者')]/a/text()"))
                data["list_update"] = timeFormat.getNowTime()
                characters = []
                order_index = 0
                for v in tree.xpath(".//div[@class='volume-list']//div[contains(@class, 'volume clearfix')]"):
                    volume_title = "".join(v.xpath(".//div[@class='volume-info']/h2/text()")).strip()
                    for c in v.xpath(".//ul[contains(@class, 'chapter-list')]/li"):
                        order_index += 1
                        url = ".".join(c.xpath(".//a[contains(@href, '/novel/')]/@href")).strip()

                        if url:
                            pid = int(url[url.rindex('/', 0, len(url) - 1) + 1:].replace(".html", ""))
                            title = "".join(c.xpath(".//a[contains(@href, '/novel/')]/text()")).strip()
                            characters.append({"aid": aid, "pid": pid, "v_title": volume_title, "title": title, "order": order_index})
                        else:
                            pid = int(f"7654{aid}{order_index}")
                            title = "".join(c.xpath(".//a[contains(@href, 'cid')]/text()")).strip()
                            characters.append(
                                {"aid": aid, "pid": pid, "v_title": volume_title, "title": title, "order": order_index})
                self.db.processItems(self.list_table, characters, [self.main_id, self.list_id])
                self.db.processItems(self.main_table, data, self.main_id)

        except Exception as error:

            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {error}", web.url)


# ************************************** 章节爬虫 **************************************
class BsChapterCrawlerProcess(BsCrawlerProcess):
    pass

# ************************************** 图片列表爬虫 **************************************
class BsPageCrawlerProcess(BsCrawlerProcess):
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

    def _changeCrawlerData(self, data):
        for i in data:
            i["page"] = 1
        return  data

    def _getCrwalerField(self):
        return {"pid": 1, "title": 1, "aid": 1, "order": 1, "new_pid": 1}

    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        self.page_data = {}
        field = self._getCrwalerField()
        # 获取没有page的数据
        find_update1 = {"$and": [
            {"content": {"$in": [None, False]}},
            {"pid": {"$nin": [None, False]}}
        ]}
        data = self.db.getItems(self.list_table, find_update1, field=field, limit=10000)  # limit = 1000

        return data

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        pid = data["pid"]
        if "new_pid" in data:
            pid = data["new_pid"]
        page = data["page"]
        aid = data["aid"]
        if page == 1:
            return f"{self.url}/novel/{aid}/{pid}.html"
        else:
            return f"{self.url}/novel/{aid}/{pid}_{page}.html"


    def _webGet(self, web, url, index):
        use_proxy = self.getUseProxy()

        # return web.get(url, header=self.header, cookie=self.cookie,  web_index=index,
        #                     timeout=30, retry_interval=3, retry_limit=5,
        #                use_proxy=use_proxy, proxy_state=ProxyState.INCLUD_DOMESTIC)

        return web.curl_get(url, header=self.header, cookie=self.cookie, web_index=index,
                       timeout=30, retry_interval=3, retry_limit=5,
                       use_proxy=use_proxy, proxy_state=ProxyState.INCLUD_DOMESTIC)

    def _getInfo(self, web, crawler_data_index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        data = []
        try:
            tree = web.tree
            pid = self.crawler_data[crawler_data_index]["pid"]
            aid = self.crawler_data[crawler_data_index]["aid"]
            page = self.crawler_data[crawler_data_index]["page"]
            data = {"pid": pid, "aid": aid}

            if "content" not in self.crawler_data[crawler_data_index]:
                self.crawler_data[crawler_data_index]["content"] = {}

            soup = BeautifulSoup(web.text, 'lxml')
            div_element = soup.find('div', id='TextContent')
            content = ""
            if div_element:
                content = div_element.prettify()
                content = typeChange.remove_script_tags(content)
            if content:
                self.crawler_data[crawler_data_index]["content"][page] = content

            # 判断是否有下一页
            na = tree.xpath(".//div[@class='mlfy_page']/a[contains(text(), '下一页')]")
            na_url = tree.xpath("string(.//div[@class='mlfy_page']/a[contains(text(), '下一页')]/@href)")
            if na and "_" in na_url:

                # 有下一页
                logger.info(f"轻小说完成 pid:{pid} 第{page}页")
                self.crawler_data[crawler_data_index]["page"] += 1
                self._getWeb(crawler_data_index)
            else:
                # 插入
                logger.info(f"轻小说完成全部 pid:{pid} 总计{page}页")
                data["content"] = self.crawler_data[crawler_data_index]["content"]
                data["content"] = json.dumps(data["content"])
                data["content_update"] = timeFormat.getNowTime()
                # print(data)
                self.db.processItems(self.list_table, data, [self.main_id, self.list_id])

                # 判断下下一章是否是没有pid的, 如果是，将当前pid移植过来
                order = self.crawler_data[crawler_data_index]["order"]
                # 暂时使用的id
                zid = int(f"7654{aid}{order+1}")
                z_data = self.db.getItem(self.list_table, {"pid": zid})
                if z_data and "new_pid" not in z_data:
                    # 下一章为暂时的目录
                    a = tree.xpath(".//div[@class='mlfy_page']/a[contains(text(), '下一页')]/@href")
                    if a:
                        url = a[0]
                        new_pid = int(url[url.rindex('/', 0, len(url) - 1) + 1:].replace(".html", ""))
                        z_data["new_pid"] = new_pid
                        del z_data["_id"]
                        self.db.processItems(self.list_table, z_data, [self.main_id, self.list_id])


                id = self.crawler_data[crawler_data_index]["_id"]




        except Exception as error:
            msg = f"{self.name} 获取第{crawler_data_index}页出错, 错误原因{error}"
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)



# ************************************** 首页图片爬虫 **************************************
class BsThumbCrawlerProcess(BsCrawlerProcess):
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
        pic = pic.replace("_3x4.jpg", ".jpg")
        return pic

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        
        return web.get(url, ips=self.ips, web_index=crawler_data_index,
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
class BsNailCrawlerProcess(BsCrawlerProcess):
    pass

# ************************************** 内容图片爬虫 **************************************
class BsImagesCrawlerProcess(BsCrawlerProcess):
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
        # pic = pic.replace("_3x4.jpg", ".jpg")
        return pic

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        
        return web.get(url, ips=self.ips, web_index=crawler_data_index,
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
                self._setRunData(index, httpType.TYPE_UNkNOW, f"aid={aid}, 图片过小")
        except Exception as error:
            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")

# ************************************** 评论页爬虫 **************************************
class BsCommentsCrawlerProcess(BsCrawlerProcess):


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
        check_time = datetime.now() - timedelta(days=100)

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
            page_count = 5
            for page in range(1, page_count + 1):
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
        url = f"{self.url}/ajax/album_pagination"
        return url

    def _webGet(self, web, url, index):
        
        data = self.crawler_data[index]
        pid = data["pid"]
        page = data["page"]
        info = {
            "video_id": pid,
            "page": page
        }
        return web.post(url, info, header=self.header, cookie=self.cookie, web_index=index,
                        timeout=10, retry_interval=3, retry_limit=5, use_proxy=self.getUseProxy(),
                        proxy_state=ProxyState.INCLUD_DOMESTIC)

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

            data = []

            for fourm in web.tree.xpath(".//div[@class='timeline-content']/text()"):
                if fourm not in data:
                    data.append(typeChange.toJianti(fourm))
            self._checkComments(index, data)


        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)

# ************************************** 下载器 **************************************
class BsDownCrawlerProcess(BsCrawlerProcess):
    pass