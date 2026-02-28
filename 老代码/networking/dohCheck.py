import socket
import requests
from ipwhois import IPWhois
from urllib.parse import urlparse
import datetime
from logger.logger import logger
import re
import ipaddress
import time



class DohCheck:
    def __init__(self):
        self.doh_check_cache = {}


    def extract_domain_and_port(self, url):
        """
        从给定的URL中提取域名和端口。
        如果URL中没有指定端口，则根据协议（http或https）返回默认端口80或443。

        参数：
            url (str): 要解析的网址字符串。

        返回：
            tuple: 包含域名和端口号的元组。
        """
        parsed_url = urlparse(url)
        domain = parsed_url.hostname
        port = parsed_url.port

        if not port:
            if parsed_url.scheme == 'http':
                port = 80
            elif parsed_url.scheme == 'https':
                port = 443

        return domain, port

    def is_port_open(self, ip, port):
        logger.info(f"{ip}:{port} in socket check ")

        try:
            addrinfo = None
            ip_address =ipaddress.ip_address(ip)
            if isinstance(ip_address, ipaddress.IPv4Address):
                addrinfo = socket.getaddrinfo(ip, port, socket.AF_INET)
            elif isinstance(ip_address, ipaddress.IPv6Address):
                addrinfo = socket.getaddrinfo(ip, port, socket.AF_INET6)
            else:
                return False


            for res in addrinfo:
                af, socktype, proto, canonname, sa = res
                with socket.socket(af, socktype, proto) as s:
                    s.settimeout(3)
                    result = s.connect_ex(sa)
                    if result == 0:
                        return True
        except Exception as e:
            logger.warning(f"{ip}:{port} in socket check error: {e}")
        return False

    def key_word_check(self, url, ip, key_word):
        """
        判断指定doh链接页面是否有关键字
        """
        return True



    def get_doh_cache(self, url, ips, key_word=""):
        host, port = self.extract_domain_and_port(url)

        if host in self.doh_check_cache:
            while self.doh_check_cache[host]["status"] == "refresh":
                # logger.info(f"{host} doh check 刷新中, 等待3s")
                time.sleep(3)
            # 计算缓存时间 超过24小时就重新刷新 否则就返回dns记录
            current_time = datetime.datetime.now()
            time_difference = current_time - self.doh_check_cache[host]["recorded_time "]
            # 判断时间差是否超过24小时
            if not time_difference.total_seconds() > 24 * 60 * 60:
                return self.doh_check_cache[host]["ips"]

        logger.info(f"{host} 刷新缓存doh")
        self.doh_check_cache[host] = {"ips": [], "status": "refresh"}
        new_ips = []
        for ip in ips:
            if self.is_port_open(ip, port):
                if key_word== "":
                    new_ips.append(ip)
                else:
                    if self.key_word_check(url, ip, key_word):
                        new_ips.append(ip)
        self.doh_check_cache[host]["ips"] = new_ips
        self.doh_check_cache[host]["status"] = "finish"
        self.doh_check_cache[host]["recorded_time "] = datetime.datetime.now()
        logger.info(f"{host} 刷新缓存doh完成")
        return self.doh_check_cache[host]["ips"]


host_check = DohCheck()
def get_doh_cache(url, ips, key_word=""):
    return host_check.get_doh_cache(url, ips, key_word)


if __name__ == '__main__':
    # 示例
    pass
