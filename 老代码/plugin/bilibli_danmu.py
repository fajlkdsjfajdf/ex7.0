import json
import os.path
import requests
import asyncio
import csv
import time
from datetime import datetime
from bs4 import BeautifulSoup
import concurrent.futures
from lxml import etree
import re
import xml.etree.ElementTree as ET


class BilibiliDanmu:
    def __init__(self):
        self.danmus = []
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3970.5 Safari/537.36',
            'Referer': 'https://www.bilibili.com/'
        }

    def getDanmu(self, url):
        self.danmus = []
        url_list = self._getTvInfo(url)
        self._getDanmu(url_list)
        # print(len(self.danmus))
        # print(self.danmus)
        return self.danmus

    def _getTvInfo(self, url):

        r = requests.get(url, headers=self.headers)
        tree = etree.HTML(r.content, parser=etree.HTMLParser(encoding='utf-8'))
        keys = re.findall(r'"cid":[\d]*', r.text)
        url_list = []
        if not keys:
            keys = re.findall(r'cid=[\d]*', r.text)
        if keys:
            key = keys[0].replace('"cid":', "").replace('"cid"=', "")
            url_list = [f'https://comment.bilibili.com/{key}.xml']
        # print(url_list)
        # print(url_list)
        return url_list


    def _getDanmu(self, url_list):
        # for url in url_list:
        #     self._getTencentDanmuThread(url)

        # 创建线程池
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # 提交任务给线程池
            futures = [executor.submit(self._getDanmuThread, url) for url in url_list]
        # 等待所有任务完成
        concurrent.futures.wait(futures)

    def _getDanmuThread(self, url):
        danmu_list = []
        try:
            r = requests.get(url, headers=self.headers)
            root = ET.fromstring(r.content.decode('utf-8'))
            cid = root.find("chatid").text
            for d in root.findall('d'):
                content = d.text
                p_attrib = d.get('p')
                a = p_attrib.split(",")

                danmu_list.append({
                    'cid': cid,
                    'p': f"{float(a[0]):.2f},{a[1]},{a[3]},[bilibli]{cid}",
                    'm': content
                })

                # print(f'内容：{content}，p属性：{p_attrib}')
        except Exception as e:
            print(e)
        self.danmus = self.danmus + danmu_list






if __name__ == '__main__':
    url = "https://www.bilibili.com/bangumi/play/ss46070?theme=movie&spm_id_from=333.337.0.0"
    print(BilibiliDanmu().getDanmu(url))
