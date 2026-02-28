import requests
from proxytools import auth
from proxytools import config




def get(url, headers={}, cookies={}, verify=False, timeout=10, proxies="", host=""):
    return proxy(url, {}, headers=headers, cookies=cookies, verify=False, timeout=10, method="GET", proxies=proxies, host=host)


def post(url, data, headers={}, cookies={}, verify=False, timeout=10, proxies="", host=""):
    return proxy(url, data, headers=headers, cookies=cookies, verify=False, timeout=10, method="POST", proxies=proxies, host=host)


def proxy(url, data, headers={}, cookies={}, verify=False, timeout=10, method="GET", proxies="", host=""):
    tt = auth.create_encrypted_time()
    post_data = {
        "url": url,
        "method": method,
        "data": data if method=="POST" else {},
        "headers": headers,
        "cookies": cookies,
        "timeout": timeout,
        "host": host
    }
    post_data = auth.encode_data(post_data)
    proxies = proxies["http"].replace("fp://", "")

    resp_data = requests.post(f"http://{proxies}/{config.path}", {"t": tt, "d": post_data}, timeout=timeout+3)
    resp_data.url = url
    if resp_data.status_code == 200:
        # 解密content
        content = resp_data.content
        content = auth.decrypt_data(content)
        resp_data._content = content
        # print(resp_data.text)
        return resp_data
    else:
        print(f"fp连接失败 代理{proxies}")
        raise Exception(f"fp连接失败 代理{proxies}")

if __name__ == '__main__':
    # proxies = "192.168.1.221:15002"
    proxies = {"http": "fp://6.comp.ainizai0904.top:15002"}
    # proxies = {"http": "fp://localhost:15002"}
    r =get("https://www.baidu.com", proxies=proxies)
    # r = get("https://www.manhuagui.com", proxies=proxies, host="77.73.69.219")
    print(r.text)