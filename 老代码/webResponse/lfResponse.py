import datetime
import os.path
import os
from webResponse.response import Response
import time
import re
from util import typeChange
from util import system
from urllib.parse import quote
from media.fileControl import FileControl
from logger.logger import logger
from bson.objectid import ObjectId
from media.lfFileData import LfFileData
from config.configParse import config

class LfResponse(Response):
    pass
    # *********************************************** 首页查询方法*********************************


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

    # *********************************************** 首页查询方法结束*********************************
    def getInfoExt(self, data):
        find_dict = {"bid": data[self.main_id]}
        lists = self.db.getItems(self.list_table, find_dict, limit=99999)

        new_lists = []
        for list in lists:
            new_lists.append(list)
        new_lists = sorted(new_lists , key=lambda x: int(x['ep']))
        data["lists"] = new_lists

        emby_find = {"title": {"$in": [data["name"], data["name_cn"]]}}

        emby_series = self.db.getItems(f"lf-emby-series", emby_find, limit=100)

        data["series"] = emby_series
        data["emby_url"] = config.read("setting", "emby_url")
        # print(lists)
        return data

    def getFile(self):
        id = self.getValues("id", None)
        if id:
            data = self.db.getItem(self.list_table, {"_id": ObjectId(id)})
            if data:
                file = LfFileData().getLocalVideo(data)
                if file:
                    return file, "file"
        return {}, "json"

    def getThumb(self):
        id = self.getValues("id", None)
        thumb_type = self.getValues("thumbmodel", "poster")
        if id:
            bucket, thumb =self.getMinioFileName(id, "thumb", ext=thumb_type)
            if bucket and thumb:
                img = self.minio.getImage(bucket, thumb)
                if img:
                    return img, "image/jpg"
                else:
                    data = self.db.getItem(self.main_table, {"_id": ObjectId(id)})
                    if data:
                        img = None
                        if thumb_type == "poster":
                            img = LfFileData().getLocalPoster(data)
                        elif thumb_type == "fanart":
                            img = LfFileData().getLocalFanart(data)
                        if img:
                            upload_success = self.minio.uploadImage(bucket, thumb, img)
                            if upload_success:
                                return img, "image/jpg"

                    msg = {"msg": f"not found {bucket} : {thumb}"}
                    logger.warning(msg)
                    return msg, "json"
        return None, None

    def getApiSearch(self):
        api_type = self.getValues("api_type", "oneinfo")
        if api_type == "oneinfo":
            device = self.getValues("device", "no")
            # 先去找有没有该设备没有完成的任务
            data = self.db.getItems(self.list_table, {
                "device": device,
                "mask": {"$ne": "finish"}
            })
            if data:
                return data[0], "json"
            data = self.db.getItems(self.list_table,
                            {
                                "type": "有码",
                                "mask": {"$nin": ["finish","down start", "down over", "up"]}
                             },
                            order="score", order_type=-1, limit=1)
            # data = self.db.getItems(self.list_table, {"bid": 409258, "ep": 1})
            if data:
                return data[0], "json"
        elif api_type == "check":
            return {}, "json"
        elif api_type == "down_start":
            bid = int(self.getValues("bid", 0))
            ep = int(self.getValues("ep", 0))
            device = self.getValues("device", "no")

            info = {"bid": bid, "ep": ep, "mask": "down start", "device": device, "down_start_time": datetime.datetime.now()}
            self.db.processItem(self.list_table,info,  ["bid", "ep"])
            return {}, "json"
        elif api_type == "down_over":
            bid = int(self.getValues("bid", 0))
            ep = int(self.getValues("ep", 0))
            info = {"bid": bid, "ep": ep, "mask": "down over"}
            self.db.processItem(self.list_table,info,  ["bid", "ep"])
            return {}, "json"
        elif api_type == "getvideo":
            bid = int(self.getValues("bid", 0))
            ep = int(self.getValues("ep", 0))
            data = self.db.getItem(self.list_table, {"bid": bid, "ep": ep})
            if data:
                file = data["file"]
                file = f'{system.getMainDir()}/{file}'
                file = os.path.abspath(file)
                title = os.path.basename(file)
                title = quote(title)
                # print(file)
                if os.path.exists(file):

                    resp_data = {
                        "file": file,
                        "title": title
                    }
                    # 临时使用, 将file替换为一个本地文件
                    # resp_data["file"] = "D:/源码/e绅士-6.0/test/test.mp4"
                    return resp_data, "largefile"
        elif "upload" in api_type:
            return self.apiUpload()
        return {}, "json"

    def apiUpload(self):

        api_type = self.getValues("api_type", "oneinfo")
        bid = int(self.getValues("bid", 0))
        ep = int(self.getValues("ep", 0))
        if api_type == "startupload":
            data = self.db.getItem(self.list_table, {"bid": bid, "ep": ep})
            if data:
                file_path = data["file"]
                file_path = f'{system.getMainDir()}/{file_path}'
                file_path = os.path.abspath(file_path)
                file_org_dir = os.path.dirname(file_path)
                file_path = file_path.replace("无码里番", "破解里番").replace("普通里番", "破解里番")
                file_dir = os.path.dirname(file_path)
                file_name, file_ext = os.path.splitext(file_path)
                file_path_ass = f"{file_name}.ass"
                file_path = f"{file_name}.mp4"
                # 建立破解文件夹
                FileControl.copyFilesWithoutVideo(file_org_dir, file_dir)
                return {
                    "ass_path" : file_path_ass,
                    "video_path": file_path
                }, "json"
        elif api_type == "overupload":
            data = {"bid": bid, "ep": ep, "mask": "finish"}
            self.db.processItem(self.list_table, data, ["bid", "ep"])
            return {"status": "success"}, "json"
        elif api_type == "uploadfile":
            path = self.request.values.get("path", "")
            num = int(self.request.values.get("num", "-1"))
            checksize = self.request.values.get("checksize", "-1")
            size = int(self.request.values.get("size", "-1"))
            if checksize == "1":
                if os.path.exists(path):
                    if os.path.getsize(path) == size:
                        return {"file": path, "status": "upload success"},"json"
            else:
                data = self.request.data
                if num == 0 and path:
                    print(f"upload {path}")
                    if FileControl.hasFile(path):
                        os.remove(path)
                else:
                    if not FileControl.hasFile(path):
                        return {'msg': f"not find {path}"}, "json"
                with open(path, 'ab') as file:
                    file.write(data)
                return {}, "json"



        return {'msg': "upload_error"}, "json"
