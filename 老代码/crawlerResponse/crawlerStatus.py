# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：     crawlerStatus
   Description :   获取爬虫的状态
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""
from control import crawlerControl
from util import timeFormat, typeChange
from config.configParse import config
from logger.logger import logger

class CrawlerStatus:
    def __init__(self, request):
        self.request = request
        self.crawlerControl = crawlerControl.getCrawlerControl()

    def __getAll(self):
        # 获取所有爬虫的大概信息
        return {}
        # crawlers = config.readJson("CRAWLER", "list")
        # return_data = []
        # for prefix in crawlers:
        #     crawler_config = config.readSection(prefix)
        #     crawler_data = {"data_count": "未运行", "down_count": "未运行", "run_count": "未运行", "image_count": "未运行"}
        #     crawler_data["title"] = crawler_config["title"]
        #     crawler_data["prefix"] = prefix
        #     fun = crawler_config["fun"]
        #     crawlerDataCls = crawlerData.getCrawlerData()
        #     crawler = crawlerDataCls.getCrawler(prefix, "")
        #     if crawler != None:
        #         crawler_data["data_count"] = crawler.getDbCount()
        #         crawler_data["down_count"] = crawler.getDbDownCount()
        #     manager = crawlerDataCls.getManager(prefix, "image")
        #     if manager != None:
        #         crawler_data["run_count"] = manager["run_count"].get("count", 0)
        #         crawler_data["image_count"] = manager["run_count"].get("image_count", 0)
        #     return_data.append(crawler_data)
        # return return_data



    def __getAllStatus(self):
        crawlers = self.crawlerControl.crawler_process_list
        return_data = []
        for crawler in crawlers:
            crawler_prefix, crawler_type = self.crawlerControl.getCrawlerTitle(crawler)
            # 隐藏不定时的任务
            if self.crawlerControl.getCrawlerTimer(crawler_prefix, crawler_type):
                manager = self.crawlerControl.getManager(crawler_prefix, crawler_type)
                info_complete = {}
                if manager:
                    if self.crawlerControl.getRunCrawler(crawler_prefix, crawler_type):
                        info_complete["run_status"] = "开始运行"
                        info_complete["run_time"] = timeFormat.getUseTime(manager["start_time"]) if "start_time" in manager else 0
                        info_complete["data_count"] = manager["data_count"] if "data_count" in manager else 0
                        info_complete["count"] = info_complete["data_count"]
                        info_complete["complete"] = manager["complete"] if "complete" in manager else 0
                    else:
                        info_complete["run_status"] = "结束运行"
                        start_time = manager["start_time"] if "start_time" in manager else 0
                        end_time = manager["end_time"] if "end_time" in manager else 0
                        info_complete["run_time"] = timeFormat.getUseTime(start_time, end_time) if start_time and end_time else 0
                        info_complete["data_count"] = manager["data_count"] if "data_count" in manager else 0
                        info_complete["count"] = info_complete["data_count"]
                        info_complete["complete"] = manager["complete"] if "complete" in manager else 0
                else:
                    info_complete["run_status"] = "等待运行"
                    info_complete["run_time"] = 0
                    info_complete["data_count"] = 0
                    info_complete["count"] = 0
                    info_complete["complete"] = 0

                info_complete["prefix"] = crawler_prefix
                info_complete["child"] = crawler_type
                info_complete["title"] = crawler
                info_complete["next"] = ""
                return_data.append(info_complete)
        return return_data





    def __startOneCrawler(self):
        prefix = self.request.args.get('prefix')
        child = self.request.args.get('child')
        start_success, msg = self.crawlerControl.startCrawler(prefix, child)
        if start_success:
            return {"status": "sucess", "msg": msg}
        else:
            return {"status": "error", "msg": msg}


    def __stopOneCrawler(self):
        prefix = self.request.args.get('prefix')
        child = self.request.args.get('child')
        start_success, msg =self.crawlerControl.stopCrawler(prefix, child)
        if start_success:
            return {"status": "sucess", "msg": msg}
        else:
            return {"status": "error", "msg": msg}


    def __getCrawlers(self):
        web_sort = config.read("setting", "web_sort")
        data = []
        for w in web_sort:
            data.append({"prefix": w, "title": w})
        return data


    def __getCrawlersData(self):
        prefix = self.request.args.get('prefix')

        data = {}
        crawler_sort = typeChange.capitalizeFirstLetter(config.read("setting", "crawler_sort"))
        for c_type in crawler_sort:
            run_data = self.crawlerControl.getRunData(prefix, c_type)
            if run_data:
                data[c_type] = run_data

        return data

    def __getLog(self):
        return logger.getLogs()


    def response(self):
        type = self.request.args.get('type')
        if type == "getall":
            return self.__getAll()
        elif type == "getallstatus":
            return self.__getAllStatus()
        elif type == "startone":
            return self.__startOneCrawler()
        elif type == "stopone":
            return self.__stopOneCrawler()
        elif type == "getcrawlers":
            return self.__getCrawlers()
        elif type == "getcrawlersdata":
            return self.__getCrawlersData()
        elif type == "getlog":
            return self.__getLog()
