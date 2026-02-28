
# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：
   Description :   av检索模块
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""


from db.mongodb import MongoDB
from datetime import datetime
from util import system
import re
import _thread
from db.mongodb import MongoDB


class AvModule:
    def __init__(self):
        self.db = MongoDB()

    def _jbSearch(self, search_str):

        find = {"$or": [{"tags": re.compile(search_str, re.IGNORECASE)},
                    {"aid": re.compile(search_str, re.IGNORECASE)},
                    {"title": re.compile(search_str, re.IGNORECASE)},
                    {"fanhao": re.compile(search_str, re.IGNORECASE)}
                    ]}
        # print(config.read("AV", "db"))
        data = self.db.getItems("jb-main", find, limit=20)
        new_data = []
        for d in data:
            if "pic_l" in d and "ReleaseDate" in d:
                # d["pic_l"] = f"{config.read('JV', 'url')}{d['pic_l']}"
                d["ReleaseDate"] =datetime.strftime(d["ReleaseDate"], "%Y-%m-%d")
                new_data.append(d)
        return new_data

    def search(self, search_str):
        data = self._jbSearch(search_str)
        return data


    def linklog(self, file_path, link_path):
        db = MongoDB()
        file_path = file_path.replace(system.getMainDir(), "")
        link_path = link_path.replace(system.getMainDir(), "")
        data = {"file_path": file_path, "link_path": link_path}

        db.processItems("zlf-av", data, "file_path")

    def getLinkLog(self):
        db = MongoDB()
        data =db.getItems("zlf-av", {}, limit=8888888)
        return data