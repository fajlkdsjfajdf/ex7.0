# Jb
from crawler.crawlerProcess import CrawlerProcess
from config.configParse import config
from networking import httpType
from lxml import etree
from util import typeChange
import json
import re
from util import timeFormat
from logger.logger import logger
from bson.objectid import ObjectId
from lxml import etree
from datetime import datetime
from plugin.javbook import JavBookTool
from networking.proxy import ProxyState



# ************************************** list爬虫 **************************************
class JbCrawlerProcess(CrawlerProcess):

    def _load(self):
        super()._load()
        self.cdn = config.read(self.prefix, "cdn")

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
        if "Javbooks" in txt:
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

        data1 = [{"page": p, "type": "serchinfo_censored"} for p in range(1, 50 + 1)]      # 有码
        data2 = [{"page": p, "type": "serchinfo_uncensored"} for p in range(1, 50 + 1)]    # 无码

        # 全部检索
        
        # data1= [{"page": p, "type": "serchinfo_censored"} for p in range(1, 9377 + 1)]      # 有码
        # data2 = [{"page": p, "type": "serchinfo_uncensored"} for p in range(1, 1798 + 1)]  # 有码
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
            data.append({"page": 1, "type": "serch_censored", "search": id})
            data.append({"page": 1, "type": "serch_uncensored", "search": id})

        return data

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
            # https://jbk002.cc/serch_censored/SSIS-935/serialall_1.htm
            url = f"{self.url}/{search_type}/{search}/serialall_1.htm"
        else:
            # //https://jbk002.cc/serchinfo_censored/topicsall/topicsall_4.htm
            url = f"{self.url}/{search_type}/nouse/topicsall_{page}.htm"
        return url

    def _webGet(self, web, url, crawler_data_index):
        """
        _webGet 获取web请求
        :param web:
        :param url:
        :param crawler_data_index:
        :return:
        """
        cookie = config.read(self.prefix, "cookie")
        return web.get(url, header=self.header, cookie=cookie, web_index=crawler_data_index,
                               timeout=30, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy(), proxy_state=ProxyState.INCLUD_DOMESTIC)
    
        # return web.get(url, header=self.header, cookie=cookie, web_index=crawler_data_index,
        #                     timeout=30, retry_interval=3, retry_limit=3, use_proxy=False, proxy_state=ProxyState.INCLUD_DOMESTIC)



    def _getInfo(self, web, crawler_data_index):
        try:
            tree = web.tree

            cralwer_data = self.crawler_data[crawler_data_index]
            page = cralwer_data["page"]
            search_type = cralwer_data["type"]
            xi = 0
            if search_type in ["serchinfo_censored", "serch_censored"]:
                search_type = "有码"
            else:
                search_type = "无码"
                xi = 1
            id_list = []
            data = []


            for item in tree.xpath(".//div[@id='PoShow_Box']/div[@class='Po_topic' or @class='Po_u_topic']"):
                url = ''.join(item.xpath(".//a/@href")).strip()
                if "content" in url:
                    aid = url.split("/")[-1].replace(".htm", "")
                    if typeChange.isNumber(aid):
                        aid = int(aid)
                        if aid not in id_list:
                            xid = xi * 10000000 + aid

                            id_list.append(aid)
                            data.append({
                                "xid": xid,
                                "aid": aid,
                                "type": search_type,
                                "index_update": datetime.now()
                            })
            if(data):
                self.crawler_data[crawler_data_index]["info"]= data
                self.db.processItems(self.main_table, data, [self.main_id, "type"])
        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)


