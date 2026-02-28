# -*- coding: utf-8 -*-
"""
-------------------------------------------------
   File Name：     WebRequest
   Description :   Network Requests Class
   Author :        J_hao
   date：          2022/8/22
-------------------------------------------------
   Change Activity:
                   022/8/22:
-------------------------------------------------
"""
from requests.models import Response
from logger.logger import logger
from lxml import etree
import requests
import random
import time
from networking import proxy
from urllib.parse import urlparse
import json
import copy
import cfscrape
from proxytools import proxyClient
from networking import dnsOverHttps
from networking import dohCheck

from util import typeChange
import zipfile
from io import BytesIO
from curl_cffi import requests as curl_requests


requests.packages.urllib3.disable_warnings()
requests.adapters.DEFAULT_RETRIES = 5







class HostHeaderSSLAdapter(requests.adapters.HTTPAdapter):
    def __init__(self, resolved_ip):
        super().__init__()                                         #python3
        self.resolved_ip = resolved_ip

    def send(self, request, **kwargs):
        connection_pool_kwargs = self.poolmanager.connection_pool_kw
        result = urlparse(request.url)
        if result.scheme == 'https' and self.resolved_ip:
            request.url = request.url.replace(
                'https://' + result.hostname,
                'https://' + self.resolved_ip,
            )
            connection_pool_kwargs['server_hostname'] = result.hostname  # SNI  python2 需要屏蔽掉 不然会报 非预期的字段 key_server_hostname
            connection_pool_kwargs['assert_hostname'] = result.hostname

            request.headers['Host'] = result.hostname
        else:
            # theses headers from a previous request may have been left
            connection_pool_kwargs.pop('server_hostname', None)            #python2 需要屏蔽掉
            connection_pool_kwargs.pop('assert_hostname', None)

        return super(HostHeaderSSLAdapter, self).send(request, **kwargs)


