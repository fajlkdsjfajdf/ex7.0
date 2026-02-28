# 对av 进行处理的api库
from config.configParse import config
from util import system, typeChange
from media.fileControl import FileControl
from logger.logger import logger
from db.mongodb import MongoDB
from datetime import datetime

class AvApi:
    def __init__(self):
        self.db = MongoDB()
        self.table_name = "zlf-avdc"

    def decodeAv(self, path):
        # 将av视频link到待转码文件夹
        file_name = typeChange.getFileName(path)
        wait_file = config.read("setting", "wait_decode_av_file")
        maindir = system.getMainDir()
        to_path = f"{maindir}/{wait_file}/{file_name}"
        if not FileControl.hasFile(to_path):
            # 对源path 进行修改
            path = path.replace("/movies", maindir)
            if FileControl.hasFile(path):
                FileControl.linkToFile(path, to_path)
                self.db.processItem(self.table_name, {"path": to_path, "status": "wait", "update": datetime.now()}, "path")
                logger.info(f"link文件{path} >> {to_path}")
                return {"status": "success"}, "json"
            else:
                return {"status": "error", "msg": "source file not exists"}, "json"
        return {"status": "error", "msg": "decode file is exists"}, "json"

    def getwaitAv(self):
        # 获取一个正在等待转码的av
        data = self.db.getItem(self.table_name, {"status": "wait"})
        if data:
            data["file"] = typeChange.getFileName(data["path"])
            return {"status": "success", "info": data}, "json"
        else:
            return {"status": "error", "msg": "no wait decode file"}, "json"