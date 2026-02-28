# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：       start
   Description :   这是爬虫flask的运行框架
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""


from config.configParse import config
from util import typeChange
from crawlerResponse.cResponse import CrawlerResponse
from flask import Flask, jsonify, request, render_template, abort, redirect, send_file, Response
from flask_cors import *

app = Flask(__name__, template_folder="../templates/crawler", static_folder="../static/crawler/static")


@app.before_request
def before_request():
    """
    每一次请求之前被调用到 判断验证
    """
    ip = request.remote_addr
    if is_internal_ip(ip):
        # 同域ip 192.168开头
        pass
    else:
        print(f"异常的访问{path}")
        abort(404)

@app.route('/')
def index():
    temp = request.args.get('temp')
    if temp is None:
        return render_template('index.html')
    else:
        return render_template(f'{temp}.html')

@app.route('/set', methods=['GET', 'POST'])
@cross_origin()
def set():
    return CrawlerResponse(request).response()


@app.route('/status', methods=['GET', 'POST'])
def status():
    data = CrawlerResponse(request).response()
    # data = typeChange.cleanJson(data)  # 清洗数据
    # response = jsonify(data)
    # response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return data

def runFlask():
    web_host = config.read("setting", "host")
    web_port = config.read("setting", "back_port")
    web_debug = config.read("setting", "debug")
    app.jinja_env.auto_reload = True
    app.run(host=web_host, port=web_port, debug=web_debug)


def is_internal_ip(ip):
    # 判断IP是否属于内网地址范围
    if ip.startswith("10.")or ip.startswith("172.17.") or ip.startswith("172.16.") or ip.startswith("192.168.") or ip == "127.0.0.1":
        return True
    else:
        return False

if __name__ == '__main__':
    runFlask()