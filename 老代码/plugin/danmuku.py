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
   Description :   rssresponse 类
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""

from db.mongodb import MongoDB
import re
import datetime
from util.xmlBuild import XmlBuild
from networking.webRequest import WebRequest
import json
import xml.etree.ElementTree as ET
import urllib.parse
from plugin.iqiyi_danmu import IqiyiDanmu
from plugin.bilibli_danmu import BilibiliDanmu
from plugin.tencent_danmu import TencentDanmu
from plugin.kedou_danmu import KedouDanmu
from plugin.youku_danmu import YouKuDanmu




class DanmuResponse:
    def __init__(self, request):
        self.request = request
        self.web = WebRequest()
        self.mongo_db = MongoDB()
        # self.api_url = "https://api.dandanplay.net/api/v2"
        self.api_url = "https://api.dandanplay.net/api/v2"



    def danmuData(self):
        type = self.request.values.get("type") if self.request.values.get("type") != None else "get"
        if type == "search":
            # 获取rss
            return self._search()
        elif type == "comment":
            # 设置rss
            return self._comment()
        elif type == "upload":
            # 获取上传弹幕
            return self._upload()
        elif type == "export":
            # 获取引用的第三方弹幕
            return self._export()
        return {}, "json"

    def _upload(self):
        try:
            # print("上传")
            xml = self.request.values.get('xml_content')  # 获取上传的文件对象
            if xml:
                root = ET.fromstring(xml)
                comments = []
                for d in root.findall('d'):
                    parameters = d.attrib['p']
                    p = parameters.split(",")
                    new_p = f"{float(p[0]):.2f},{p[1]},{p[3]},[other]{p[7]}"
                    m = d.text
                    cid = p[4]
                    data = {
                        "cid": cid,
                        "p": new_p,
                        "m": m
                    }
                    comments.append(data)
                info = {
                    "id": int(self.request.values.get("id")),
                    "title": self.request.values.get("title"),
                    "episode": self.request.values.get("episode"),
                    "export": "loaclfile",
                    "comments": comments
                }
                self.mongo_db.processItem("dm-localdm", info, ["id", "export"])
                return {"status": "success", "count": len(comments)}, "json"

        except Exception as e:
            print(e)
        return {"status": "error", "msg": ""}, "json"



    def _export(self):
        try:
            print("引入第三方弹幕")
            export_url = self.request.values.get('export_url', "")  # 获取上传的网址
            export_auto = False
            if not export_url:
                # 去剧集列表里找找有没有，有就引用第三方弹幕
                export_auto = True
                title = self.request.values.get("title", "")
                ep = self.request.values.get("episode", "0")
                print(f"{title}  {ep}")
                if title and ep != "0":
                    tvs = self.mongo_db.getItem("dm-localtvs", {"title": title})
                    if tvs and ep in tvs["tvs"]:
                        export_url = tvs["tvs"][ep]["url"]

            if export_url:
                danmus = []
                tvlists = {}
                export = ""
                if "iqiyi" in export_url:
                    # 爱奇艺弹幕
                    export = "iqiyi"
                    if "mesh.if" in export_url:
                        # 批量剧集导入
                        print(f"批量导入{export} 剧集")
                        tvlists = IqiyiDanmu().getTvList(export_url)
                        # print(tvlists)
                        episode = self.request.values.get("episode")
                        if episode and str(episode) in tvlists:
                            print(tvlists[str(episode)])
                            # danmus = IqiyiDanmu().getDanmu(tvlists[str(episode)]["url"])
                            danmus = KedouDanmu().getdanmu(tvlists[str(episode)]["url"])
                    else:

                        # danmus = IqiyiDanmu().getDanmu(export_url)
                        danmus = KedouDanmu().getdanmu(export_url)
                elif "qq.com" in export_url:
                    # 腾讯视频弹幕
                    export = "tencent"
                    danmus = TencentDanmu().getDanmu(export_url)
                elif "bilibili.com" in export_url:
                    # b站
                    export = "bilibili"
                    danmus = BilibiliDanmu().getDanmu(export_url)
                elif "youku.com" in export_url:
                    # 优酷
                    export = "youku"
                    if not export_auto:
                        tvlists = YouKuDanmu().get_tv_list(export_url)
                    danmus = KedouDanmu().getdanmu(export_url)
                if tvlists and len(tvlists) > 0:
                    info = {
                        "title": self.request.values.get("title"),
                        "tvs": tvlists,
                        "export": export
                    }
                    self.mongo_db.processItem("dm-localtvs", info, "title")

                if danmus and len(danmus) > 0:
                    info2 = {
                        "id": int(self.request.values.get("id")),
                        "title": self.request.values.get("title"),
                        "episode": self.request.values.get("episode"),
                        "export": export,
                        "comments": danmus
                    }
                    # print(info2)
                    self.mongo_db.processItem("dm-localdm", info2, ["id", "export"])
                    return {"status": "success", "count": len(danmus)}, "json"


        except Exception as e:
            print(e)
        return {"status": "error", "msg": ""}, "json"



    def _search(self):
        keyword = self.request.values.get("keyword") if self.request.values.get("keyword") != None else ""
        episode = self.request.values.get("episode") if self.request.values.get("episode") != None else -1
        animeid = self.request.values.get("animeid") if self.request.values.get("animeid") != None else -1
        animeid = int(animeid)
        if animeid > 0:
            # 通过id查询
            find = {"$and":[{"animeId": int(animeid)},
                {"update_time": {"$gt": datetime.datetime.now() - datetime.timedelta(days=7)}}
                ]}
            data = self.mongo_db.getItem("dm-animes", find)
            index = int(episode) - 1
            if data and "episodes" in data:
                print("本地anime有缓存")
                return {"animes": [data]}, "json"
        
        url = f'{self.api_url}/search/episodes?anime={urllib.parse.quote(keyword)}'
        # if episode == -1 or episode=="movie":
            # url = f'{self.api_url}/search/episodes?anime={urllib.parse.quote(keyword)}'
        # else:
            # url = f'{self.api_url}/search/episodes?anime={urllib.parse.quote(keyword)}&episode={episode}'
        # print(url)
        self.web.get(url)
        data = self.web.json

        for anime in data["animes"]:
            item = anime
            item["update_time"] = datetime.datetime.now()
            self.mongo_db.processItem("dm-animes", item, "animeId")
        return data, "json"
    



    def _comment(self):
        id = self.request.values.get("id") if self.request.values.get("id") != None else 0
        # 先去本地库找找有没有
        data = self.mongo_db.getItems("dm-localdm", {"id": int(id)}, limit=5)
        sort_array = ["bilibili", "iqiyi", "tencent", "youku"]

        data = sorted(data, key=lambda x: sort_array.index(x['export']) if x['export'] in sort_array else 9999)

        if data:
            comments = []
            export = []
            req_data = {
                "title": data[0]["title"],
                "episode": data[0]["episode"],
                "export": [],
                "comments": []
            }
            for d in data:
                if "comments" in d and len(d["comments"]) > 0:
                    comments = comments + d["comments"]
                    export.append(d["export"])
            req_data["export"] = export
            req_data["comments"] = comments
            if len(comments) > 0:
                print(f"使用本地弹幕: 弹幕来源{export}")
                return req_data, "json"


        episodeId = self.request.values.get("episodeId") if self.request.values.get("episodeId") != None else 0
        chConvert = 1
        withRelated = self.request.values.get("withRelated") if self.request.values.get("withRelated") != None else "true"
        find = {"$and":[{"eid": int(episodeId)},
                        {"update_time": {"$gt": datetime.datetime.now() - datetime.timedelta(days=7)}}
                        ]}
        data = self.mongo_db.getItem("dm-danmu", find)
        if data != None and withRelated == "true":
            print(f"弹幕使用缓存")
            return data, "json"
        else:
            url = f'https://api.dandanplay.net/api/v2/comment/{episodeId}?withRelated={withRelated}&chConvert={chConvert}'
            self.web.get(url)
            '''if "error" not in self.web.text:'''
            data = self.web.json
            if "error" not  in data:
                data["eid"] = int(episodeId)
                data["update_time"] = datetime.datetime.now()
                if withRelated == "true":
                    self.mongo_db.processItem("dm-danmu", data, "eid")
                return self.web.json, "json"
            else:
                return {"comments": [], "count": 0}, "json"

