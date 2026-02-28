import time, base64, re, json, requests, subprocess
from hashlib import md5
from networking.seleniumTool import SeleniumTool

class YouKuDanmu:
    def __init__(self):
        self.cookies = ""
    # -----------------------------------------------------------
    def get_request_data(self, smpa, id, video_id, show_id, page=0):
        """
            获取提交请求的参数
            需要的参数:
                smpA
                id
                videoId
                showId
                page: 页数，一页100条数据
        """

        # ip只要是国内ip就行
        next_session = {
            "spmA": smpa,
            "level": 2,
            "lastPageNo": 1,
            "lifecycle": 1,
            "id": id,
            "itemStartStage": page * 100 + 1,
            "itemEndStage": (page + 1) * 100
        }
        params = {
                    "biz": "new_detail_web2",
                    "scene": "component",
                    "componentVersion": "3",
                    "ip": "58.215.55.107",
                    "debug": 0,
                    "userId": "",
                    "platform": "pc",
                    "gray": 0,
                    "nextSession": json.dumps(next_session),
                    "videoId": video_id,
                    "showId": show_id
                }
        system_info = {
            "os": "pc",
            "device": "pc",
            "ver": "1.0.0",
            "appPackageKey": "pcweb",
            "appPackageId": "pcweb"
        }




        data = {
            "ms_codes": "2019030100",
            "params": json.dumps(params),
            "system_info": json.dumps(system_info)
        }
        data = json.dumps(data)
        app_key = '24679788'
        m_h5_tk = re.findall("m_h5_tk=(.*?)_", self.cookies)[0]  # 从cookies中找到m_h5_tk
        t = int(time.time()) * 1000  # 日期时间戳的毫秒表示
        sign = f"{m_h5_tk}&{t}&{app_key}&{data}"
        sign = md5(sign.encode("utf8")).hexdigest()

        return {
            'jsv': '2.6.1',
            'appKey': app_key,
            't': t,
            'sign': sign,
            'api': 'mtop.youku.columbus.gateway.new.execute',
            'type': 'originaljson',
            'v': '1.0',
            'ecode': '1',
            'dataType': 'json',
            'data': data
        }

    def get_cookies(self):
        url = "https://acs.youku.com/h5/mtop.youku.columbus.ycp.query/1.0/"

        app_key = '24679788'
        t = int(time.time()) * 1000  # 日期时间戳的毫秒表示

        params = {
            "bizKey": "ycp",
            "pageSize": 10,
            "time": t,
            "app": "5200-C2cNqy93",
            "objectType": 1,
            "nodeKey": "MAINPAGE_SUBPAGE",
            "page": 1,
            "objectCode": "XMTM3OTE1NzIyNA==",
            "utdid": None,
            "gray": 0
        }

        data = {
                "ms_codes": "2019061000",
                "system_info": {},
                "params": json.dumps(params),
                "debug": 0
            }
        m_h5_tk = ""

        sign = f"{m_h5_tk}&{t}&{app_key}&{data}"
        sign = md5(sign.encode("utf8")).hexdigest()



        requests_data = {
            "jsv": "2.6.1",
            "appKey": app_key,
            "t": t,
            "sign": "077810ee81b8adeebe89ce385ad601ec",
            "api": "mtop.youku.columbus.ycp.query",
            "type": "originaljson",
            "v": "1.0",
            "ecode": 1,
            "dataType": "json",
            "data": data
        }
        r = requests.get(url, params=requests_data)
        # print(r.text)
        # print(r.cookies)
        self.cookies = "; ".join([f"{key}={value}" for key, value in r.cookies.items()])


    def get_stage(self, n):
        try:
            # print(n["data"]["action"]["report"]["trackInfo"])
            # print(f'https://v.youku.com/v_show/id_{n["data"]["action"]["value"]}.html')
            return {
                "ep": n["data"]["stage"],
                "title": n["data"]["title"],
                "url": f'https://v.youku.com/v_show/id_{n["data"]["action"]["value"]}.html'
            }
        except:
            return None

    def get_stage_list(self, smpa, id, video_id, show_id, page=0):
        """
        获取优酷剧集列表
        """
        headers = {
            "^Accept": "*/*^",
            "^Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6^",
            "^Cache-Control": "no-cache^",
            "^Connection": "keep-alive^",
            "Host": "acs.youku.com",
            "Sec-Fetch-Dest": "script",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
            "cookie": self.cookies,
            "Referer": "https://v.youku.com/v_show/id_XNjQ1MDE1NzY0MA==.html?spm=a2hja.14919748_WEBTV_JINGXUAN.drawer4.d_zj1_2",
        }
        request_data = self.get_request_data(smpa, id, video_id, show_id, page)
        r = requests.get("https://acs.youku.com/h5/mtop.youku.columbus.gateway.new.execute/1.0/",
                           params=request_data, headers=headers)
        # print(res.url)
        # print(res.json())
        if r.status_code == 200:
            tv_info = {}
            d = r.json()
            # print(d)
            for k in d["data"]:
                for n in d["data"][k]["data"]["nodes"]:
                    tv = self.get_stage(n)
                    if tv:
                        tv_info[str(tv["ep"])] = tv
            return tv_info
        return {}


    def get_page_data(self, url):
        """
        从传入的url中获取一些参数
        """

        headers = {
            "cookie": self.cookies,
        }
        r = requests.get(url, headers=headers)
        if r.status_code == 200:
            # 定义一个正则表达式来匹配window.__INITIAL_DATA__
            pattern = re.compile(r'window\.__INITIAL_DATA__\s*=\s*(\{.*?\});', re.DOTALL)
            match = pattern.search(r.text)
            if match:
                json_str = match.group(1)
                data = json.loads(json_str)
                # print(json_str)
                return data
        return None

    def get_tv_episodes(self, data):
        try:
            episodes = data["data"]["model"]["detail"]["data"]["data"]["extra"]["episodeTotal"]
            return episodes
        except:
            return 0

    def get_tv_list(self, url):
        """
        获取剧集列表
        """
        self.get_cookies()
        data = self.get_page_data(url)
        if data:
            smpa = data["spmA"]
            video_id = data["videoId"]
            show_id = data["showId"]
            id = 0
            for x in data["data"]["data"]["nodes"]:
                for n in x["nodes"]:
                    if n["type"] == 10013:  # 播放器选集组件
                        id = n["id"]
                        break
            episode_count = self.get_tv_episodes(data)
            if episode_count:
                tv_list = {}
                for p in range(0, int(episode_count / 100) + 1):
                    tv_list.update(self.get_stage_list(smpa, id, video_id, show_id, p))
                return tv_list
        return {}



