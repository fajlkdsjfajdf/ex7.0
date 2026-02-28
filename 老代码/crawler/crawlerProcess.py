# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   Description :   这是所有爬虫的总类
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""
import time
from util import timeFormat, typeChange
from config.configParse import config
from db.mongodb import MongoDB
from multiprocessing import Process
from multiprocessing.pool import ThreadPool
from logger.logger import logger
from networking import httpType
from networking.webRequest import WebRequest
from util.timeFinder import TimeFinder
from db.minio import MinioClient
from bson.objectid import ObjectId
from networking.proxy import ProxyState

class CrawlerProcess(Process):
    def __init__(self, manager_dict={}, run_data={}, **kwargs):
        super(CrawlerProcess, self).__init__()  # 必须加载Process的__init__
        self.kwargs = kwargs
        self.run_count = 0
        self.manager_dict = manager_dict # 进程交互字典, 用于告知当前状态
        self.run_data = run_data    # 同上
        self.crawler_data = self._getArgs("crawler_data", []) # 爬取数据， 如果有就按照给的数据爬, 否则自动爬
        self.run_type = self._getArgs("run_type", "thread")  # 运行模式, [for, thread]
        self.manager_dict["fun_name"] = self.getName()
        self.complete_data = []     # 用于记录完成记录的数组 存放完成的index
        self.run_over = False
        self._getPrefixAndType()
        self._setDefaultTimer()
        self._setDefautlId()
        self.mode = "crawler"

    def getCrawlerData(self):
        if self.crawler_data and len(self.crawler_data) > 0:
            data = []
            for i,item in enumerate(self.crawler_data):

                if type(item) == dict:
                    if i in self.complete_data:
                        item["complete"] = True
                    else:
                        item["complete"] = False
                    data.append(item)
                elif type(item) == list:
                    data.append(item)
                else:
                    pass
            return data

        else:
            return {}

    def getCrawlerIsOver(self):
        # 判断是否执行完成所有线程
        return self.run_over

    def setRunOver(self, run_over):
        self.run_over = run_over

    def setCrawlerData(self, data):
        self.crawler_data = data

    def setPage(self, page, page_count):
        self.page = page
        self.page_count = page_count

    def setUseProxy(self, flag):
        self.use_proxy = flag

    def setRunType(self, run_type):
        self.run_type = run_type

    def _getPrefixAndType(self):
        web_sort = config.read("setting", "web_sort")
        type_sort = config.read("setting", "crawler_sort")
        crawler_name = self.getName()
        self.prefix = ""
        self.type = ""
        for p in web_sort:
            if crawler_name.startswith(typeChange.capitalizeFirstLetter(p)):
                self.prefix = p
                break
        for t in type_sort:
            if crawler_name.replace(typeChange.capitalizeFirstLetter(self.prefix), "").startswith(t) and t != "":
                self.type = t
                break

    def _setDefaultTimer(self):
        if self.type != "":
            self.timer = config.read(self.prefix, f"timer-{self.type.lower()}", 0)
        else:
            self.timer = config.read(self.prefix, f"timer-main", 0)

    def _setDefautlId(self):
        self.main_id = config.read(self.prefix, f"main_id", "id")
        self.list_id = config.read(self.prefix, f"list_id", "id")

    def _getArgs(self, key, default):
        """
        _getArgs 获取指定参数
        :return:
        """
        if key in self.kwargs and self.kwargs[key] != "" and self.kwargs[key] != None:
            return self.kwargs[key]
        return default

    def _getMinioFile(self, id, page=-1, path_ext=".jpg"):
        bucket = f"{self.getName().lower()}"
        if "images" in bucket:
            bucket = bucket.replace("images", "image")
        path = ""
        path_header = ""
        if typeChange.isNumber(id):
            id = int(id)
            path_header = f"{id // 1000}/{id}"
        else:
            id = str(id)
            path_header = f"{id[:5]}/{id}"
        if page== -1:
            path = f"{path_header}{path_ext}"
        else:
            path = f"{path_header}/{page:04d}{path_ext}"
        return bucket, path

    def _load(self):
        """
        读取爬虫的基本配置
        :return:
        """
        self.db = MongoDB()
        self.minio = MinioClient()
        self.url = config.read(self.prefix, "url", "")
        self.header = config.read(self.prefix, "header", {})
        self.cookie = config.read(self.prefix, "cookie", {})
        self.thread_count = config.read(self.prefix, "thread", 30)
        self.main_table = f"{self.prefix.lower()}-main"
        self.list_table = f"{self.prefix.lower()}-list"
        self.list_count = config.read(self.prefix, "list_count", 100)
        self.bookmark_table = f"{self.prefix.lower()}-bookmark"
        self.comments_table = f"{self.prefix.lower()}-comments"
        self.info_count = 1000
        self.timeFinder = TimeFinder(base_date='1900-01-01 00:00:00')
        self.complete_data = []
        self.run_over = False


    def getName(self):
        return (self.__class__.__name__).replace("CrawlerProcess", "")

    def run(self):
        try:
            self._load()
            self.manager_dict["start_time"] = timeFormat.getNowTime()
            if len(self.crawler_data) > 0:
                logger.warning(f"限制模式启动:{self.getName()},启动模式: {self.run_type},  限制数据数量{len(self.crawler_data)}")
            else:
                self.crawler_data = self._getCrawlerData()
                logger.warning(f"启动:{self.getName()},启动模式:{self.run_type}, 爬取数量{len(self.crawler_data)}")
            if self.crawler_data and len(self.crawler_data)>0:
                self.manager_dict["data_count"] = len(self.crawler_data)
                self.manager_dict["complete"] = 0
                self.data_index = self._splitData(0, len(self.crawler_data))
                self.run_count += 1
                if self.run_type == "for":
                    for i in range(self.thread_count):
                        self._getWeb(i)
                else:
                    if(len(self.crawler_data)==1):
                        logger.info(f"{self.getName()} 只需要执行一项")
                        self._getWeb(0)
                    else:
                        pool = ThreadPool(processes=self.thread_count)
                        pool.map(self._getWeb, range(self.thread_count))
                        pool.close()
                        pool.join()
                logger.warning(f"完成:{self.getName()}")
            else:
                logger.warning(f"{self.getName()} 爬取数量为0")
        except Exception as e:
            logger.error(f"运行{self.getName()} 失败 {e}")
        self.run_over = True
        self.manager_dict["end_time"] = timeFormat.getNowTime()

    def _splitData(self, num_start, num_end):
        # 将数字分段
        num_segments = self.thread_count
        number = num_end - num_start
        quotient, remainder = divmod(number, num_segments)
        # 初始化segments
        segments = {}

        # 分段
        for i in range(self.thread_count):
            start = num_start + i * quotient + min(i, remainder)
            end = start + quotient + (1 if i < remainder else 0)
            count = end - start
            segment = {"start": start, "end": end, "count": count, "value": start}
            segments[i] = segment
        return segments

    def _setRunData(self, index, type, msg=None, url=None, re_count=None):
        """
        设置运行状态
        :param crawler_data_index:
        :param type:
        :param msg:
        :param url:
        :param re_count:
        :return:
        """
        try:
            data = {}
            if url != None and url != "":
                data["url"] = url
            if re_count != None and re_count != "":
                data["re_count"] = re_count
            if type != None and type != "":
                data["type"] = type
            if msg != None and msg != "":
                data["msg"] = str(msg)
            # if "run_data" not in self.manager_dict:
            #     self.manager_dict["run_data"] = {}
            # self.manager_dict["run_data"][index] = data
            self.run_data[index] = data
        except Exception as e:
            logger.error(f"设置运行状态错误 {e}")

    def _httpComplete(self, response, url, kwargs):
        """
        web http成功时的回调
        :param response:
        :param url:
        :param kwargs:
        :return:
        """
        re_count = 0
        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPCOM, "获取成功", url, re_count)
        return True

    def _httpError(self, response, url, error, kwargs):
        """
        web http失败时的回调
        :param response:
        :param url:
        :param error:
        :param kwargs:
        :return:
        """
        re_count = 0
        if "retry_count" in kwargs:
            re_count = kwargs["retry_count"]
        if "web_index" in kwargs and kwargs["web_index"] != "" and kwargs["web_index"] != None:
            self._setRunData(kwargs["web_index"], httpType.TYPE_HTTPERR, error, url, re_count)
        return False

    def _dataCheck(self, index):
        """
        判断数据是否需要网络去爬， 一般都是false 像
        Args:
            index:

        Returns:

        """
        return False

    def _getCrwalerField(self):
        return None

    def _changeCrawlerData(self, data):
        return data

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
            data = self._changeCrawlerData(data)
            return data
        else:
            return {}

    def setIndexSearch(self, search_txt, page):
        """
        设置首页查询模式，通过直连查找
        Returns:
        """
        self._load()
        self.mode = "search"
        self.search_txt = search_txt
        self.crawler_data = [page]

    def getUseProxy(self):
        """
        获取是否要使用代理
        Returns:

        """
        use_proxy = self.use_proxy if hasattr(self, "use_proxy") else True
        return use_proxy

    def _webError(self, index):
        pass


    def _getWeb(self, index):
        web = WebRequest(httpError=self._httpError, httpComplete=self._httpComplete)
        while True:
            data = self.data_index[index]
            if(data["value"] < data["end"]):
                if not self._dataCheck(data["value"]):
                    # 执行爬虫
                    url = self._getUrl(data["value"])
                    # print(url)
                    if url:
                        urls = []
                        if type(url) == str:
                            urls = [url]
                        else:
                            urls = url
                        for url in urls:
                            self._setRunData(data["value"], httpType.TYPE_START, "开始爬取", url)
                            web_sucess = self._webGet(web, url, data["value"])
                            if web_sucess:
                                self._setRunData(data["value"], httpType.TYPE_HTTPCOM, "获取成功，解析中")
                                self._getInfo(web, data["value"])
                            else:
                                self._webError(data["value"])

                # 记录完成的序号
                self.complete_data.append(data["value"])
                # print(self.complete_data)
                # value自增
                self.data_index[index]["value"] += 1
                self._completeOne()
                # time.sleep(1)

            else:
                # 超过上限, 不用继续执行了
                logger.info(f"{self.getName()} 线程{index} 执行完毕, 总共完成{data['count']}条")
                break

    def _completeOne(self):
        # 完成一次后， 设置完成量
        count = 0
        for i in self.data_index:
            count += (self.data_index[i]["value"] - self.data_index[i]["start"])

        self.manager_dict["complete"] = count
