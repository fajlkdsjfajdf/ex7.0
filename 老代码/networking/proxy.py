#!/usr/bin/env python
# -*- coding: UTF-8 -*-
# 代理获取
import time

import requests
import random
from config.configParse import config
from apscheduler.schedulers.background import BackgroundScheduler
from db.mongodb import MongoDB
import _thread
import socket
from urllib.parse import urlparse
from logger.logger import logger


class ProxyState:
    """
    这是一个使用代理的类，根据不同类型使用不同代理
    ALL_PROXY:  使用所有能用到的代理
    INCLUD_DOMESTIC: 只包含国内代理
    INCLUD_FOREIGN: 只包含国外代理
    MY_PROXY: 所有自建代理    包括v2ray 和 http
    INCLUD_MYDOMESTIC: 只包含自建的国内代理
    INCLUD_MYFOREIGN： 只包含自建的海外代理
    """
    ALL_PROXY = "所有代理"
    INCLUD_DOMESTIC = "只包含国内代理"
    INCLUD_FOREIGN = "只包含国外代理"
    MY_PROXY = "所有自建代理"
    INCLUD_MYDOMESTIC = "只包含自建的国内代理"
    INCLUD_MYFOREIGN = "只包含自建的海外代理"
    FLASK_FOREIGN = "flask 海外反代"
    FLASK_DOMESTIC = "flask 国内反代"

