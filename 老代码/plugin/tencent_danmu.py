import json
import os.path
import requests
import asyncio
import csv
import time
from datetime import datetime
from bs4 import BeautifulSoup
import concurrent.futures


class TencentDanmu:
    def __init__(self):
        self.danmus = []

    def getDanmu(self, url):
        self.danmus = []
        url_list = self._getTvInfo(url)
        self._getTencentDanmu(url_list)
        # print(len(self.danmus))
        return self.danmus

    def _getTvInfo(self, url):
        vid = url.split("/")[-1].split(".")[0]
        seg_index_url = f'https://dm.video.qq.com/barrage/base/{vid}'
        r = requests.get(seg_index_url)
        segment_index = r.json()['segment_index']
        url_prefix = f'https://dm.video.qq.com/barrage/segment/{vid}/'
        url_list = [url_prefix + seg['segment_name'] for index, seg in segment_index.items()]
        # print(url_list)
        return url_list


    def _getTencentDanmu(self, url_list):
        # for url in url_list:
        #     self._getTencentDanmuThread(url)

        # 创建线程池
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # 提交任务给线程池
            futures = [executor.submit(self._getTencentDanmuThread, url) for url in url_list]
        # 等待所有任务完成
        concurrent.futures.wait(futures)

    def _getTencentDanmuThread(self, url):
        danmu_list = []
        try:
            r = requests.get(url)
            data_json = r.json()
            for a in data_json["barrage_list"]:
                show_time = f"{(float(a['time_offset'])  / 1000):.2f}"
                content_str = a['content_style']
                color = "16777215"
                try:
                    content_json = json.loads(content_str)
                    color = content_json['color']
                    color = f"{int(color, 16)}"
                except:
                    pass
                danmu_list.append({
                    'cid': a['id'],
                    'p': f"{show_time},1,{color},[tencent]{a['id']}",
                    'm': a['content']
                })
        except Exception as e:
            print(e)
        self.danmus = self.danmus + danmu_list






if __name__ == '__main__':
    url = "https://v.qq.com/x/cover/drdhwecvp0vtech/o00225rfysh.html"
    TencentDanmu().getDanmu(url)
