# web 的控制
import glob
import os
import importlib
from logger.logger import logger
from config.configParse import config
from util import typeChange

class WebControl:
    def __init__(self):
        self.web_sort = typeChange.capitalizeFirstLetter(config.read("setting", "web_sort"))
        self.importResponse()

    def importResponse(self):
        # 载入所有的webresponse
        self.response_list = {}
        current_folder = os.path.dirname(os.path.dirname(__file__))
        response_folder = os.path.join(current_folder, "webResponse")
        py_files = glob.glob(f"{response_folder}/*.py")  # 匹配指定文件夹下的所有 .py 文件
        response_list = {}
        for file in py_files:
            module_name = os.path.basename(file)[:-3]  # 获取文件名并去掉文件名的后缀 .py
            module = importlib.import_module(f"webResponse.{module_name}")  # 动态导入模块
            for attr_name in dir(module):
                if "Response" in attr_name and attr_name != "Response":
                    if attr_name not in self.response_list:
                        class_method = getattr(module, attr_name)
                        response_list[attr_name] = class_method
        for web in self.web_sort:
            response_name = f"{web}Response"
            if response_name in response_list:
                self.response_list[response_name] = response_list[response_name]
                # self.response_list[response_name]()  # 全部实例化一次
                logger.info(f"加载了Response模块{response_name}")

    def getResponse(self, prefix):
        """
        根据指定的pefix 获取对应的response
        :param prefix:
        :return:
        """
        if not prefix:
            prefix = config.read("setting", "web_default")
        prefix = typeChange.capitalizeFirstLetter(prefix)
        resp_name = f"{prefix}Response"
        if resp_name in self.response_list:
            return self.response_list[resp_name]
        else:
            return None

webControl = None

def getWebControl():
    global webControl
    if webControl == None:
        webControl = WebControl()
    return webControl