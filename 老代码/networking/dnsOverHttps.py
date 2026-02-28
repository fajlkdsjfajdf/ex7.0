import socket
import random
import time
import requests
from urllib.parse import urlparse
import threading
from logger.logger import logger
import datetime
import random




class DnsCheck:
    def __init__(self):
        self.url = "https://dnschecker.org"

        self.header = {"Referer": "https://dnschecker.org/"}
        self.dns_cache = {}


    def gen_csrf(self):
        try:
            upd = random.random() * 1000 + int(time.time() * 1000) % 1000
            url = f"{self.url}/ajax_files/gen_csrf.php?upd={upd}"
            response = requests.get(url, headers=self.header, timeout=20)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(e)
        return None

    def get_dns(self, search_url):
        self.search_url = self.__get_host(search_url)
        data = self.gen_csrf()

        if data:
            self.ips_v4 = []
            self.ips_v6 = []
            self.token = data["csrf"]
            self.ips_v4 += self.__get_a()
            self.ips_v6 += self.__get_aaaa()
            return self.ips_v4, self.ips_v6
        return False, False

    def __get_a(self):
        try:
            upd = random.random() * 1000 + int(time.time() * 1000) % 1000
            url = f"{self.url}/ajax_files/api/20/A/{self.search_url}?dns_key=ip&dns_value=4&v=0.36&cd_flag=1&upd={upd}"
            header = self.header
            header["Csrftoken"] = self.token
            # print(url)
            # print(header)

            response = requests.get(url, headers=header, timeout=20)
            if response.status_code == 200:
                data = response.json()
                ips = str(data["result"]["ips"]).split("<br />")
                return ips
        except Exception as e:
            print(e)
        return []

    def __get_aaaa(self):
        try:
            upd = random.random() * 1000 + int(time.time() * 1000) % 1000
            url = f"{self.url}/ajax_files/api/256/AAAA/{self.search_url}?dns_key=ip&dns_value=4&v=0.36&cd_flag=1&upd={upd}"
            header = self.header
            header["Csrftoken"] = self.token
            # print(url)
            # print(header)
            response = requests.get(url, headers=header, timeout=20)
            if response.status_code == 200:
                data = response.json()
                ips = str(data["result"]["ips"]).split("<br />")
                return ips
        except Exception as e:
            print(e)
        return []

    def __get_host(self, url):
        parsed_url = urlparse(url)
        return parsed_url.hostname



    def get_dns_cache(self, url):
        # # 生成一个0到1之间的随机浮点数
        # random_time = random.uniform(0, 1)
        # # 将随机浮点数乘以1000（转换为毫秒）
        # random_time_ms = random_time * 1000
        # # 使用time.sleep()函数暂停相应的时间
        # time.sleep(random_time_ms / 10000)
        host = self.__get_host(url)
        while host in self.dns_cache and self.dns_cache[host]["status"] == "refresh":
            # print( self.dns_cache[host] )
            # logger.info(f"{host} dns 刷新中, 等待3s")
            time.sleep(3)
        if host in self.dns_cache:
            # 计算缓存时间 超过24小时就重新刷新 否则就返回dns记录
            current_time = datetime.datetime.now()
            time_difference = current_time - self.dns_cache[host]["recorded_time"]
            # 判断时间差是否超过24小时
            if not time_difference.total_seconds() > 24 * 60 * 60:
                return self.dns_cache[host]["ipv4"], self.dns_cache[host]["ipv6"]
        try:

            self.dns_cache[host] = {"ipv4": [], "ipv6": [], "status": "refresh"}
            logger.info(f"{host} 刷新缓存dns")
            ipv4, ipv6 = self.get_dns(url)

            if ipv4 or ipv6:
                self.dns_cache[host]["ipv4"] = ipv4 if ipv4 and ipv4[0] else []
                self.dns_cache[host]["ipv6"] = ipv6 if ipv6 and ipv6[0] else []
                self.dns_cache[host]["status"] = "finish"
                self.dns_cache[host]["recorded_time"] = datetime.datetime.now()
                logger.info(f"{host} 刷新缓存dns完成")
                return self.dns_cache[host]["ipv4"], self.dns_cache[host]["ipv6"]
            else:
                del self.dns_cache[host]
                return [], []
        except Exception as e:
            logger.error(f"{host} 刷新dns缓存失败 {e}")
            del self.dns_cache[host]




dns_check = DnsCheck()

def get_dns_cache(url):
    return dns_check.get_dns_cache(url)


if __name__ == '__main__':
    ipv4, ipv6 = dns_check.get_dns_cache("https://18-comicblade.club:81/123")
    print(ipv4)
    print(ipv6)


