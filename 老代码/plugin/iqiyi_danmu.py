import os
import requests
from util import typeChange
import csv
import json
import bs4
from math import ceil
from datetime import datetime
from zlib import decompress
import concurrent.futures
import time
import hashlib
from urllib.parse import urlencode


class IqiyiDanmu:
    def __init__(self):
        self.danmus = []
    def getDanmu(self, url):
        self.danmus = []
        info = self._getTvInfo(url)
        print(info)
        danmu = self._getIqiyiDanmus(info["tvid"], info["duration"])
        # print(self.danmus)
        return self.danmus

    def getTvList(self, url):
        # info = self._getTvInfo(url)
        # print(info)
        # list = self._getIqiyiTvList(info)
        return self._getIqiyiTvList(url)


    def _getDeviceid(self, vid_script):
        try:
            return vid_script["a"]["data"]["showResponse"]["slots"][0]["ads"][0]["iqiyiTracking"]["cupidTracking"]["trackingParam"]["g"]
        except:
            return ""

    def _getTvInfo(self, html_url):
        r = requests.get(html_url)
        soup = bs4.BeautifulSoup(r.content, 'html.parser')
        script_html = list(filter(lambda a: "window.QiyiPlayerProphetData" in a.text, soup.findAll('script')))[0]
        print(script_html)
        vid_script = json.loads(script_html.text.split("window.QiyiPlayerProphetData=")[1])
        # print(vid_script)
        tvid = str(vid_script['tvid']) if "tvid" in vid_script else str(vid_script['tvId'])
        video_duration = vid_script['a']['data']['showResponse']['videoInfo']['videoDuration']
        tl = vid_script['a']['data']['originRes']['vdi']['tl']
        device_id = self._getDeviceid(vid_script)

        # print(vid_script)
        info = {
            'tvid': tvid,
            'duration': video_duration,
            'title': tl,
            "device_id": device_id
        }
        return info


    def _getIqiyiDanmus(self, vid, duration):
        i_length = ceil(duration/300)  # iteration count for 300 second intervals
        # for i in range(1, i_length+1):
        #     self._getDanmuThread(vid, duration, i)
        # 创建线程池
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # 提交任务给线程池
            futures = [executor.submit(self._getDanmuThread, vid, duration, i) for i in range(1, i_length + 1)]
        # 等待所有任务完成
        concurrent.futures.wait(futures)

    def _getDanmuThread(self,vid, duration, i):
        # i_url = f"https://cmts.iqiyi.com/bullet/{vid[-4:-2]}/{vid[-2:]}/{vid}_300_{i}.z"

        vid = str(vid)
        i_url = f"https://cmts.iqiyi.com/bullet/mask/{vid[-4:-2]}/{vid[-2:]}/{vid}_mask_{i}.z"
        # i_url = "https://cmts.iqiyi.com/bullet/bullet_guide.z"
        try:
            dms = []
            dm_raw = requests.get(i_url).content
            dm_dc = decompress(dm_raw)
            print(dm_dc)
            dm = typeChange.xmlToDict(dm_dc)
            dm = dm['danmu']['data']['entry']
            for entry in dm:
                if not entry['list']:
                    continue
                if isinstance(entry['list']['bulletInfo'], dict):
                    record = [entry['list']['bulletInfo']]
                else:
                    record = entry['list']['bulletInfo']
                    # 'contentId': a['contentId'],
                    # 'content': a['content'],
                    # 'showTime': a['showTime'],
                    # 'likeCount': a['likeCount'],
                    # 'plusCount': a['plusCount'],
                    # 'dissCount': a['dissCount'],
                    # 'replyCount': a['replyCnt'],
                    # 'userName': a['userInfo']['name'],
                    # 'userUid': a['userInfo']['uid']

                record = [{
                    'cid': a['contentId'],
                    'p': f"{float(a['showTime']):.2f},1,{int(a['color'], 16)},[aiqiyi]{a['contentId']}",
                    'm': a['content']
                } for a in record]
                dms = dms + record
        except Exception as e:
            print(e)
        self.danmus = self.danmus + dms


    def _getTvs(self, info):
        videos = []
        try:
            videos  = info["data"]["template"]["pure_data"]["selector_bk"]
            return videos
        except:
            pass
        try:
            blocks = info["data"]["template"]["tabs"][0]["blocks"]
            for b in blocks:
                if b["bk_id"] == "selector_bk":
                    videos = b["data"]["data"]
                    return videos
            return videos
        except:
            pass
        return videos

    def _getTvid(self, url):
        """
        通过url 获取tvid
        Args:
            url:

        Returns:

        """
        y = 129125665826668
        token = url
        e = int(url,  36)

        i = list(bin(e)[2:])[::-1]
        n = list(bin(y)[2:])[::-1]
        o = []
        for r in range(max(len(i), len(n))):
            if r < len(i) and r < len(n):
                o.append('0' if i[r] == n[r] else '1')
            elif r < len(i):
                o.append(i[r])
            else:
                o.append(n[r])
        e =  int(''.join(o[::-1]), 2)
        t = e
        t = 100 * (t + 9e5) if t < 9e5 else t
        print(t)
        return t




    def _getIqiyiTvList(self, url):
        try:
            r = requests.get(url)
            info = json.loads(r.text)


            videos = self._getTvs(info)


            juji_videos = None
            for v in videos:
                if v["order"] == 1 or v["order"] == 0:
                    juji_videos = v
                    break
            if juji_videos:
                tv_info = {}
                videos = juji_videos["videos"]
                for page_key in videos["feature_paged"] :
                    for video in videos["feature_paged"][page_key]:
                        tv_info[str(video["album_order"])] = {
                            "ep": video["album_order"],
                            "url": video["page_url"]
                        }
                return tv_info
        except Exception as e:
            print(f"获取爱奇艺剧集信息出错 {e}")
        return None



    # 拼接 连接符 数据 特殊符号（可不填）
    def _getSign(self, c, t, e=None):
        # 根据参数加密生成sign
        buf = []
        for key, value in t.items():
            buf.append('='.join([key, str(value)]))
        if e != None:
            buf.append(e)
            return (self.md5(c.join(buf)))
        return (c.join(buf))

    def getTimestamp(self):
        # 获取当前时间的秒级时间戳
        current_timestamp = int(time.time() * 1000)

        return str(current_timestamp)

    # md5加密
    def md5(self, data):
        return hashlib.md5(bytes(data, encoding='utf-8')).hexdigest()

    def _getSign2(self, e, t, a={}):
        n = a.get("split", "|")
        s = a.get("sort", True)
        o = a.get("splitSecretKey", True)

        keys = sorted(t.keys()) if s else t.keys()

        values = [f"{key}={t[key]}" for key in keys]
        param_str = n.join(values)
        if o:
            param_str += n

        param_str += e
        return hashlib.md5(param_str.encode()).hexdigest()
    def test(self):
        info = {
                'entity_id': '13201536500',
                'timestamp': '1707717814297',
                'src': 'pcw_tvg',
                'vip_status': '0',
                'vip_type': '',
                'auth_cookie': '',
                'device_id': 'e3ffe0525b00f2ebc421400bf7a13f06',
                'user_id': '',
                'app_version': '7.0.0',
                'scale': '200'
             }
        sign = self._getSign2('UKobMjDMsDoScuWOfp6F', info)
        print(sign)

    def _getTvidByParentId(self, parent_id):
        """
        根据parent_id获取tvid
        Args:
            parent_id:

        Returns:

        """

        # js代码如下
        pass






