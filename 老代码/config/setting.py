# 各种配置

# DB

db_host = "192.168.191.70"
api_host = "192.168.1.222"
mongodb_port = 27017
mongodb_name = "MediaHub"
mongodb_config = "config"
proxy_port = 5010
minio_port = 9000
minio_access_key = "D6HXDS591KJ4M6K7OOTD"
minio_secret_key = "lKZrZzlMibCIs9g3qph07DYoLJWChUaFHsSqPUCD"
aes_key = "B6ECD65B4AAC4C63"
api_key = "jjljalksjfidojowenndsklnvjsdoanf"
emby_port = 8096
emby_key = "44c5e48df71443f4a7fd40a9300c936d"
emby_url = "http://ainizai0904.asuscomm.com:8074"
rpc_url = "https://down.ainizai0904.top:8071/transmission/rpc/"
rpc_username = "ainizai0904"
rpc_password = "yuwenwei1994"
cloudflare_token = "L1ClhJwWQqbg7bZXmS6FBurt_q_SyMN9fLIRd7NB"


# WEB
host = "0.0.0.0"
crawler_port = 8070     # 弃用
web_port = 18001
cdn_port = 18002        # 弃用
tool_port = 18003       # 弃用
back_port = 8070
file_port = 18004   # 文件服务器, 使用flask
tran_port = 18073   # 图片翻译端口
deco_port = 18006   # 图片去马赛克接口
waifu_port = 8812   # waifu2x端口
selenium_port = 4444 # chrome浏览器调用端口
selenium_show_port = 7900 # chrome 展示端口

debug = False
log = True          # 是否显示log

# File
main_windows = "Z:"
main_linux = "/mnt/maindir"

wait_decode_av_file = "转码中/普通AV-等待转码"

decode_av_file = "手动整理/破解AV"
normal_av_file = "手动整理/普通AV"
down_cache_file = "下载中/cache"
img_file = "data/imgtool"

org_lf_file = "手动整理"

# proxy
user = "ainizai0904"
password = "eXV3ZW53ZWkxOTk0"
proxy_data = {
    "cloud.ainizai0904.top:15001": {"region": "美国", "type": "socks5", "weight": 1},
    # "cloud2.ainizai0904.top:15001": {"region": "美国", "type": "socks5", "weight": 1},
    "192.168.1.221:15001": {"region": "中国", "type": "socks5", "weight": 50}
}
proxy_flask = {
    "cloud.ainizai0904.top:15002": {"region": "美国", "type": "fp", "weight": 2},
    # "cloud.ainizai0905.top:15002": {"region": "美国", "type": "fp", "weight": 2},
    # "dalai.asuscomm.cn:15002": {"region": "中国", "type": "fp", "weight": 2}
    "192.168.1.221:15002": {"region": "中国", "type": "fp", "weight": 2},
    # "127.0.0.1:15002": {"region": "中国", "type": "fp", "weight": 2},
}
proxy_v2ray = {
    # "192.168.1.222:20170": {"region": "美国", "type": "socks5", "weight": 20},
    # "192.168.1.210:15002": {"region": "美国", "type": "fp", "weight": 20}
}





# 不需要验证的url
unpermission_url = [
    "/static/js/emby-danmu.js",
    "/static/js/emby-danmu-app.js",
    "/static/app.apk",
    "/static/file/pmta5.0.tar.gz",
    "/static/js/api/*",
    "/static/js/danmu/*",
    "/danmuku",
    "/pic",
    "/tpw",
    "/static/images/back.jpg",
    "/favicon.ico",
    "/response_api",
    "/api" + api_key,
    # "/imgtool/get_image/*",
    "/api"
]




web_sort = ["EX", "CM", "BK", "BS", "KM", "YM", "MG", "JV", "MH", "AV", "TY", "TK", "JB", "LF", "LM", "CB"]
web_default = "EX"
crawler_sort = ["", "Info", "Chapter", "Page", "Thumb", "Nail", "Images", "Comments", "Down"]

dns_host = {
    "tktube.com": "104.27.195.88",
    "www.manhuagui.com": "77.73.69.218",
    "jmcomic1.ltd": "2606:4700:3032::6815:77",
    "avmoo.online": "159.253.120.252",
    "18comic-wilds.vip": "2606:4700:3035::ac43:d7b2",
    "cdn-msp.18comic-idv.org": "2a06:98c1:3121::6"
}


