import datetime

from webResponse.response import Response
from bson.objectid import ObjectId
from logger.logger import logger
from util import typeChange
import re
from plugin.bilibli_manga import BilibliManga

class MgResponse(Response):
    # *********************************************** 首页查询方法*********************************
    def __init__(self, request = None, user_id=None):
        super().__init__(request, user_id)
        self.has_list = True

    def getTitleSearch(self, search):
        """
        根据标题搜索 一般都是要重载的
        Args:
            search:

        Returns:

        """
        value1 = typeChange.toJianti(search)
        value2 = typeChange.toFanti(search)
        find = {"$or": [{"tags": re.compile(value1, re.IGNORECASE)},
                        {"tags": re.compile(value2, re.IGNORECASE)},
                        {"title": re.compile(value1, re.IGNORECASE)},
                        {"title": re.compile(value2, re.IGNORECASE)},
                        {"title2": re.compile(value1, re.IGNORECASE)},
                        {"title2": re.compile(value2, re.IGNORECASE)}
                        ]}
        return find

    def getTags(self, limit=500):
        """
        getTags重写，将tags分类
        获取tags集
        :return:
        """
        data = {}

        for tag in self.db.getItems(self.tags_table, {}, limit=limit):
            tag["tag_id"] = tag["tag_name"]
            type = tag['tag_type']
            if type in data:
                data[type].append(tag)
            else:
                data[type] = []
                data[type].append(tag)
        return data, "json"

    def getIndexJson(self, data):
        """
        getIndexJson
        需要全部重写，更具不同列名实现
        :return:
        """
        data_new = []
        for d in data:
            # 修改一些列的显示形式 及增加一些列
            d["date"] = d["update_time"].strftime("%Y-%m-%d") if 'update_time' in d and type(d['update_time']) == datetime.datetime else "未知日期"

            data_new.append(d)
        return data_new

    def getIndexData(self, data):
        """
        对index 列表进行额外的处理
        Args:
            data:

        Returns:
        """
        # 去list表中找到最新的一个章节以及统计章节数量
        maid_list = [item[self.main_id] for item in data["data"]]
        list_items = self.db.getItems(self.list_table, {self.main_id: {"$in": maid_list}},
                                             limit=99999, field={self.main_id: 1, self.list_id: 1, "title": 1})
        new_data = []
        for item in data["data"]:
            main_id = item[self.main_id]
            item["list"] = [i for i in list_items if i[self.main_id] == main_id]
            new_data.append(item)
        data["data"] = new_data
        return data

    # *********************************************** 首页查询方法结束*********************************

    def getInfoExt(self, data):
        aid = data["aid"]
        id = data["_id"]
        # 获取对应历史记录
        data_history = self.user_info.getHistoryById(self.history_table, id)

        characters_history = {}
        if data_history and "list" in data_history:
            characters_history = data_history["list"]

        find_dict = {self.main_id: data[self.main_id]}

        lists = self.db.getItems(self.list_table, find_dict, limit=99999)

        list_1 = []
        list_2 = []
        list_3 = []

        for li in lists:
            if str(li["_id"]) in characters_history:
                li["read_history"] = characters_history[li["_id"]]
            li["title"] = f"({li['type']})--{li['title']}"
            if li["type"] == "单话":
                list_1.append(li)
            elif li["type"] == "单行本":
                list_2.append(li)
            else:
                list_3.append(li)
        list_1 = sorted(list_1, key=lambda x: x['order'])
        list_2 = sorted(list_2, key=lambda x: x['order'])
        list_3 = sorted(list_3, key=lambda x: x['order'])
        data["lists"] = list_1 + list_2 + list_3
        # print(lists)
        return data

    def beforeCheck(self, check_type):
        """
        重写beforeCheck
        Args:
            check_type:

        Returns:

        """
        if check_type == "infocheck":
            logger.info(f"{self.prefix} 重载info")
            if self.getValues("checkdata") and len(self.getValues("checkdata")) > 0:
                id = self.getValues("checkdata")[0]
                data = self.db.getItem(self.main_table, {"_id": ObjectId(id)})
                if data:
                    aid = data["aid"]
                    if aid:
                        self.db.removeItems(self.list_table, {"aid": aid})


    def bindData(self):
        """
        重写bindData
        Args:
        Returns:

        """
        try:
            url = self.request.values.get("url", "")
            aid = self.request.values.get("aid", "")
            if url and aid:
                bm = BilibliManga()
                bilibili_id = bm.get_manga_id(url)
                if bilibili_id:
                    aid = int(aid)
                    bilibili_list = bm.get_comic_list(bilibili_id)
                    info = {
                        "aid": aid,
                        "bmid": bilibili_id,
                        "list": bilibili_list
                    }
                    self.db.processItem(f"{self.prefix.lower()}-bind", info, "aid")
                    return {"msg": "绑定完成"}, "json"
        except Exception as e:
            logger.error(f"绑定bilibli漫画失败{e}")
        return {"msg": f"绑定失败 {e}"}, "json"

    def getForum(self):
        id = self.getValues("id", None)
        if id == None:
            return {"status": "error", "msg": "no_id"}, "json"
        find = {"item_id": ObjectId(id)}
        data = self.db.getItem(self.comments_table, find)
        if data:
            if "update_comments" in data and (datetime.datetime.now() - data["update_comments"]) <= datetime.timedelta(hours=2):
                return {"status": "success", "info": data}, "json"
        # 更新评论

        list_data = self.db.getItem(self.list_table, {"_id": ObjectId(id)})
        if list_data:
            item_id = list_data["_id"]
            aid = list_data["aid"]
            pid = list_data["pid"]
            order = typeChange.findnum(list_data["title"])
            bind_data = self.db.getItem(f"{self.prefix.lower()}-bind", {"aid": aid})
            if bind_data and order > 0:
                bind_list = bind_data["list"]
                bind_item = [value for value in bind_list if 'short_title' in value and typeChange.findnum(value['short_title']) == order]
                if(bind_item):
                    bm = BilibliManga()
                    bind_item = bind_item[0]
                    bind_id = bind_item["id"]
                    comments = bm.get_comments(bind_id)
                    comments = [f'short_title: {bind_item["short_title"]} title: {bind_item["title"]}'] + comments
                    if comments:
                        info = {
                            "item_id": item_id,
                            "forums": comments,
                            "aid": aid,
                            "pid": pid,
                            "update_comments": datetime.datetime.now()
                        }
                        self.db.processItem(self.comments_table, info, "item_id")
                        return {"status": "success", "info": info}, "json"
            # update_comments = datetime.datetime.now()


        return {"status": "error", "info": "error"}, "json"
