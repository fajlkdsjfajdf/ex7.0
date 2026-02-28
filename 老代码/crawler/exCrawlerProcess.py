# e绅士的爬虫库
import time

from crawler.crawlerProcess import CrawlerProcess
from config.configParse import config
from networking import httpType
from lxml import etree
from util import typeChange
import json
from datetime import datetime, timedelta
from datetime import  time as time1
from logger.logger import logger
from networking.webRequest import WebRequest
from bson.objectid import ObjectId
import re
from networking.proxy import ProxyState
from plugin.domainResolver import DomainResolver


# ************************************** list爬虫 **************************************
class ExCrawlerProcess(CrawlerProcess):

    def _load(self):
        super()._load()
        self.ips = config.read(self.prefix, "ips")


    def _urlSuccess(self, url):
        s = False
        for ip in self.ips:
            if ip in url:
                s = True
                break
        if "hentai" in url:
            s = True
        return s

    def _txtSuccess(self, txt):
        if "You don't have permission to access" in txt :
            return False
        elif "Backend fetch failed" in txt:
            return False
        return True

    def _httpComplete(self, response, url, kwargs):
        """
        httpComplete
        判断http是否真的完成，即使返回200，有时也会被墙屏蔽
        不要直接调用此方法，将此方法传递给webrequest使用
        :return:
        """
        txt = response.get("text", "")
        url = response.get("url", "")
        complete = True
        msg = "获取成功"
        if "Your ip" in txt or "Your IP" in txt:  # ip限制
            msg = f"{url} ip被限制"
            complete = False
        elif "No hits found" in txt:  # 没页了
            msg = f"{url} 没有页了"
            complete = False
        elif txt is None or txt == "":
            msg = f"{url} 空页"
            complete = False
        elif self._urlSuccess(url) == False:
            msg = f"{url} 不正常的页"
            complete = False
        elif self._txtSuccess(txt) == False:
            msg = f"{url} 代理问题"
            complete = False

        re_count = 0
        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, msg, url, re_count)
        return complete



    def _getCrawlerData(self):
        # 提取第1000位大的gid数据
        max_gid_data = self.db.getItems(self.main_table, {}, skip=20000, order="gid", order_type=-1, field={"gid": 1})
        if(len(max_gid_data) > 0):
            self.start_gid = int(max_gid_data[0]["gid"])
        else:
            self.start_gid = 1

        # self.start_gid = 1  # 这句话表示全文索引, 平常注释掉

        end_gid = self.start_gid + 100000
        # 通过查找ex绅士的首页获取当前最大的gid
        web = WebRequest()
        web_success = web.get(self.url, header=self.header, ips=self.ips,
                              cookie=self.cookie, timeout=30, retry_interval=1, retry_limit=10)
        if web_success:
            end_gid = self._getMaxGid(web.tree)


        # 让start_gid 向前推进100w 并均等的分成 thread的份数
        data = range(self.start_gid, end_gid)
        logger.info(f"ex-list查询最大gid为: {end_gid}")
        return data

    def _getUrl(self, value):
        # ex的索引页不用关心crawler_data  特例
        if self.mode == "search":
            self.start_gid = 1
            return f"{self.url}/?f_search={self.search_txt}"
        else:
            prev_gid = value + self.start_gid
            return f"{self.url}?prev={prev_gid}&f_cats=640"




    def _webGet(self, web, url, index):

        return web.get(url, header=self.header, ips=self.ips, cookie=self.cookie, web_index=index,
                               timeout=30, retry_interval=3, retry_limit=10, use_proxy=self.getUseProxy(),
                       proxy_state=ProxyState.MY_PROXY)

    def withDataIndex(self, index):
        # 根据index 获取在data_index 中的序号
        index = int(index)
        for i in self.data_index:
            item = self.data_index[i]
            start = item["start"]
            end = item["end"]
            if index>=start and index< end:
                return i

    def _webError(self, index):
        data_index_num = self.withDataIndex(index)
        now_value = self.data_index[data_index_num]["end"]
        self.data_index[data_index_num]["value"] = now_value

    def _getMaxGid(self, tree):
        try:
            max_gid = 0
            for a in tree.xpath(".//a"):
                url = "".join(a.xpath("./@href"))
                pattern = "https://(ex|e-)hentai.org/g/\d*/\w*"
                match = re.search(pattern, url)
                if match:
                    values = url.split('/')
                    if (len(values) > 5 and values[5] != None and values[5] != ""):
                        gid = int(values[4])
                        token = values[5]
                        max_gid = gid if max_gid < gid else max_gid
                    else:
                        logger.error(f"{values[4]}没有token")
            return max_gid
        except Exception as e:
            logger.error(f"excrawler获取最大gid错误 {e}")
        return 0

    def _extract_gid(self, url):
        match = re.search(r'/g/(\d+)/', url)
        if match:
            return match.group(1)
        return None

    def _getInfo(self, web, index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        # print(web.text)
        data = []
        try:
            tree = web.tree
            max_gid = 0
            for a in tree.xpath(".//a"):
                url = "".join(a.xpath("./@href"))
                pattern = "https://(ex|e-)hentai.org/g/\d*/\w*"
                match = re.search(pattern, url)
                if match:
                    values = url.split('/')
                    if (len(values) > 5 and values[5] != None and values[5] != ""):
                        gid = int(values[4])
                        token = values[5]
                        data.append({"gid": gid, "token": token})
                        max_gid = gid if max_gid < gid else max_gid
                    else:
                        logger.error(f"{values[4]}没有token")
            self.db.processItems(self.main_table, data, self.main_id)
            # 将当前运行的value 修改
            now_value = (max_gid - self.start_gid - 1)
            now_value = now_value if now_value>1 else 1
            data_index_num = self.withDataIndex(index)
            if max_gid <= 0:
                # 没有找到新gid
                now_value = self.data_index[data_index_num]["end"]
            self.data_index[data_index_num]["value"] =  now_value
            if self.mode == "search":
                gids = [i["gid"] for i in data]
                d = self.db.getItems(self.main_table, {"gid": {"$in": gids}}, field={"gid": 1, "token": 1}, limit=500)
                # print(d)
                self.crawler_data[index] = {"data": d}
            # print(self.data_index[index])

        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            logger.warning(msg)
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)



