# 时间格式化
import time
import datetime


def getNow():
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

def getDate(my_time):
    return my_time.strftime("%Y-%m-%d %H:%M:%S")

def getNowTime():
    return datetime.datetime.now()  # 开始时间

def getUseTime(start_time, end_time=None):
    if end_time == None:
        use = datetime.datetime.now() - start_time  # 总计耗时
    else:
        use = end_time - start_time
    use = str(use).split(".")[0]
    return use



