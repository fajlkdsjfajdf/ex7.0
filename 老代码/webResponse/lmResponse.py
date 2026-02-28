from webResponse.response import Response
from bson.objectid import ObjectId
from logger.logger import logger
from datetime import datetime
from util import typeChange
from util import picCheck

class LmResponse(Response):
    # *********************************************** 首页查询方法*********************************
    def __init__(self, request = None, user_id=None):
        super().__init__(request, user_id)
        self.has_list = True
        self.bucket = f"{self.prefix.lower()}image"

    def getThumb(self):
        id = self.getValues("id", None)
        if id:
            data = self.db.getItem(self.main_table, {"_id": typeChange.convertId(id)})
            if data:
                thumb = data["thumb"]
                thumb2 =  ""
                dot_index = thumb.rfind('.')
                if dot_index != -1:
                    # 在后缀名前插入 '-thumb'
                    thumb2 = thumb[:dot_index] + '-thumb' + thumb[dot_index:]
                if thumb2:
                    if not self.minio.existImage(self.bucket, thumb2):
                        if self.minio.existImage(self.bucket, thumb):
                            img = self.minio.getImage(self.bucket, thumb)
                            img2 = picCheck.compress_image(img)
                            if img2:
                                self.minio.uploadImage(self.bucket, thumb2, img2)
                                return img2, "image/jpg"

                    else:
                        img = self.minio.getImage(self.bucket, thumb2)
                        return img, "image/jpg"
        return None, None




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
        date_format = "%Y-%m-%dT%H:%M:%S.%fZ"
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
                                             limit=99999, field={self.main_id: 1, self.list_id: 1, "title": 1, "order": 1})
        new_data = []
        for item in data["data"]:
            main_id = item[self.main_id]
            list = [i for i in list_items if i[self.main_id] == main_id]

            list = sorted(list, key=lambda x: x['order'])
            item["list"] = list
            new_data.append(item)

        data["data"] = new_data
        return data

    # *********************************************** 首页查询方法结束*********************************

    def getInfoExt(self, data):
        id = data["_id"]
        # 获取对应历史记录
        data_history = self.user_info.getHistoryById(self.history_table, id)

        characters_history = {}
        if data_history and "list" in data_history:
            characters_history = data_history["list"]

        find_dict = {self.main_id: data[self.main_id]}

        lists = self.db.getItems(self.list_table, find_dict, limit=99999)
        new_lists = []
        for list in lists:
            if str(list["_id"]) in characters_history:
                list["read_history"] = characters_history[list["_id"]]
            new_lists.append(list)
        new_lists = sorted(new_lists, key=lambda x: x['order'])
        data["lists"] = new_lists
        # print(lists)
        return data


    def getImage(self):
        id = self.getValues("id", None)
        page = self.getValues("page", 1)
        if id:
            data = self.db.getItem(self.list_table, {"_id": typeChange.convertId(id)})
            if data:
                data2 = self.db.getItem(self.main_table, {"aid": data["aid"]})
                if data2:
                    title1 = data2["title"]
                    title2 = data["title"]
                img_title = data["pages"][int(page) - 1]
                img_title = f"{title1}/{title2}/{img_title}"
                if self.minio.existImage(self.bucket, img_title):
                    img = self.minio.getImage(self.bucket, img_title)
                    return img, "image/jpg"

        return None, None

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
                    cid = data["cid"]
                    if cid:
                        self.db.removeItems(self.list_table, {"cid": cid})
