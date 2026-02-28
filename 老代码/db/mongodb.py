# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：     mongodb
   Description :   mongodb操作模块
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""

from config.configParse import config
import pymongo
import datetime
from logger.logger import logger
from pymongo import MongoClient, errors, UpdateOne
from enum import Enum




class MongoIndxType(Enum):
    """
    这是一个枚举类，保存索引的类型
    """
    ASCENDING = "ASCENDING"
    DESCENDING = "DESCENDING"
    HASHED = "HASHED"
    TEXT = "TEXT"
    GEO2D = "GEO2D"

class MongoDB:
    def __init__(self):
        """
        __init__

        :param db_name:数据库名称
        :param table_name:表名称
        :return:
        """
        db_host = config.read("setting", "db_host")
        port = config.read("setting", "mongodb_port")
        connect_str = f"mongodb://{db_host}:{port}/"
        # logger.info(connect_str)
        db_name = config.read("setting", "mongodb_name")
        self.connection = pymongo.MongoClient(connect_str)
        self.db = self.connection[db_name]

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.connection.close()


    def processItem(self, table_name, item, index_key):
        """
        process_item
        插入单独一个值
        :param table_name:表名称
        :param item:插入的值
        :param index_key:唯一字段的名称
        :return:
        """
        subject = item
        find = {}
        if index_key:
            if type(index_key) == str:
                find = {index_key: subject[index_key]}
                data = self.db[table_name].find_one(find)
            elif type(index_key) == list:
                find = []
                for k in index_key:
                    find.append({k: subject[k]})
                find = {"$and": find}
                data = self.db[table_name].find_one(find)
        else:
            data = None
        if data is None:
            self.db[table_name].insert_one(dict(subject))
        else:
            self.db[table_name].update_one(find, {"$set": dict(subject)})

    def processItems(self, table_name, items, index_key):
        """
        process_items
        插入1个或多个值
        :param items:插入的值数组
        :param index_key:唯一字段的名称
        :param table_name:如果需要使用其他表的情况
        :return:
        """
        collection = self.db[table_name]
        find = {}
        data = None
        if type(items) != list:
            items = [items]
        if type(index_key) != list:
            index_key = [index_key]

        # 批量插入或更新数据
        bulk_operations = []
        if len(items) > 0:
            for item in items:
                update_check = {}
                for k in index_key:
                    update_check[k] = item[k]
                bulk_operations.append(
                    UpdateOne(update_check, {'$set': item}, upsert=True))
            # print(bulk_operations)
            collection.bulk_write(bulk_operations)




    def getItem(self, table_name, find_dict,**kwargs):
        """
        get_items
        获取多个数据
        :param table_name:表名称
        :param find_dict:查询字典
        :return:
        """
        field = kwargs["field"] if "field" in kwargs and kwargs["field"] != "" else None

        data = self.db[table_name].find_one(find_dict, field)
        if data != None:
            data["_id"] = str(data["_id"])
            return data
        else:
            return None


    def getItems(self, table_name, find_dict, **kwargs):
        """
        getItems
        获取多个数据
        :param table_name:表名称
        :param find_dict:查询字典
        :param limit:数量
        :param skip:skip
        :param order:order
        :param order_type:1 or -1
        :return:
        """
        #  limit, skip=0, order="_id", order_type= 1, return_field= {}
        limit = kwargs["limit"] if "limit" in kwargs and kwargs["limit"] != "" else 1
        skip = kwargs["skip"] if "skip" in kwargs and kwargs["skip"] != "" else 0
        order = kwargs["order"] if "order" in kwargs and kwargs["order"] != "" else "_id"
        order_type = kwargs["order_type"] if "order_type" in kwargs and kwargs["order_type"] != "" else 1
        field = kwargs["field"] if "field" in kwargs and kwargs["field"] != "" else None
        try:
            data = self.db[table_name].find(find_dict, field, max_time_ms=30000).skip(skip).limit(limit).sort(order, order_type)

            # 打印查询信息
            # find_info = self.db[table_name].find(find_dict, field, max_time_ms=30000).skip(skip).limit(limit).sort(order,
            #                                                                                            order_type).explain()
            # message = f"find: {find_dict} \nsort: {order} {order_type} \nwinningPlan: {find_info['queryPlanner']['winningPlan']}"
            # print(message)

            # 指针转为列表
            data_list = []
            for d in data:
                d["_id"] = str(d["_id"])
                data_list.append(d)
            return data_list
        except errors.OperationFailure as e:
            logger.warning(f"mongodb 查询表 {table_name} 超时")
            return []


    def getTags(self, table_name, limit= 100):
        """
        getItems
        获取多个数据
        :param table_name:表名称
        :param limit:数量
        :return:
        """
        data = self.db[table_name].find({}).limit(limit)
        return data


    def getCount(self, table_name, find_dict):
        count = self.db[table_name].count_documents(find_dict)
        return count

    def getOneById(self, table_name, id):
        data = self.db[table_name].find_one({"_id":ObjectId(id)})
        return data

    def removeOneById(self, table_name, find_dict):
        self.db[table_name].delete_one(find_dict)

    def removeItems(self, table_name, find_dict, **kwargs):
        limit = kwargs["limit"] if "limit" in kwargs and kwargs["limit"] != "" else 1
        skip = kwargs["skip"] if "skip" in kwargs and kwargs["skip"] != "" else 0
        order = kwargs["order"] if "order" in kwargs and kwargs["order"] != "" else "_id"
        order_type = kwargs["order_type"] if "order_type" in kwargs and kwargs["order_type"] != "" else 1
        field = kwargs["field"] if "field" in kwargs and kwargs["field"] != "" else None
        # data = self.db[table_name].find(find_dict, field).skip(skip).limit(limit).sort(order, order_type)
        data =self.db[table_name].delete_many(find_dict)

    def aggregate(self, table_name, pipline):
        data = self.db[table_name].aggregate(pipline)
        # 指针转为列表
        data_list = []
        for d in data:
            if "_id" in d:
                d["_id"] = str(d["_id"])
            data_list.append(d)
        return data_list

    def checkIndex(self,table_name, indexs, index_name):
        """
        判断索引是否一致
        Args:
            indexs: 需要新建的索引
            index_name: 索引名称
        Returns:

        """
        # 获取索引信息
        save_indexs = self.db[table_name].list_indexes()
        index2 = []
        has_index = False
        for i in save_indexs:
            if i["name"] == index_name:
                has_index = True
                for k, v in i["key"].items():
                    index2.append((k, v))
        return (indexs == index2), has_index



    def createIndex(self,table_name: str, index_array):
        """
        创建mongodb 索引
        Args:
            table_name:
            index_array:
        Returns:

        """
        # 建立一个唯一数组和一个不唯一数组
        unique_indexs = []
        indexs = []

        for i in index_array:
            index_key = i["col_name"]
            index_type = i["index_type"]
            index_value = 1
            if index_type == MongoIndxType.ASCENDING:
                index_value = 1
            elif index_type == MongoIndxType.DESCENDING:
                index_value = -1
            elif index_type == MongoIndxType.HASHED:
                index_value = pymongo.HASHED
            elif index_type == MongoIndxType.TEXT:
                index_value = pymongo.TEXT
            elif index_type == MongoIndxType.GEO2D:
                index_value = pymongo.GEO2D

            if "unique" in i and i["unique"]:
                unique_indexs.append((index_key, index_value))
            else:
                indexs.append((index_key, index_value))

        if indexs:
            try:
                index_name = f"{table_name}"
                check_index, has_index = self.checkIndex(table_name, indexs, index_name)
                if not check_index:
                    if has_index:
                        self.db[table_name].drop_index(index_name)
                    index_info = self.db[table_name].create_index(indexs, name=index_name)
                    logger.info(f"{table_name}索引创建成功，索引信息：{index_info}")
            except Exception as e:
                logger.warning(f"{table_name}创建索引失败,{indexs},  {e}")

        if unique_indexs:
            try:
                index_name = f"{table_name}-unique"
                check_index, has_index = self.checkIndex(table_name, unique_indexs, index_name)
                if not check_index:
                    if has_index:
                        self.db[table_name].drop_index(index_name)
                    index_info = self.db[table_name].create_index(unique_indexs, name=index_name, unique=True)
                    logger.info(f"{table_name}唯一索引创建成功，索引信息：{index_info}")
            except Exception as e:
                logger.warning(f"{table_name}创建索引失败, {unique_indexs}, {e}")





        # index_options = {}
        # unique_options = {}
        # # 判断是否唯一键
        # if unique:
        #     unique_options['unique'] = True
        #
        # if index_type == MongoIndxType.ASCENDING:
        #     index_options[index_key] = 1
        # elif index_type == MongoIndxType.DESCENDING:
        #     index_options[index_key] = -1
        #
        # elif index_type == MongoIndxType.HASHED:
        #     index_options['bucketSize'] = 1024
        # elif index_type == MongoIndxType.TEXT:
        #     index_options['default_language'] = 'english'
        #     index_options['language_override'] = 'language'
        # elif index_type == MongoIndxType.GEO2D:
        #     index_options['bits'] = 26
        #
        # # 获取索引信息
        # indexes = self.db[table_name].list_indexes()
        # # 检查指定列是否建立了索引
        # is_indexed = any(index['key'].get(index_key) for index in indexes)
        #
        # print(index_options)
        # if not is_indexed:
        #     index_info = self.db[table_name].create_index(index_options)
        #     logger.info(f"{table_name}索引创建成功，索引信息：{index_info}")



if __name__ == '__main__':
    db = MongoDB()
