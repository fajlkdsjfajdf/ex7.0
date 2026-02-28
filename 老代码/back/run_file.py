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
from control import webControl
from start import web_flask


if __name__ == '__main__':
    webControl.getWebControl()
    # 运行flask
    web_flask.runFileServer()
