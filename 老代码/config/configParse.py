# 读写配置文件类
import configparser
import json
from config import setting
from util import typeChange
import sys
import os
from apscheduler.schedulers.background import BackgroundScheduler
from config import globalArgs



class ConfigParse:
    def __init__(self):
        self._set_setting()
        self._update_config()
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(self._update_config, 'interval', minutes=5)
        self.scheduler.start()

    def _set_system(self):
        if "win" in sys.platform:
            self.data["system"]["name"] = "windows"
        else:
            self.data["system"]["name"] = "linux"

    def _set_setting(self):
        self.data = {"system": {}, "setting": {}}
        self._set_system()
        for item in dir(setting):
            if not item.startswith("_"):
                # 尝试从环境变量获取值
                value = os.getenv(item)
                if value:
                    print(f"载入了环境变量 {item}: {value}")
                    self.data["setting"][item] = value
                elif item in globalArgs.global_args and item:
                    print(f"载入了参数变量 {item}: {globalArgs.global_args[item]}")
                    self.data["setting"][item] = globalArgs.global_args[item]
                else:
                    self.data["setting"][item] = getattr(setting, item)


    def _update_config(self):
        # 更新config配置
        # print("更新config配置")

        # 从config.ini 中更新， 注意这个更新是动态的, 可以定时刷新
        self.config = configparser.ConfigParser()
        config_path = os.path.dirname(os.path.abspath(__file__))
        self.config.read(f'{config_path}/config.ini', encoding="utf-8")

        for section in self.config:
            for key in self.config[section]:
                if section not in self.data:
                    self.data[section] = {}
                value = self.config[section][key]
                value = value.replace("%%", "%")
                if value.startswith("{") and value.endswith("}"):
                    value = json.loads(value)
                elif value.startswith("[") and value.endswith("]"):
                    value = json.loads(value)
                elif typeChange.isNumber(value):
                    value = int(value)
                self.data[section][key] = value
        # print(self.data)

    def write(self, section, key, value):
        # write 只可以修改config.ini中的值
        if section not in self.config:
            config[section] = {}
        if type(value) != str:
            value = json.dumps(value)

        self.config[section][key] = value.replace("%", "%%")
        config_path = os.path.dirname(os.path.abspath(__file__))
        with open(f'{config_path}/config.ini', 'w', encoding="utf-8") as configfile:
            self.config.write(configfile)




    def read(self, section, key, default=None):
        """
        :param section:
        :param key:
        :param default: 如果没有读取到， 设置的默认值
        :return:
        """
        if section in self.data and key in self.data[section]:
            return self.data[section][key]
        elif default is not None:
            self.write(section, key, default)
            return default
        else:
            return None

    def readStr(self, section, key, default=None):
        return str(self.read(section, key, default))

    def readSection(self, section):
        if section in self.data:
            return self.data[section]
        else:
            return None


config = ConfigParse()


if __name__ == '__main__':
    config.write("CM", "url", "https://18comic-now.net")
    pass