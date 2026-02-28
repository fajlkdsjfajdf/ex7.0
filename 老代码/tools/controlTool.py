# 控制工具的模块
import json
from logger.logger import logger
from config.configParse import config
import hashlib
from tools.webTool import WebTool
from util import timeFormat
from datetime import timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import _thread
from util import typeChange


class ControlTool:
    def __init__(self):
        # 保存已启动任务的 ID
        self.task_ids = {}
        # 一个定期执行的清理计划
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(self.cleanToolsStart, 'interval', seconds=30)
        self.scheduler.start()



    def start(self, data):
        try:
            values = data
            # 将传入的值序列化并md5 生成process_id
            md5_hash = hashlib.md5(json.dumps(values).encode()).hexdigest()
            if md5_hash not in self.task_ids:
                self.task_ids[md5_hash] = {
                    "start": timeFormat.getNowTime(),
                    "tool": WebTool(values)
                }
                return {"start": "success", "id": str(md5_hash)}
            else:
                return {"start": "error", "msg": "id is activate", "id": str(md5_hash)}
        except Exception as e:
            msg = f"启动工具出错 {e}"
            logger.error(msg)
            return {"start": "error", "msg": msg}

    def get(self, id):
        self.checkOver(id)
        data = {}
        if id and id in self.task_ids:
            if "over" in self.task_ids[id]:
                data = {"id": id, "start": self.task_ids[id]["start"], "over": True, "info": self.task_ids[id]["info"]}
                data["title"] = self.task_ids[id]["title"]
            else:
                data = {"id": id, "start": self.task_ids[id]["start"], "info": self.task_ids[id]["tool"].getInfo()}
                data["title"] = self.task_ids[id]["tool"].getName()
        else:
            data = {"status": "error", "msg": "no id"}
        data = typeChange.cleanJson(data)
        return data

    def checkOver(self, hash_code):
        if hash_code in self.task_ids and "tool" in self.task_ids[hash_code]:
            tool = self.task_ids[hash_code]["tool"]
            if tool.getIsOver():

                info = self.task_ids[hash_code]["tool"].getInfo()
                title = self.task_ids[hash_code]["tool"].getName()
                start = self.task_ids[hash_code]["start"]
                data = {
                    "start": start,
                    "info": info,
                    "over": True,
                    "title": title
                }
                self.task_ids[hash_code] = data

    def cleanToolsStart(self):
        _thread.start_new_thread(self.cleanTools, ())

    def cleanTools(self):
        # 定期清理已经完成的tools
        try:
            #logger.info("定期清理开始")
            remove_list = {}
            update_list = {}
            for hash_code in self.task_ids:
                self.checkOver(hash_code)
                if "info" in self.task_ids[hash_code]:
                    start_time = self.task_ids[hash_code]["start"]
                    if timeFormat.getNowTime() - start_time > timedelta(hours=4):
                        logger.info(f"删除task{hash_code}")
                        remove_list[hash_code] = {}
                    if not self.task_ids[hash_code]["info"]:
                        # 空的info
                        remove_list[hash_code] = {}

            for code in remove_list:
                if code in self.task_ids:
                    del self.task_ids[code]
        except Exception as e:
            logger.error(f"定期清理失败 {e}")
