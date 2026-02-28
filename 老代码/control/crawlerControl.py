# 爬虫控制类
import datetime
import glob
import os
import importlib
import time
import _thread
from logger.logger import logger
from multiprocessing import Process, Manager
from config.configParse import config
from util import typeChange
from apscheduler.schedulers.background import BackgroundScheduler
import random


class CrawlerControl:
    def __init__(self):
        self.manager = Manager()
        self.manager_list = {}
        self.run_data = {}
        self.run_list = {}
        self.crawler_sort = typeChange.capitalizeFirstLetter(config.read("setting", "crawler_sort"))
        self.web_sort = typeChange.capitalizeFirstLetter(config.read("setting", "web_sort"))
        self.importCrawlers()
        self.addSchedulerJob()


    def __del__(self):
        try:
            if self.manager:
                self.manager.shutdown()
        except Exception as e:
            print(e)

    def addSchedulerJob(self):
        """
        添加定时执行任务
        Returns:
        """
        self.scheduler = BackgroundScheduler()
        for web in self.web_sort:
            for c_type in self.crawler_sort:
                timer_skip =self.getCrawlerTimer(web, c_type)
                if timer_skip:
                    timer_skip = int(timer_skip)
                    logger.info(f"{web} {c_type} 添加定时任务, 时间: {timer_skip} 小时")
                    self.scheduler.add_job(
                        self.startCrawler,
                        'interval',
                        seconds=timer_skip * 60 * 60 + random.randint(1, 30),
                        args=[web, c_type]
                    )
                    # self.scheduler.add_job(self.startCrawler, 'interval', minutes=1, args=[web, c_type])
        self.scheduler.start()
    def importCrawlers(self):
        """
        引用所有爬虫类
        :return:
        """
        self.crawler_process_list = {}
        current_folder = os.path.dirname(os.path.dirname(__file__))
        crawler_folder = os.path.join(current_folder, "crawler")


        py_files = glob.glob(f"{crawler_folder}/*.py")  # 匹配指定文件夹下的所有 .py 文件
        crawler_process_list = {}
        for file in py_files:
            module_name = os.path.basename(file)[:-3] # 获取文件名并去掉文件名的后缀 .py
            module = importlib.import_module(f"crawler.{module_name}")  # 动态导入模块
            for attr_name in dir(module):
                if "CrawlerProcess" in attr_name and attr_name != "CrawlerProcess":
                    if attr_name not in self.crawler_process_list:
                        class_method = getattr(module, attr_name)
                        crawler_process_list[attr_name] = class_method
        for web in self.web_sort:
            for type in self.crawler_sort:
                crawler_name = f"{web}{type}CrawlerProcess"
                if crawler_name in crawler_process_list:
                    self.crawler_process_list[crawler_name] = crawler_process_list[crawler_name]
                    self.crawler_process_list[crawler_name]()  # 全部实例化一次
                    # logger.info(f"加载了爬虫模块{crawler_name}")

    def getCrawlerName(self, crawler_prefix, crawler_type):
        crawler_prefix = typeChange.capitalizeFirstLetter(crawler_prefix)
        crawler_type = typeChange.capitalizeFirstLetter(crawler_type) if crawler_type else ""
        return f"{crawler_prefix}{crawler_type}CrawlerProcess"

    def getCrawlerTimer(self, crawler_prefix, crawler_type):
        if crawler_type != "":
            return config.read(crawler_prefix.upper(), f"timer-{crawler_type.lower()}")
        else:
            return config.read(crawler_prefix.upper(), f"timer-main")

    def getCrawlerTitle(self, crawler_name):
        """
        反向， 通过crawler_name 获取crawler的prefix 和type
        :param crawler_name:
        :return:
        """
        if crawler_name in self.crawler_process_list:
            web_sort = config.read("setting", "web_sort")
            type_sort = config.read("setting", "crawler_sort")
            crawler_prefix = ""
            crawler_type = ""
            for p in web_sort:
                if crawler_name.startswith(typeChange.capitalizeFirstLetter(p)):
                    crawler_prefix = p
                    break
            for t in type_sort:
                if crawler_name.replace(typeChange.capitalizeFirstLetter(crawler_prefix), "").startswith(t) and t != "":
                    crawler_type = t
                    break
            return crawler_prefix, crawler_type
        else:
            return None, None

    def getCrawler(self, crawler_prefix, crawler_type):
        """
        获取指定的模块 注意获得的是对应的类， 并没有实例化
        :param crawler_prefix:
        :param crawler_type:
        :return:
        """

        if self.getCrawlerName(crawler_prefix, crawler_type) in self.crawler_process_list:
            return self.crawler_process_list[self.getCrawlerName(crawler_prefix, crawler_type)]
        else:
            return None

    def getManager(self, crawler_prefix, crawler_type):
        """
        获取交换变量
        :param crawler_prefix:
        :param crawler_type:
        :return:
        """
        if self.getCrawlerName(crawler_prefix, crawler_type) in self.manager_list:
            return self.manager_list[self.getCrawlerName(crawler_prefix, crawler_type)]
        else:
            return None

    def getRunData(self, crawler_prefix, crawler_type):
        """
        获取交换变量
        :param crawler_prefix:
        :param crawler_type:
        :return:
        """
        if self.getCrawlerName(crawler_prefix, crawler_type) in self.run_data:

            return dict(self.run_data[self.getCrawlerName(crawler_prefix, crawler_type)])
        else:
            return None

    def getRunCrawler(self, crawler_prefix, crawler_type):
        """
        获取已经实例化的指定爬虫
        :param crawler_prefix:
        :param crawler_type:
        :return:
        """
        if self.getCrawlerName(crawler_prefix, crawler_type) in self.run_list:
            return self.run_list[self.getCrawlerName(crawler_prefix, crawler_type)]
        else:
            return None

    def startCrawler(self, crawler_prefix, crawler_type, **args):
        """
        执行指定的模块
        :param crawler_prefix:
        :param crawler_type:
        :return:
        """
        crawler_name = self.getCrawlerName(crawler_prefix, crawler_type)
        if crawler_name not in self.run_list:
            if self.getCrawler(crawler_prefix, crawler_type):
                _thread.start_new_thread(self.startThread, (crawler_prefix, crawler_type,))
                return True, ""
            else:
                msg = f"无法运行{crawler_name} 没有找到该类"
                logger.error(msg)
                return False, msg
        else:
            msg = f"无法运行{crawler_name} 已有一个同名进程运行中"
            logger.error(msg)
            return False, msg

    def startThread(self, crawler_prefix, crawler_type):
        """
        启动一个新线程来运行子线程
        :return:
        """
        crawler_name = self.getCrawlerName(crawler_prefix, crawler_type)
        try:
            self.manager_list[crawler_name] = self.manager.dict()  # 记录运行日志的变量
            self.run_data[crawler_name] = self.manager.dict()
            run_crawler = self.getCrawler(crawler_prefix, crawler_type)         # 获取运行的类
            self.run_list[crawler_name] = run_crawler(self.manager_list[crawler_name], self.run_data[crawler_name])  # 实例化运行类
            logger.info(f"开始运行{crawler_name}")
            self.run_list[crawler_name].start()
            sec = 0
            while True:
                sec += 5  # 每次增加time.sleep 的时间
                if not self.run_list[crawler_name].is_alive():
                    break
                if sec > 3 * 60 * 60:
                    logger.warning(f"{crawler_name} 运行超过10小时， 手动终止")
                    self.run_list[crawler_name].terminate()
                    break
                time.sleep(5)
            if crawler_name in self.run_list:
                del self.run_list[crawler_name]
            # self.run_list[crawler_name].join()
            logger.info(f"结束运行{crawler_name}")
            # del self.manager_list[crawler_name]     # 清理运行日志和运行类
        except Exception as e:
            logger.error(f"运行爬虫{crawler_name} 失败 {e}")
        if crawler_name in self.run_list:
            del self.run_list[crawler_name]
        if crawler_name in self.manager_list:
            del self.manager_list[crawler_name]
        if crawler_name in self.run_data:
            del self.run_data[crawler_name]


    def stopCrawler(self, crawler_prefix, crawler_type):
        """
        停止进程
        :param crawler_prefix:
        :param crawler_type:
        :return:
        """
        crawler_name = self.getCrawlerName(crawler_prefix, crawler_type)
        if crawler_name in self.run_list:
            try:
                self.run_list[crawler_name].terminate()
                return True, f"终止了进程{crawler_name}"
            except Exception as e:
                return False, f"终止进程{crawler_name}失败: {e}"
        else:
            return False, f"进程{crawler_name}没有启动"


# **************************全局实体化**********************************
crawlerControl = None


def getCrawlerControl():
    global crawlerControl
    if crawlerControl == None:
        crawlerControl = CrawlerControl()
    return crawlerControl



if __name__ == '__main__':
    getCrawlerControl()
    crawlerControl.__del__()
    # crawlerControl.startCrawler("Ex", "info2")
    # crawlerControl.startCrawler("Ex", "")
    # time.sleep(2)
