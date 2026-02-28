# 定期任务
import time

from apscheduler.schedulers.background import BackgroundScheduler
import _thread
from networking.proxyControl import ProxyControl
from plugin.webSpeed import FastestWebsiteChecker
from plugin.participleTool import Participle
from plugin.webLogin import WebLogin
from logger.logger import logger
import multiprocessing



class TimerJob:
    def __init__(self):
        self.run_count = {}
        self.scheduler = BackgroundScheduler()

    def start(self):
        self.__start_job(FastestWebsiteChecker, 10 * 60, is_process=False)  # 10分钟一次
        self.__start_job(Participle, 60 * 60, is_process=False)             # 1小时一次
        self.__start_job(ProxyControl, 30 * 60, is_process=False)           # 30分钟一次
        self.__start_job(WebLogin, 24 * 60 * 60 , is_process=False)         # 一天一次
        self.scheduler.start()

    def __start_job(self, cls, interval=30, is_process=False):
        """
        开始一个任务
        Args:
            cls: 执行类
            interval: 执行间隔(s)
        Returns:
        """
        cls_name = cls.__name__
        self.run_count[cls_name] = 0
        # 立即执行一次
        _thread.start_new_thread(self.__time_job, (cls, is_process, ))
        # 定期执行
        self.scheduler.add_job(self.__time_job, 'interval', seconds=interval, args=(cls,is_process, ))

    def __time_job(self, cls, is_process=False):
        """

        Args:
            cls: 执行类
            is_process: 是否子进程执行

        Returns:

        """
        cls_name = cls.__name__
        self.run_count[cls_name] += 1
        logger.info(f"定时任务 {cls_name} 第 {self.run_count[cls_name]} 次开始运行")
        if is_process:
            pass
            # process = multiprocessing.Process(target=self.class_run, args=(cls, ))
            # # process = multiprocessing.Process(target=self.t)
            # process.start()
            # process.join()
        else:
            self.class_run(cls)
        logger.info(f"定时任务 {cls_name} 执行了 {self.run_count[cls_name]} 次")


    def class_run(self, cls):
        cls_name = cls.__name__
        try:
            c = cls()
            c.run()
        except Exception as e:
            logger.error(f"定时任务 {cls_name} 出错, 原因{e}")

if __name__ == '__main__':
    TimerJob().start()
    time.sleep(100)


