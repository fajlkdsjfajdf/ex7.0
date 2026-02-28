# -*- coding: utf-8 -*-
# 测试网页耗时时间
import requests
from time import time
import threading
from logger.logger import logger
from plugin.dnsCheck import DnsCheck
from util.host import Host


class URLChecker:
    def __init__(self, urls, keyword):
        self.urls = urls
        self.keyword = keyword
        self.dnsCheck = DnsCheck()
        self.host = Host()

    def get_response_content(self, url):
        start_time = time()
        try:
            response = requests.get(url, timeout=10)
            # print(response.text)
            if self.keyword in response.text:
                end_time = time()
                return end_time - start_time, True, response.content, response.url
            else:
                return float('inf'), False, None, None
        except Exception as e:
            # logger.info(f"{e}")
            return float('inf'), False, None, None

    def get_response_head(self, url):
        start_time = time()
        try:
            response = requests.head(url, timeout=10)
            # print(response.headers)
            if len(response.headers) > 0:
                end_time = time()
                return end_time - start_time, True, response.headers, response.url
            else:
                return float('inf'), False, None, ""
        except Exception as e:
            # logger.info(f"{e}")
            return float('inf'), False, None, ""

    def set_url_host(self):
        for url in self.urls:
            ip = self.dnsCheck.get_dns(url)
            if ip:
                if ip["ipv6"]:
                    self.host.hostUpdate(url, ip["ipv6"])
                elif ip["ipv4"]:
                    self.host.hostUpdate(url, ip["ipv4"])
    def set_host(self, url):
        ip = self.dnsCheck.get_dns(url)
        if ip:
            if ip["ipv6"]:
                self.host.hostUpdate(url, ip["ipv6"])
            elif ip["ipv4"]:
                self.host.hostUpdate(url, ip["ipv4"])

    def check_fastest_url(self):
        self.set_url_host()

        response_times = []
        threads = []

        def worker(url):
            for i in range(1, 4):   # 每个网址尝试3次
                if "head" in self.keyword:
                    time_taken, success, content, real_url = self.get_response_head(url)
                else:
                    time_taken, success, content, real_url = self.get_response_content(url)
                if success:

                    if url != real_url:
                        print(f"测速网页发生跳转 {url} -> {real_url}")
                        url = real_url
                        self.set_host(url)
                    response_times.append({"url": url, "index": i,  "time_taken": time_taken, "content": content})

        # print(self.urls)
        for url in self.urls:
            thread = threading.Thread(target=worker, args=(url,))
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()
        if len(response_times) > 0:
            logger.info(f"测速结果: ")
            # print(response_times)
            for rt in response_times:
                logger.info(f"网址:{rt['url']} 次序:{rt['index']}  耗时:{rt['time_taken']}")
            fastest_url = min(response_times, key=lambda x: x["time_taken"])
            return fastest_url
        else:
            return False


