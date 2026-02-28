# 这是一个分词工具, 用于对数据库进行分词
from db.mongodb import MongoDB
from config.configParse import config
from apscheduler.schedulers.background import BackgroundScheduler
from util import typeChange
import re
import jieba
from sudachipy import tokenizer
from sudachipy import dictionary
from logger.logger import logger
from datetime import datetime
from bson import ObjectId
from multiprocessing.pool import ThreadPool
from functools import partial
from datetime import datetime, timedelta
import _thread

class Participle:
    def __init__(self):
        # 判断哪些库需要分词
        webs = config.read("setting", "web_sort")
        self.part_webs = {}
        for web in webs:
            web_part = config.read(web, "part")
            if web_part:
                self.part_webs[web] = config.readSection(web)
        self.db = MongoDB()

    def start(self):
        scheduler = BackgroundScheduler()
        scheduler.add_job(self.part_set, 'interval', seconds=3600)
        scheduler.start()

        _thread.start_new_thread(self.part_set, ())

    def run(self):
        # 定时调用入口
        self.part_set()


    def part_set_thread(self, item, prefix, web):
        # return False
        try:
            table = f"{prefix.lower()}-main"
            cols = web["part"]
            orders = web["order"]
            order = orders[0]

            part_array = []
            data = {}
            insert_flag = True
            for col in cols:
                col_name = col["col"]
                col_type = col["type"]
                if col.get('fill', 0) and col_name not in item:  # 必须要的字段没有包含在数据中，
                    insert_flag = False
                if col_name in item:
                    if col_type == 'jp':
                        # 日文分词
                        part_array += self.jp_part(item[col_name])
                    elif col_type == 'cn':
                        # 中文分词
                        part_array += self.cn_part(item[col_name])
                    elif col_type == 'tag':
                        # tag数组
                        part_array += self.tag_part(item[col_name])
                    elif col_type == 'word':
                        # 完整单词
                        part_array.append(item.get(col_name, ""))
            part_array = list(set(part_array))
            data["_id"] = ObjectId(item["_id"])
            data[order["order_field"]] = item.get(order["order_field"], None)
            data["_t"] = ' '.join(part_array)
            data["_t_time"] = datetime.now()
            if insert_flag:
                self.db.processItems(table, {"_id": data["_id"], "_t_time": data["_t_time"]}, "_id")
                self.db.processItems(f"{prefix.lower()}-search", data, "_id")
        except Exception as e:
            logger.warning(f"{prefix} : {item.get('_id', 0)} 分词失败 {e}")

    def part_set(self):
        logger.info(f"数据表分词开始")



        # 对指定表名的文字进行分词
        for prefix, web in self.part_webs.items():
            table = f"{prefix.lower()}-main"
            cols =  web["part"]
            orders = web["order"]
            field = {}
            for col in cols:
                field[col["col"]] = 1
            order = orders[0]
            field[order["order_field"]] =1

            # up_time = datetime.now() - timedelta(days=3)

            # find = {"$or":  [{"_t_time": {"$eq": None}}, {"_t_time": {"$lt": up_time}}]}
            find = {"_t_time": {"$eq": None}}
            items = self.db.getItems(table, find, field=field, limit=10000)

            #
            # for item in items:
            #     self.part_set_thread(item, prefix, web)

            pool = ThreadPool(processes=30)
            bound = partial(self.part_set_thread, prefix=prefix, web=web)
            pool.map(bound, items)
            pool.close()
            pool.join()
            logger.info(f"{prefix} 分词结束")


    def clean_text(self, text):
        """
        清理文本
        Args:
            text: 输入文本

        Returns:

        """
        text = typeChange.replace_punctuation_with_space(text)
        return text


    def check_jp(self, text):
        """
        判断文字是否有日文，没有就认为是纯中文
        Args:
            text:
        Returns:
        """
        jap = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7A3]')  # \uAC00-\uD7A3为匹配韩文的，其余为日文
        if jap.search(text):
            return True
        else:
            return False

    def jieba_cut(self, text):
        """
        使用jieba分词
        Args:
            text:

        Returns:

        """
        cut = jieba.cut_for_search(text)
        arr = []
        for t in cut:
            arr.append(t)
        arr = self.clean_cut(arr)
        return arr

    def sudachipy_cut(self, text):
        """
        日文分词工具
        Args:
            text:

        Returns:

        """
        tokenizer_obj = dictionary.Dictionary().create()
        mode = tokenizer.Tokenizer.SplitMode.B
        arr = [m.surface() for m in tokenizer_obj.tokenize(text, mode)]
        arr = self.clean_cut(arr)
        return arr

    def clean_cut(self, cut_arr):
        """
        清理分词
        Args:
            cut_arr:

        Returns:

        """
        new_cut = []
        for t in cut_arr:
            if not typeChange.isNumber(t) and not t.isspace() and t != "叙述":
                new_cut.append(t)
        return new_cut


    def jp_part(self, text, jf=True):
        """
        日文分词
        Args:
            text:

        Returns:

        """
        text = self.clean_text(text)
        is_jp = self.check_jp(text)
        part_arr = []
        if is_jp:
            # 有日文
            part_arr = self.sudachipy_cut(text)
            return part_arr
        else:
            # 没有日文, 按中文分词
            return self.cn_part(text, jf)


    def cn_part(self, text, jf=True):
        """
        中文分词
        Args:
            text:

        Returns:

        """
        text = self.clean_text(text)
        part_arr = []
        if jf:
            text_jt = typeChange.toJianti(text)
            part_arr += self.jieba_cut(text)
            part_arr += self.jieba_cut(text_jt)
        else:
            part_arr = self.jieba_cut(text)
        return part_arr

    def tag_part(self, tags):
        """
        tag分词
        Args:
            tags:

        Returns:

        """
        part_arr = []
        for t in tags:
            if type(t) == str:
                part_arr.append(typeChange.toJianti(t))
        return part_arr



if __name__ == '__main__':
    p = Participle()
    p.part_set()
    import time
    while True:
        time.sleep(10)