class WebRequest(object):
    name = "web_request"


    def __init__(self, *args, **kwargs):
        self.response = {}
        self.kwargs = kwargs
        self.httpError = self._getArgs("httpError", self._httpError)
        self.httpComplete = self._getArgs("httpComplete", self._httpComplete)


    @property
    def user_agent(self):
        """
        return an User-Agent at random
        :return:
        """
        ua_list = [
            'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101',
            'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.122',
            'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71',
            'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95',
            'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.71',
            'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; QQDownload 732; .NET4.0C; .NET4.0E)',
            'Mozilla/5.0 (Windows NT 5.1; U; en; rv:1.8.1) Gecko/20061208 Firefox/2.0.0 Opera 9.50',
            'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0',
        ]
        return random.choice(ua_list)


    @property
    def header(self):
        """
        basic header
        :return:
        """
        return {'User-Agent': self.user_agent,
                'Accept': '*/*',
                'Connection': 'keep-alive',
                'Accept-Language': 'zh-CN,zh;q=0.8'}
    
    def check_cloudflare_ban(self, text):
        """
        判断是否遇到了cloudflare墙
        """
        if "<title>403 Forbidden</title>" in text and "<center>cloudflare</center>" in text:
            return True

        return False


    def _request(self, request_fun):
        """
        http请求总成
        :return:
        """

        done = False
        while self.stop_flag == False:
            if self.use_proxy:
                if self.proxies == "":
                    if self.use_proxy != True and not self.proxy_state:
                        self.proxy_state = self.use_proxy
                    proxies = proxy.getRndProxies(self.proxy_state)
                    # proxies = {"http": "fp://192.168.1.210:15002"}

                else:
                    proxies = self.proxies
            else:
                proxies = None
            self.kwargs["retry_count"] = self.retry_count
            try:
                url = ""
                if self.retry_count > 0:
                    url = self._getUrl(self._getBackUrl(self.request_url))
                else:
                    url = self._getUrl(self.request_url)

                scraper = None
                response = None
                if proxies and str(proxies["http"]).startswith("fp"):
                    # flask反代模式
                    if request_fun == "get":
                        response = proxyClient.get(url, headers=self.headers, cookies=self.cookie, verify=False,
                                                timeout=self.timeout, proxies=proxies, host=self.host_ip)
                    elif request_fun == "post":
                        response = proxyClient.post(url, self.request_data, headers=self.headers, cookies=self.cookie,
                                                 verify=False, timeout=self.timeout, proxies=proxies, host=self.host_ip)
                elif self.doh and str(url).startswith("https://") and proxies==None:
                    ip = self.doh_ip
                    if not ip:
                        ip = self._getDoh_ip(url)
                    # logger.info(ip)
                    if ip:
                        session = requests.Session()
                        session.mount('https://', HostHeaderSSLAdapter(ip))

                        if request_fun == "get":
                            response = session.get(url, headers=self.headers, cookies=self.cookie, verify=False,
                                                        timeout=self.timeout, proxies=proxies)
                        elif request_fun == "post":
                            response = session.post(url, self.request_data, headers=self.headers, cookies=self.cookie,
                                                     verify=False,timeout=self.timeout, proxies=proxies)
                        # print(response.text)
                    else:
                        logger.warning(f"{url} doh没有ip")
                else:
                    if request_fun == "get":
                        response = requests.get(url, headers=self.headers, cookies=self.cookie, verify=False,
                                                    timeout=self.timeout, proxies=proxies)
                    elif request_fun == "post":
                        response = requests.post(url, self.request_data, headers=self.headers, cookies=self.cookie,
                                                 verify=False,timeout=self.timeout, proxies=proxies)
                    elif request_fun == "curl_get":
                        response = curl_requests.get(url, headers=self.headers, cookies=self.cookie, impersonate="chrome120",
                                                timeout=self.timeout, proxies=proxies)
                    elif request_fun == "curl_post":
                        response = curl_requests.post(url, self.request_data, headers=self.headers, cookies=self.cookie,
                                                 impersonate="chrome120", timeout=self.timeout, proxies=proxies)

                url = copy.deepcopy(response.url)
                content = copy.deepcopy(response.content)
                text = copy.deepcopy(response.text)
                cookies = copy.deepcopy(response.cookies.get_dict())
                headers = copy.deepcopy(response.headers)

                self.response = {"url": url, "content": content,
                                 "text": text, "cookies": cookies, "headers": headers}
                response.close()
                
                if scraper != None:
                    scraper.close()
                if not self.httpComplete(self.response, url, self.kwargs):
                    if self.check_cloudflare_ban(text):
                        msg = "遇到cloudflare墙"
                        self.httpError(None, url, msg, self.kwargs)

                    # print(self.response)
                    self.response = {}
                    self.retry_count += 1
                    # if self.retry_count >=2 and self.proxy_state in(proxy.ProxyState.FLASK_DOMESTIC):
                    #     # 使用了国内反代，并且有可能失效了 修改为使用所有国内代理
                    #
                    #     self.proxy_state = proxy.ProxyState.INCLUD_DOMESTIC
                    if self.retry_count == self.retry_limit:
                        self.stop_flag = True
                    time.sleep(self.retry_interval)
                else:
                    self.stop_flag = True
                    done = True
            except Exception as e:
                # print(f"web 错误 使用代理: {proxies} 原因: {e}")

                self.retry_count += 1
                if self.retry_count == self.retry_limit:
                    self.stop_flag = True
                msg = f"使用代理: {proxies}  错误原因: {e}"
                self.httpError(None, url, msg, self.kwargs)
        return done


    def _setData(self, url, data, kwargs):
        """
        设置http的请求参数
        :return:
        """
        self.request_url = url
        self.request_data = data
        self.kwargs = kwargs
        self.headers = self.header
        header = self._getArgs("header", {})
        if not header:
            header = self._getArgs("headers", {})
        if header and isinstance(header, dict):
            self.headers.update(header)

        self.cookie = self._getArgs("cookie", {})
        self.timeout = self._getArgs("timeout", 20)
        self.retry_limit = self._getArgs("retry_limit", 5)
        self.delay = self._getArgs("delay", 20)
        self.ips = self._getArgs("ips", [])
        self.retry_count = 0
        self.retry_interval = self._getArgs("retry_interval", 5)
        self.stop_flag = False
        self.use_proxy = self._getArgs("use_proxy", False)
        self.proxies = self._getArgs("proxies", "")
        self.proxy_state = self._getArgs("proxy_state", "")
        # self.use_haiwai = self._getArgs("use_haiwai", False)
        self.url_backup = self._getArgs("url_backup", [])

        self.doh = self._getArgs("doh", False)
        self.doh_keyword = self._getArgs("doh_keyword", "")
        self.doh_ip = self._getArgs("doh_ip", False)
        # self.use_myproxy = self._getArgs("use_myproxy", False)
        # self.use_myproxy_haiwai = self._getArgs("use_myproxy_haiwai", False)

        self.host_ip = self._getArgs("host", "")



    def _getArgs(self, key, default):
        if key in self.kwargs and self.kwargs[key] != "" and self.kwargs[key] != None:
            return self.kwargs[key]
        return default

    def _getHost(self, url):
        url_u = urlparse(url)
        host = url_u.hostname
        return host

    def _getUrl(self, url):
        if len(self.ips) > 0:
            host = self._getHost(url)
            ip = random.choice(self.ips)
            return url.replace(host, ip)
        else:
            return url

    def _getBackUrl(self, url):
        if len(self.url_backup) > 0:
            index = self.url_backup.index(url) if url in self.url_backup else -1
            if index == -1 or index >= len(self.url_backup) -1:
                return self.url_backup[0]
            else:
                return self.url_backup[index + 1]
        else:
            return url

    def _getDohUrl(self, url):
        # 停用
        ipv4, ipv6 = dnsOverHttps.get_dns_cache(url)
        ips = ipv6 if ipv6 else ipv4
        ips = dohCheck.get_doh_cache(url, ips, self.doh_keyword)
        if ips:
            # print(ips)
            host = self._getHost(url)
            ip = random.choice(ips)
            ip_type = typeChange.check_ip_type(ip)
            if ip_type:
                if ip_type == "ipv4":
                    return url.replace(host, ip)
                else:
                    return url.replace(host, f"[{ip}]")
        return url

    def _getDoh_ip(self, url):
        ipv4, ipv6 = dnsOverHttps.get_dns_cache(url)
        ips = ipv6 if ipv6 else ipv4
        ips = dohCheck.get_doh_cache(url, ips, self.doh_keyword)
        # print(ips)
        if ips:
            ip = random.choice(ips)
            ip_type = typeChange.check_ip_type(ip)
            if ip_type:
                if ip_type == "ipv4":
                    return ip
                else:
                    return f"[{ip}]"

        return False



    def doh_get(self, url, **kwargs):
        request_fun = "get"
        kwargs["doh"] = True
        self._setData(url, None, kwargs)
        return self._request(request_fun)

    def doh_post(self, url, data, **kwargs):
        request_fun = "post"
        kwargs["doh"] = True
        self._setData(url, data, kwargs)
        return self._request(request_fun)


    def get(self, url, **kwargs):
        request_fun = "get"
        self._setData(url, None, kwargs)
        return self._request(request_fun)


    def post(self, url, data, **kwargs):
        request_fun = "post"
        self._setData(url, data, kwargs)
        return self._request(request_fun)

    def curl_get(self, url, **kwargs):
        request_fun = "curl_get"
        self._setData(url, None, kwargs)
        return self._request(request_fun)


    def curl_post(self, url, data, **kwargs):
        request_fun = "curl_post"
        self._setData(url, data, kwargs)
        return self._request(request_fun)


    # def getCfscrape(self, url, **kwargs):
    #     request_fun = "cfGet"
    #     self._setData(url, None, kwargs)
    #     return self._request(request_fun)
    #
    #
    # def postCfscrape(self, url, data=None, **kwargs):
    #     request_fun = "cfPost"
    #     self._setData(url, data, kwargs)
    #     return self._request(request_fun)


    def get_filename_from_url(self, url):
        try:
            # 发送请求获取文件名
            response = requests.head(url)
            content_disposition = response.headers.get('content-disposition')

            # 解析文件名
            if content_disposition:
                filename = content_disposition.split('filename=')[-1].strip('"')
            else:
                filename = urlparse(url).path.split('/')[-1]
            return filename
        except Exception as e:
            print(f"获取下载文件名错误, {e}")
        return ""

    def download_file(self, url):
        response = requests.get(url, stream=True)
        total_size = int(response.headers.get('content-length', 0))
        block_size = 1024  # 1 Kibibyte
        downloaded_size = 0
        file_data = BytesIO()

        for data in response.iter_content(block_size):
            downloaded_size += len(data)
            file_data.write(data)
            print(f"Downloaded {downloaded_size}/{total_size} bytes ({downloaded_size / total_size * 100:.2f}%)",
                  end='\r')

        print("Download completed!")
        return file_data.getvalue()

    def download_and_extract_zip(self, url):
        resp_data = []
        try:

            # 下载zip文件到内存中
            content = self.download_file(url)
            zip_data = BytesIO(content)

            # 解压zip文件
            with zipfile.ZipFile(zip_data, 'r') as zip_ref:
                # 获取内部的每一个文件，按文件名排序
                file_list = sorted(zip_ref.namelist())

                # 输出文件名和二进制内容
                for file_name in file_list:
                    with zip_ref.open(file_name) as file:
                        file_content = file.read()
                        resp_data.append({"file": file_name, "content": file_content})
        except Exception as e:
            print(f"下载文件错误 {e}")

        return resp_data

    def close(self):
        self.stop_flag = True
        self.response = {}


    def _httpComplete(self, response, url, kwargs):
        """
        httpComplete
        判断http是否真的完成，即使返回200，有时也会被墙屏蔽
        不要直接调用此方法，将此方法传递给webrequest使用
        :return:
        """
        return True


    def _httpError(self, response, url, error, kwargs):
        """
        httpError
        在http出错时的方法，需要重写
        :return:
        """
        # print(error)
        return False


    @property
    def tree(self):
        content = self.response.get("content", "")
        '''
        \x00 是UTF-8编码中的一个字节，表示一个空字符。在UTF-8编码中，字符被表示为一个或多个字节，而 x00 字节是一个特殊的字节，用于表示字符串的结束。
        '''
        content = content.replace(b'\x00', b'')     # 删除 \x00
        return etree.HTML(content, parser=etree.HTMLParser(encoding='utf-8'))


    @property
    def text(self):
        return self.response.get("text", "")


    @property
    def content(self):
        return self.response.get("content", "")


    @property
    def json(self):
        try:
            if self.response and "content" in self.response:
                return json.loads(self.response.get("content", {}))
            else:
                return {}
        except Exception as e:
            # self.log.error(str(e))
            # logger.error(str(e))
            return {}


    @property
    def url(self):
        try:
            return self.response.get("url", "")
        except Exception as e:
            logger.error(str(e))
            return ""

    @property
    def response_headers(self):
        try:
            return self.response.get("headers", {})
        except Exception as e:
            logger.error(str(e))
            return {}

    @property
    def requests_cookies(self):
        try:
            return self.response.get("cookies", {})
        except Exception as e:
            logger.error(str(e))
            return {}





if __name__ == '__main__':
    web = WebRequest()
    url = 'https://18comic-dwo.vip/ajax/album_pagination'
    data = {
        "video_id": 293465,
        "page": 1
    }
    web.post(url, data)
    print(web.text)

