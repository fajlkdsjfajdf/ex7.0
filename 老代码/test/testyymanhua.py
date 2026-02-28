import requests

url = "https://www.yymanhua.com/m384675/chapterimage.ashx?cid=384675&page=5&key=&_cid=384675&_mid=207&_dt=2024-12-02+13%3A56%3A18&_sign=bb57743c548611da5748fc1a2b930e1c"

headers = {

    "method": "GET",
    "scheme": "https",
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    "cookie": "NGSERVERID=d6e0e4146d15ea4f2735b0ef88905cab; MANGABZ_MACHINEKEY=080a6c72-d3b1-455b-825f-776a87e619c3; ",
    "pragma": "no-cache",
    "priority": "u=1, i",


}

headers = {
    "authority": "www.yymanhua.com",
    "method": "GET",
    "scheme": "https",
    "accept": "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    "cache-control": "no-cache",
    "cookie": "NGSERVERID=d6e0e4146d15ea4f2735b0ef88905cab; MANGABZ_MACHINEKEY=080a6c72-d3b1-455b-825f-776a87e619c3; firsturl=https%3A%2F%2Fwww.yymanhua.com%2Fm384675%2F; firsturl=https%3A%2F%2Fwww.yymanhua.com%2Fm384675%2F",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "referer": "https://www.yymanhua.com/m384675/",
    "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "x-requested-with": "XMLHttpRequest"
}


pid = 237699
aid = 42
page = 1
dt = "2024-12-02+14%3A33%3A38"
sign = "1b726fc1582b8a73f02889810be8db77"
url = 'https://image.yymanhua.com/6/5441/200499/1_5891.jpg?cid=200499&key=5fd671a06799f8909c51e8ef61b3709e&uk='
print(url)

response = requests.get(url, headers=headers)
print(response.status_code)
print(response.text)
