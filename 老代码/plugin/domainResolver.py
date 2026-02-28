import socket
import requests
from ipwhois import IPWhois
from urllib.parse import urlparse


class DomainResolver:
    def __init__(self, url):
        domain, port = self.extract_domain_and_port(url)
        self.domain = domain
        self.port = port
        self.ipv4 = self.resolve_ipv4()
        self.ipv6 = self.resolve_ipv6()

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

    def resolve_ipv4(self):
        try:
            ipv4 = socket.getaddrinfo(self.domain, None, socket.AF_INET)[0][4][0]
            return ipv4
        except Exception as e:
            # print(f"Error resolving IPv4: {e}")
            return None

    def resolve_ipv6(self):
        try:
            ipv6 = socket.getaddrinfo(self.domain, None, socket.AF_INET6)[0][4][0]
            return ipv6
        except Exception as e:
            # print(f"Error resolving IPv6: {e}")
            return None

    def is_port_open(self):
        ip = ""
        if self.ipv4:
            ip = self.ipv4
        else:
            return False
        if ip:
            # print(ip)
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(3)
                result = s.connect_ex((ip, self.port))
                if result == 0:
                    return True
        return False

    def get_country(self):
        ipv4 = self.resolve_ipv4()
        if ipv4:
            try:
                obj = IPWhois(ipv4)
                results = obj.lookup_rdap(depth=1)
                # print(results)
                return results['network']['country']
            except Exception as e:
                # print(f"Error getting country: {e}")
                return None
        return None

if __name__ == '__main__':
    # 示例
    domain = "https://xmpmbil.wdpkosrpruki.hath.network:49584/h/1ed138763f10788354d1b4ae46b0a8a2fcdd1607-59731-1280-720-jpg/keystamp=1722244500-aeb3d34d4e;fileindex=149828783;xres=1280/06_023.jpg"
    resolver = DomainResolver(domain)
    print(f"IPv4: {resolver.resolve_ipv4()}")
    print(f"IPv6: {resolver.resolve_ipv6()}")
    print(f"Port open: {resolver.is_port_open()}")
    print(f"Country: {resolver.get_country()}")
