# 实现web的login任务
import time

from networking.seleniumTool import SeleniumTool
from config.configParse import config
from logger.logger import logger

class WebLogin:
    def __init__(self):
        pass

    def run(self):
        self.linovelib_login_check()
        self.biliblimanga_login_check()

    def biliblimanga_login(self):
        tool = SeleniumTool(headless=False)
        try:
            url = config.read("BM", "url")

            # 打开网页
            tool.open_url(url)
            # time.sleep(100)
            # tool.close_browser()
        except Exception as e:
            logger.info(e)
        return tool.show_url

    def biliblimanga_login_check(self):
        # 哔哩哔哩漫画cookie
        tool = SeleniumTool(headless=True)
        try:
            url = config.read("BM", "url")

            # 打开网页
            tool.open_url(url)
            # 打印页面标题
            time.sleep(3)
            cookies = tool.get_cookies_dict()
            if cookies:
                config.write("BM", "cookies", cookies)
                logger.info(f"写入了哔哩漫画 cookie")
        except Exception as e:
            logger.error(f"哔哩漫画错误: {e}")
        tool.close_browser()


    def linovelib_login_check(self):
        # 哔哩轻小说 cf cookie获取
        tool = SeleniumTool(headless=True)
        try:
            url = config.read("BS", "url")
            url = f"{url}/novel/3095/246901.html"
            # 打开网页
            tool.open_url(url)
            # 打印页面标题
            time.sleep(3)
            cookies = tool.get_cookies()
            cf_clearance = ""
            for c in cookies:
                if "name" in c and c["name"] == "cf_clearance":
                    cf_clearance = c["value"]
            if cf_clearance:
                cookies = {"cf_clearance": cf_clearance}
                config.write("BS", "cookie", cookies)
                logger.info(f"写入了哔哩轻小说 cf cookie")

        except Exception as e:
            logger.error(f"哔哩轻小说过cf错误: {e}")

        tool.close_browser()


# 使用示例
if __name__ == "__main__":
    WebLogin().biliblimanga_login_check()