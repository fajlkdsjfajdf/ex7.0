# 对于数据库的索引结构的配置项目
from db.mongodb import MongoIndxType, MongoDB

indexs = {
    "tk-main": [
        {"col_name": "aid", "index_type": MongoIndxType.DESCENDING, "unique": True},
        {"col_name": "tags", "index_type": MongoIndxType.ASCENDING},
        {"col_name": "token", "index_type": MongoIndxType.ASCENDING},
        {"col_name": "info_update", "index_type": MongoIndxType.ASCENDING},
        {"col_name": "type", "index_type": MongoIndxType.ASCENDING}
    ],
    "jb-main": [
        {"col_name": "aid", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "fanhao", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "tags", "index_type": MongoIndxType.ASCENDING},
        {"col_name": "info_update", "index_type": MongoIndxType.ASCENDING},
        {"col_name": "type", "index_type": MongoIndxType.ASCENDING}
    ],
    "jb-stars": [
        {"col_name": "StarName", "index_type": MongoIndxType.DESCENDING, "unique": True},
        {"col_name": "ImgLoad", "index_type": MongoIndxType.DESCENDING},
    ],
    "jb-search": [
        {"col_name": "_t", "index_type": MongoIndxType.TEXT},
        {"col_name": "_t_time", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "ReleaseDate", "index_type": MongoIndxType.DESCENDING},
    ],
    "ex-main": [
        {"col_name": "gid", "index_type": MongoIndxType.DESCENDING, "unique": True},
        {"col_name": "tags", "index_type": MongoIndxType.ASCENDING},
        {"col_name": "posted", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "rating", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "filecount", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "image_load", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "update_info", "index_type": MongoIndxType.DESCENDING}
    ],
    "ex-list": [
        {"col_name": "gid", "index_type": MongoIndxType.DESCENDING, "unique": True},
        {"col_name": "pic_down", "index_type": MongoIndxType.ASCENDING},
    ],
    "ex-search": [
        {"col_name": "_t", "index_type": MongoIndxType.TEXT},
        {"col_name": "_t_time", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "gid", "index_type": MongoIndxType.DESCENDING},
    ],
    "ex-comments": [
        {"col_name": "_t", "index_type": MongoIndxType.TEXT},
        {"col_name": "update_comments", "index_type": MongoIndxType.DESCENDING},
    ],
    "cm-main": [
        {"col_name": "aid", "index_type": MongoIndxType.DESCENDING, "unique": True},
        {"col_name": "tags", "index_type": MongoIndxType.ASCENDING},
        {"col_name": "update_time", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "readers", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "filecount", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "list_count", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "albim_likes", "index_type": MongoIndxType.DESCENDING},
        # {"col_name": "_t", "index_type": MongoIndxType.TEXT},
        {"col_name": "_t_time", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "update_info", "index_type": MongoIndxType.DESCENDING}
    ],
    "cm-list": [
        {"col_name": "pid", "index_type": MongoIndxType.DESCENDING, "unique": True},
        {"col_name": "aid", "index_type": MongoIndxType.ASCENDING},
        {"col_name": "update_time", "index_type": MongoIndxType.DESCENDING},
    ],
    "cm-search": [
        {"col_name": "_t", "index_type": MongoIndxType.TEXT},
        {"col_name": "_t_time", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "update_time", "index_type": MongoIndxType.DESCENDING},
    ],
    "cm-comments": [
        {"col_name": "_t", "index_type": MongoIndxType.TEXT},
        {"col_name": "update_comments", "index_type": MongoIndxType.DESCENDING},
    ],

    "mg-main": [
        {"col_name": "aid", "index_type": MongoIndxType.DESCENDING, "unique": True},
        {"col_name": "tags", "index_type": MongoIndxType.ASCENDING},
        {"col_name": "update_time", "index_type": MongoIndxType.DESCENDING},
        {"col_name": "update_info", "index_type": MongoIndxType.DESCENDING}
    ],
    "mg-list": [
        {"col_name": "pid", "index_type": MongoIndxType.DESCENDING, "unique": True}
    ],

}



def update_indexs():
    db = MongoDB()
    for table, data in indexs.items():
        db.createIndex(table, data)

if __name__ == '__main__':
    update_indexs()





