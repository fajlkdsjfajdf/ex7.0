import requests
from networking import proxy
import re
from logger.logger import logger
from flask import Response
from bs4 import BeautifulSoup
import urllib.parse
from networking.webRequest import WebRequest
from networking import proxy


class ReverseProxy:
    def __init__(self, proxy_url: str, prefix:str,  use_proxy=False):
        """

        Args:
            proxy_url: 反代的网址
            use_proxy: 反代是否使用海外代理
        """
        if proxy_url.endswith("/"):
            proxy_url = proxy_url[:-1]
        self.proxy_url = proxy_url
        self.use_proxy = use_proxy
        self.prefix = prefix


    def is_relative(self, url: str):
        # 判断URL是否是相对路径
        return not bool(urllib.parse.urlparse(url).netloc)
        # if url.startswith(".") or url.startswith("/"):
        #     return True
        # else:
        #     return False

    def modify_links(self, html_content):
        soup = BeautifulSoup(html_content, 'html.parser')

        # 修改CSS链接
        for link in soup.find_all('link', rel='stylesheet'):
            if link.get('href') and self.is_relative(link['href']):
                link['href'] = self.prefix + link['href']

        # 修改JS链接
        for script in soup.find_all('script'):
            if script.get('src') and self.is_relative(script['src']):
                script['src'] = self.prefix  + script['src']

        return str(soup)

    def get_charset_from_headers(self, headers):
        content_type = headers.get('Content-Type', '')
        match = re.search(r'charset=([\w-]+)', content_type)
        if match:
            return match.group(1)
        return 'utf-8'



    def forward_request(self, path, request, **kwargs):

        target_url = f'{self.proxy_url}/{path}'
        # print(target_url)
        # # 获取原始请求的方法和数据
        method = request.method
        data = request.get_data()
        headers = {key: value for key, value in request.headers if key != 'Host'}

        web = WebRequest()
        web_success = False;
        if method == "GET":
            query_string = urllib.parse.urlencode(data)
            target_url = f"{target_url}?{query_string}"
            web_success = web.get(target_url, use_proxy=self.use_proxy, proxy_state=proxy.ProxyState.INCLUD_MYFOREIGN)
        elif method == "POST":
            web_success = web.post(target_url, data=data, use_proxy=self.use_proxy, proxy_state=proxy.ProxyState.INCLUD_MYFOREIGN)

        if web_success:
            logger.info(f"status: 200  url: {target_url}")
            charset = self.get_charset_from_headers(web.response_headers)
            content = web.content.decode(charset)
            modified_content = self.modify_links(content)
            content = modified_content.encode(charset)
            return Response(content, content_type=web.response_headers['content-type'])

        else:
            logger.warning(f"status: 404  url: {target_url}")
            return Response(status=404)



        # response = None
        #
        # # print(proxies)
        # response = requests.request(method, target_url, proxies=proxies, **kwargs)
        #
        # if response.status_code == 200:
        #     logger.info(f"status: 200  url: {target_url}")
        #     charset = self.get_charset_from_headers(response.headers)
        #     content = response.content.decode(charset)
        #     modified_content = self.modify_links(content)
        #
        #     # content = response.content
        #     content = modified_content.encode(charset)
        #     return Response(content, content_type=response.headers['content-type'])
        # else:
        #     logger.warning(f"status: {response.status_code}  url: {target_url}")
        #     return Response(status=response.status_code)



if __name__ == '__main__':
    r = ReverseProxy("https://sukebei.nyaa.si/", True)
    # a =r.forward_request("get", "?f=0&c=0_0&q=破")
    print(r.get_url("http://localhost:18001/proxy/sukebei.nyaa.si/123/456"))
    # print(a.text)