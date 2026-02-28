# Jv
from crawler.crawlerProcess import CrawlerProcess
from config.configParse import config
from networking import httpType
from lxml import etree
from util import typeChange
import json
from util import timeFormat
from logger.logger import logger
from bson.objectid import ObjectId
import re
from datetime import datetime
from networking.proxy import ProxyState



# ************************************** list爬虫 **************************************
class JvCrawlerProcess(CrawlerProcess):

    def _load(self):
        super()._load()

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
        if "JavBus" in txt:
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
        """
        _getCrawlerData 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """

        data1 = [{"page": p, "type": "censored"} for p in range(1, 100 + 1)]
        data2 = [{"page": p, "type": "uncensored"} for p in range(1, 100 + 1)]
        return data1 + data2

    def getCrawlerDataById(self, id_list):
        """
        通过id列表获取对应的crawler数据 重写
        Args:
            id_list:
        Returns:
        """
        self._load()
        data = []
        for id in id_list:
            data.append({"page": 1, "type": "censored", "search": id})
            data.append({"page": 1, "type": "uncensored", "search": id})
        return id_list

    def _getUrl(self, crawler_data_index):
        """
        _getUrl 获取网址
        :param crawler_data_index:
        :return:
        """
        data = self.crawler_data[crawler_data_index]
        page = data["page"]
        search_type = data["type"]
        search = data.get("search", "")
        url = ""
        if search:
            pass
        else:
            if search_type == "censored":   # 有码搜索
                url = f"{self.url}/page/{page}"
            else:
                url = f"{self.url}/uncensored/page/{page}"
        return url

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



    def _getInfo(self, web, crawler_data_index):
        try:
            data = []
            tree = web.tree
            search_type = self.crawler_data[crawler_data_index]["type"]
            if search_type == "censored":   # 有码搜索
                search_type = "有码"
            else:
                search_type = "无码"
            for item in tree.xpath(".//a[@class='movie-box']"):
                url = ''.join(item.xpath("./a/@href")).strip()
                url = ''.join(item.xpath("./@href")).strip()
                aid = url.split("/")[-1]
                data.append({"aid": aid, "type": search_type, "index_update": datetime.now()})
            if(data):
                self.db.processItems(self.main_table, data, self.main_id)
        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)


# ************************************** info爬虫 **************************************
class JvInfoCrawlerProcess(JvCrawlerProcess):
    def _getCrwalerField(self):
        return {"aid": 1}

    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        field = self._getCrwalerField()
        # 获取没有info的数据
        find_update1 = {}
        # find_update1 = {}
        limit = 1000
        # limit = 999999
        data = self.db.getItems(self.main_table, find_update1, field=field, limit=limit, order="index_update",
                                      order_type=-1)  # limit = 1000
        find_update2 = {"info_update": {"$in": [None, False]}}
        # 获取没有内容的记录
        data2 = self.db.getItems(self.main_table, find_update2, field=field, limit=limit)
        data = typeChange.vstack("_id", data, data2)
        return data

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        return f"{self.url}/{data['aid']}"

    def _webGet(self, web, url, crawler_data_index):
        return web.get(url, header=self.header, cookie=self.cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy())

    def _getInfo(self, web, crawler_data_index):
        try:
            tree = web.tree
            # print(web.text)
            data_dict = {}
            data_dict['aid'] = self.crawler_data[crawler_data_index]["aid"]
            data_dict['title'] = ''.join(tree.xpath(".//div[@class='container']/h3/text()")).strip()
            data_dict['fanhao'] = ''.join(tree.xpath(
                ".//div[@class='container']//p/span[contains(text(),'識別碼')]/following-sibling::span[1]/text()")).strip()
            data_dict['Length'] = ''.join(tree.xpath(
                ".//div[@class='container']//span[contains(text(),'長度')]/../text()")).replace("分鐘", "").strip()
            try:
                data_dict['ReleaseDate'] = datetime.strptime(''.join(tree.xpath(
                    ".//div[@class='container']//span[contains(text(),'發行日期')]/../text()")).strip(), '%Y-%m-%d')
            except:
                data_dict['ReleaseDate'] = datetime.strptime("1900-01-01", '%Y-%m-%d')
            data_dict['Studio'] = ''.join(tree.xpath(
                ".//div[@class='container']//span[contains(text(),'製作商')]/following-sibling::a[1]/text()")).strip()
            data_dict['Label'] = ''.join(tree.xpath(
                ".//div[@class='container']//span[contains(text(),'發行商')]/following-sibling::a[1]/text()")).strip()
            data_dict['pic_l'] = ''.join(tree.xpath(".//a[@class='bigImage']/img[1]/@src"))
            data_dict['PicList'] = tree.xpath(".//div[@id='sample-waterfall']/a/@href")


            data_dict['tags'] = tree.xpath(".//span[@class='genre']//a/text()")

            data_dict['stars'] = []
            for star in tree.xpath(".//p[@class='star-show']/following-sibling::p[1]/span"):
                star_name = ''.join(star.xpath("./a/text()"))
                star_url = ''.join(star.xpath("./a/@href"))
                if star_url != "":
                    star_pic = star_url.split("/")[-1]
                    star_pic = f"/pics/actress/{star_pic}_a.jpg"
                else:
                    star_pic = ""
                data_dict['stars'].append({"StarName": star_name, "StarPic": star_pic})

            data_dict['info_update'] = datetime.now()
            if(data_dict):
                self.db.processItems(self.main_table, data_dict, self.main_id)
        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)