# ************************************** info爬虫 **************************************
class JbInfoCrawlerProcess(JbCrawlerProcess):
    def _getCrwalerField(self):
        return {"aid": 1, "xid":1,  "type": 1}

    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        field = self._getCrwalerField()
        # 获取没有info的数据
        find_update1 = {}
        # find_update1 = {}
        limit = 100
        # limit = 999999
        data = self.db.getItems(self.main_table, find_update1, field=field, limit=limit, order="index_update",
                                      order_type=-1)  # limit = 1000
        # find_update2 = {"$or": [
        #     {"info_update": {"$in": [None, False]}},
        #     {"title": ""},
        #     {"tags": { "$in": ["0"] }}
        # ]}
        find_update2 = {"$or": [
            {"info_update": {"$in": [None, False]}},
            {"title": ""}
        ]}
        # 获取没有内容的记录
        data2 = self.db.getItems(self.main_table, find_update2, field=field, limit=100000, order="aid", order_type=-1)
        data = typeChange.vstack("_id", data, data2)
        return data

        # 获取指定记录
        # find = {"fanhao": "FLAV-346"}
        # data = self.db.getItems(self.main_table, find, field=field, limit=10)
        # return data



    def getCrawlerDataById(self, id_list):
        """
        通过id列表获取对应的crawler数据 重写
        Args:
            id_list:
        Returns:
        """
        self._load()
        # 先使用indexcrawler获取id数组
        crawler = JbCrawlerProcess({})
        crawler_data = crawler.getCrawlerDataById(id_list)
        if len(crawler_data) > 0:
            crawler.setCrawlerData(crawler_data)
            crawler.setUseProxy(False)
            crawler.run()
            data = crawler.getCrawlerData()
            info_list = []
            for item in data:
                if "info" in item:
                    info_list.append(item["info"][0])
            # print(info_list)
            return info_list
            #
            # data = []
            # for id in id_list:
            #     data.append({"page": 1, "type": "serchinfo_censored", "search": id})
            #     data.append({"page": 1, "type": "serchinfo_uncensored", "search": id})
            # return id_list
        return []

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        search_type = data["type"]
        aid = data["aid"]
        if search_type == "有码":
            search_type = "content_censored"
        else:
            search_type = "content_uncensored"
        # https://jbk002.cc/content_uncensored/93129.htm
        url = f"{self.url}/{search_type}/{aid}.htm"
        return url


    def _webGet(self, web, url, crawler_data_index):
        cookie = config.read(self.prefix, "cookie")
        return web.get(url, header=self.header, cookie=cookie,  web_index=crawler_data_index,
                            timeout=30, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy(), proxy_state=ProxyState.INCLUD_DOMESTIC)
    
        # return web.get(url, header=self.header, cookie=cookie,  web_index=crawler_data_index,
        #                 timeout=30, retry_interval=3, retry_limit=3, use_proxy=False, proxy_state=ProxyState.INCLUD_DOMESTIC)

    def _getInfo(self, web, crawler_data_index):
        try:
            tree = web.tree
            data_dict = {}
            search_type = self.crawler_data[crawler_data_index]["type"]

            data_dict['xid'] = self.crawler_data[crawler_data_index]["xid"]
            data_dict['aid'] = self.crawler_data[crawler_data_index]["aid"]
            data_dict['title'] = ''.join(tree.xpath(".//div[@id='title']/b/text()")).strip()
            data_dict['fanhao'] = ''.join(tree.xpath(
                ".//div[@class='infobox']/b[contains(text(),'番號')]/following-sibling::font[1]/a/text()")).strip()
            if data_dict['fanhao'] == "":
                data_dict['fanhao'] = ''.join(tree.xpath(
                    ".//div[@class='infobox']/b[contains(text(),'番號')]/following-sibling::font[1]/text()")).strip()
            data_dict['Length'] = ''.join(tree.xpath(
                ".//div[@class='infobox']/b[contains(text(),'影片時長')]/../text()")).strip()
            try:
                data_dict['ReleaseDate'] = datetime.strptime(''.join(tree.xpath(
                ".//div[@class='infobox']/b[contains(text(),'發行時間')]/../text()")).strip(), '%Y-%m-%d')
            except:
                data_dict['ReleaseDate'] = datetime.strptime("1900-01-01", '%Y-%m-%d')
            data_dict['Director'] = ''.join(tree.xpath(
                ".//div[@class='infobox']/b[contains(text(),'導演')]/following-sibling::a[1]/text()")).strip()
            data_dict['Studio'] =  ''.join(tree.xpath(
                ".//div[@class='infobox']/b[contains(text(),'製作商')]/following-sibling::a[1]/text()")).strip()
            data_dict['Label'] = ''.join(tree.xpath(
                ".//div[@class='infobox']/b[contains(text(),'發行商')]/following-sibling::a[1]/text()")).strip()
            data_dict['Series'] =''.join(tree.xpath(
                ".//div[@class='infobox']/b[contains(text(),'系列')]/following-sibling::a[1]/text()")).strip()
            data_dict['pic_l'] = ''.join(tree.xpath(".//div[@class='info_cg']/img[1]/@src"))

            data_dict['PicList'] = tree.xpath(".//div[@class='hvr-grow']//a/@href")
            tags = [search_type]
            for a in tree.xpath(".//div[@class='infobox']/b[contains(text(),'影片類別')]/../a"):
                tag = a.xpath("./text()")
                if len(tag)> 0:
                    tag = tag[0]
                    if tag == "0":
                        href = a.xpath("./@href")[0]
                        find = re.search(r'/(\d+)/', href)
                        if find:
                            tag_code = find.group(1)
                            jbt = JavBookTool()
                            tag = jbt.getTag(tag_code)

                    tags.append(tag)

            
            # data_dict['tags'] = typeChange.toJianti(tree.xpath(
            #     ".//div[@class='infobox']/b[contains(text(),'影片類別')]/../a/text()"))

            data_dict['info_update'] = datetime.now()
            data_dict['stars'] = []
            stars = []
            for star in tree.xpath(".//div[@class='av_performer_cg_box']"):
                star_name = ''.join(star.xpath("./div/a/text()"))
                star_pic = ''.join(star.xpath("./img/@src"))
                if star_name:
                    imgload = 1
                    if "nowprinting" in star_pic:
                        imgload = 0
                    stars.append({"StarName": star_name, "StarPic": star_pic, "ImgLoad": imgload})
                    data_dict['stars'].append(star_name)

            tags += [i["StarName"] for i in stars]

            data_dict['tags'] = tags
            if(data_dict):
                self.db.processItems(f"{self.prefix.lower()}-stars", stars, "StarName")
                self.db.processItems(self.main_table, data_dict, self.main_id)
        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)



