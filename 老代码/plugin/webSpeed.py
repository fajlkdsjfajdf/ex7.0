# 各种网页url定期测速刷新

import requests
from apscheduler.schedulers.background import BackgroundScheduler
from util.urlChecker import URLChecker
import re
from networking.webRequest import WebRequest
from lxml import etree
import time
from util import typeChange
from requests.utils import dict_from_cookiejar
from config.configParse import config
from logger.logger import logger
from plugin.comic18.jm_plugin import JmCryptoTool
from plugin.comic18 import  jm_config

import _thread

class FastestWebsiteChecker:
    def __init__(self):
        pass

    def run(self):
        self.updateCookie()
        self.getFastestWebsite()


    def getFastestWebsite(self):
        # 获取最快的网址
        # print("执行web check")
        # cm

        # cm_urls = self.getCmUrls()
        # if len(cm_urls) > 0:
        #     url_checker = URLChecker(cm_urls, "禁漫天堂")
        #     fast_url = url_checker.check_fastest_url()
        #     if fast_url:
        #         url = typeChange.convertUrl(fast_url["url"])
        #         host = typeChange.getHost(url)
        #         content = fast_url["content"]
        #         cdn = self.getCmCdn(url)
        #         config.write("CM", "url", url)
        #         config.write("CM", "header", host)
        #         if cdn:
        #             url_checker.set_host(cdn)
        #             config.write("CM", "cdn", cdn)
        #     self.getCmLogin()
        # else:
        #     logger.warning("cm网址为空")
        pass
        # bk
        # 刷新login的token
        # login_token = BikaBikaLogin().login()
        # if login_token:
        #     GlobalConfig.write_config("BK", "token", login_token)




    def updateCookie(self):
        self.getCmCookie()
        self.getJbCookie()

    def getCmUrls(self):
        try:
            # 18comic 黑名单
            black_list = [
                "18comic.vip",
                "18comic.org",
                "jmcomic.me",
                "jmcomic1.me",
                "jm365.work",
                "gmail.com",
                "discord.gg",
                "jmc8763.org",
                "t.me",
                "re18comic"
            ]
            url_link = config.read("CM", "url-link")


            url_checker = URLChecker([], "禁漫天堂")

            url_checker.set_host(url_link)

            web = WebRequest()
            if web.curl_get(url_link):
                # 获取class为"word"的div元素
                word_divs = web.tree.xpath('.//div[contains(@class, "main-content")]')
                html = ""
                # 提取div内部的HTML代码
                for word_div in word_divs:
                    html += etree.tostring(word_div, encoding='unicode')
                pattern = r'\b(?:[a-zA-Z0-9.-]+)\.[a-zA-Z]{2,}\b'
                urls = re.findall(pattern, html)
                data = []
                for s in urls:
                    flag = False
                    for b in black_list:
                        if b in s:
                            flag = True
                    if not flag:
                        data.append(f"https://{s}")
                return data
            else:
                logger.error(f"{url_link} 引导页访问失败")
                return []
        except Exception as e:
            print(f"获取cm实时网址失败, {e}")
            return []

    def getCmCdn(self, url):
        urls = {}
        for i in range(1, 4):
            shut_url = f"{url}?shunt={i}"   # 分流url
            web = WebRequest()
            if web.get(shut_url, retry_limit=2):
                tree = web.tree
                img_src = tree.xpath(".//div[contains(@class,'thumb-overlay-albums')]/a/img/@src")
                if len(img_src)> 0:
                    img_src = img_src[0]
                    cdn = typeChange.getDomain(img_src)
                    if cdn:
                        urls[cdn] = img_src
        if len(urls) == 1:
            # 只有一个cdn 直接返回
            return list(urls.keys())[0]
        elif len(urls) > 1:
            # 有多个cdn 测试速度
            image_urls = list(urls.values())
            url_checker = URLChecker(image_urls, "head")
            fast_url = url_checker.check_fastest_url()
            if fast_url:
                # print()
                cdn = typeChange.getDomain(fast_url["url"])
                return cdn
        return None

    def getCmLogin(self):
        try:
            url = config.read("CM", "url")
            url = f"{url}/login"
            user = config.read("CM", "user")
            pwd = config.read("CM", "pwd")
            # user = "ainizai0905"
            data = f"username={user}&password={pwd}&login_remember=on&submit_login="
            header = {}
            header["Content-Type"] = "application/x-www-form-urlencoded"

            # 创建一个Session对象
            session = requests.Session()
            # 使用Session对象发起请求
            response = session.post(url, data=data, headers=header)
            if "无效的用户名和" in response.text:
                logger.warning(f"cm登录失败")
            else:
                cookies = session.cookies
                print(cookies)
                cookies_dict = dict_from_cookiejar(cookies)
                config.write("CM", "cookie", cookies_dict)
        except Exception as e:
            logger.error(f"getCmLogin {e}")


    def getJbCookie(self):
        try:
            url = config.read("JB", "url")

            url_check = f"{url}"
            data = requests.get(url_check, timeout=10)
            if data:
                url_main = f"{url}/serchinfo_censored/IamOverEighteenYearsOld/topicsbt_1.htm"
                data = requests.get(url_main, timeout=10)
                if data:
                    phpsessid = data.cookies.get("PHPSESSID")
                    if phpsessid:
                        config.write("JB", "cookie", {"PHPSESSID": phpsessid})
                        logger.info(f"JB更新了cookie  PHPSESSID={phpsessid}")
        except Exception as e:
            logger.error(e)

    def getCmCookie(self):
        try:

            data = {}
            for url in jm_config.DOMAIN_API_LIST:
                new_url, cookies = JmCryptoTool.get_cookies(url)
                cookies = typeChange.cookies_to_str(cookies)
                data[url] = cookies

                # print(cookies)
                # break
            config.write("CM", "api_cookies", data)
            logger.info(f"CM更新了cookie  {data}")


            # url = config.read("JB", "url")
            #
            # url_check = f"{url}"
            # data = requests.get(url_check, timeout=10)
            # if data:
            #     url_main = f"{url}/serchinfo_censored/IamOverEighteenYearsOld/topicsbt_1.htm"
            #     data = requests.get(url_main, timeout=10)
            #     if data:
            #         phpsessid = data.cookies.get("PHPSESSID")
            #         if phpsessid:
            #             config.write("JB", "cookie", {"PHPSESSID": phpsessid})
            #             logger.info(f"JB更新了cookie  PHPSESSID={phpsessid}")
        except Exception as e:
            logger.error(e)

if __name__ == '__main__':
    f = FastestWebsiteChecker()
    # f.getFastestWebsite()
    # print(f.getCmCdn("https://18-comicblade.vip"))
    f.getFastestWebsite()

    f.getCmCookie()