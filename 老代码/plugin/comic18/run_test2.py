from curl_cffi import requests
import jm_config
from jm_plugin import JmCryptoTool
import time

# 获取当前时间戳（秒级）
ts = int(time.time())

token, tokenparam = JmCryptoTool.token_and_tokenparam(ts)

headers = jm_config.APP_HEADERS_TEMPLATE
headers.update({
    'token': token,
    'tokenparam': tokenparam
})

url = 'https://www.cdnblackmyth.club/setting'
new_headers = {
    'token': token,
    'tokenparam': tokenparam
}

try:
    # 发送 GET 请求（假设是 GET 方法，如果是 POST 需要修改）
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # 检查请求是否成功

    # 输出响应信息
    print(f"状态码: {response.status_code}")
    print(f"响应头: {response.headers}")
    print(f"响应内容: {response.text}")
    data = response.json()
    print(JmCryptoTool.decode_resp_data(data["data"], ts))



except requests.exceptions.RequestException as e:
    print(f"请求失败: {e}")