if __name__ == '__main__':
    d = IqiyiDanmu()
    url= "https://www.iqiyi.com/v_19rrk2h4f8.html"
    vid = d._getTvid("19rrk2h4f8")
    d._getDanmuThread(vid, 30, 1)


    # a = d._getTvInfo(url)
    # print(a)

    # d._getDanmuThread(123, 1234, 1)
    # a =d.getTvList("https://mesh.if.iqiyi.com/tvg/v2/lw/base_info?entity_id=103405000&device_id=77aa33b31f1dbb8fefc70bc4a3cd08e9&auth_cookie=&user_id=0&vip_type=-1&vip_status=0&conduit_id=&app_version=12.94.20247&ext=&timestamp=1729136972894&src=pca_tvg&os=&ad_param=%5B%7B%22azt%22%3A%22730%22%2C%22azd%22%3A%221000000000942%22%2C%22lm%22%3A1%2C%22position%22%3A%22related%22%7D%2C%7B%22azt%22%3A%22731%22%2C%22azd%22%3A%221000000000943%22%2C%22lm%22%3A1%2C%22position%22%3A%22recommend%22%7D%2C%7B%22azt%22%3A%22734%22%2C%22azd%22%3A%221000000000910%22%2C%22lm%22%3A1%2C%22position%22%3A%22middlecard%22%7D%2C%7B%22azt%22%3A%22738%22%2C%22azd%22%3A%221000000000911%22%2C%22lm%22%3A1%2C%22position%22%3A%22bottomcard%22%7D%2C%7B%22azt%22%3A%22612%22%2C%22azd%22%3A%221000000000695%22%2C%22lm%22%3A2%2C%22position%22%3A%22recommend_full%22%7D%2C%7B%22azt%22%3A%22%22%2C%22azd%22%3A%221000000000912%22%2C%22lm%22%3A1%2C%22position%22%3A%22rcd_image%22%7D%5D&sign=EA0B0B38AAAD336F58678CE8BF03D0F6")
    # print(a)
