import codecs
import os
from config.configParse import config
from urllib.parse import urlparse

class Host:
    def __init__(self):
        # 检查操作系统类型
        if os.name == 'nt':  # Windows系统
            self.hosts_file_path = r'C:\Windows\System32\drivers\etc\hosts'  # hosts文件路径
        else:  # 类Unix系统
            self.hosts_file_path = '/etc/hosts'
        # self.setHost()


    def getHost(self, url: str):
        url = "http://" + url if not url.startswith("http") else url
        parsed_url = urlparse(url)
        return parsed_url.netloc


    def setHost(self):
        try:
            hosts = config.read("setting", "dns_host")
            for host in hosts:
                self.hostUpdate(host, hosts[host])
        except Exception as e:
            print(f"设置host失败 {e}")

    def hostUpdate(self, custom_hostname, custom_ip):
        try:
            custom_hostname = self.getHost(custom_hostname)
            # 检查hosts文件是否已存在该域名
            hosts_content = ''
            # 读取所有行
            lines = []
            data = {}
            if os.path.exists(self.hosts_file_path):
                with codecs.open(self.hosts_file_path, 'r', 'utf-8') as hosts_file:
                    lines = hosts_file.readlines()
            for index, line in enumerate(lines):
                if line.strip() and not line.strip().startswith("#"):
                    v = line.split(" ")
                    host = v[1].strip() if len(v) > 1 else ""
                    ip = v[0].strip() if len(v) > 1 else ""
                    if host and ip:
                        ip_type = "ipv4" if "." in ip else "ipv6"
                        # print(f"host: {host}, ip: {ip}, type: {ip_type}")
                        data[f"{ip_type}:{host}"] = {"index": index, "ip": ip}

            # 更新或插入域名和IP到hosts文件
            custom_ip_type = "ipv4" if "." in custom_ip else "ipv6"
            if f"{custom_ip_type}:{custom_hostname}" not in data:
                # 插入新的host
                lines.append(f"{custom_ip} {custom_hostname}\n")
                content = ''.join(lines)
                with codecs.open(self.hosts_file_path, 'w', 'utf-8') as hosts_file:
                    hosts_file.write(content)
                print(f'已插入新的域名和IP到hosts文件，将{custom_hostname}关联到{custom_ip}')

            else:
                # 更新host
                if data[f"{custom_ip_type}:{custom_hostname}"]["ip"] == custom_ip:
                    # ip没有变动
                    print(f"与host内容一致, 无需将{custom_hostname}关联到{custom_ip}")
                else:
                    # ip变动
                    index = data[f"{custom_ip_type}:{custom_hostname}"]["index"]
                    lines[index] = f"{custom_ip} {custom_hostname}\n"
                    content = ''.join(lines)
                    with codecs.open(self.hosts_file_path, 'w', 'utf-8') as hosts_file:
                        hosts_file.write(content)
                    print(f'已更新hosts文件，将{custom_hostname}关联到{custom_ip}')
        except Exception as e:
            print(f"更新dns错误, {e}")





if __name__ == '__main__':
    Host().hostUpdate("tktube2.com", "2606:4700:3035::6815:1c61")