class Proxy:
    def __init__(self):
        self.db = MongoDB()
        self.table_name = "proxy"
        self.all_proxy = []             # 包含所有代理
        self.include_domestic = []      # 包含国内代理
        self.include_foregin = []       # 包含国外代理
        self.my_proxy = []              # 包含所有自建代理
        self.include_my_domestic = []   # 包含所有自建国内
        self.include_my_foregin = []    # 包含所有自建国外



    def get_my_proxy_data(self):
        proxy_data = config.read("setting", "proxy_data")
        for key, value in proxy_data.items():
            proxy = self.get_proxy_with_ip(key)
            if proxy:
                proxy_data[key]["proxy"] = proxy
            else:
                logger.warning(f"自建代理 {key} 无法使用")
        return proxy_data



    def get_v2ray_proxy(self):
        # ip = config.read("setting", "db_host")
        # port = config.read("setting", "v2ray_port")
        # return [f"socks5://{ip}:{port}" for i in range(10)]
        v2ray_arr = config.read("setting", "proxy_v2ray")
        proxy = []
        user = config.read("setting", "user")
        pwd = config.read("setting", "password")
        for key, value in v2ray_arr.items():
            proxy_type = value.get("type", "http")
            proxy += [f'{proxy_type}://{user}:{pwd}@{key}' for i in range(value["weight"])]
        return proxy

    def get_my_proxy(self, include_foregin= False):
        """
        获取自建代理
        Args:
            include_foregin: 是否包含国外代理
        Returns:
        """
        user = config.read("setting", "user")
        pwd = config.read("setting", "password")
        proxy_data = self.my_proxy_data
        proxy_list = []
        for key, value in proxy_data.items():
            proxy_type = value.get("type", "http")
            if "proxy" in value:
                if include_foregin:
                    proxy_list+= [f'{proxy_type}://{user}:{pwd}@{value["proxy"]}' for i in range(0, value.get("weight", 1))]
                else:
                    if value.get("region", "中国") == "中国":
                        proxy_list += [f'{proxy_type}://{user}:{pwd}@{value["proxy"]}' for i in range(0, value.get("weight", 1))]

        return proxy_list

    def get_my_proxy_flask(self):
        """
        获取自建代理
        Args:
            include_foregin: 是否包含国外代理
        Returns:
        """
        proxy_data = config.read("setting", "proxy_flask")
        for key, value in proxy_data.items():
            proxy = self.get_proxy_with_ip(key)
            proxy_data[key]["proxy"] = proxy

        proxy_list = []
        proxy_list2 = []
        for key, value in proxy_data.items():
            proxy_type = value.get("type", "http")
            if  value.get("region", "中国") == "中国":
                proxy_list2 += [f'{proxy_type}://{value["proxy"]}' for i in range(0, value.get("weight", 1))]
            else:
                proxy_list += [f'{proxy_type}://{value["proxy"]}' for i in range(0, value.get("weight", 1))]

        return proxy_list, proxy_list2

    def start(self):
        scheduler = BackgroundScheduler()
        scheduler.add_job(self.update_proxys, 'interval', seconds=10 * 60)
        scheduler.start()
        _thread.start_new_thread(self.update_proxys, ())

    def update_proxys(self):
        # 更新代理
        self.my_proxy_data = self.get_my_proxy_data()
        self.all_proxy = []             # 包含所有代理
        self.include_domestic = []      # 包含国内代理
        self.include_foregin = []       # 包含国外代理
        self.my_proxy = []              # 包含所有自建代理
        self.include_my_domestic = []   # 包含所有自建国内
        self.include_my_foregin = []    # 包含所有自建国外
        self.flask_foregin = []         # 海外flask反代
        self.flask_domestic = []        # 国内flask反代

        # 从数据库获取野生代理
        data = self.db.getItems(self.table_name, { "check_count": { "$gt": 6 } }, limit=999999)
        self.all_proxy += [i["proxy"] for i in data]
        self.include_domestic += [i["proxy"] for i in data if "region" not in i or i["region"] == "中国"]
        self.include_foregin += [i["proxy"] for i in data if "region" in i and i["region"] != "中国"]
        # 将本地的v2ray 也加入所有代理和国外代理
        self.all_proxy += self.get_v2ray_proxy()
        self.include_foregin += self.get_v2ray_proxy()
        # 将自建代理中的国内代理页加入所有代理和国内代理
        self.all_proxy += self.get_my_proxy()
        self.include_domestic += self.get_my_proxy()
        # 添加所有自建代理
        self.my_proxy += self.get_my_proxy(True)
        self.my_proxy += self.get_v2ray_proxy()

        self.include_my_domestic += self.get_my_proxy()
        self.include_my_foregin = [i for i in self.my_proxy if i not in self.include_my_domestic]

        self.flask_foregin, self.flask_domestic = self.get_my_proxy_flask()
        # v2ray 也加入自建海外代理
        # self.include_my_foregin += self.get_v2ray_proxy()

    def get_proxy_with_ip(self, url):
        """
        将 host格式的代理转换为 ip格式的
        Args:
            url:

        Returns:
        """
        url = self.get_url(url)

        ipv4, ipv6 = self.get_ip_addresses(url)
        port = self.get_port(url)
        if self.is_port_open(ipv4, port):
            return f"{ipv4}:{port}"
        elif self.is_port_open(ipv6, port, True):
            return f"[{ipv6}]:{port}"
        return None

    def get_url(self, url):
        if not url.startswith("http") and not url.startswith("https"):
            url = f"http://{url}"
        return url

    def get_port(self, url):

        parsed_url = urlparse(url)
        if parsed_url.scheme == 'http' and not parsed_url.port:
            return 80
        elif parsed_url.scheme == 'https' and not parsed_url.port:
            return 443
        else:
            return parsed_url.port


    def get_ip_addresses(self, url):
        ipv4_address = None
        ipv6_address = None
        parsed_url = urlparse(url)
        domain = parsed_url.hostname


        try:
            ipv4_address = socket.getaddrinfo(domain, None, socket.AF_INET)[0][4][0]
        except Exception as e:
            pass
        try:
            ipv6_address = socket.getaddrinfo(domain, None, socket.AF_INET6)[0][4][0]
        except Exception as e:
            pass

        return ipv4_address, ipv6_address

    def is_port_open(self, host, port, ipv6=False):
        if host and port:
            family = socket.AF_INET6 if ipv6 else socket.AF_INET
            s = socket.socket(family, socket.SOCK_STREAM)
            s.settimeout(1)
            try:
                s.connect_ex((host, port))
                return True
            except socket.error:
                return False
            finally:
                s.close()

    def get_rnd_proxy(self, proxy_state=ProxyState.ALL_PROXY, retry=0) -> dict:

        # 获取随机代理
        data = []
        if proxy_state == ProxyState.ALL_PROXY or proxy_state == "" or proxy_state == None:
            data = self.all_proxy
        elif proxy_state == ProxyState.INCLUD_DOMESTIC:
            data = self.include_domestic
        elif proxy_state == ProxyState.INCLUD_FOREIGN:
            data = self.include_foregin
        elif proxy_state == ProxyState.MY_PROXY:
            data = self.my_proxy
        elif proxy_state == ProxyState.INCLUD_MYDOMESTIC:
            data = self.include_my_domestic
        elif proxy_state == ProxyState.INCLUD_MYFOREIGN:
            data = self.include_my_foregin
        elif proxy_state ==ProxyState.FLASK_FOREIGN:
            data = self.flask_foregin
        elif proxy_state == ProxyState.FLASK_DOMESTIC:
            data = self.flask_domestic

        if len(data) > 0:
            use_proxy = random.choice(data)
            if use_proxy.startswith("socks5") or use_proxy.startswith("http") or use_proxy.startswith("https") or use_proxy.startswith("fp"):
                return {
                    "http": f"{use_proxy}",
                    "https": f"{use_proxy}"
                }
            return {
                        "http": f"http://{use_proxy}",
                        "https": f"http://{use_proxy}"
                    }
        else:
            if retry > 3:
                return None
            time.sleep(1)
            return self.get_rnd_proxy(proxy_state, retry + 1)






proxy_cls = Proxy()
proxy_cls.start()

def getRndProxies(proxy_state):
    return proxy_cls.get_rnd_proxy(proxy_state)



if __name__ == '__main__':
    # print(proxy_cls.get_v2ray_proxy())
    # proxy_cls.update_proxys()
    time.sleep(5)
    print(proxy_cls.include_my_domestic)
    # print(proxy_cls.get_rnd_proxy(ProxyState.MY_PROXY))


