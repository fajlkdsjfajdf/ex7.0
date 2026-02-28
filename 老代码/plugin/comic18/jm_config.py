# 移动端API域名

# DOMAIN_API_LIST = [
#     "www.cdnmhwscc.vip",
#     "www.cdnblackmyth.club",
#     "www.cdnmhws.cc",
#     "www.cdnuc.vip",
# ]

from telnetlib import DO


DOMAIN_API_LIST = [
    "www.cdnhth.net",
    # "www.cdnbea.net",
    # "www.cdnzack.cc",
]

# 移动端图片域名

DOMAIN_IMAGE_LIST = [
    # "cdn-msp.jmapiproxy1.cc",
    "cdn-msp.jmapiproxy2.cc",
    "cdn-msp2.jmapiproxy2.cc",
    "cdn-msp3.jmapiproxy2.cc",
    "cdn-msp.jmapinodeudzn.net",
    "cdn-msp3.jmapinodeudzn.net",
    "cdn-msp.jmdanjonproxy.xyz"
]


DOMAIN_IMAGE_LIST = [
    "cdn-msp2.jmdanjonproxy.vip",
    "cdn-msp2.18comic-erdtree.cc",
    "cdn-msp2.jmapiproxy1.cc"
]

APP_HEADERS_TEMPLATE = {
    'Accept-Encoding': 'gzip, deflate',
    'user-agent': 'Mozilla/5.0 (Linux; Android 9; V1938CT Build/PQ3A.190705.11211812; wv) AppleWebKit/537.36 (KHTML, '
                    'like Gecko) Version/4.0 Chrome/91.0.4472.114 Safari/537.36',
}

APP_HEADERS_IMAGE = {
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'X-Requested-With': 'com.jiaohua_browser',
    'Referer': "https://" + DOMAIN_API_LIST[0],
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
}


# 移动端API密钥
APP_TOKEN_SECRET = '18comicAPP'
APP_TOKEN_SECRET_2 = '18comicAPPContent'
APP_DATA_SECRET = '185Hcomic3PAPP7R'
APP_VERSION = '1.7.9'
