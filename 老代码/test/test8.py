import requests

url = "https://178.175.132.20/"
# url = "https://www.baidu.com"
url = "https://4.ipw.cn"
# url = "https://192.168.1.220"
url = "https://www.manhuagui.com"
url = "https://6.ipw.cn"


for i in range(3):
    r = requests.get(url, timeout=5)

    print(r.text)