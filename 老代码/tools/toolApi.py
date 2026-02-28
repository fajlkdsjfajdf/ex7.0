# 这是调用tool 网址的api
import requests
from config.configParse import config
from logger.logger import logger
from util import picCheck
import json

class ToolApi:
    def __init__(self, prefix):
        self.api_host = config.read("setting", "api_host")
        self.api_port = config.read("setting", "back_port")
        self.tran_host = config.read("setting", "db_host")
        self.tran_port = config.read("setting", "tran_port")
        self.url = f"http://{self.api_host}:{self.api_port}"
        self.tran_url = f"http://{self.tran_host}:{self.tran_port}"
        self.decode_url = f"http://{self.tran_host}:{config.read('setting', 'deco_port')}"
        self.waifu_url  = f"http://{self.tran_host}:{config.read('setting', 'waifu_port')}"
        self.prefix = prefix.lower()


    def toolStart(self, tool_type, data):
        """
        开启一个新的中间工具
        :param prefix:
        :param tool_type:
        :param data:
        :return:
        """
        new_data = {
            "prefix": self.prefix,
            "tool_type": tool_type,
            "data": data
        }
        try:
            url = f"{self.url}/start"
            # print(url)
            new_data = json.dumps(new_data)
            resp = requests.post(url, new_data, timeout=5, headers={'Content-Type': 'application/json'})
            # print(resp)
            data = json.loads(resp.text)
            if "id" in data:
                return data["id"]
            else:
                return None
        except Exception as e:
            logger.warning(f"start 工具超时 {tool_type}")
            return None

    def getInfo(self, id):
        try:
            url = f"{self.url}/get?id={id}"
            resp = requests.get(url, timeout=5)
            data = json.loads(resp.text)
            if "id" in data:
                return data
            else:
                return None
        except Exception as e:
            return None


    def tranStart(self, img):
        try:
            url = f"{self.tran_url}/submit"
            formData = {
                'size': "X",
                'detector': "auto",
                'direction': "auto",
                'translator': "papago",
                'tgt_lang': "CHS"
            }
            files = {'file': img}
            response = requests.post(url, data=formData, files=files, timeout=5)
            data = json.loads(response.text)
            if "status" in data and data["status"] == "successful":
                return data["task_id"]
            else:
                logger.warning(f"transtart 错误 返回值= {response.text}")
                return None
        except Exception as e:
            logger.warning(f"start 工具错误 {e}")
            return None

    def getTranInfo(self, task_id):
        try:
            url = f"{self.tran_url}/task-state?taskid={task_id}"
            response = requests.get(url, timeout=3)
            data = json.loads(response.text)
            if "finished" in data and data["finished"]:
                logger.info("翻译完成")
                return True
            else:
                return False

        except Exception as e:
            logger.warning(f"获取翻译信息错误 {e}")
            return False

    def getTranImg(self, task_id):
        try:
            url = f"{self.tran_url}/result/{task_id}"
            response = requests.get(url, timeout=10)
            return response.content
        except Exception as e:
            logger.warning(f"获取翻译完成图片错误 {e}")
            return False

    def getDecodeImg(self, img, d_mode):
        try:
            url = f"{self.decode_url}/{d_mode}"
            files = {'image': img}
            response = requests.post(url, files=files, timeout=99)

            return response.content
        except Exception as e:
            logger.warning(f"图片去码错误 {e}")
            return False

    def getWaifuBigImg(self, img, img_name, big_type=2):
        try:
            img_size = picCheck.get_image_size(img)
            if big_type == 1 and (img_size[0]> 3000 or img_size[1]> 3000):
                # 降噪的图片限制尺寸3000*3000
                logger.warning(f"{img_name} 无法降噪, 尺寸过大 {img_size[0]} * {img_size[1]}")
                return False
            elif big_type == 2 :
                # 放大的图片限制尺寸1500*1500
                if (img_size[0]> 1500 or img_size[1]> 1500) and ((img_size[0]<= 5000 and img_size[1]<= 5000)):
                    logger.warning(f"{img_name} 无法放大,切换为降噪模式  {img_size[0]} * {img_size[1]}")
                    big_type = 1
                elif (img_size[0] > 5000 or img_size[1] > 5000):
                    logger.warning(f"{img_name} 无法放大,且无法降噪 {img_size[0]} * {img_size[1]}")
                    return False

            url = f"{self.waifu_url}/api"

            data = {
                "url": "图片的URL",
                "style": "art",
                "noise": 1,
                "scale": 1.6 if big_type== 2 else 0
            }
            files = {"file": (img_name, img, "image/jpeg")}
            response = requests.post(url, data=data, files=files, timeout=20)


            return response.content
        except Exception as e:
            logger.warning(f"图片放大错误 {e}")
            return False

    def realUrlStart(self, url):
        """
        这是一个反向代理模块 用于解析传入的url， 获取真实的url
        """
        try:
            response = requests.get(url, timeout=10, allow_redirects=False)
            if response.status_code == 302:
                return response.headers['Location']
            return False
        except Exception as e:
            logger.warning(f"反向解析url失败 {e}")
            return False

if __name__ == '__main__':
    t = ToolApi("ex")
    t.getInfo("bd5e1ca22467b8da6a76b7d5c45a2bf5")