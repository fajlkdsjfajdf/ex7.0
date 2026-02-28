# tk
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
import re
from networking.proxy import ProxyState


# ************************************** list爬虫 **************************************
class TkCrawlerProcess(CrawlerProcess):
    def _load(self):
        super()._load()
        self.cdn = config.read(self.prefix, "cdn")

    def _txtSuccess(self, txt):
        if "You don't have permission to access" in txt :
            return False
        return True

    def _getCrawlerData(self):
        """
        _getCrawlerData 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        # crawlerRange = range(1, 2000 + 1)
        crawlerRange = range(1, 100 + 1)
        return crawlerRange

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
        if "tktube" in txt:
            complete = True
        else:
            msg = f"获取失败,不正常页"
            complete = False

        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, msg, url, re_count)
        return complete

    def _getUrl(self, crawler_data_index):
        """
        _getUrl 获取网址
        :param crawler_data_index:
        :return:
        """
        return f"{self.url}/?mode=async&function=get_block&block_id=list_videos_most_recent_videos&sort_by=post_date&from={self.crawler_data[crawler_data_index]}"

    def getUseProxy(self):
        return False

    def _webGet(self, web, url, crawler_data_index):
        """
        _webGet 获取web请求
        :param web:
        :param url:
        :param crawler_data_index:
        :return:
        """
        
        return web.get(url, header=self.header, cookie=self.cookie, web_index=crawler_data_index,
                               timeout=30, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy())

    def _extractIdToken(self, url):
        # 定義一個函數來從一個url中提取id和token
        # 定義id和token的正則表達式
        id_pattern = r"videos/(\d+)"
        token_pattern = r"([^/]*)/$"
        # 使用re.search方法來對url進行匹配
        id_match = re.search(id_pattern, url)
        token_match = re.search(token_pattern, url)
        # 如果匹配成功，則從分組中獲取id和token的值
        if id_match and token_match:
            id = id_match.group(1)
            token = token_match.group(1)
            return id, token
        # 如果匹配失敗，則返回None
        else:
            return None, None

    def _getInfo(self, web, crawler_data_index):
        try:
            data = []
            tree = web.tree
            for item in tree.xpath(".//div[contains(@class, 'item')]//a"):
                url = ''.join(item.xpath("./@href")).strip()
                aid, token = self._extractIdToken(url)
                if aid != None:
                    date = ''.join(item.xpath(".//div[contains(@class, 'added')]/em/text()"))
                    date = typeChange.strToDate(date)

                    data.append({"aid": int(aid), "token": token, "date": date})
            if(data):
                self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)


# ************************************** info爬虫 **************************************
class TkInfoCrawlerProcess(TkCrawlerProcess):
    def _getCrwalerField(self):
        return {"aid": 1, "token": 1}

    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        field = self._getCrwalerField()

        find_update1 = {}
        limit = 1000
        data = self.db.getItems(self.main_table, find_update1, field=field, limit=limit, order="aid",
                                       order_type=-1)
        find_update2 = {"$or": [{"info_update": {"$in": [None, False]}}, {"title": ""}]}
        # 获取没有内容的记录
        data2 = self.db.getItems(self.main_table, find_update2, field=field, limit=5000)
        data = typeChange.vstack("_id", data, data2)
        return data

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        return f"{self.url}/videos/{data['aid']}/{data['token']}/"

    def _webGet(self, web, url, crawler_data_index):
        use_proxy = self.getUseProxy()
        return web.get(url, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=5, use_proxy=self.getUseProxy())

    def _extractScript(self, html):
        '''
        解析url 获取js， 获得2个值，video_alt_url， preview_url
        '''
        # 定義一個函數來從一個url中提取id和token
        # 定義id和token的正則表達式
        jpg_pattern = r"preview_url: '(.+?)',"
        # 使用re.search方法來對url進行匹配
        jpg_match = re.search(jpg_pattern, html)
        # 如果匹配成功，則從分組中獲取id和token的值
        if jpg_match :
            jpg = jpg_match.group(1)
            return jpg
        # 如果匹配失敗，則返回None
        else:
            return None
    def _getInfo(self, web, crawler_data_index):
        try:
            # print(web.text)
            tree = web.tree
            # print(web.text)
            data_dict = {}
            data_dict['aid'] = self.crawler_data[crawler_data_index]["aid"]
            data_dict['title'] = ''.join(tree.xpath(".//div[@class='headline']/h1/text()")).strip()
            data_dict['Length'] = ''.join(tree.xpath(".//div[@class='item'][1]/span[1]/em/text()")).strip()
            data_dict['summary'] = ''.join(tree.xpath(".//div[@class='item'][2]/text()")).strip().replace("Download:",
                                                                                                          "")
            data_dict['type'] = ''.join(tree.xpath(".//div[@class='item'][3]/a/text()")).strip()
            data_dict['tags'] = tree.xpath(".//div[@class='item'][4]/a/text()")
            data_dict['stars'] = tree.xpath(".//div[@class='item'][5]/a/text()")
            data_dict['PicList'] = tree.xpath(".//div[@id='tab_screenshots']//img/@src")
            data_dict['info_update'] = datetime.now()
            jpg = self._extractScript(web.text)
            if jpg is not None:
                data_dict["pic"] = jpg
            self.db.processItem(self.main_table, data_dict, self.main_id)
        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)

# ************************************** 章节爬虫 **************************************
class TkChapterCrawlerProcess(TkCrawlerProcess):
    pass


# ************************************** 图片列表爬虫 **************************************
class TkPageCrawlerProcess(TkCrawlerProcess):
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
            msg = "大小为0"
            complete = False
        else:
            complete = True
        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, msg, url, re_count)
        return complete

    def _getCrwalerField(self):
        return {"aid": 1, "token": 1}


    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        self.page_data = {}
        field = self._getCrwalerField()
        data = self.db.getItems(self.main_table, {"aid": 145745})

        return data


    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        aid = data["aid"]
        token = data["token"]
        return f"{self.url}/videos/{aid}/{token}/"

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        use_proxy = self.getUseProxy()
        return web.get(url, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=5, use_proxy=self.getUseProxy())

    def _extractTkScript(self, html):
        '''
        解析url video_alt_url， video_url
        '''
        """

        """
        video1_url_pattern = r"video_url: '(.+?)',"
        video1_text_pattern = r"video_url_text: '(.+?)',"
        video2_url_pattern = r"video_alt_url: '(.+?)',"
        video2_text_pattern = r"video_alt_url_text: '(.+?)',"
        video3_url_pattern = r"video_alt_url2: '(.+?)',"
        video3_text_pattern = r"video_alt_url2_text: '(.+?)',"
        list = [
            {"url": video1_url_pattern, "text": video1_text_pattern},
            {"url": video2_url_pattern, "text": video2_text_pattern},
            {"url": video3_url_pattern, "text": video3_text_pattern},
        ]
        data = {}
        for i in list:
            urls = re.search(i["url"], html)
            texts = re.search(i["text"], html)
            if urls and texts:
                data[texts.group(1)] = urls.group(1)
        return data

        # video2_pattern = r"video_url_text: '(.+?)',"
        # video_alt_url_pattern = r"video_alt_url: '(.+?)',"
        # video_url_pattern = r"video_url: '(.+?)',"
        # # 使用re.search方法來對url進行匹配
        # video_alt_url_match = re.search(video_alt_url_pattern, html)
        # video_url_match = re.search(video_url_pattern, html)
        # # 如果匹配成功，則從分組中獲取id和token的值
        # video_alt_url = video_alt_url_match.group(1) if video_alt_url_match else None
        # video_url = video_url_match.group(1) if video_url_match else None
        # return video_alt_url, video_url

    def _getInfo(self, web, crawler_data_index):
        try:
            text = web.text
            data = self._extractTkScript(text)
            logger.info(f"搜索到视频信息 {data}")
            self.crawler_data[crawler_data_index]["video"] = data

        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)


# ************************************** 首页图片爬虫 **************************************
class TkThumbCrawlerProcess(TkCrawlerProcess):
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
        if content == "" or content == None or len(content) < 10:
            msg = "图片大小为0"
            complete = False
        else:
            complete = True
        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, msg, url, re_count)
        return complete

    def _getCrwalerField(self):
        return {"aid": 1, "pic": 1, "token": 1}
    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        field = self._getCrwalerField()
        # 获取没有thumb的数据
        find_update = {"$and": [{"pic": {"$nin": [None, False]}},
                                {"thumb_load": {"$in": [None, False, 0]}}]}
        data = self.db.getItems(self.main_table, find_update, field=field, limit=1000)      # limit = self.count
        return data

    def _getUrl(self, crawler_data_index):
        # data = self.crawler_data[crawler_data_index]
        # return data["pic"]
        # 现在改用cdn获取图片了
        data = self.crawler_data[crawler_data_index]
        aid = data["aid"]
        aid_b = int(aid / 1000) * 1000
        url = f"{self.cdn}/contents/videos_screenshots/{aid_b}/{aid}/preview.jpg"
        # print(url)
        return url

    def _webGet(self, web, url, crawler_data_index):
        return web.get(url, header={}, cookie=self.cookie, web_index=crawler_data_index,
                       timeout=30, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy())


    def _getInfo(self, web, crawler_data_index):
        try:
            content = web.content
            aid = self.crawler_data[crawler_data_index]["aid"]
            if content is not None and len(content) > 1000:
                bucket, thumb = self._getMinioFile(aid)
                up_sucess = self.minio.uploadImage(bucket, thumb, content)
                if up_sucess:
                    # logger.info(f"{aid} 上传thumb成功")
                    self.db.processItem(self.main_table, {"aid": int(aid), "thumb_load": 2}, self.main_id)

        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)


# ************************************** 缩略图片爬虫 **************************************
class TkNailCrawlerProcess(TkCrawlerProcess):
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

    def _getCrwalerField(self):
        return {"aid": 1,  "PicList": 1}

    def _changeCrawlerData(self, data):
        # 将data 按照mpv_images 拆散
        new_data = []
        for item in data:
            if "PicList" in item:
                images = item["PicList"]
                if(len(images)> 50):
                    images = images[:50]

                for index,img in enumerate(images):
                    new_data.append({
                        "_id": item["_id"],
                        "aid": item["aid"],
                        "nail_url": img,
                        "page": index + 1,
                        "page_count": len(images)
                    })
        return new_data

    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        self.page_data = {}
        field = self._getCrwalerField()
        data = self.db.getItems(self.main_table, {"aid": 145745})
        data = self._changeCrawlerData(data)
        # data = self._splitData(data)
        return data

    def _dataCheck(self, index):
        """
        判断数据是否需要网络去爬， 一般都是false 像
        Args:
            index:

        Returns:

        """
        id = self.crawler_data[index][self.main_id]
        page = self.crawler_data[index]["page"]
        bucket, path = self._getMinioFile(id, page)
        if self.minio.existImage(bucket, path):
            self._checkImages(index)
            return True
        else:
            return False

    def _checkImages(self, index):
        data =self.crawler_data[index]
        id = data[self.main_id]
        page_count = data["page_count"]
        bucket, path = self._getMinioFile(id, 0)
        folder = path.rsplit('/', 1)[0] if '/' in path else path
        file_count = self.minio.countFile(bucket, folder)
        if file_count >= page_count:
            logger.info(f"{self.getName()} {id} 完成所有图片")
            self.db.processItem(self.main_table, {self.main_id: data[self.main_id], "nail_load": 2}, self.main_id)

    def _getUrl(self, crawler_data_index):
        # data = self.crawler_data[crawler_data_index]
        #
        # return data["nail_url"]
        data = self.crawler_data[crawler_data_index]
        aid = data["aid"]
        aid_b = int(aid / 1000) * 1000
        page = data["page"]
        url = f"{self.cdn}/contents/videos_sources/{aid_b}/{aid}/screenshots/{page}.jpg"
        return url

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        return web.get(url, header={}, cookie=self.cookie, web_index=crawler_data_index,
                       timeout=30, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy())

    def _getInfo(self, web, index):
        try:
            data = self.crawler_data[index]
            id = self.crawler_data[index][self.main_id]
            page = self.crawler_data[index]["page"]

            content = web.content
            if content is not None and len(content) > 100 and "html" not in str(content):
                bucket, path = self._getMinioFile(id, page)
                upload_success = self.minio.uploadImage(bucket, path, content)
                if upload_success:
                    logger.info(f"{id} 第{page}页完成")
                    self._checkImages(index)
                else:
                    logger.warning(f"{id}  上传thumb失败")
                    self._setRunData(index, httpType.TYPE_UNkNOW, f"id={id}, 错误的图片")
            else:
                self._setRunData(index, httpType.TYPE_UNkNOW, f"id={id}, 图片过小")
        except Exception as error:
            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")


# ************************************** 内容图片爬虫 **************************************
class TkImagesCrawlerProcess(TkCrawlerProcess):
    pass


# ************************************** 评论页爬虫 **************************************
class TkCommentsCrawlerProcess(TkCrawlerProcess):
    pass


# ************************************** 下载器 **************************************
class TkDownCrawlerProcess(TkCrawlerProcess):
    pass
