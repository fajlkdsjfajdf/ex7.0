# bilibli漫画辅助
import time
from urllib.parse import urlencode, quote, unquote
import hashlib
import requests
import re
from config.configParse import config


class BilibliManga:
    def __init__(self):
        self.comment_api_url = "https://api.bilibili.com/x/v2/reply/wbi/main"
        self.comiclist_api_url = "https://manga.bilibili.com/twirp/comic.v1.Comic/ComicDetail?device=pc"
        self.search_api_url = "https://manga.bilibili.com/twirp/comic.v1.Comic/Search?device=pc&platform=web&nov=25"


    def get_picture_hash_key(self, tt):
        rt = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39,
              12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63,
              57, 62, 11, 36, 20, 34, 44, 52]
        vt = []
        for zt in rt:
            if len(tt) > zt and tt[zt]:
                vt.append(tt[zt])
        return ''.join(vt)[:32]

    def get_cookies(self):

        return config.read("BM", "cookies")

    def get_headers(self):
        return {
            'authority': 'manga.bilibili.com',
            'accept': 'application/json, text/plain, */*',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
        }

    def get_img_format_config(self):
        """
        获取vt和zt, 当前使用未登录时默认的值
        Returns:

        """
        vt = "7cd084941338484aae1ad9425b84077c"
        zt = "4932caff0ff746eab6f01bf08b70ac45"
        return {"vt": vt, "zt": zt}

    def get_w_rid(self, tt, ft=None):
        """
        获取w_rid
        Returns:

        """
        img_config = self.get_img_format_config()
        wt = self.get_picture_hash_key(img_config["vt"] + img_config["zt"])
        if not ft:
            ft = round(time.time())
        tt["wts"] = ft
        jt = urlencode(tt)
        w_rid = hashlib.md5((jt + wt).encode('utf-8')).hexdigest()
        return w_rid, ft

    def get_comment_url(self, oid):
        """
        根据漫画id获取评论url
        Args:
            oid: 漫画章节id

        Returns:

        """

        tt = self.get_comment_param(oid)
        w_rid, wts = self.get_w_rid(tt)
        tt["w_rid"] = w_rid
        tt["wts"] = wts
        url = f"{self.comment_api_url}?{urlencode(tt)}"
        # print(url)
        return url

    def get_comment_url_test(self):
        tt = {
            "oid": 448685,
            "type": 29,
            "mode": 3,
            "pagination_str": r"""{"offset": "{\"type\":1,\"direction\":1,\"data\":{\"pn\":2}}"}""",
            "plat": 1,
            "web_location": 1315875

        }
        w_rid, wts = self.get_w_rid(tt, "1735280444")
        print(w_rid)
        print(wts)



    def get_comment_param(self, oid):
        """
        获取漫画评论所需要的参数
        Args:
            oid: 漫画章节id

        Returns:

        """

        # pagination_str = r'''{"offset":"{\"type\":1}", \"direction\":1},\"data\":{\"pn\":2}}"}'''
        # pagination_str = r'''{"offset":"{\"type\":1,\"direction\":1,\"data\":{\"pn\":2}}"}'''
        pagination_str = r'''{"offset":""}'''
        param = {
            "mode": 3,
            "oid": oid,
            "pagination_str": pagination_str,
            "plat": 1,
            "type": 29,
            "web_location": 1315875
        }
        return param

    def get_comic_list(self, comic_id):
        """
        获取漫画列表
        Args:
            comic_id: 漫画id

        Returns:

        """

        resp_data = requests.post(self.comiclist_api_url, {"comic_id":comic_id}, cookies=self.get_cookies(), headers=self.get_headers())
        # print(resp_data.text)
        if resp_data.status_code == 200:
            # print(resp_data)
            data_json = resp_data.json()
            ep_list = [{"id": ep["id"], "ord": ep["ord"], "short_title": ep["short_title"], "title": ep["title"]}
                       for ep in data_json["data"]["ep_list"]]
            return ep_list
        return None

    def get_manga_id(self, url):
        pattern = r'mc(\d+)'
        match = re.search(pattern, url)
        if match:
            number = match.group(1)
            number = int(number)
            return number
        else:
            return None

    def search_manga(self, title):
        """
        根据标题搜索漫画
        """
        try:
            url = self.search_api_url
            headers = self.get_headers()
            cookies = self.get_cookies()
            request_data = {"key_word": title, "page_num": 1, "page_size": 9}
            resp_data = requests.post(url, request_data, headers=headers, cookies=cookies)
            if resp_data.status_code == 200:
                data = resp_data.json()
                manga_list = []
                if "data" in data and "list" in data["data"]:
                    for i in data["data"]["list"]:
                        manga_list.append(i)
                else:
                    print(data)
                return manga_list

        except Exception as e:
            print(e)
        return None


    def get_comments(self, id):
        try:
            url = self.get_comment_url(id)
            headers = self.get_headers()
            cookies = self.get_cookies()
            cookies = {}
            comments = []
            resp_data = requests.get(url, headers=headers, cookies=cookies)
            if resp_data.status_code == 200:
                data = resp_data.json()

                if "data" in data and "replies" in data["data"] and data["data"]["replies"]:
                    for replies in data["data"]["replies"]:
                        comments.append(replies["content"]["message"])
                        if "replies" in replies:
                            for replies2 in replies["replies"]:
                                comments.append(replies2["content"]["message"])
                    # print(len(comments))
                else:
                    print(data)
                return comments
        except Exception as e:
            print(e)
        return None

    def search(self, t, value):
        """
        网页response返回
        """
        if t == "search":
            data = self.search_manga(value)
            if data:
                return {"data": data}

        return {}


if __name__ == '__main__':
    url = "https://manga.bilibili.com/detail/mc26469?from=manga_homepage"
    b = BilibliManga()

    # id =b.get_manga_id(url)
    # # print(b.get_comic_list(id))
    #
    # comments = b.get_comments("448685")
    # print(comments)
    # print(len(comments))
    # b.get_comment_url_test()

    # d = b.search_manga("月光下的异世界之旅")
    # print(d)
    url = "https://manga.bilibili.com/detail/mc30613?from=manga_search"
    bilibili_id = b.get_manga_id(url)
    d = b.get_comic_list(bilibili_id)
    print(bilibili_id)




