import json

from webResponse.response import Response
from bson.objectid import ObjectId
from logger.logger import logger

class BsResponse(Response):
    # *********************************************** 首页查询方法*********************************
    def __init__(self, request = None, user_id=None):
        super().__init__(request, user_id)
        self.has_list = True

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
            d["date"] = d["update_time"].strftime("%Y-%m-%d") if 'update_time' in d else "未知日期"

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

        lists = self.db.getItems(self.list_table, find_dict, limit=99999, field={"content": 0})
        new_lists = []
        for list in lists:
            if str(list["_id"]) in characters_history:
                list["read_history"] = characters_history[list["_id"]]
            new_lists.append(list)
        new_lists = sorted(new_lists, key=lambda x: x['order'])
        # print(new_lists)
        data["lists"] = new_lists

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



    def getEngineSearch(self, search, page_num):
        # 搜索引擎查询
        if self.engine_order:
            order = self.engine_order[0]["order_field"]
            order_type = self.engine_order[0]["order_type"]
            engine_type = "search"
            # 判断search的类型
            if str(search).startswith("$comments:"):
                # 评论查询
                search = search.replace("$comments:", "").strip()
                engine_type  = "comments"

            # search = typeChange.toFanti(search)
            search_arr = self.engine_text_part.jp_part(search, False)
            search_arr = list(set(search_arr))
            if search_arr:

                text = ""
                for s in search_arr:
                    text += f'"{s}" '
                text = text.strip()
                find = {"$text": {"$search": text}}
                if engine_type == "search":
                    data_engine = self.db.getItems(self.engine_table,
                                            find,
                                            skip=(page_num - 1) * 50,
                                            limit=50,
                                            order=order,
                                            order_type=order_type
                                            )
                    ids = [ObjectId(d["_id"]) for d in data_engine]
                    count = self.db.getCount(self.engine_table, find)

                    data = self.db.getItems(self.main_table, {"_id": {"$in": ids}},field=self.getField(),
                                            limit=50, order=order, order_type=order_type)
                    page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1
                    resp_data = {"count": count, "page_num": page_num, "page_count": page_count,
                                 "data": self.getIndexJson(data)}
                elif engine_type=="comments":
                    data_engine = self.db.getItems(self.comments_table,
                                            find,
                                            skip=(page_num - 1) * 50,
                                            limit=50,
                                            order="pid",
                                            order_type=-1
                                            )
                    data_comments = {}
                    for d in data_engine:
                        comment = ""
                        for c in d["forums"]:
                            if search in c:
                                comment = c
                                break
                        data_comments[d["aid"]] = {"aid": d["aid"], "pid": d["pid"], "c": comment}


                    ids = [d["aid"] for d in data_engine]
                    count = self.db.getCount(self.comments_table, find)

                    data = self.db.getItems(self.main_table, {"aid": {"$in": ids}},field=self.getField(),
                                            limit=50, order=order, order_type=order_type)
                    for d in data:
                        d["comment_info"] = data_comments[d["aid"]] if d["aid"] in data_comments else ""


                    page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1
                    resp_data = {"count": count, "page_num": page_num, "page_count": page_count,
                                 "data": self.getIndexJson(data)}
                return resp_data


        return {"count": 0, "page_num": page_num, "page_count": 0,
                     "data": self.getIndexJson({})}


    def getContent(self):
        id = self.getValues("id", "")
        if id:
            data = self.db.getItem(self.list_table, {"_id": ObjectId(id)}, field={"content": 1})
            if data and "content" in data and data["content"] and data["content"] != "{}":
                content = data["content"]
                content = json.loads(content)
                return {"content": content}, "json"
        return {}, "json"