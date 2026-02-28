# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：      start
   Description :   运行爬虫
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""

from config.configParse import config
from start import back_flask
from control import crawlerControl
from plugin.timerJob import TimerJob
from util.host import Host
import logging

if __name__ == '__main__':
    if config.read("setting", "debug"):
        pass
    else:
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)
    # 设置HOST
    Host().setHost()
    # 执行一些定期任务
    TimerJob().start()
    # 载入爬虫控制类
    crawlerControl.getCrawlerControl()
    # 运行flask
    back_flask.run()
