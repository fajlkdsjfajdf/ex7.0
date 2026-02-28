import datetime

from webResponse.response import Response

import time
import re

class ExResponse(Response):

    # *********************************************** 首页查询方法*********************************
    def getIndexFindDefault(self):
        """
        需要重载的方法 默认的find
        :return:
        """
        find = {"$and": [{"update_info": {"$nin": [None, False]}}]}
        return find

    def getField(self):
        """
        getField 获取index页面要显示的页
        :return:
        """
        return {"images": 0}

    def getIndexJson(self, data):
        """
        需要重载的方法，获取了index页面， 是否还有要补充的项目
        :return:
        """
        data_new = []
        for d in data:
            # 从tag中获取语言信息
            language = [tag for tag in d.get("tags", []) if "chinese" in tag]
            d["language"] = "japanese" if len(language) == 0 else "chinese"
            # 修改一些列的显示形式 及增加一些列
            d["date"] = time.strftime("%Y-%m-%d", time.localtime(int(d["posted"]))) if 'posted' in d else "未知日期"
            d["title"] = d["title"] if "title" in d and d["title"] != None and d["title"] != '' else ""
            d["title"] = d["title_jpn"] if "title_jpn" in d and d["title_jpn"] != None and d["title_jpn"] != '' else d["title"]
            data_new.append(d)
        return data_new

    def getTagsSearch(self, tags):
        """
        根据标签查询
        Args:
            tags:

        Returns:

        """
        cate_tags = ["doujinshi", "manga", "artistcg", "gamecg", "non-h", "imageset", "western", "cosplay", "misc"]
        new_tags = []
        new_nin_tags = []
        # db.main.find({"tags" : {"$all": ["chinese", "pantyhose"]}}).sort({"gid": -1}).limit(50)
        type1 = ""
        for key in tags:
            if key.lower() in cate_tags:
                type1 = key
            else:
                if str(key).endswith(":-1"):
                    new_nin_tags.append(key[:-3])
                else:
                    new_tags.append(key)

        if ("cg" in type1):
            type1 = type1.replace("cg", " cg")
        if (type1 == "imageset"):
            type1 = "image set"
        # print(new_tags)
        find = []
        if type1:
            find.append({"category": {"$regex": re.compile(type1, re.IGNORECASE)}})
        if len(new_tags) > 0:
            find.append({"tags": {"$all": new_tags}})
        if len(new_nin_tags) > 0:
            find.append({"tags": {"$nin": new_nin_tags}})

        if len(find)==1:
            find = find[0]
        elif len(find)> 1:
            find ={"$and": find}

        return find

    def getTitleSearch(self, search):
        find = {"$or": [{"tags": {"$regex": search}},
                        {"title": {"$regex": search}},
                        {"title_jpn": {"$regex": search}}
                        ]}
        return find

    def getIndexData(self, data):
        """
        对index 列表进行额外的处理
        Args:
            data:

        Returns:
        """
        # 去list表中找到图片下载信息
        maid_list = [item[self.main_id] for item in data["data"]]
        list_items = self.db.getItems(self.list_table, {self.main_id: {"$in": maid_list}},
                                             limit=99999, field={self.main_id: 1, "image_load": 1})

        new_data = []
        for item in data["data"]:
            main_id = item[self.main_id]
            ext_info = [i for i in list_items if i[self.main_id] == main_id]
            if ext_info:
                item["image_load"] = ext_info[0].get("image_load", 0)
            else:
                item["image_load"] = 0
            new_data.append(item)
        data["data"] = new_data
        return data

    def get_original_search(self, search_str, tags):
        return search_str

    # *********************************************** 首页查询方法结束*********************************

    def getInfoExt(self, data):
        data["date"] = time.strftime("%Y-%m-%d", time.localtime(int(data["posted"]))) if 'posted' in data else "未知日期"
        # 加入阅读日期
        data_history = self.user_info.getHistoryById(self.history_table, data["_id"])
        if data_history:
            data["read_history"] = data_history["read_history"]

        find_dict = {self.main_id: data[self.main_id]}

        info = self.db.getItem(self.list_table, find_dict)
        if info:
            data["image_load"] = info.get("image_load", 0)
            data["mpv_images"] = info.get("mpv_images", [])
            data["mpv"] = info.get("mpv", None)

        return data


    # ***********************************api查询
    def getApiSearch(self):
        type_fun = self.getValues("fun", "")
        if type_fun == "link_item":
            link_data = self.getValues("link")
            self.db.processItem("ex-mosaiclink", link_data, "item_unmosaic_gid")
            return {"status": "success"}, "json"
        if type_fun == "link_del":
            item_unmosaic_gid = self.getValues("item_unmosaic_gid")
            self.db.removeOneById("ex-mosaiclink", {"item_unmosaic_gid": item_unmosaic_gid})
            return {"status": "success"}, "json"
        if type_fun == "get_link":
            item_unmosaic_gid = self.getValues("item_unmosaic_gid")
            data = self.db.getItem("ex-mosaiclink", {"item_unmosaic_gid": item_unmosaic_gid})
            if data:
                return {"status": "success", "info": data}, "json"
        if type_fun == "update_mpv":
            gid = self.getValues("gid")
            token = self.getValues("token")
            mpv = self.getValues("mpv")
            mpv_images = self.getValues("mpv_images")
            info = {
                "gid": int(gid),
                "token": token,
                "mpv": mpv,
                "mpv_images": mpv_images,
                "update_images": datetime.datetime.now()
            }
            self.db.processItem(self.main_table, info, self.main_id)
            return {"status": "success"}, "json"
        if type_fun == "get_mpv":
            gid = self.getValues("gid")
            data = self.db.getItem(self.main_table, {"gid": int(gid)})
            if data and "update_images" in data:
                update_time = data["update_images"]
                # 计算两个时间的差值
                time_difference = datetime.datetime.now() - update_time
                # 判断差值是否大于5小时
                if time_difference < datetime.timedelta(hours=5):
                    return {"status": "success", "mpv": data["mpv"], "mpv_images": data["mpv_images"]}, "json"
        if type_fun == "link_data":
            gid = self.getValues("gid")
            link_data = self.getValues("link_data")
            info = {
                "item_unmosaic_gid": int(gid),
                "link_data": link_data
            }
            self.db.processItem("ex-mosaiclink", info, "item_unmosaic_gid")
            return {"status": "success"}, "json"
        return {}, "json"