if __name__ == '__main__':
    # cookie = 'isI18n=false; cna=zZTIHmYQQi8BASQOA6OgBiTo; __ysuid=1735547730994tMt; __aysid=1735547730995LR2; mtop_partitioned_detect=1; xlly_s=1; webpushRejected=1; __ayft=1735621475614; __ayscnt=1; _m_h5_tk=eae1af1e8300c029022e8b5486b477ca_1735625793964; _m_h5_tk_enc=b107cf92d5cfc5827363785215932783; youku_history_word=%5B%22%E5%A4%A7%E6%98%8E%E9%A3%8E%E5%8C%96%22%5D; __arycid=dh-3-00; __arcms=dh-3-00; isg=BKenjVh_jM25hQlzz4p_pnw_NttxLHsOqk5c5HkU-TZdaMYqgf1gXHwgjmh2gFOG; __arpvid=1735621875489naJGLP-1735621875492; __aypstp=7; __ayspstp=17; __ayvstp=17; __aysvstp=43; tfstk=gTKIDRcSEWVQXNPMKXHNGW9_Tds7-QiVw86JnLEUeMILyF9esySFLLCWNC5gzXfe4QNR6BtrtuvhQhXJjuYhJL0JjptwT2epe86J_Cd5rvfPw_OyeekZ0mJHKgjRVjoq0CRw_iA5pTELBYBPhWHNJgEnKtI-gjo47RQnTgdUYJoK1dCGFTedwQI9BtWd2TBd2A1OFt489QI-CA6RF9EdpyCTXTXV2_dR2A9OsTM_b-6SR6vIdy2H8n28OdC_2uK1BbfvdDEfL3WBEs9pAuqor9_CMpCiixVw6NplP32uVavpoQXv9WhV-LL619sSbyIvCUdfIHn4OOYeBK59h8ryhMt6fUQspDp1A6_fCNw07MTJt3_HR8DDBMdMosbKSfX6Yn75iNNt9dJ19ZTWTfqRTE991Z-a_oSksUdRFCFC45qVG6YUPR_0VO1qCAaurIvS73EUmnzFJOXC7AM_9UbdIO1qCAaurwBGd1ksCWLl.'
    url = 'https://v.youku.com/v_show/id_XMTM3OTE1NzMzNg==.html?spm=a2hja.14919748_WEBCOMIC_JINGXUAN.scg_scroll_3.d_play3&s=e1f23322845b11e5b692&scm=20140719.rcmd.feed_scg.show_e1f23322845b11e5b692&s=e1f23322845b11e5b692'
    url2 = 'https://v.youku.com/v_show/id_XNDQ1Nzg0ODUyNA==.html?s=3d167d3aefbfbd1f11ef&spm=a2hje.13141534.1_5.d_1_1&scm=20140719.apircmd.240015.video_XNDQ1Nzg0ODUyNA=='
    youku = YouKuDanmu()
    # youku.start()
    # youku.get_stage_list(smpa='a2h08', id='239064', video_id='XMTM3OTE1NzMzNg==', show_id='e1f23322845b11e5b692')
    # youku.get_stage_list(smpa='a2hjt', id='240015', video_id='XNDQ1Nzg0ODUyNA==', show_id='3d167d3aefbfbd1f11ef')
    # youku.get_page_data(url2)
    youku.get_tv_list(url2)

    # youku.get_cookies()