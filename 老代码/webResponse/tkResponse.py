from webResponse.response import Response
import time
import re
from util import typeChange

class TkResponse(Response):
    pass
    # *********************************************** 首页查询方法*********************************
    def getIndexFindDefault(self):
        """
        需要重载的方法 默认的find
        :return:
        """
        find = {"info_update": {"$nin": [None, False]}}
        return find


    def getTags(self, limit=500):
        """
        getTags重写，将tags分类
        获取tags集
        :return:
        """
        data = []
        mongodata = self.db.getItems(self.tags_table, {}, limit=limit)
        for tag in mongodata:
            if (tag["type"] == "type"):
                tag["tag_id"] = "type:" + tag["tag_name"]
                tag["tag_name"] = "type:" + tag["tag_name"]

            else:
                tag["tag_id"] = tag["tag_name"]
            data.append(tag)
        return {"标签": data}, "json"

    def getTagsSearch(self, tags):
        """
        tag查询重写
        """
        new_tags = []
        type = ""
        # db.main.find({"tags" : {"$all": ["chinese", "pantyhose"]}}).sort({"gid": -1}).limit(50)
        for key in tags:
            if "type" in key:
                type = key.replace("type:", "")
            else:
                new_tags.append(key)
        # print(new_tags)
        if type == "":
            find = {"tags": {"$all": new_tags}}
        else:
            if len(new_tags)> 0:
                find = {"$and": [{"tags": {"$all": new_tags}},
                                 {"type": re.compile(type)}]}
            else:
                find = {"type": re.compile(type)}

        return find

    def getIdFind(self, search):
        """
        可以重载的方法  判断是否为数字或id
        Returns:
        """
        # 番号判断
        pattern = re.compile(r'[A-Za-z]{2,7}-\d{2,5}')
        if len(pattern.findall(search)) > 0:
            # 认为是番号
            find = {"title": re.compile(search)}
            # print("番号查询")
            return find
        else:
            return None

    def getTitleSearch(self, search):
        jianti = typeChange.toJianti(search)
        fanti = typeChange.toFanti(search)

        find = {"$or": [{"tags": re.compile(jianti)},
                        {"title": re.compile(jianti)},
                        {"name": re.compile(jianti)},
                        {"tags": re.compile(fanti)},
                        {"title": re.compile(fanti)},
                        {"name": re.compile(fanti)}
                        ]}
        return find

    def getIndexJson(self, data):
        """
        需要重载的方法，获取了index页面， 是否还有要补充的项目
        :return:
        """
        data_new = []
        for d in data:
            d["date"] = d["date"].strftime("%Y-%m-%d") if 'date' in d else "未知日期"
            data_new.append(d)
        return data_new

    # *********************************************** 首页查询方法结束*********************************
    def getInfoExt(self, data):
        data["date"] = data["date"].strftime("%Y-%m-%d") if 'date' in data else "未知日期"
        return data