import socket
import random
import time
from networking.webRequest import WebRequest
from urllib.parse import urlparse
import threading
from logger.logger import logger
class DnsCheck:
    def __init__(self):
        self.url = "https://dnschecker.org"
        self.web = WebRequest()
        self.header = {"Referer": "https://dnschecker.org/"}


    def gen_csrf(self):
        try:
            upd = random.random() * 1000 + int(time.time() * 1000) % 1000
            url = f"{self.url}/ajax_files/gen_csrf.php?upd={upd}"
            if self.web.get(url, header=self.header):
                if self.web.json:
                    return self.web.json
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
            ip_v4 = self.__get_fast_ip(self.ips_v4)
            ip_v6 = self.__get_fast_ip(self.ips_v6)
            # ip_v4 = {"ip": self.ips_v4[0]} if self.ips_v4 else False
            # ip_v6 = {"ip": self.ips_v6[0]} if self.ips_v6 else False
            if ip_v4 or ip_v6:
                return {"ipv4": ip_v4["ip"] if ip_v4 else False, "ipv6": ip_v6["ip"] if ip_v6 else False}
        return False

    def __get_fast_ip(self, ips):
        response_times = []
        threads = []

        def worker(ip):
            for i in range(1, 3):  # 每个网址尝试2次
                time_taken, success = self.__connect_ip(ip)
                if success:
                    response_times.append({"ip": ip, "index": i, "time_taken": time_taken})

        # print(self.urls)
        for ip in ips:
            thread = threading.Thread(target=worker, args=(ip,))
            threads.append(thread)
            thread.start()

        for thread in threads:
            thread.join()
        if len(response_times) > 0:
            # logger.info(f"测速结果: ")
            # print(response_times)
            for rt in response_times:
                pass
                # logger.info(f"ip:{rt['ip']} 次序:{rt['index']}  耗时:{rt['time_taken']}")
            fastest_ip = min(response_times, key=lambda x: x["time_taken"])
            logger.info(f"{self.search_url} 最快的ip为 {fastest_ip}")
            return fastest_ip
        else:
            return False

    def __connect_ip(self, ip):
        start_time = time.time()
        try:
            sock = socket.socket(socket.AF_INET if ':' not in ip else socket.AF_INET6)
            sock.settimeout(1)
            sock.connect((ip, 80))
            sock.close()
            use_time = time.time() - start_time
            return use_time, True
        except Exception as e:
            # print(f"连接失败： {ip}，错误信息： {e}")
            return 9999999, False


    def __get_a(self):
        try:
            upd = random.random() * 1000 + int(time.time() * 1000) % 1000
            url = f"{self.url}/ajax_files/api/20/A/{self.search_url}?dns_key=ip&dns_value=4&v=0.36&cd_flag=1&upd={upd}"
            header = self.header
            header["Csrftoken"] = self.token
            # print(url)
            # print(header)
            if self.web.get(url, header=header):
                ips = str(self.web.json["result"]["ips"]).split("<br />")
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
            if self.web.get(url, header=header):
                ips = str(self.web.json["result"]["ips"]).split("<br />")
                return ips
        except Exception as e:
            print(e)
        return []

    def __get_host(self, url):
        parsed_url = urlparse(url)
        return parsed_url.netloc



if __name__ == '__main__':
    d = DnsCheck()
    # d.gen_csrf()
    print(d.get_dns("https://18-comicblade.club/123"))
