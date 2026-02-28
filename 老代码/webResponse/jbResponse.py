import json

from webResponse.response import Response
import time
import re
from util import typeChange
from bson.objectid import ObjectId
from logger.logger import logger
from plugin.jbTool import JbTool
from media.avFileData import AvFileData

class JbResponse(Response):
    pass
    # *********************************************** 首页查询方法*********************************
    def getIndexFindDefault(self):
        """
        需要重载的方法 默认的find
        :return:
        """
        find = {"info_update": {"$nin": [None, False]}}
        return find

    def getIndexJson(self, data):
        """
        需要重载的方法，获取了index页面， 是否还有要补充的项目
        :return:
        """
        data_new = []

        fanhaos = [x["fanhao"] for x in data if "fanhao" in x]
        avdata = AvFileData()
        avfile = avdata.findAvData(fanhaos)

        # 将av信息归档到data
        new_data = []
        for d in data:
            if avfile:
                fanhao = d["fanhao"]
                d["av_file"] = {}
                if (fanhao + "未解码") in avfile:
                    d["av_file"]["未解码"] = avfile[fanhao + "未解码"]
                if (fanhao + "已解码") in avfile:
                    d["av_file"]["已解码"] = avfile[fanhao + "已解码"]
            d["date"] = d["ReleaseDate"].strftime("%Y-%m-%d") if 'ReleaseDate' in d else "未知日期"
            d["fanhao"] = d["fanhao"].lower()
            d["tk"] = []
            new_data.append(d)

        # 通过tukube 查询番号结果
        fanhao_list = [d["fanhao"] for d in data]
        find = {'token': {'$regex': f"{'|'.join(fanhao_list)}", '$options': 'i'}}
        data_tk = self.db.getItems("tk-main", find, limit=1000)
        if data_tk:
            for t in data_tk:
                token = t["token"].lower()
                for d in new_data:
                    if d["fanhao"] in token:
                        d["tk"].append(t)
        data = new_data
        return data

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



    def getIdFind(self, search):
        """
        可以重载的方法  判断是否为数字或id
        Returns:
        """
        # 番号判断
        pattern = re.compile(r'[A-Za-z]{2,7}-\d{2,5}')
        if len(pattern.findall(search)) > 0:
            # 认为是番号
            find = {"fanhao": re.compile(search)}
            # print("番号查询")
            return find
        else:
            return None

    def getTitleSearch(self, search):
        jianti = typeChange.toJianti(search)
        fanti = typeChange.toFanti(search)

        find = {"$or": [{"tags": re.compile(jianti)},
                        {"title": re.compile(jianti)},
                        {"fanhao": re.compile(jianti)},
                        {"tags": re.compile(fanti)},
                        {"title": re.compile(fanti)},
                        {"stars": re.compile(search)},
                        {"fanhao": re.compile(fanti)},
                        {"tags": {"$regex": jianti}},
                        {"tags": {"$regex": fanti}},
                        {"title": {"$regex": jianti}},
                        {"title": {"$regex": fanti}},
                        ]}
        return find

    def getThumb(self):
        img, img_type = super().getThumb()
        if img_type != "image/jpg":
            return "/static/images/wait.gif", "url"
        else:
            is_load_pic = JbTool.checkIsLoadPic(img)
            if not is_load_pic:
                return img, img_type
            else:
                # 重载图像
                id = self.getValues("id", None)
                logger.warning(f"{id} 图像为未打印图像, 重新获取")
                return "/static/images/wait.gif", "url"

    # *********************************************** 首页查询方法结束*********************************
    def getInfoExt(self, data):
        # 从tukube 查找对应的视频信息
        fanhao = data["fanhao"]
        data_tk = self.db.getItems("tk-main", {'token': {'$regex': fanhao, '$options': 'i'}}, limit=100)
        if data_tk:
            data["tk"] = data_tk

        data["date"] = data["ReleaseDate"].strftime("%Y-%m-%d") if 'ReleaseDate' in data else "未知日期"
        return data

    # *********************************************** api查询*********************************
    def getApiSearch(self):

        m_type = self.getValues("mt", "")
        if m_type:
            if m_type == "thumb":
                return self.getThumb()
            elif m_type == "nail":
                return self.getNail()

        id_list = self.getValues("fh_list", [])
        update = self.getValues("update", 0)
        avdata = AvFileData()
        task_id = 0
        if id_list:
            if type(id_list) == str:
                id_list = json.loads(id_list)
            id_list2 = [id.lower() for id in id_list]

            data = self.db.getItems(self.main_table, {"fanhao": {"$in": id_list + id_list2}}, limit=100)
            if data:
                new_data = []
                for d in data:
                    if "PicList" in d:
                        # 修改piclist 中的图片地址
                        d["PicList"] = [typeChange.replace_domain(p, self.cdn) for p in d["PicList"]]
                    if "pic_l" in d:
                        d["pic_l"] = typeChange.replace_domain(d["pic_l"], self.cdn)
                    new_data.append(d)
                data = new_data



            fanhaos = [x["fanhao"] for x in data if "fanhao" in x]
            avfile = avdata.findAvData(fanhaos)
            if avfile:
                # 将av信息归档到data
                new_data = []
                for d in data:
                    fanhao = d["fanhao"]
                    d["av_file"] = {}
                    if (fanhao + "未解码") in avfile:
                        d["av_file"]["未解码"] = avfile[fanhao + "未解码"]
                    if (fanhao + "已解码") in avfile:
                        d["av_file"]["已解码"] = avfile[fanhao + "已解码"]
                    new_data.append(d)
                data = new_data



            # 获取没找到番号的数据
            if update:
                update_id_list = []
                for fanhao in id_list:
                    if not typeChange.checkValueInDictList(data, "fanhao", fanhao):
                        update_id_list.append(fanhao)
                if update_id_list:
                    logger.info(f"需要更新{update_id_list}")
                    task_id = self.tool_api.toolStart("info", update_id_list)
            return {"status": "success", "data": data, "task_id": task_id}, "json"
        return {}, "json"