# ************************************** 章节爬虫 **************************************
class JbChapterCrawlerProcess(JbCrawlerProcess):
    pass


# ************************************** 图片列表爬虫 **************************************
class JbPageCrawlerProcess(JbCrawlerProcess):
    pass


# ************************************** 首页图片爬虫 **************************************
class JbThumbCrawlerProcess(JbCrawlerProcess):
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
        return {"aid": 1, "fanhao": 1, "pic_l": 1, "type": 1, "xid": 1}

    def getCrawlerDataById(self, id_list):
        """
        通过id列表获取对应的crawler数据 重写
        Args:
            id_list:
        Returns:
        """

        self._load()
        id_list = typeChange.convertObjectId(id_list)
        if id_list:
            find = {"_id": {"$in": id_list}}
            data = self.db.getItems(self.main_table, find, field=self._getCrwalerField(), limit=9999999)

            data = sorted(data,
                          key=lambda x: id_list.index(ObjectId(x['_id'])) if ObjectId(x['_id']) in id_list else len(
                              id_list))
            data = self._changeCrawlerData(data)
            return data
        else:
            return {}
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

        # find = {"aid": 347344}
        # data = self.db.getItems(self.main_table, find, field=field, limit=100)
        # return data

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        if "pic_l" in data:
            pic = str(data['pic_l'])
            if pic.startswith("http"):
                url = pic
            else:
                url = f"{self.url}/{pic}"
            url = typeChange.replace_domain(url, self.cdn)
            # url = url.replace("jbk002", "jbk003")

            return url
        else:
            return None

    def _webGet(self, web, url, crawler_data_index):
        if "pics.dmm.co.jp" in url:
            # 使用海外代理
            return web.get(url, header=self.header, timeout=30, retry_interval=0, retry_limit=1,
                           proxy_state=ProxyState.INCLUD_MYFOREIGN)
        else:

            return web.get(url, header=self.header, cookie=self.cookie, web_index=crawler_data_index,
                           timeout=30, retry_interval=3, retry_limit=3, use_proxy=self.getUseProxy())

    def _getInfo(self, web, crawler_data_index):
        try:
            url = web.url
            if "now_printing" not in url:
                content = web.content
                aid = self.crawler_data[crawler_data_index]["aid"]
                xid = self.crawler_data[crawler_data_index]["xid"]
                fanhao = self.crawler_data[crawler_data_index]["fanhao"]
                if content is not None and len(content) > 1000:
                    bucket, thumb = self._getMinioFile(xid)

                    up_sucess = self.minio.uploadImage(bucket, thumb, content)
                    if up_sucess:
                        logger.info(f"{aid} 上传thumb成功")
                        self.db.processItem(self.main_table, {"xid": xid, "thumb_load": 2}, self.main_id)

        except Exception as error:
            msg = f"{self.getName()} 获取第{crawler_data_index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(crawler_data_index, httpType.TYPE_UNkNOW, msg)


# ************************************** 缩略图片爬虫 **************************************
class JbNailCrawlerProcess(JbCrawlerProcess):
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
        return {"aid": 1, "PicList": 1, "xid": 1}

    def getCrawlerDataById(self, id_list):
        """
        通过id列表获取对应的crawler数据 重写
        Args:
            id_list:
        Returns:
        """

        self._load()
        id_list = typeChange.convertObjectId(id_list)
        if id_list:
            find = {"_id": {"$in": id_list}}
            data = self.db.getItems(self.main_table, find, field=self._getCrwalerField(), limit=9999999)

            data = sorted(data,
                          key=lambda x: id_list.index(ObjectId(x['_id'])) if ObjectId(x['_id']) in id_list else len(
                              id_list))
            data = self._changeCrawlerData(data)
            return data
        else:
            return {}
    def _changeCrawlerData(self, data):
        # 将data 按照mpv_images 拆散
        new_data = []
        for item in data:
            if "PicList" in item:
                images = item["PicList"]
                if (len(images) > 50):
                    images = images[:50]

                for index, img in enumerate(images):
                    new_img = typeChange.replace_domain(img, self.cdn)
                    new_data.append({
                        "_id": item["_id"],
                        "aid": item["aid"],
                        "xid": item["xid"],
                        "nail_url": new_img,
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
        data = self.db.getItems(self.main_table, {"aid": 347344})
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
                    logger.warning(f"{id}  上传thumbNail失败")
                    self._setRunData(index, httpType.TYPE_UNkNOW, f"id={id}, 错误的图片")
            else:
                self._setRunData(index, httpType.TYPE_UNkNOW, f"id={id}, 图片过小")
        except Exception as error:
            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")


# ************************************** 内容图片爬虫 **************************************
class JbImagesCrawlerProcess(JbCrawlerProcess):
    pass


# ************************************** 评论页爬虫 **************************************
class JbCommentsCrawlerProcess(JbCrawlerProcess):
    pass


# ************************************** 下载器 **************************************
class JbDownCrawlerProcess(JbCrawlerProcess):
    pass
