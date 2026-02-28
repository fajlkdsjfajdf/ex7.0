# # 使用waifu2x 放大图片
# from waifu2x_vulkan import waifu2x_vulkan
#
# class Waifu2xProcess:
#     def __init__(self):
#         sts = waifu2x_vulkan.init()
#         gpuList = waifu2x_vulkan.getGpuInfo()
#         print(gpuList)
#
#
# if __name__ == '__main__':
#     Waifu2xProcess()




# 调用web请求waifu2x放大图片

import requests
from config.configParse import config
def waifuapi(file_name, file_data, style="art", noise=1, scale=2):
    url = config.read("")
    response = requests.post(url, data=data, files=files)
    print(response.text)