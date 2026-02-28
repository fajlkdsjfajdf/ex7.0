# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：     systemModule
   Description :   获取系统信息
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""

import os
import time

import psutil
import sys
from config.configParse import config


def getMainDir():
    sys_info = sys.platform
    if sys_info == "win32":
        return config.read("setting", "main_windows")
    if sys_info == "linux":
        return config.read("setting", "main_linux")


# 获取当前进程内存占用。
def getCurrentMemory():
    pid = os.getpid()
    p = psutil.Process(pid)
    info = p.memory_full_info()
    return info.uss

def getTotalMemoryOfPythonApps():
    total_memory = 0
    for process in psutil.process_iter(['pid', 'name', 'memory_info']):
        if  'python' in  process.info['name']:
            total_memory += process.info['memory_info'].rss
    return total_memory



# 获取所有信息字符串：
def getInfo():
    use_memory = getTotalMemoryOfPythonApps()
    system_info = sys.platform
    memory = psutil.virtual_memory()
    net = psutil.net_io_counters()
    cpu = psutil.cpu_percent()
    return {"system": system_info, "use_memory": use_memory, "memory": memory,
            "net": net, "cpu": cpu
            }

def getSystem():
    """
    返回windows or linux
    """
    sys_info = sys.platform
    if sys_info == "win32":
        return "windows"
    if sys_info == "linux":
        return "linux"


def get_cpu_usage():
    cpu_time = psutil.cpu_times()
    start_time = time.time()
    time.sleep(1)
    cpu_time2 = psutil.cpu_times()
    cpu_usage = (cpu_time2.user - cpu_time.user) / ((cpu_time2.user + cpu_time2.system + cpu_time2.idle) - (
                cpu_time.user + cpu_time.system + cpu_time.idle)) * 100
    return cpu_usage

def get_cpu_and_memory_usage():
    cpu_percent = psutil.cpu_percent()
    memory_info = psutil.virtual_memory()
    memory_percent = memory_info.percent
    return cpu_percent, memory_percent




if __name__ == '__main__':
    cpu_usage, memory_usage = get_cpu_and_memory_usage()
    print("CPU占用率： {}%".format(cpu_usage))
    print("内存占用率： {}%".format(memory_usage))








