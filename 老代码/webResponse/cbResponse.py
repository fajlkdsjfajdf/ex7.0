from webResponse.response import Response
from bson.objectid import ObjectId
from logger.logger import logger
from util import typeChange

class CbResponse(Response):
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
            d["pic"] = f"imgcache?path=cb/{typeChange.strToMd5(d['pic'])}"
            data_new.append(d)
        return data_new

    def getInfoExt(self, data):
        data["pic"] = f"imgcache?path=cb/{typeChange.strToMd5(data['pic'])}"

        reco = data["reco"]
        if reco:
            reco2 = self.db.getItems("cm-main", {"aid": {"$in": reco}}, limit=100)
            for d in reco2:
                d["date"] = d["update_time"].strftime("%Y-%m-%d") if 'update_time' in d else "未知日期"
            data["reco"] = reco2
        else:
            reco = []

        return data

    def getField(self):
        """
        getField 获取index页面要显示的页
        :return:
        """
        return {"content": 0, "comments": 0}