# ************************************** 章节爬虫 **************************************
class JvChapterCrawlerProcess(JvCrawlerProcess):
    pass


# ************************************** 图片列表爬虫 **************************************
class JvPageCrawlerProcess(JvCrawlerProcess):
    pass


# ************************************** 首页图片爬虫 **************************************
class JvThumbCrawlerProcess(JvCrawlerProcess):
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
        return {"aid": 1, "pic_l": 1}

    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        field = self._getCrwalerField()
        # 获取没有thumb的数据
        find_update = {"$and": [{"pic_l": {"$nin": [None, False]}},
                                {"thumb_load": {"$in": [None, False, 0]}}]}
        data = self.db.getItems(self.main_table, find_update, field=field, limit=1000)  # limit = self.count
        return data

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        pic = str(data['pic_l'])
        if pic.startswith("http"):

            url = pic
        else:
            url = f"{self.url}/{pic}"
        return url

    def _webGet(self, web, url, crawler_data_index):
        if "pics.dmm.co.jp" in url:
            # 使用海外代理
            return web.get(url, header=self.header, timeout=30, retry_interval=0, retry_limit=1,
                           proxy_state = ProxyState.INCLUD_MYFOREIGN)
        else:

            return web.get(url, header=self.header, cookie=self.cookie, web_index=crawler_data_index,
                           timeout=30, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy())

    def _getInfo(self, web, crawler_data_index):
        try:
            content = web.content
            aid = self.crawler_data[crawler_data_index]["aid"]
            if content is not None and len(content) > 1000:
                bucket, thumb = self._getMinioFile(aid)
                up_sucess = self.minio.uploadImage(bucket, thumb, content)
                if up_sucess:
                    logger.info(f"{aid} 上传thumb成功")
                    self.db.processItem(self.main_table, {"aid": aid, "thumb_load": 2}, self.main_id)

        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)


# ************************************** 缩略图片爬虫 **************************************
class JvNailCrawlerProcess(JvCrawlerProcess):
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
        return {"aid": 1, "PicList": 1}

    def _changeCrawlerData(self, data):
        # 将data 按照mpv_images 拆散
        new_data = []
        for item in data:
            if "PicList" in item:
                images = item["PicList"]
                if (len(images) > 50):
                    images = images[:50]

                for index, img in enumerate(images):
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
        data = self.db.getItems(self.main_table, {"aid": "CAWD-599"})
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
        data = self.crawler_data[index]
        id = data[self.main_id]
        page_count = data["page_count"]
        bucket, path = self._getMinioFile(id, 0)
        folder = path.rsplit('/', 1)[0] if '/' in path else path
        file_count = self.minio.countFile(bucket, folder)
        if file_count >= page_count:
            logger.info(f"{self.getName()} {id} 完成所有图片")
            self.db.processItem(self.main_table, {self.main_id: data[self.main_id], "nail_load": 2}, self.main_id)

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        return data["nail_url"]

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        if "pics.dmm.co.jp" in url:
            # 使用海外代理
            return web.get(url, header=self.header, timeout=30, retry_interval=0, retry_limit=1,
                           proxy_state=ProxyState.INCLUD_MYFOREIGN)
        else:

            return web.get(url, header=self.header, cookie=self.cookie, web_index=crawler_data_index,
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
class JvImagesCrawlerProcess(JvCrawlerProcess):
    pass


# ************************************** 评论页爬虫 **************************************
class JvCommentsCrawlerProcess(JvCrawlerProcess):
    pass


# ************************************** 下载器 **************************************
class JvDownCrawlerProcess(JvCrawlerProcess):
    pass
