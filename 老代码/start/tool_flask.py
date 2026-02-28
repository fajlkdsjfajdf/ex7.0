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
from crawlerResponse.cResponse import CrawlerResponse
from flask import Flask, jsonify, request, render_template, abort, redirect, send_file, Response
from flask_cors import *
from tools.controlTool import ControlTool

app = Flask(__name__)
control_tool = ControlTool()

@app.before_request
def before_request():
    """
    每一次请求之前被调用到 判断验证
    """
    ip = request.remote_addr
    if is_internal_ip(ip):
        # 同域ip 192.168开头
        # 将json 的数据页加入到request的values里
        values = {}
        for v in request.values:
            values[v] = request.values[v]
        try:
            if request.method == 'POST' and request.headers.get('Content-Type') == 'application/json':
                for k in request.json:
                    values[k] = request.json[k]
            request.values = values
        except Exception as e:
            logger.warning(f"添加json到request.values 失败 {e}")
    else:
        print(f"异常的访问{path}")
        abort(404)



@app.route('/start', methods=['GET', 'POST'])
def start():
    """
    用于启动指定工具的方法。
    - **data**: {
        “prefix”: prefix,
        "tool_type": ["thumb", ]
        “data”: 数据列表
        }
    """
    data = {
        "prefix": request.values.get("prefix"),
        "tool_type": request.values.get("tool_type"),
        "data": request.values.get("data")
    }
    # print(data)
    return control_tool.start(data)

@app.route('/get', methods=['GET', 'POST'])
def get():
    """
    用于获取指定工具运行状态的方法
    - **id**: 唯一id
    """
    id  = request.values.get("id")
    return control_tool.get(id)

def run():
    web_host = config.read("setting", "host")
    web_port = config.read("setting", "tool_port")
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