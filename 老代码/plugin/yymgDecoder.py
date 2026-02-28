# yy漫画的解码类
import re
from networking.webRequest import WebRequest
from config.configParse import config
from networking.proxy import ProxyState
import requests
import urllib.parse
from urllib.parse import quote
from datetime import datetime
from logger.logger import logger
import concurrent.futures
from util import typeChange
import execjs

class Yymanga:
    def __init__(self, aid, pid, use_proxies=False, proxies_state=ProxyState.FLASK_DOMESTIC, run_type="thread"):
        """

        """
        self.aid = aid
        self.pid = pid
        self.use_proxies = use_proxies
        self.proxies_state = proxies_state
        self.imgs = {}
        self.url = config.read("YM", "url")
        self.run_type = run_type

    def set_vars(self, p, a, c, k, e, d):
        self.p = p
        self.a = a
        self.c = c
        self.k = k
        self.e = e
        self.d = d

    def get_sign(self):
        match = re.search(r'var\s+YYMANHUA_VIEWSIGN\s*=\s*"([^"]+)"', self.page_content)
        if match:
            yymanhua_viewsign = match.group(1)
            return yymanhua_viewsign
        else:
            return ""

    def get_pages(self):
        match = re.search(r'var\s+YYMANHUA_IMAGE_COUNT\s*=\s*(\d+)', self.page_content)
        if match:
            yymanhua_viewsign = match.group(1)
            return yymanhua_viewsign
        else:
            return ""


    def get_dt(self):
        match = re.search(r'var\s+YYMANHUA_VIEWSIGN_DT\s*=\s*"([^"]+)"', self.page_content)
        if match:
            yymanhua_viewsign = match.group(1)
            return yymanhua_viewsign
        else:
            return ""


    def do_js(self, js_code):
        """
        运行js并获取d的结果
        """
        try:
            js_code = js_code.replace("\\'", "'")
            ctx = execjs.compile(js_code)
            result = ctx.eval("d")
            return result
        except Exception as e:
            logger.warning(f"无法解析的js{js_code}")
            return []

    def do_js_re(self, js_code):
        """
        手动实现获取图片
        """
        js_code = js_code.replace("\\'", "'")
        # 使用正则表达式提取 key, pix 和 pvalue 的值
        key_pattern = re.compile(r"var key='([^']+)'")
        pix_pattern = re.compile(r'var pix="([^"]+)"')
        pvalue_pattern = re.compile(r'var pvalue=\[([^\]]+)\]')

        key_match = key_pattern.search(js_code)
        pix_match = pix_pattern.search(js_code)
        pvalue_match = pvalue_pattern.search(js_code)

        if key_match:
            key = key_match.group(1)
        else:
            key = None

        if pix_match:
            pix = pix_match.group(1)
        else:
            pix = None

        if pvalue_match:
            pvalue = pvalue_match.group(1).split(',')
            pvalue = [item.strip().strip("'") for item in pvalue]
        else:
            pvalue = None

        if key and pix and pvalue:
            # print(pvalue)
            urls = []
            for p in pvalue:
                p = p.replace('"', '')
                urls.append(f"{pix}{p}?cid={self.pid}&key={key}&uk=")
            return urls
        logger.warning(f"无法手动解析的js{js_code}")
        return []


    def get_vars(self, encode_js):
        """
        提取字符串中的几个参数
        """
        # 示例字符串
        text = encode_js

        # 定义正则表达式模式
        pattern = r";\}\s*\("

        # 使用正则表达式进行匹配
        match = re.search(pattern, text)
        if match:
            # 提取匹配位置之后的字符串
            text = text[match.end():]

        else:
            print("没有找到匹配的模式")
            return []
        text = text.strip()
        text = text[0: -2]
        # print("提取的内容:", text)
        content = text
        result = []
        current_part = []

        i = 0
        start_index = 0
        yinhao_count = 0
        content = " " + content
        while i < len(content):
            char = content[i]
            if char == "'" and i > 0:
                if content[i-1] != "\\":
                    yinhao_count += 1
            if char == ",":
                if yinhao_count % 2 == 0:
                    # 引号是完整的
                    result.append(content[start_index : i])
                    start_index = i + 1
            i += 1
        if len(result) == 5:
            x0 = result[0]
            x0 = x0[2:-1]
            x1 = result[1]
            x1 = int(x1)
            x2 = result[2]
            x2 = int(x2)
            x3 = result[3]
            x3 = x3.replace(".split('|')", "")
            x3 = x3[1:-1]
            x3 = x3.split("|")
            x4 = result[4]
            x4 = int(x4)
            x5 = {}
            self.set_vars(x0, x1, x2, x3, x4,x5)


    def to_string_base36(self, number):
        if number < 0:
            raise ValueError("Number must be non-negative")

        if number == 0:
            return '0'

        digits = []
        while number:
            remainder = number % 36
            if remainder < 10:
                digits.append(str(remainder))
            else:
                digits.append(chr(ord('a') + remainder - 10))
            number //= 36

        return ''.join(digits[::-1])

    def function_e(self):
        c = self.c
        a = self.a
        x1 = ""
        if c < a:
            x1 = ""
        else:
            x1 = e(c // a, a)

        self.c = c % a
        c = self.c
        x2 = ""
        if c > 35:
            x2 = chr(c + 29)
        else:
            x2 = self.to_string_base36(c)
        return x1 + x2

    def decode(self):
        while self.c > 0:
            self.c -= 1
            d_index = self.function_e()
            # print(self.k[self.c])
            if self.k[self.c]:
                self.d[d_index] = self.k[self.c]
            else:
                self.d[d_index] = self.function_e()
        p = re.sub(r'\b\w+\b', lambda match: self.d.get(match.group(0), match.group(0)), self.p)
        return p

    def _httpComplete(self, response, url, kwargs):
        """
        httpComplete
        判断http是否真的完成，即使返回200，有时也会被墙屏蔽
        不要直接调用此方法，将此方法传递给webrequest使用
        :return:
        """
        re_count = 0
        msg = "获取成功"
        txt = response.get("text", "")
        if "function" in txt:
            complete = True
        else:
            complete = False
        return complete

    def get_img_fun(self, page):
        try:
            url = f"{self.url}/m{self.pid}/chapterimage.ashx?cid={self.pid}&page={page}&key=&_cid={self.pid}&_mid={self.aid}&_dt={self.dt}&_sign={self.sign}"
            headers = {
                "cookie": self.cookies_str,
                "authority": "www.yymanhua.com",
                "method": "GET",
                "scheme": "https",
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "priority": "u=1, i",
                "referer": self.first_url,
                "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
                "x-requested-with": "XMLHttpRequest"
            }
            web = WebRequest(httpComplete=self._httpComplete)
            if web.get(url, headers=headers, use_proxy=self.use_proxies, proxy_state=self.proxies_state):
                self.get_vars(web.text)
                js_str = self.decode()
                imgs = self.do_js_re(js_str)
                for i, img in enumerate(imgs):

                    self.imgs[page + i] = img
            else:
                logger.warning(f"获取页面url={url}失败")
        except Exception as e:
            logger.warning(f"获取页面url={url}失败 {e} ")




    def get_imgs(self):
        self.imgs = {}
        sign = self.get_sign()
        pages = self.get_pages()
        dt = self.get_dt()
        if sign and pages and dt:
            self.sign = sign
            self.dt = dt
            pages = int(pages)
            page_list = []
            for page in range(1, pages + 1, 2):
                if page <= pages:
                    page_list.append(page)
            if self.run_type == "for":
                for page in page_list:
                    self.get_img_fun(page)
            elif self.run_type == "thread":
                with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                    futures = [executor.submit(self.get_img_fun, page) for page in page_list]
                    concurrent.futures.wait(futures)

            if len(self.imgs) >= pages:
                imgs = typeChange.sort_dict_by_key(self.imgs)
                imgs = [v for k, v in imgs.items()]
                return imgs
            else:
                logger.warning(f"ym收集图片数量异常 应有:{pages} 收集:{len(self.imgs)}   {self.imgs}")
        return None

    def set_cookies(self, cookies):
        cookies_str = ""
        if type(cookies) == dict:
            for n, v in enumerate(cookies):
                cookies_str += f"{n}:{v};"
        else:
            for c in cookies:
                cookies_str += f"{c.name}:{c.value};"
        replacements = {
            ' ': '%20',  # URL编码空格
            '+': '%2B',  # 表单编码加号
            '/': '%2F',  # URL编码斜杠
            '\\': '%5C',  # URL编码反斜杠
            '?': '%3F',  # URL编码问号
            '=': '%3D',  # URL编码等号
            '#': '%23',  # URL编码井号
            '%': '%25'  # URL编码百分号
        }
        # 使用列表生成式进行替换
        url = self.first_url
        url = ''.join([replacements[char] if char in replacements else char for char in url])
        cookies_str += f"firsturl:{url};firsturl:{url};"
        self.cookies_str = cookies_str

    def get_imgs_by_id(self):
        url = f"{self.url}/m{self.pid}/"
        r = requests.get(url)
        if r.status_code == 200:
            self.page_content = r.text
            self.first_url = url
            self.set_cookies(r.cookies)
            # print(self.cookies)
            return self.get_imgs()

    def get_imgs_by_content(self, url, content, cookies):
        self.page_content = content
        self.first_url = url
        self.set_cookies(cookies)
        return self.get_imgs()



if __name__ == '__main__':
    y = Yymanga(25935, 207657)
    y.get_imgs_by_id()
