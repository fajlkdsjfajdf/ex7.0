from curl_cffi import requests as curl_requests

url = "https://tktube.com/zh/videos/277521/sone-385c-u-k/"
r = curl_requests.get(url, impersonate="chrome124")
print(r.cookies)
print(r.text)