# 这是一个爬虫的控制类 用于定期从不同的网站获取代理ip
import time

from config.configParse import config
from db.mongodb import MongoDB
from logger.logger import logger
from networking.webRequest import WebRequest
import requests
from geolite2 import geolite2
import re
from multiprocessing.pool import ThreadPool
from apscheduler.schedulers.background import BackgroundScheduler
import _thread
from ipaddress import IPv6Address


class ProxyControl:

    def __init__(self):
        """
        一些代理的站点
        https://ip.ihuan.me/
        https://www.89ip.cn/api.html
        """
        self.db = MongoDB()
        self.table_name = "proxy"
        self.proxy_time_out = 5 # 代理的超时事件
        self.check_state = False
        self.check_key = "baidu"
        self.run_count = 0

    def start(self):
        scheduler = BackgroundScheduler()
        scheduler.add_job(self.get_proxy, 'interval', hours=30)
        scheduler.add_job(self.check_proxys, 'interval', seconds=10 * 60)
        scheduler.start()
        self.check_proxys()

    def run(self):
        if self.run_count % 100 == 0:
            self.get_proxy()
        self.check_proxys()

    def get_proxy(self) -> None:
        self.get_proxy1()
        self.get_proxy2()
        self.get_proxy3()
        self.get_proxy4()
        self.get_proxy5()
        self.get_proxy6()


    def get_proxy1(self) -> None:
        """
        url: https://www.89ip.cn/api.html
        api: http://api.89ip.cn/tqdl.html?api=1&num=5000&port=&address=&isp=
        Returns:
        """
        try:
            url = "http://api.89ip.cn/tqdl.html?api=1&num=5000&port=&address=&isp="
            web = WebRequest()
            web.get(url)
            ips = self.extract_ip_port(web.text)
            self.add_ip_data(ips)
        except Exception as e:
            logger.error(f"ProxyControl get_89ip_proxy 获取代理出错 {e}")

    def get_proxy2(self):
        """
        快代理 https://www.kuaidaili.com
        """
        page_count = 3
        url_pattern = [
            'https://www.kuaidaili.com/free/inha/{}/',
            'https://www.kuaidaili.com/free/intr/{}/'
        ]
        url_list = []
        for page_index in range(1, page_count + 1):
            for pattern in url_pattern:
                url_list.append(pattern.format(page_index))
        web = WebRequest()
        ips = []
        for url in url_list:
            try:
                web.get(url)
                tree = web.tree
                proxy_list = tree.xpath('.//table//tr')
                for tr in proxy_list[1:]:
                    ips.append(f"{tr.xpath('./td/text()')[0]}:{tr.xpath('./td/text()')[1]}")
            except Exception as e:
                pass
            time.sleep(1)
        self.add_ip_data(ips)

    def get_proxy3(self):
        """
        云代理 http://www.ip3366.net/free/
        :return:
        """
        urls = ['http://www.ip3366.net/free/?stype=1',
                "http://www.ip3366.net/free/?stype=2"]
        ips = []
        web = WebRequest()
        for url in urls:
            try:
                web.get(url)
                html_tree = web.tree
                for tr in html_tree.xpath(".//table[@class='table table-bordered table-striped']/tbody/tr"):
                    ip = ''.join(tr.xpath('./td[1]/text()')).strip()
                    port = ''.join(tr.xpath('./td[2]/text()')).strip()
                    ips.append(f"{ip}:{port}")
            except Exception as e:
                pass
        self.add_ip_data(ips)

    def get_proxy4(self):
        """
                小幻代理 https://ip.ihuan.me/
                :return:
                """
        urls = [
            'https://ip.ihuan.me/address/5Lit5Zu9.html',
        ]
        web = WebRequest()
        ips = []
        for url in urls:
            try:
                web.get(url)
                html_tree = web.tree
                for tr in html_tree.xpath(".//table[@class='table table-hover table-bordered']/tbody/tr"):
                    ip = ''.join(tr.xpath('./td[1]/a/text()')).strip()
                    port = ''.join(tr.xpath('./td[2]/text()')).strip()
                    ips.append(f"{ip}:{port}")
            except Exception as e:
                pass
        self.add_ip_data(ips)

    def get_proxy5(self):
        """
                http://www.89ip.cn/index.html
                89免费代理
                :param max_page:
                :return:
                """
        max_page = 4
        base_url = 'http://www.89ip.cn/index_{}.html'
        web = WebRequest()
        ips = []
        for page in range(1, max_page + 1):
            try:
                url = base_url.format(page)
                web.get(url)
                html_tree = web.tree
                for tr in html_tree.xpath(".//table[@class='layui-table']/tbody/tr"):
                    ip = ''.join(tr.xpath('./td[1]/text()')).strip()
                    port = ''.join(tr.xpath('./td[2]/text()')).strip()
                    ips.append(f"{ip}:{port}")
            except Exception as e:
                pass
        self.add_ip_data(ips)

    def get_proxy6(self):
        """
        http://www.proxy-list.download
        Free Proxy List
        :return:
        """
        country_iso_code = ["HK", "JP", "US", "KR", "TW", "SG", "NL", "MO", "FR"]
        ips = []
        web = WebRequest()
        for code in country_iso_code:
            try:
                url = "https://www.proxy-list.download/api/v1/get?type=http&anon=elite&country=%s" % code
                web.get(url)
                ip_list = web.text.splitlines()
                for ip_port in ip_list:
                    ips.append(ip_port)
            except Exception as e:
                pass
        self.add_ip_data(ips)


    def check_proxys(self) -> None:
        _thread.start_new_thread(self.check_proxys_thread, ())

    def check_proxys_thread(self) -> None:
        """
        确认代理的生命状态， 并删除错误次数过多的代理
        Returns:
        """
        try:
            if self.check_state:
                # logger.warning(f"确认代理状态已经在运行中")
                return
            self.check_state = True
            logger.info(f"开始确认代理状态")
            proxys = self.db.getItems(self.table_name, {}, limit=88888)
            # for proxy in proxys:
            #     self._check_proxy(proxy)

            pool = ThreadPool(processes=30)
            pool.map(self._check_proxy, proxys)
            pool.close()
            pool.join()
        except Exception as e:
            logger.error(f"check_proxys_thread 错误 {e}")
        self.check_state = False

    def _check_proxy(self, proxy: dict) -> None:
        """
        单独的检查代理过程
        Args:
            proxy:

        Returns:

        """
        proxy.pop("_id")
        proxy.pop("region") if "region" in proxy else None
        proxy.pop("update") if "update" in proxy else None
        proxies = {"http": f"http://{proxy['proxy']}",
                   "https": f"http://{proxy['proxy']}"}
        state = False
        try:

            r = requests.get("https://4.ipw.cn/", proxies=proxies, timeout=30)
            if r.status_code == 200 and r.text in proxy['proxy']:
                state = True
        except Exception as e:
            state = False
        fail_count = proxy.get("fail_count", 0)
        check_count = proxy.get("check_count", 0)
        check_count += 1
        if state:
            proxy["check_count"] = check_count
            self.db.processItem(self.table_name, proxy, "proxy")
        else:
            # 出错的情况
            fail_count += 1
            proxy["check_count"] = check_count
            proxy["fail_count"] = fail_count
            if check_count > 5:
                # 测试次数超过5次后， 将成功率不足30% 的代理删除
                pre = (check_count - fail_count) / check_count      # 算出成功率
                if pre  < 0.2:
                    self.db.removeOneById(self.table_name, {"proxy": proxy["proxy"]})
                    return
            self.db.processItem(self.table_name, proxy, "proxy")



    def add_ip_data(self, ips: list[str]) -> None:
        """
        添加ip列表到数据库
        Args:
            ips:

        Returns:
        """
        data = []
        for ip in ips:
            if self.is_ip_port_format(ip):
                region = self.get_country_by_ip(ip)
                # region = ""
                info = {
                    "proxy": ip,
                    "region": region
                }
                data.append(info)
        self.db.processItems(self.table_name, data, "proxy")


    def extract_ip_port(self, s: str) -> list[str]:
        """
        将字符串中的所有ip: port格式提取出来
        Args:
            s:

        Returns:

        """
        ipv4_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}:\d+\b'
        ipv6_pattern = r'\[(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\]:\d+'
        pattern = f'({ipv4_pattern})|({ipv6_pattern})'
        result = re.findall(pattern, s)
        return [item for group in result for item in group if item]

    def get_country_by_ip(self, ip_address: str) -> str:
        """
        获取ip的地区
        Args:
            ip_address:

        Returns:

        """
        try:
            ip_address = ip_address.split(":")[0] if ":" in ip_address else ip_address
            reader = geolite2.reader()
            location_data = reader.get(ip_address)
            if location_data:
                if 'country' in location_data:
                    country = location_data['country']['names']['zh-CN']
                    return country
                else:
                    return "中国"
            else:
                return "中国"
        except Exception as e:
            logger.error(f"get_country_by_ip error: {e}")
            return "中国"


    def is_ip_port_format(self, s):
        pattern = r'^(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}:[0-9]{1,5}|(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}:[0-9]{1,5})$'
        if re.match(pattern, s):
            ip, port = s.split(':')
            try:
                if ':' in ip:
                    IPv6Address(ip)
                else:
                    int(port)
                return True
            except ValueError:
                return False
        return False


if __name__ == '__main__':
    # time.sleep(50)
    p = ProxyControl()
    # p.get_proxy()
    p.check_proxys_thread()
