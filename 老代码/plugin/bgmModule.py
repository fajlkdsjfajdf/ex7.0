
# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：
   Description :   番组计划查询模块
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""
from networking.webRequest import WebRequest
import json



class BgmModule:
    def __init__(self):
        self.client_id = "bgm16665f8142948e286"
        self.client_secret = "499681da6537ef01003679ba8e165a6f"
        self.state = "asdagsdcxgwedfasfsa"
        self.token_url = "https://bgm.tv/oauth/access_token"
        self.api_url = "https://api.bgm.tv"
        self.web = WebRequest()

    def getToken(self, code, host_url, temp=""):
        data = {"grant_type": "authorization_code",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "redirect_uri": f"{host_url}status?cls=ZhengliStatus&type=loginbgm&temp={temp}",
                "state": self.state
                }
        self.web.post(self.token_url, data)
        if "access_token" in self.web.json:
            return self.web.json["access_token"]
        else:
            return ""


    def _header(self, token):
        return {"User-Agent": "awei/my-private-project", "Authorization": f"Bearer {token}"}


    def getSubject(self, subject_id, token):
        """
        获取信息
        :param subject_id: 番组计划id
        :param token: 访问token
        :return:返回的结果
        """
        header = self._header(token)
        url = f"{self.api_url}/v0/subjects/{subject_id}"
        self.web.get(url, header=header)
        if "Bad Request" in self.web.text:
            return None
        else:
            return self.web.json


    def getCharacters(self, subject_id, token):
        """
        获取演员信息
        :param subject_id: 番组计划id
        :param token: 访问token
        :return:返回的结果
        """
        header = self._header(token)
        url = f"{self.api_url}/v0/subjects/{subject_id}/characters"
        self.web.get(url, header=header)
        if "Bad Request" in self.web.text:
            return None
        else:
            return self.web.json


    def getEpisodes(self, subject_id, token):
        """
        获取章节信息
        :param subject_id: 番组计划id
        :param token: 访问token
        :return:返回的结果
        """

        # 无效的过程
        header = self._header(token)
        url = f"{self.api_url}/v0/episodes"
        self.web.get(url, header)
        print(self.web.text)
        if "Bad Request" in self.web.text:
            return None
        else:
            return self.web.json

    def search(self, keyword, token):
        header = self._header(token)
        url = f"{self.api_url}/search/subject/{keyword}"
        self.web.get(url, header=header)
        if "Bad Request" in self.web.text:
            return None
        else:
            return self.web.json


if __name__ == '__main__':
    bgm = BgmModule()
    # data = bgm.getSubject("899", "80ef8a4698348b591de3eba2903efcb42b25285f")
    # data = bgm.getCharacters("33506", "80ef8a4698348b591de3eba2903efcb42b25285f")
    # data = bgm.getEpisodes("899", "80ef8a4698348b591de3eba2903efcb42b25285f")
    # data = bgm.search("JKとエロ議員センセイ", "ad026e6a31d5b84df1541e9f4197de155cb026d4")
    # data = bgm.getSubject(35698, "3a4056d4d80acb6b880d29e4a58e5100d1deae13")
    # print(data)
    data = bgm.getSubject("38494", "96b20946d6ede49857983ab0d6972cfa7131b901")
    print(data)