# ************************************** info爬虫 **************************************
class ExInfoCrawlerProcess(ExCrawlerProcess):
    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        field = {"gid": 1, "token": 1}
        # 获取没有info的数据
        find_update1 = {"$and": [{"update_info": {"$in": [None, False]}}, {"gid": {"$nin": [None, False]}},
                                 {"token": {"$nin": [None, False]}}]}
        data1 = self.db.getItems(self.main_table, find_update1, field=field, limit=10000)  # limit = 1000

        # 获取需要刷新的数据
        find_update2 = {}
        data2 = self.db.getItems(self.main_table, find_update2, field=field, limit=self.info_count, order="gid",
                                       order_type=-1)
        # 合并查找项
        data = typeChange.vstack("gid", data1, data2)
        # 分割为20条记录每份的数组
        data = typeChange.splitList(data, 20)
        logger.info(f"exinfo 需要爬取{len(data)}条数据")
        return data

    def _changeCrawlerData(self, data):
        return typeChange.splitList(data, 20)

    def _getUrl(self, crawler_data_index):
        return f"{self.url}/api.php"

    def _webGet(self, web, url, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        gidlist = []
        for item in data:
            gidlist.append([item["gid"], item["token"]])
        api_data = {"method": "gdata", "gidlist": gidlist}
        data = json.dumps(api_data)
        return web.post(url, data, header=self.header, cookie=self.cookie, ips=self.ips, web_index=crawler_data_index,
                        timeout=30, retry_interval=3, retry_limit=40, use_proxy=self.getUseProxy())

    def _getInfo(self, web, index):
        try:
            json_data = json.loads(web.text)
            if "gmetadata" in json_data:
                data = json_data["gmetadata"]
                data_in = []
                for item in data:
                    if "error" not in str(item):
                        item["gid"] = int(item["gid"])
                        item["filecount"] = int(item["filecount"])
                        item["update_info"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        data_in.append(item)
                self.db.processItems(self.main_table, data_in, self.main_id)
                # self.crawler_data[index]["data"] = data_in
            else:
                self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {web.text}")
        except Exception as error:
            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取info出错 {error}")


# ************************************** 章节爬虫 **************************************
class ExChapterCrawlerProcess(ExCrawlerProcess):
    pass

# ************************************** 图片列表爬虫 **************************************
class ExPageCrawlerProcess(ExCrawlerProcess):
    def _httpComplete(self, response, url, kwargs):
        """
           httpComplete
           判断http是否真的完成，即使返回200，有时也会被墙屏蔽
           不要直接调用此方法，将此方法传递给webrequest使用
           :return:
           """
        txt = response.get("text", "")
        url = response.get("url", "")
        complete = True
        msg = "获取成功"
        if "Your ip" in txt or "Your IP" in txt:  # ip限制
            msg = f"{url} ip被限制"
            complete = False
        elif txt is None or txt == "":
            msg = f"{url} 空页"
            complete = False
        elif self._urlSuccess(url) == False:
            msg = f"{url} 不正常的页"
            complete = False
        elif self._txtSuccess(txt) == False:
            msg = f"{url} 代理问题"
            complete = False
        elif "hentai" not in txt and "Gallery not found" not in txt:
            msg = f"{url} 没有关键词 hentai"
            complete = False

        re_count = 0
        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, msg, url, re_count)
        return complete

    def _getCrwalerField(self):
        return {"gid": 1, "token": 1, "filecount": 1, "thumb": 1, "update_images": 1}

    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        self.page_data = {}
        field = self._getCrwalerField()
        # 获取没有page的数据
        find_update = {"$or": [
            {"$and": [
                {"update_images": {"$in": [None, False]}},
                {"update_info": {"$nin": [None, False]}}
            ]},
        ]}

        data = self.db.getItems(self.main_table, find_update, field=field, limit=1000)  # limit = 1000
        # data = self._splitData(data)
        return data

    def _dataCheck(self, index):
        """
        判断数据是否需要网络去爬， 一般都是false 像
        Args:
            index:

        Returns:

        """
        gid = self.crawler_data[index]["gid"]

        if "update_images" in self.crawler_data[index]:
            update_images = self.crawler_data[index]["update_images"]
            if (datetime.now() - update_images) < timedelta(hours=15):
                # 低于3小时不用更新
                logger.info(f"{gid} 近期更新过page")
                return True

        return False

    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        return f"{self.url}/mpv/{data['gid']}/{data['token']}/"

    def _webGet(self, web, url, crawler_data_index):
        
        return web.get(url, header=self.header, cookie=self.cookie, ips=self.ips, web_index=crawler_data_index,
                       timeout=30, retry_interval=3, retry_limit=10, use_proxy=self.getUseProxy())

    def _isRemove(self, text):
        remove_texts = []
        remove_texts.append("This gallery is unavailable due to")
        remove_texts.append("This gallery has been removed or is unavailable")
        remove_texts.append("Gallery not found")
        for r in remove_texts:
            if r in text:
                return True
        return False

    def _getInfo(self, web, crawler_data_index):
        try:
            if self._isRemove(web.text) == False:
                text = web.text
                gid = self.crawler_data[crawler_data_index]["gid"]
                # thumb = self.crawler_data[crawler_data_index]["thumb"]
                pattern1 = r'var\s+mpvkey\s*=\s*"(\w+)";'
                pattern2 = r'var\s+imagelist\s*=\s*(.+);'
                match = re.search(pattern1, text)
                if match:
                    mpvkey = match.group(1)
                    match = re.search(pattern2, text)
                    if match:
                        list_json = match.group(1).strip()
                        list_data = json.loads(list_json)
                        data = []
                        for i, x in enumerate(list_data):
                            t = typeChange.extract_url(x["t"])
                            if t:
                                data.append({"k": x["k"], "t": t, "page": i + 1})

                        info = {
                            "gid": int(gid),
                            "mpv": mpvkey,
                            "mpv_images": data,
                            "update_images": datetime.now()
                        }
                        self.crawler_data[crawler_data_index]["images"] = data

                        # print(gid)
                        self._setRunData(crawler_data_index, httpType.TYPE_ALLCOM, f"{gid} 已更新mpv", web.url)
                        self.db.processItems(self.main_table, {"gid": info["gid"], "update_images": info["update_images"]}, self.main_id)
                        self.db.processItems(self.list_table, info, self.main_id)
                    else:
                        self._setRunData(crawler_data_index, httpType.TYPE_HTTPERR, f"gid={gid} mpvkey不存在")
                else:
                    self._setRunData(crawler_data_index, httpType.TYPE_HTTPERR, f"gid={gid} imagelist 不存在")
            else:
                gid = self.crawler_data[crawler_data_index]["gid"]
                self.db.removeOneById(self.main_table, {"gid": int(gid)})
                self._setRunData(crawler_data_index, httpType.TYPE_HTTPERR, f"gid={gid} 项目已被删除")
                logger.info(f"{self.prefix}  {gid} 项目已被删除")
        except Exception as error:
            logger.error(f"{self.prefix}获取图片列表错误 {error}")


# ************************************** 首页图片爬虫 **************************************
class ExThumbCrawlerProcess(ExCrawlerProcess):
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
        data = self.db.getItems(self.main_table, find_update, field=field, limit=10000)  # limit = self.count
        # print(data)
        return data

    def _getCrwalerField(self):
        return {"gid": 1, "thumb": 1, "thumb_load": 1, "token": 1}


    def _getUrl(self, crawler_data_index):
        data = self.crawler_data[crawler_data_index]
        return data["thumb"]

    def _webGet(self, web, url, crawler_data_index):
        # print(url)
        use_proxy = self.getUseProxy()
        # use_proxy = True
        header = config.read(self.prefix.upper(), "header_thumb")
        return web.get(url, header=header, cookie=self.cookie, ips=self.ips, web_index=crawler_data_index,
                       timeout=30, retry_interval=3, retry_limit=3, use_proxy=use_proxy)

    def _dataCheck(self, index):
        """
        判断数据是否需要网络去爬， 一般都是false 像
        Args:
            index:

        Returns:

        """
        gid = self.crawler_data[index]["gid"]
        thumb_load = self.crawler_data[index]["thumb_load"] if "thumb_load" in self.crawler_data[index] else 0
        id = int(gid)
        if thumb_load == 2:
            return True
        else:
            return False
        # bucket = f"{self.prefix.lower()}thumb"
        # thumb = f"{id // 1000}/{id}.jpg"
        # if self.minio.existImage(bucket, thumb):
        #     # 图片已经在minio存在, 不用重复下载
        #     logger.warning(f"{gid} thumb已存在")
        #     data = {"gid": int(gid), "thumb_load": 2}
        #     self.db.processItems(self.main_table, data, self.main_id)
        #     return True
        # else:
        #     return False

    def _getInfo(self, web, index):
        try:
            gid = self.crawler_data[index]["gid"]
            content = web.content
            if content is not None and len(content) > 100 and "html" not in str(content):
                id = int(gid)
                bucket = f"{self.prefix.lower()}thumb"
                thumb = f"{id // 1000}/{id}.jpg"
                upload_success = self.minio.uploadImage(bucket, thumb, content)
                if upload_success:
                    data = {"gid": int(gid), "thumb_load": 2}
                    # logger.info(f"{gid} 上传thumb成功")
                    self.db.processItems(self.main_table, data, self.main_id)
                else:
                    logger.info(f"{gid}  上传thumb失败")
                    self._setRunData(index, httpType.TYPE_UNkNOW, f"gid={gid}, 错误的图片")
            else:
                self._setRunData(index, httpType.TYPE_UNkNOW, f"gid={gid}, 图片过小")
        except Exception as error:
            self._setRunData(index, httpType.TYPE_UNkNOW, f"获取图片出错 {error}")


# ************************************** 缩略图片爬虫 **************************************
class ExNailCrawlerProcess(ExCrawlerProcess):
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
        return {"gid": 1, "token": 1, "mpv_images": 1}

    def _changeCrawlerData(self, data):
        # 从图片列表数据库中获取数据
        gids = []
        gid_token = {}
        gid_id = {}
        for i in data:
            gids.append(i["gid"])
            gid_token[i["gid"]] = i["token"]
            gid_id[i["gid"]] = i["_id"]

        data = self.db.getItems(self.list_table, {"gid": {"$in": gids}}, limit=len(data))
        if not data:
            return []

        # 将data 按照mpv_images 拆散
        new_data = []
        for item in data:
            if "mpv_images" in item and  len(item["mpv_images"])>0:
                images = item["mpv_images"]
                if(len(images)> 50):
                    images = images[:50]
                # print(len(images))

                for mpv_image in images:
                    new_data.append({
                        "_id": gid_id[item["gid"]],
                        "gid": item["gid"],
                        "token": gid_token[item["gid"]],
                        "nail_url": mpv_image["t"],
                        "page": mpv_image["page"],
                        "page_count": len(item["mpv_images"])
                    })
        return new_data


    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """
        self.page_data = {}
        field = self._getCrwalerField()
        # 获取没有page的数据
        find_update = {"$and": [
                {"nail_load": {"$in": [None, False]}},
                {"update_images": {"$nin": [None, False]}}
            ]}
        data = self.db.getItems(self.main_table, find_update, field=field, limit=10)  # limit = 1000
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
        data = self.crawler_data[crawler_data_index]
        return data["nail_url"]

    def _webGet(self, web, url, crawler_data_index):
        print(url)
        
        header = config.read(self.prefix.upper(), "header_thumb")
        return web.get(url, header=header, cookie=self.cookie, ips=self.ips, web_index=crawler_data_index,
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
class ExImagesCrawlerProcess(ExCrawlerProcess):
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
        else:
            complete = True
        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, msg, url, re_count)
        return complete

    def _getCrwalerField(self):
        return {"gid": 1, "token": 1,"mpv": 1, "mpv_images": 1, "update_images": 1}


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
            data = self.db.getItems(self.main_table, find, field=self._getCrwalerField(), limit=9999999)
            data = sorted(data,
                          key=lambda x: id_list.index(ObjectId(x['_id'])) if ObjectId(x['_id']) in id_list else len(
                              id_list))


            gids = list(set([i["gid"] for i in data]))
            data2 = self.db.getItems(self.list_table, {"gid": {"$in": gids}}, limit=99999999)
            data3 = []
            for i in data2:
                gid2 = i["gid"]
                for j in data:
                    gid1 = j["gid"]
                    if gid1 == gid2:
                        x = i
                        x.update(j)
                        data3.append(x)


            data = self._changeCrawlerData(data3)
            return data
        else:
            return {}


    def _changeCrawlerData(self, data):
        if not hasattr(self, "page"):
            self.page = 1
            self.page_count = 30
        # 将data 按照mpv_images 拆散
        new_data = []
        for item in data:
            if "mpv_images" in item and  len(item["mpv_images"])>0 and "mpv" in item:
                images = item["mpv_images"]
                images = typeChange.arraySplitPage(images, self.page, self.page_count)
                for mpv_image in images:
                    new_data.append({
                        "_id": item["_id"],
                        "gid": item["gid"],
                        "token": item["token"],
                        "mpv": item["mpv"],
                        "k": mpv_image["k"],
                        "page": mpv_image["page"],
                        "page_count": len(item["mpv_images"])
                    })
        return new_data


    def getUseProxy(self):
        """
        获取是否要使用代理
        Returns:

        """
        use_proxy = False
        if hasattr(self, "use_proxy"):
            use_proxy = True
        else:
            # use_proxy = ProxyState.INCLUD_MYDOMESTIC
            pass
        return use_proxy



    def _getCrawlerData(self):
        """
        getCrawlerRange 获取爬取的范围， 有必要的话，把爬取data放入self.crawler_data
        :return:
        """

        self.page = 1
        self.page_count = 9999

        # 从ex-mosaiclink 中获取需要查询的gid
        # mosaic_data = self.db.getItems("ex-mosaiclink", {}, limit=9999)
        # gids = [i["item_unmosaic_gid"] for i in mosaic_data] + [i["item_mosaic_gid"] for i in mosaic_data]
        # find = {
        #     "$and": [
        #         {"gid": {"$in": gids}},
        #         {"image_load": {"$in": [None, False, 0]}}
        #     ]
        # }
        #
        # data = self.db.getItems(self.main_table, find, limit=9999)

        # 从历史记录中获取所有gid
        data = self.db.getItems(f"{self.prefix.lower()}-history", {}, limit=999999)
        history_gids = list(set([i["gid"] for i in data]))   # 通过转成set 去重

        # 从马赛克连接项取出所有gid(ai训练用)
        data = self.db.getItems(f"{self.prefix.lower()}-mosaiclink", {}, limit=999999)
        mosaiclink_gids = [i["item_unmosaic_gid"] for i in data] + [i["item_unmosaic_gid"] for i in data]

        # 无修正游戏cg或者艺术家cg
        cg_search = "無修正"

        # 获取具有指定tag的值
        find_tag = config.read(self.prefix.upper(), "find_tags", [])
        black_tag = config.read(self.prefix.upper(), "black_tags", [])
        # find = {
        #     "$or":[
        #         {"$and": [
        #             {"tags": {"$elemMatch": {"$eq": "chinese"}}},
        #             {"tags": {"$elemMatch": {"$in": find_tag}}},
        #             {"tags": {"$elemMatch": {"$nin": black_tag}}},
        #             {"filecount": {"$lt": 300}},
        #             {"image_load": {"$in": [None, False, 0]}}
        #         ]},
        #         {"$and": [
        #             {"gid": {"$in": history_gids}},
        #             {"filecount": {"$lt": 500}},
        #             {"image_load": {"$in": [None, False, 0]}}
        #         ]},
        #         {"$and": [
        #             {"gid": {"$in": mosaiclink_gids}},
        #             {"image_load": {"$in": [None, False, 0]}}
        #         ]},
        #         {"$and": [
        #             {"$or": [{"title": {"$regex": cg_search}}, {"title_jpn": {"$regex": cg_search}}]},
        #             {"category": {"$in": ["Artist CG", "Game CG"]}},
        #             {"image_load": {"$in": [None, False, 0]}}
        #         ]}
        #     ]
        # }
        start_time = time1(3, 0)  # 凌晨3点
        end_time = time1(17, 0)  # 晚上5点

        if start_time <= datetime.now().time() <= end_time:
            pass
        else:
            logger.info(f"当前时间无法执行ex-images")
            return []

        find = {"$and": [
                    {"gid": {"$in": history_gids}},
                    {"filecount": {"$lt": 5000}},
                    {"image_load": {"$in": [None, False, 0]}}
                ]}
        data = []
        # for f in find["$or"]:
        #     data = typeChange.vstack("gid", self.db.getItems(self.main_table, f, order="gid", order_type=-1, limit=100), data)
        data = self.db.getItems(self.main_table, find, order="gid", order_type=-1, limit=10)
        # data = self.db.getItems(self.main_table, find, order="gid", order_type=-1, limit=100)
        gids = list(set([i["gid"] for i in data]))


        # 创建一个ExPage爬虫 来更新mpv
        crawler_process = ExPageCrawlerProcess({})
        crawler_process.crawler_data = data
        crawler_process.run()

        find = {
            "$and": [
                {"gid": {"$in": gids}},
                {"update_images": {"$gte": datetime.now() - timedelta(hours=15)}}
            ]
        }

        data = self.db.getItems(self.main_table, find , limit=50)

        gids = list(set([i["gid"] for i in data]))
        data2 = self.db.getItems(self.list_table, {"gid" : {"$in": gids}}, limit=99999999)
        data3 = []
        for i in data2:
            gid2 = i["gid"]
            for j in data:
                gid1 = j["gid"]
                if gid1 == gid2:
                    x = i
                    x.update(j)
                    data3.append(x)
        # print(data3)


        data = self._changeCrawlerData(data3)

        return data




    def _dataCheck(self, index):
        """
        判断数据是否需要网络去爬， 一般都是false 像
        Args:
            index:

        Returns:

        """
        data = self.crawler_data[index]
        id = self.crawler_data[index][self.main_id]
        page = self.crawler_data[index]["page"]
        bucket, path = self._getMinioFile(id, page)
        if self.minio.existImage(bucket, path):
            self._setRunData(index, httpType.TYPE_HTTPCOM, f"{id} 第{page} 页已有缓存")
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
        # if file_count >= page_count:
        if (file_count / page_count) >= 0.9:
            # 完成率超过90%则认为完成
            # logger.info(f"{self.getName()} {id} 完成所有图片")
            self._setRunData(index, httpType.TYPE_ALLCOM, f"{id} 完成所有图片")
            self.db.processItem(self.main_table, {self.main_id: data[self.main_id], "image_load": 2}, self.main_id)
            self.db.processItem(self.list_table, {self.main_id: data[self.main_id], "image_load": 2}, self.main_id)


    def _webGet(self, web, url, crawler_data_index):

        pass



    def _getWeb(self, index):
        """
        image 独有 重写getweb
        Args:
            index:

        Returns:

        """
        while True:
            data = self.data_index[index]
            if(data["value"] < data["end"]):
                if not self._dataCheck(data["value"]):
                    # 执行爬虫
                    img_data = self._getImgData(data["value"])
                    if img_data:

                        self._saveImg(data["value"], img_data)


                # 记录完成的序号
                self.complete_data.append(data["value"])
                # value自增
                self.data_index[index]["value"] += 1
                self._completeOne()
                # time.sleep(1)
            else:
                # 超过上限, 不用继续执行了
                logger.info(f"{self.getName()} 线程{index} 执行完毕, 总共完成{data['count']}条")
                break

    def _saveImg(self, index, img_data):

        id = self.crawler_data[index][self.main_id]
        page = self.crawler_data[index]["page"]
        bucket, path = self._getMinioFile(id, page)
        success = self.minio.uploadImage(bucket, path, img_data)
        self._setRunData(index, httpType.TYPE_HTTPCOM, f"{id} 第{page}页 下载完成")

        if success:
            self._checkImages(index)
            # logger.info(f"{id} 第{page}页 下载完成")



    def _getImgData(self, crawler_data_index):
        # self.proxy_state = ProxyState.INCLUD_MYDOMESTIC
        # if self.getUseProxy():
        #     self.proxy_state = ProxyState.MY_PROXY
        self.proxy_state = ProxyState.INCLUD_MYDOMESTIC

        page = self.crawler_data[crawler_data_index]["page"]
        nl = ""
        for _ in range(3):
            img_data = self._getImgUrl(crawler_data_index, nl)

            if(img_data):
                src = img_data["src"]
                self.crawler_data[crawler_data_index]["real_url"] = src
                nl = img_data["nl"]
                content = self._getImgContent(src)
                if content:
                    return content
                else:
                    self._setRunData(crawler_data_index, httpType.TYPE_OSERR,
                                     f"{id} 第{page}页 下载图片失败")
        return None







    def _getImgUrl(self, crawler_data_index, nl=""):
        try:
            
            web = WebRequest(httpError=self._httpError, httpComplete=self._httpComplete)
            api_url = f"{self.url}/api.php"
            header = self.header
            data = self.crawler_data[crawler_data_index]
            mpvkey = data["mpv"]
            imgkey = data["k"]
            page = data["page"]
            gid = data["gid"]

            post_data = {"gid": int(gid), "imgkey": imgkey, "method": "imagedispatch", "mpvkey": mpvkey, "page": page}
            # print(post_data)
            if nl != "":
                post_data["nl"] = nl
            post_data = json.dumps(post_data)

            use_proxy = True
            proxy_state = ProxyState.FLASK_DOMESTIC
            # use_proxy = self.getUseProxy()
            web_success = web.post(api_url, post_data, header=header, cookie=self.cookie, ips=self.ips, web_index=crawler_data_index,
                                  timeout=20, retry_interval=1, retry_limit=5, use_proxy=use_proxy, proxy_state=proxy_state )
            if web_success:
                resp_data = web.json
                if "i" in resp_data and "s" in resp_data:
                    return {"src": resp_data["i"], "nl": resp_data["s"]}
        except Exception as e:
            logger.error(f"获取图片网址错误 {e}")
        return False

    def _getImgContent(self, src, use_cloud=False):
        try:
            web = WebRequest()
            web_success = False
            proxy_state = ProxyState.FLASK_DOMESTIC
            dr = DomainResolver(src)
            if dr.is_port_open():
                # 国内可以查看其端口, 不使用代理
                web_success = web.get(src, header=self.header, timeout=20, retry_interval=0, retry_limit=2)
                if not web_success:
                    web_success = web.get(src, header=self.header, timeout=20, retry_interval=0, retry_limit=3, use_proxy= True,
                                          proxy_state=proxy_state)
            elif dr.get_country() == "CN":
                # 国内的网址, 但是国内不可达, 认为是失效的网址
                logger.warning(f"ex子域名为CN境内域名，并且已关闭: {dr.domain} ")
                return False
            else:
                logger.warning(f"ex图片 {src} 国内不可达, 使用代理")
                web_success = web.get(src, header=self.header, timeout=20, retry_interval=0, retry_limit=2, use_proxy= True,
                                      proxy_state=ProxyState.INCLUD_MYFOREIGN )

            if web_success:
                return web.content

        except Exception as e:
            logger.error(f"获取图片信息错误 {e}")
        return False



    def _checkMpvOverTime(self):
        # 用来判断mpv是否超时了, 超时了就调用page 重新拉一个
        pass


# ************************************** 评论页爬虫 **************************************
class ExCommentsCrawlerProcess(ExCrawlerProcess):
    def _getCrawlerData(self):
        # 计算差距时间
        check_time = datetime.now() - timedelta(days=100)

        # 定义聚合管道
        pipeline = [
            {
                '$lookup': {
                    'from': 'ex-comments',
                    'localField': 'gid',
                    'foreignField': 'gid',
                    'as': 'comments'
                }
            },
            {
                '$match': {
                    '$and': [
                        {'tags': {'$in': ['chinese']}},
                        {
                            '$or': [
                                {'comments': {'$size': 0}},  # ex-comments 不存在于 ex-main 的数据
                                {'comments': {'$elemMatch': {'update_comments': {'$lte': check_time}}}}

                            ]
                        }
                    ]
                }
            },
            {
                '$project': {
                    "gid": 1,
                    "token": 1
                }
            },
            {'$limit': 5000}  # 限制返回的文档数量为100
        ]
        data = self.db.aggregate(self.main_table, pipeline)


        return data

    def _getCrwalerField(self):
        return {"gid": 1, "token": 1}

    def _getUrl(self, value):
        data = self.crawler_data[value]
        gid = data["gid"]
        token = data["token"]
        url = f"{self.url}/g/{gid}/{token}/"
        return url

    def _webGet(self, web, url, index):
        
        return web.get(url, header=self.header, cookie=self.cookie, ips=self.ips, web_index=index,
                               timeout=10, retry_interval=3, retry_limit=5, use_proxy=self.getUseProxy(), proxy_state=ProxyState.FLASK_DOMESTIC)

    def _getInfo(self, web, index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        try:
            # print(web.content)
            id = self.crawler_data[index]["_id"]
            forums = web.tree.xpath(".//div[@class='c6']")
            data = []
            comments = []
            for forum in forums:
                txt = "<br>".join(forum.xpath("./text()"))
                txt = typeChange.toJianti(txt)
                comments += forum.xpath("./text()")

                for href in forum.xpath("./a/@href"):
                    gid = self._extract_gid(href)
                    if gid:
                        txt += f"<br><search key='gid'>{gid}</search>"
                    else:
                        txt += "<br>" +  href

                data.append(txt)
            comments = [typeChange.toJianti(i) for i in comments]
            comments_part = typeChange.cn_part(" ".join(comments))
            # print(comments_part)
            comments_part = " ".join(comments_part)

            info = {
                "item_id": ObjectId(id),
                "forums": data,
                "_t": comments_part,
                self.main_id: self.crawler_data[index][self.main_id],
                "update_comments": datetime.now()
            }

            self.db.processItems(self.comments_table, info, "item_id")


        except Exception as error:
            msg = f"{self.name} 获取第{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)





# ************************************** 下载工具爬虫 **************************************
class ExDownCrawlerProcess(ExCrawlerProcess):
    def _getCrawlerData(self):
        return []

    def _getCrwalerField(self):
        return {"gid": 1, "token": 1, "archiver_key": 1}

    def _getUrl(self, value):
        # 先使用info刷新一遍
        data = self.crawler_data[value]
        id = data["_id"]

        c = ExInfoCrawlerProcess({}, run_type="for")
        c.setCrawlerData(c.getCrawlerDataById([id]))
        c.use_proxy = False
        c.run()
        data = self.db.getItem(self.main_table, {"_id": typeChange.convertObjectId(id)})
        if data:

            gid = data["gid"]
            token = data["token"]
            archiver_key = data["archiver_key"]
            # https://exhentai.org/archiver.php?gid=2804296&token=1a8d0b7b6e&or=478762-c279505159ddb36c3dbc7327c7096821e4bfa326
            url = f"{self.url}/archiver.php?gid={gid}&token={token}&or={archiver_key}"
            return url
        return  ""

    def _webGet(self, web, url, index):
        post_data = {
            "dltype": "res",
            "dlcheck": "Download Resample Archive"
        }


        return web.post(url, post_data, header=self.header, cookie=self.cookie, ips=self.ips, web_index=index,
                       timeout=10, retry_interval=3, retry_limit=5, use_proxy=self.getUseProxy())




    def _getInfo(self, web, index):
        """
        获取info
        :param web:
        :param crawler_data_index:
        :return:
        """
        try:
            id = self.crawler_data[index][self.main_id]
            links = web.tree.xpath('//a/@href')
            if len(links) > 0 and "archive" in links[0]:
                url = links[0]
                web = WebRequest()
                url = f"{url}?start=1"
                # print(url)

                for i in range(10):
                    print(url)
                    # web.get(url, header=self.header, cookie=self.cookie,  web_index=index,
                    #    timeout=10, retry_interval=3, retry_limit=5, use_proxy=True, proxy_state=ProxyState.INCLUD_MYFOREIGN)
                    # if "You have clocked" in web.text:
                    #     print(f"{id} 被锁定")
                    #     break
                    filename = web.get_filename_from_url(url)
                    if filename and str(filename).endswith("zip"):
                        resp_data = web.download_and_extract_zip(url)
                        for i, item in enumerate(resp_data):
                            file = item["file"]
                            content = item["content"]
                            page = i + 1
                            bucket, path = self._getMinioFile(id, page)
                            bucket = "eximage"
                            success = self.minio.uploadImage(bucket, path, content)
                        logger.info(f"{id} 下载完成")
                        break
                    time.sleep(10)


        except Exception as error:
            msg = f"{self.name} 下载{index}页出错, 错误原因{error}"
            self._setRunData(index, httpType.TYPE_UNkNOW, msg)