import requests
# from config.configParse import config
# from networking.webRequest import WebRequest


user = "ainizai0904"
pwd = "eXV3ZW53ZWkxOTk0"


# 设置代理地址和端口
proxies = {
    "http": "http://192.168.191.70:20171",
    "https": "http://192.168.191.70:20171"
}



proxies = {'http': f'http://{user}:{pwd}@comp2.ainizai0904.top:15001',
                   'https': f'http://{user}:{pwd}@comp2.ainizai0904.top:15001'}

# proxies = {'http': f'http://192.168.2.222:8888',
#                    'https': f'http://192.168.2.222:8888'}

# proxies = {'http': f'http://cloud.ainizai0904.top:8118',
#                    'https': f'http://cloud.ainizai0904.top:8118'}
#
#
proxies = {'http': f'http://{user}:{pwd}@cloud.ainizai0904.top:15001',
                   'https': f'http://{user}:{pwd}@cloud.ainizai0904.top:15001'}
#
# proxies = {'http': f'http://{user}:{pwd}@192.168.2.222:15001',
#                    'https': f'http://{user}:{pwd}@192.168.2.222:15001'}

# proxies = {
#     "http": f'socks5://192.168.191.70:20170',
#     "https": f'socks5://192.168.191.70:20170'
# }

proxies = {'http': f'socks5://{user}:{pwd}@cloud.ainizai0904.top:15001',
            'https': f'socks5://{user}:{pwd}@cloud.ainizai0904.top:15001'}


proxies = {'http': f'socks5://{user}:{pwd}@comp2.ainizai0904.top:15001',
            'https': f'socks5://{user}:{pwd}@comp2.ainizai0904.top:15001'}

# proxies = {
#     "http": f'http://localhost:20171',
#     "https": f'http://localhost:20171'
# }

print(proxies)


# 使用requests.get()方法访问百度，并传入代理参数
# response = requests.get("https://ipaddress.my/",proxies=proxies, timeout=10, verify=False)
# print(response.text)


response = requests.get("https://18-comicblade.club/",proxies=proxies, timeout=20, verify=False)
print(response.text)
