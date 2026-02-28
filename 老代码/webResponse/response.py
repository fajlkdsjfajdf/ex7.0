# respon 总类
import configparser
import datetime
import os
import time

from db.mongodb import MongoDB
from bson.objectid import ObjectId
from logger.logger import logger
from auth.user import UserInfo
from flask import jsonify, send_file, redirect
import flask
from util import typeChange
from config.configParse import config
from config import defaultsConfig
from db.minio import MinioClient
from tools.toolApi import ToolApi
from plugin.participleTool import Participle
import json
from plugin.bilibli_manga import BilibliManga
import re


class Response:
    def __init__(self, request = None, user_id=None):
        self.request = request if request else None
        self.user_info = UserInfo(user_id) if user_id else None # 设置用户信息
        self.setConfig()        # 设置基础参数

    def getName(self):
        return (self.__class__.__name__).replace("Response", "")

    def getPrefix(self):
        web_sort = config.read("setting", "web_sort")
        response_name = self.getName()
        prefix = ""
        for p in web_sort:
            if response_name.startswith(typeChange.capitalizeFirstLetter(p)):
                prefix = p
                break
        return prefix

    def setConfig(self):
        """
        设置一些response 的基本参数
        :return:
        """
        try:
            self.prefix = self.getPrefix()
            self.db = MongoDB()
            self.minio = MinioClient()
            self.tool_api = ToolApi(self.prefix.lower())
            self.main_table = f"{self.prefix.lower()}-main"
            self.list_table = f"{self.prefix.lower()}-list"
            self.tags_table = f"{self.prefix.lower()}-tags"
            self.history_table = f"{self.prefix.lower()}-history"
            self.bookmark_table = f"{self.prefix.lower()}-bookmark"
            self.comments_table = f"{self.prefix.lower()}-comments"
            self.main_id = config.read(self.prefix.upper(), "main_id")
            self.list_id = config.read(self.prefix.upper(), "list_id")
            self.engine_table  = f"{self.prefix.lower()}-search"
            self.engine_search = config.read(self.prefix.upper(), "part")
            self.engine_order = config.read(self.prefix.upper(), "order")
            self.engine_text_part = Participle()
            self.cdn = config.read(self.prefix.upper(), "cdn")
            self.has_list = False
        except Exception as e:
            logger.error(f"设置response config出错 {e}")

    def getValues(self, key, default=None):
        """
        获取request 的参数
        :param key: key
        :param default: 默认
        :return:
        """
        if key in self.request.values and self.request.values[key] != None and self.request.values[key] != "":
            return self.request.values[key]
        else:
            return default


    # *********************************************** 首页查询方法*********************************

    def getField(self):
        """
        需要重载的方法，获取list 时需要显示的列或者不需要显示的列
        :return:
        """
        return None

    def getIndexJson(self, data):
        """
        需要重载的方法，获取了index页面， 是否还有要补充的项目
        :return:
        """
        return data

    def getIndexFindDefault(self):
        """
        需要重载的方法 默认的find
        :return:
        """
        return {}

    def getIdFind(self, search):
        """
        可以重载的方法  判断是否为数字或id
        Returns:
        """
        id = typeChange.convertId(search)
        if id:
            return {self.main_id: id}
        else:
            return None

    def getParamSearch(self, search_str):
        """
        paramSearch
        根据不同的数据重写，判断是否列名:数值查找
        如 @title:111 查找title列名为111的
        :return:
        """
        if "@" in search_str and ":" in search_str:
            key = search_str.replace("@", "").split(":")[0]
            value = search_str.replace("@", "").split(":")[1]
            if key != "" and value !="":
                if "$in-" in value:
                    value = value.replace("$in-", "")
                    value1 = typeChange.toJianti(value)
                    value2 = typeChange.toFanti(value)
                    find = {key: {"$in": [value1, value2]}}
                    # print(find)
                elif "$lk-" in value:
                    value = value.replace("$lk-", "")
                    find = {"$or": [{key: re.compile(typeChange.toJianti(value))},
                                    {key: re.compile(typeChange.toFanti(value))}]}
                elif "$eq-" in value:
                    value = value.replace("$eq-", "")
                    find = {"$or": [{key: typeChange.toJianti(value)},
                                    {key: typeChange.toFanti(value)}]}
                    # print(find)
                else:
                    if str(value).isdigit():
                        value = int(value)
                    find = {key: value}
                return find
        return None

    def getCommentsInfo(self, data, comment):
        """

        Args:
            data: 数据
            comment: 查询的评论

        Returns:

        """
        comments = []
        for i in data:
            if "forums" in i:
                for c in i["forums"]:
                    if comment in c:
                        comments.append(c)
        # print(comments)
        return comments

    def getEngineSearch(self, search, page_num, order, order_type):
        # 搜索引擎查询
        if self.engine_order:

            engine_type = "search"
            # 判断search的类型
            if str(search).startswith("$comments:"):
                # 评论查询
                search = search.replace("$comments:", "").strip()
                engine_type = "comments"

            # search = typeChange.toFanti(search)
            search_arr = self.engine_text_part.jp_part(search, False)
            search_arr = list(set(search_arr))
            if search_arr:

                text = ""
                for s in search_arr:
                    text += f'"{s}" '
                text = text.strip()
                find = {"$text": {"$search": text}}
                page_count = 0
                count = 0
                data = []

                search_table = self.engine_table
                search_table_id = "_id"
                if engine_type == "comments":
                    search_table = self.comments_table
                    search_table_id = self.main_id
                pipline = [
                    {
                        '$match': {
                            '$text': {'$search': text}
                        }
                    },
                    {
                        '$group': {
                            '_id': f"${search_table_id}",
                            'documents': {'$push': "$$ROOT"}
                        }
                    },
                    {
                        '$lookup': {
                            'from': self.main_table,
                            'localField': "_id",
                            'foreignField': f"{search_table_id}",
                            'as': "mainData"
                        }
                    },
                    {
                        '$unwind': "$mainData"
                    },

                    {
                        '$sort': {f"mainData.{order}": order_type}
                    },
                    {
                        '$skip': (page_num - 1) * 50
                    },
                    {

                        '$limit': 50
                    },
                    {
                        '$facet': {
                            'results': [{'$project': {'_id': 0, 'aid': 1, 'documents': 1, 'mainData': 1}}],
                            'count': [{'$count': "totalCount"}]
                        }
                    },
                    {
                        '$project': {
                            'results': 1
                        }
                    }
                ]




                data_engine = self.db.aggregate(search_table, pipline)
                if data_engine:
                    for i in data_engine[0]["results"]:
                        main_data = i["mainData"]

                        if engine_type == "comments":
                            # 评论页面的额外处理
                            main_data["comments_info"] = self.getCommentsInfo(i["documents"], search)
                        data.append(main_data)
                count = self.db.getCount(search_table, find)
                page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1

                resp_data = {"count": count, "page_num": page_num, "page_count": page_count,
                             "data": self.getIndexJson(data)}
                return resp_data


                # if engine_type == "search":
                #     data_engine = self.db.aggregate(self.engine_table, pipline)
                #     count = self.db.getCount(self.comments_table, find)
                #     page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1
                #
                #     data_engine = self.db.getItems(self.engine_table,
                #                                    find,
                #                                    skip=(page_num - 1) * 50,
                #                                    limit=50,
                #                                    order=order,
                #                                    order_type=order_type
                #                                    )
                #     ids = [ObjectId(d["_id"]) for d in data_engine]
                #     count = self.db.getCount(self.engine_table, find)
                #
                #     data = self.db.getItems(self.main_table, {"_id": {"$in": ids}}, field=self.getField(),
                #                             limit=50, order=order, order_type=order_type)
                #     page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1
                #     resp_data = {"count": count, "page_num": page_num, "page_count": page_count,
                #                  "data": self.getIndexJson(data)}
                # elif engine_type == "comments":
                #
                #
                #
                #
                #
                #     if data_engine :
                #         count = self.db.getCount(self.comments_table, find)
                #         page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1
                #         for i in data_engine[0]["results"]:
                #             main_data = i["mainData"]
                #             data.append(main_data)
                #
                #     resp_data = {"count": count, "page_num": page_num, "page_count": page_count,
                #                  "data": self.getIndexJson(data)}
                    # data_engine = self.db.getItems(self.comments_table,
                    #                                find,
                    #                                skip=(page_num - 1) * 50,
                    #                                limit=50,
                    #                                order="pid",
                    #                                order_type=-1
                    #                                )
                    # data_comments = {}
                    # for d in data_engine:
                    #     comment = ""
                    #     for c in d["forums"]:
                    #         if search in c:
                    #             comment = c
                    #             break
                    #     data_comments[d["aid"]] = {"aid": d["aid"], "pid": d["pid"], "c": comment}
                    # ids = [d["aid"] for d in data_engine]
                    # count = self.db.getCount(self.comments_table, find)
                    #
                    # data = self.db.getItems(self.main_table, {"aid": {"$in": ids}}, field=self.getField(),
                    #                         limit=50, order=order, order_type=order_type)
                    # for d in data:
                    #     d["comment_info"] = data_comments[d["aid"]] if d["aid"] in data_comments else ""
                    #
                    # page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1
                    # resp_data = {"count": count, "page_num": page_num, "page_count": page_count,
                    #              "data": self.getIndexJson(data)}
                return resp_data

        return {"count": 0, "page_num": page_num, "page_count": 0,
                "data": self.getIndexJson({})}


    def getTitleSearch(self, search):
        """
        根据标题搜索 一般都是要重载的
        Args:
            search:

        Returns:

        """
        value1 = typeChange.toJianti(search)
        value2 = typeChange.toFanti(search)
        find = {"$or": [{"tags": re.compile(value1)},
                        {"tags": re.compile(value2)},
                        {"title": re.compile(value1)},
                        {"title": re.compile(value2)}
                        ]}
        return find

    def getTagsSearch(self, tags):
        """
        标签查询
        Args:
            tags:

        Returns:

        """
        new_tags = []
        new_nin_tags = []
        for key in tags:
            if str(key).endswith(":-1"):
                new_nin_tags.append(key[:-3])
            else:
                new_tags.append(key)

        find = []
        if len(new_tags) > 0:
            find.append({"tags": {"$all": new_tags}})
        if len(new_nin_tags) > 0:
            find.append({"tags": {"$nin": new_nin_tags}})

        if len(find) == 1:
            find = find[0]
        elif len(find) > 1:
            find = {"$and": find}
        return find


    def getIndexFind(self, search_str, tags):
        """
        getIndexFind
        构建find搜索
        :return:
        """
        find = self.getIndexFindDefault()
        if search_str != "":
            # 有查询内容时忽视tags
            # id查询
            if str(search_str).startswith("$search:"):
                # 直连查询 把前缀删除了先正常查询
                search_str = search_str.replace("$search:", "")
                self.getToolSearch(search_str)

            find = self.getIdFind(search_str)
            if find == None:
                # 参数查询
                find = self.getParamSearch(search_str)
                if find == None:

                    # 内容查询
                    if self.engine_search:
                        find = "engine_search"
                    else:
                        find = self.getTitleSearch(search_str)
        elif len(tags) > 0:
            # tag查询
            find = self.getTagsSearch(tags)
        if find == {}:
            # 不让find做空查询
            find = {"_id": {"$ne": None}}
        return find

    def getIndexData(self, data):
        """
        需要重载 对列表data 进行额外的处理
        Args:
            data:

        Returns:

        """
        return data

    # *********************************************** 首页查询方法结束*********************************

    def getInfoExt(self, data):
        """
        获取info页的额外记录
        Args:
            data:

        Returns:

        """
        return data


    def getMinioFileName(self, id, web_type, page=-1, is_list=False, ext=""):
        """
        根据objectid 获取thumb的bucket 和路径
        :param id:
        :return:
        """
        id = ObjectId(id)
        id_name = self.main_id
        table_name = self.main_table
        data = None
        if is_list:
            id_name = self.list_id
            table_name = self.list_table

        data = self.db.getItem(table_name, {"_id": id}, field={id_name: 1})


        path = ""
        path_header = ""
        page = int(page)
        bucket = None
        path = None
        if data and id_name in data:
            main_id = data[id_name]
            if typeChange.isNumber(main_id):
                id = int(main_id)
                bucket = f"{self.prefix.lower()}{web_type.lower()}"
                path_header = f"{id // 1000}/{id}"
            else:
                id = str(main_id)
                bucket = f"{self.prefix.lower()}{web_type.lower()}"
                path_header = f"{id[:5]}/{id}"
        if page > 0:
            path = f"{path_header}/{page:04d}{ext}.jpg"
        else:
            path = f"{path_header}{ext}.jpg"
        if bucket and path:
            return bucket, path
        else:
            return None, None

    def beforeCheck(self, check_type):
        # check 前需要做的工作
        pass


    def sendFile(self, file):
        with open(file, 'rb') as targetfile:
            while 1:
                data = targetfile.read(20 * 1024 * 1024)  # 每次读取20M
                if not data:
                    break
                yield data

    def getFileName(self, request_type, img_type):
        file_name = f"{int(time.time())}.{img_type}"
        if request_type =="image":
            id = self.request.values.get("id", "")
            page = self.request.values.get("page", "")
            file_name = f"{self.prefix}-{id}-{page}.{img_type}"
        return file_name

    def getResponse(self):
        """
        response 的最终方法， 所有的结果都在这个方法返回
        :return:
        """

        type = self.request.values.get("type", "")
        data = None
        data_type = None

        if type == "webs":
            data, data_type = self.getWebs()
        elif type == "list":
            data, data_type = self.getList()
        elif type == "thumb":
            data, data_type = self.getThumb()
        elif type == "nail":
            data, data_type = self.getNail()
        elif type == "image":
            data, data_type = self.getImage()
        elif type == "imagetran":
            data, data_type = self.getImageTran()
        elif type == "imagedecode":
            data, data_type = self.getImageDecode()
        elif type == "imagebig":
            data, data_type = self.getImageBig()
        elif type == "bind":
            data, data_type = self.bindData()
        elif type == "taskinfo":
            data, data_type = self.getTaskinfo()
        elif type == "tags":
            data, data_type = self.getTags()
        elif type == "info":
            data, data_type = self.getInfo()
        elif type == "forum":
            data, data_type = self.getForum()
        elif type == "content":
            data, data_type = self.getContent()
        elif type == "bookmark":
            data, data_type = self.bookMark()
        elif type == "history":
            data, data_type = self.history()
        elif type == "realurl":
            data, data_type = self.getRealUrl()
        elif type == "file":
            data, data_type = self.getFile()
        elif type == "apisearch":
            data, data_type = self.getApiSearch()
        elif type == "bilibilimanga":
            data, data_type = self.getBilibiliManga()
        elif "check" in type:
            data, data_type = self.getCheck()



        if data_type:
            try:
                # 返回值的类型
                if data_type == "json":
                    data = typeChange.cleanJson(data)  # 清洗数据
                    response = jsonify(data)
                    response.headers['Content-Type'] = 'application/json; charset=utf-8'
                    return response
                elif data_type == "file":
                    return send_file(data)
                elif data_type == "url":
                    return redirect(data)
                elif data_type == "image/jpg":
                    img_type = typeChange.get_image_type(data)
                    mimetype = "image/jpg"
                    if img_type== "png":
                        mimetype = "image/png"
                    elif img_type == "gif":
                        mimetype = "image/gif"
                    if img_type == "unknown":
                        img_type = "jpg"
                    data = typeChange.convertBytesIO(data)
                    file_name = self.getFileName(type, img_type)
                    return send_file(data, mimetype=mimetype, download_name=file_name)
                elif data_type == "largefile":
                    # 获取大文件的路径
                    file = data["file"]
                    title = data["title"]

                    response = flask.Response(self.sendFile(file), content_type='application/octet-stream')
                    response.headers["Content-disposition"] = 'attachment; filename=%s' % title  # 如果不加上这行代码，导致下图的问题
                    response.headers['content-length'] = os.stat(str(file)).st_size
                    return response
            except Exception as e:
                msg = f"无法返回数据 原因{e}"
                data = self.request.values
                data["msg"] = msg
                logger.error(msg)
                return data, 200, {'ContentType': 'application/json'}
        else:
            # 啥都不是的默认返回值
            data = self.request.values
            data["msg"] = "unknow request"
            return data, 200, {'ContentType': 'application/json'}


    def getWebs(self):
        """
        获取web列表
        :return:
        """
        web_sort = config.read("setting", "web_sort")
        default_web = config.read("setting", "web_default")
        web_list = []
        for prefix in web_sort:
            web = config.readSection(prefix)
            if web and "show" in web and web["show"]:
                if prefix == default_web:
                    web["default"] = True
                web["prefix"] = prefix.lower()
                web_list.append(web)
        return web_list, "json"

    def getList(self):
        """
        获取首页列表
        :return:
        """
        # 提取基础参数
        is_history = int(self.getValues("history", 0))      # 历史查询
        is_bookmark = int(self.getValues("mark", 0))        # 收藏查询
        search_str = self.getValues("search", "")           # 查询语句
        order = self.getValues("order", defaultsConfig.getOrder(self.prefix)) # 排序列名称
        order_type = defaultsConfig.getOrderType(self.prefix, order)
        page_num = int(self.getValues("page", 1))           # 页码
        tags = self.getValues("tags", "[]")                 # tag 的json
        resp_data = None
        if is_history == 1:             # 历史搜索
            item_ids, count = self.user_info.getHistory(self.history_table, page_num)
            data = self.db.getItems(
                self.main_table,
                {"_id": {"$in": item_ids}},
                field=self.getField(),
                limit=50
            )
            # 让data 根据上面搜索到的id重新排序 才是正确的阅读劣势记录
            data = sorted(data,
                          key=lambda x: item_ids.index(ObjectId(x['_id'])) if ObjectId(x['_id']) in item_ids else len(
                              item_ids))

            page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1
            resp_data = {"count": count, "page_num": page_num, "page_count": page_count,
                    "data": self.getIndexJson(data)}

        elif is_bookmark == 1:          # 收藏搜索
            """
                收藏的查询， 先去查找一个用户所有收藏的记录， 再去查找该用户历史浏览的记录，
                让收藏记录根据历史浏览记录排序， 如果只有收藏没有浏览就排到最下面
            """
            item_bookmark_ids, bookmark_count = self.user_info.getBookmark(self.bookmark_table, 1, limit=999999)

            item_history_ids, history_count = self.user_info.getHistory(
                self.history_table,
                1,
                limit=999999,
                find={"item_id": {"$in": item_bookmark_ids}})   # 从历史浏览中获取所有id

            item_bookmark_ids = sorted(item_bookmark_ids,
                          key=lambda x: item_history_ids.index(ObjectId(x)) if ObjectId(x) in item_history_ids else len(
                              item_history_ids))
            # 将id数组分页
            item_ids_split = [item_bookmark_ids[i:i + 50] for i in range(0, len(item_bookmark_ids), 50)]
            find = {"_id": {"$in": item_ids_split[page_num - 1] if (page_num - 1) < len(item_ids_split) else [1]}}
            data = self.db.getItems(self.main_table, find, field=self.getField(), limit=50)
            data = sorted(data,
                          key=lambda x: item_bookmark_ids.index(ObjectId(x['_id'])) if ObjectId(x['_id']) in item_bookmark_ids else len(
                              item_bookmark_ids))
            count = bookmark_count
            page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1

            resp_data = {"count": count, "page_num": page_num, "page_count": page_count,
                    "data": self.getIndexJson(data)}
        else:
            """
            返回标准的list 有tags 优先依照tags, 没有就依照search
            """
            # print(order)
            resp_data = {}
            if order=="original":
                # 直连查询
                resp_data = self.get_original_list(search_str, tags, page_num)
            else:

                tags = json.loads(tags)
                find = self.getIndexFind(search_str, tags)  # 获取find
                if type(find)== str and find == "engine_search":
                    # 搜索引擎查询
                    resp_data = self.getEngineSearch(search_str, page_num, order=order, order_type=order_type)

                else:
                    data = self.db.getItems(self.main_table,
                                            find,
                                            field=self.getField(),
                                            skip=(page_num - 1) * 50,
                                            limit= 50,
                                            order=order,
                                            order_type=order_type
                                            )
                    count = self.db.getCount(self.main_table, find)
                    # count = 100000
                    page_count = int(count / 50) if count % 50 == 0 else int(count / 50) + 1
                    resp_data = {"count": count, "page_num": page_num, "page_count": page_count,
                            "data": self.getIndexJson(data)}
        if resp_data:
            # 对data 进行处理, 一般没有必要
            resp_data = self.getIndexData(resp_data)
            return resp_data, "json"
        return None, None


    def get_original_search(self, search_str, tags):
        return search_str

    def get_original_list(self, search_str, tags, page_num):
        resp_data = {}
        ids = []
        try:
            id = self.tool_api.toolStart("", {"page": page_num, "search": self.get_original_search(search_str, tags)})
            if id:
                for i in range(10):
                    data = self.tool_api.getInfo(id)
                    # print(data)
                    if "info" in data and len(data["info"])>0 and "data" in data["info"][0] :
                        d = data["info"][0]["data"]
                        ids = [i["_id"] for i in d]
                        break
                    else:
                        time.sleep(3)
            if ids:
                info_id = self.tool_api.toolStart("info", ids)
                if info_id:
                    for i in range(10):
                        d2 = self.tool_api.getInfo(info_id)
                        m_data = self.db.getItems(self.main_table, {"_id": {"$in": typeChange.convertObjectId(ids)}}, limit=100)
                        if "over" in d2 and d2["over"] == "True":
                            resp_data = {"count": 500, "page_num": 1, "page_count": 5,
                            "data": self.getIndexJson(m_data)}
                            break
                        time.sleep(3)
        except Exception as e:
            logger.warning(f"获取直连列表错误: {e}")

        return resp_data

    def getThumb(self):
        id = self.getValues("id", None)
        if id:
            bucket, thumb =self.getMinioFileName(id, "thumb")
            if bucket and thumb:
                img = self.minio.getImage(bucket, thumb)
                if img:
                    return img, "image/jpg"
                else:
                    msg = {"msg": f"not found {bucket} : {thumb}"}
                    logger.warning(msg)
                    return msg, "json"
        return None, None


    def getNail(self):
        id = self.getValues("id", None)
        page = self.getValues("page", 0)
        if id:
            bucket, thumb =self.getMinioFileName(id, "nail", page)
            if bucket and thumb:
                img = self.minio.getImage(bucket, thumb)
                if img:
                    return img, "image/jpg"
                else:
                    msg = {"msg": f"not found {bucket} : {thumb}"}
                    # logger.warning(msg)
                    return msg, "json"
        return None, None

    def getImage(self):
        id = self.getValues("id", None)
        page = self.getValues("page", 0)
        if id:
            bucket, thumb =self.getMinioFileName(id, "image", page, self.has_list)
            if bucket and thumb:
                img = self.minio.getImage(bucket, thumb)
                if img:
                    return img, "image/jpg"
                else:
                    msg = {"msg": f"not found {bucket} : {thumb}"}
                    # logger.warning(msg)
                    return msg, "json"
        return None, None

    def getImageTran(self):
        """
        获取翻译图片
        Returns:

        """
        id = self.getValues("id", None)
        page = self.getValues("page", 0)
        check = int(self.getValues("check", 0))
        if id:
            bucket, thumb =self.getMinioFileName(id, "image", page, self.has_list, ".t")
            if bucket and thumb:
                if check == 0:
                    bucket, thumb = self.getMinioFileName(id, "image", page, self.has_list, ".t")
                    if bucket and thumb:
                        img = self.minio.getImage(bucket, thumb)
                        if img:
                            return img, "image/jpg"

                elif check == 1:
                    exist_flag = self.minio.existImage(bucket, thumb)
                    if exist_flag:
                        msg = {"status": "success"}
                        return msg, "json"
                    else:
                        # 将传入翻译工具
                        bucket, thumb = self.getMinioFileName(id, "image", page, self.has_list)
                        img = self.minio.getImage(bucket, thumb)
                        if img:
                            id = self.tool_api.tranStart(img)
                            if id:
                                msg = {"status": "wait", "id": id}
                            else:
                                msg = {"status": "error", "msg": "no task id"}
                        else:
                            msg = {"status": "error", "msg": "no image"}
                        return msg, "json"
                elif check == 2:
                    tid = self.getValues("tid")
                    msg = {"status": "wait"}
                    if tid:
                        complete =self.tool_api.getTranInfo(tid)
                        if complete:
                            data = self.tool_api.getTranImg(tid)
                            bucket, thumb = self.getMinioFileName(id, "image", page, self.has_list, ".t")
                            if bucket and thumb:
                                up_success = self.minio.uploadImage(bucket, thumb, data)
                                if up_success:
                                    msg =  {"status": "success"}

                    return msg, "json"
        return None, None

    def getImageDecode(self):
        """
        图片去码
        """
        id = self.getValues("id", None)
        page = self.getValues("page", 0)
        m = int(self.getValues("m", 0))
        d_model = "deepcreampy-bar-rcnn"
        if m == 1:
            d_model = "deepcreampy-mosaic-rcnn"
        elif m == 2:
            d_model = "deepcreampy-mosaic-rcnn-esrgan"

        if id:
            bucket, thumb =self.getMinioFileName(id, "image", page, self.has_list, f".d{m}")
            if bucket and thumb and self.minio.existImage(bucket, thumb):
                # 图片已经去码
                img = self.minio.getImage(bucket, thumb)
                return img, "image/jpg"
            else:
                bucket, thumb = self.getMinioFileName(id, "image", page, self.has_list)
                img_ori = self.minio.getImage(bucket, thumb)        # 获取原图
                if img_ori:
                    img = self.tool_api.getDecodeImg(img_ori, d_model)
                    if img:
                        bucket, thumb = self.getMinioFileName(id, "image", page, self.has_list, f".d{m}")
                        self.minio.uploadImage(bucket, thumb, img)
                        return img, "image/jpg"


        return {"start": "error", "msg": "no data"}, "json"

    def getImageBig(self):
        """
        图片放大
        """
        id = self.getValues("id", None)
        page = self.getValues("page", 0)
        b_type = int(self.getValues("b", 2)) # 图片的放大模式, 1为降噪， 2为降噪并放大

        if id:
            bucket, thumb =self.getMinioFileName(id, "image", page, self.has_list, f".big")
            if bucket and thumb and self.minio.existImage(bucket, thumb):
                # 图片已经放大
                img = self.minio.getImage(bucket, thumb)
                return img, "image/jpg"
            else:
                bucket, thumb = self.getMinioFileName(id, "image", page, self.has_list)
                img_ori = self.minio.getImage(bucket, thumb)        # 获取原图
                if img_ori:
                    img = self.tool_api.getWaifuBigImg(img_ori, thumb, b_type)
                    if img:
                        bucket, thumb = self.getMinioFileName(id, "image", page, self.has_list, f".big")
                        self.minio.uploadImage(bucket, thumb, img)
                        return img, "image/jpg"
                    else:
                        # 返回标准图片
                        bucket, thumb = self.getMinioFileName(id, "image", page, self.has_list)
                        self.minio.uploadImage(bucket, thumb, img)
                        return img, "image/jpg"


        return {"start": "error", "msg": "no data"}, "json"


    def getToolSearch(self, search_str):
        """
        直连查询
        Returns:

        """
        data = {
            "search": search_str,
            "page": 1
        }
        self.tool_api.toolStart("", data)

    def getCheck(self):
        """
        获取thumb的状态 需要调用tools
        :return:
        """
        type = self.request.values.get("type", "")
        self.beforeCheck(type)
        data = self.getValues("checkdata", [])
        # print(data)
        if len(data)> 0:
            id = self.tool_api.toolStart(type.replace("check", ""), data)
            if id:
                return {"start": "success", "id": id} , "json"
            else:
                return {"start": "error", "msg": "no id"}, "json"
        else:
            return {"start": "error", "msg": "no data"}, "json"

    def getTaskinfo(self):
        """
        根据id 获取thumb的状态
        Returns:

        """
        id = self.getValues("id")
        if id:
            info = self.tool_api.getInfo(id)
            if info:
                return {"status": "success", "info": info} , "json"
            else:
                return {"status": "error", "msg": "no info"}, "json"
        else:
            return {"status": "error", "msg": "no id"}, "json"

    def getTags(self):
        """
        获取tags 一般都没有, 少数几个重载
        Returns:
        """
        return None, None

    def getInfo(self):
        """
        获取info
        Returns:

        """
        id = self.getValues("id", None)
        if id == None:
            return "", None
        find = {"_id": ObjectId(id)}
        data = self.db.getItem(self.main_table, find)
        if data:
            # 获取是否收藏了
            bookmark = self.user_info.getBookmarkById(self.bookmark_table, id)
            if bookmark:
                data["bookmark"] = bookmark
            else:
                data["bookmark"] = 0

            # 获取真实url
            data["url"] = config.read(self.prefix.upper(), "url")
            # 获取额外信息
            data = self.getInfoExt(data)
            return data, "json"
        else:
            return {"没有找到对应id"}, "json"

    def getForum(self):
        id = self.getValues("id", None)
        if id == None:
            return {"status": "error", "msg": "no_id"}, "json"
        find = {"item_id": ObjectId(id)}
        data = self.db.getItem(self.comments_table, find)
        if data:
            if "update_comments" in data and (datetime.datetime.now() - data["update_comments"]) <= datetime.timedelta(days=2) and "forums" in data and data["forums"]:
                return {"status": "success", "info": data}, "json"
            else:
                return {"status": "error", "msg": "need update", "info": data}, "json"
        return {"status": "error", "msg": "need update"}, "json"

    def getContent(self):
        return {}, "json"


    def bookMark(self):
        """
        bookMark
        收藏
        :return:
        """
        id = self.getValues("id", None)
        if id == None:
            return {"msg": "id不存在", "state": "error"}
        is_mark = int(self.getValues("mark", 0))

        # is_mark 0为未收藏 1为已收藏
        data = self.db.getItem(self.main_table, {"_id": ObjectId(id)})
        if data:
            set_data = {self.main_id: data[self.main_id]}
            self.user_info.setBookmarkByid(self.bookmark_table, id, is_mark, set_data)

            if is_mark == 1:
                return {"msg": "已收藏", "state": "sucess", "bookmark": 1}, "json"
            else:
                return {"msg": "取消收藏", "state": "sucess", "bookmark": 0}, "json"
        else:
            return {"msg": "无效的id", "state": "error"}, "json"

    def history(self):
        """
        设置阅读历史
        Returns:
        """
        id = self.getValues("id", None)
        list_id = self.getValues("lid", None)
        list_history = {}
        if id != None:
            data = self.db.getItem(self.main_table, {"_id": ObjectId(id)})
            if data:
                set_data = {self.main_id: data[self.main_id]}
                self.user_info.setHistoryById(self.history_table, id, list_id, set_data)
                return {"msg": f"id:{id}记录历史成功"}, "json"

        return {"msg": "id不存在", "state": "error"}, "json"


    def getRealUrl(self):
        """
        获取info
        Returns:

        """
        url = self.getValues("url", None)
        if id == None:
            return "", None

        # 获取真实url
        real_url = self.tool_api.realUrlStart(url)
        if real_url:
            msg = {"status": "success", "url": real_url}
        else:
            msg = {"status": "error", "msg": "未获取真实url"}
        return msg, "json"


    def getApiSearch(self):
        return {"msg": "没有重写apisearch方法", "status": "error"}, "json"

    def getFile(self):
        return {"msg": "没有重写getFile方法", "status": "error"}, "json"


    def bindData(self):
        return {"msg": "没有重写bindData方法", "status": "error"}, "json"

    def getBilibiliManga(self):
        """
        获取bilibli漫画信息
        """
        return BilibliManga().search(self.getValues("t"), self.getValues("v")), "json"

