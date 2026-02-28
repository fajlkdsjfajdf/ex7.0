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
   Description :   这是前端web的flask
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""
import logging
from flask import Flask, jsonify, request, render_template, abort, send_file, redirect, make_response, flash
from flask_login import LoginManager, current_user, UserMixin, login_required, login_user, logout_user
from flask_cors import *
from datetime import timedelta
from config.configParse import config
from auth.user import Login, load_user
from control import webControl
from logger.logger import logger
from plugin.danmuku import DanmuResponse
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
import os
from api.apiResponse import ApiResponse
from api.imgCache import ImgCache
from views.reverse_proxy import reverse_proxy
from util import system
from start.blueprint.imgtool import imgtool_bp


api_key = config.read("setting", "api_key")



app = Flask(__name__, template_folder="../templates/web", static_folder="../static/web/static")
app.config['MAX_CONTENT_LENGTH'] = 10000 * 1024 * 1024  # 设置最大文件大小为 10GB
# 登录超时
app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=15)
app.secret_key = config.read("setting", "aes_key")

app.register_blueprint(reverse_proxy, url_prefix='/proxy')
CORS(app)

# 注册蓝图
app.register_blueprint(imgtool_bp)

login = LoginManager(app)
login.login_view = 'login'
login.user_loader(load_user)



@app.before_request
def before_request():
    if Login(request).check_blacklist():
        return "Your IP is blocked"
    elif Login(request).check_login() == False:
        # abort(404)
        return redirect("/tpw")
    else:
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

@app.route('/',methods=['GET','POST'])
def index():
    template = request.values.get("temp") if request.values.get("temp") != None else "index"
    return render_template("index.html")


@app.route('/index2',methods=['GET','POST'])
def index2():
    return render_template("temp2/index.html")

@app.route('/tpw',methods=['GET','POST'])
def login():
    return Login(request).login()

@app.route('/tpwout',methods=['GET','POST'])
def login_out():
    return Login(request).login_out()

@app.route('/response', methods=['GET', 'POST'])
@cross_origin()
def response():
    web = webControl.getWebControl()
    respCls = web.getResponse(request.values.get("prefix"))
    if respCls:
        resp = respCls(request, current_user.id)
        return resp.getResponse()
    else:
        return "未知的Response"

@app.route('/imgcache', methods=['GET', 'POST'])
@cross_origin()
def imgcache():
    # 图片缓存库
    return ImgCache(request).getResponse()

# @app.route('/api' + api_key, methods=['GET', 'POST'])
# @cross_origin()
# def api():
#     # api库， 不需要登录即可调用 已禁用
#     return ApiResponse(request).getResponse()

@app.route('/danmuku', methods=['GET', 'POST'])
@cross_origin()
def danmuku():
    # 弹幕插件
    response = DanmuResponse(request)
    data, data_type = response.danmuData()
    return jsonify(data), 200, {'ContentType': 'application/json'}


# 获取登录code， 这个code 24小时失效
@app.route('/login_code',methods=['GET'])
@cross_origin()
def loginCode():
    source_url = request.args.get('source_url', "")  # 获取源页面的 URL 参数
    login_code = Login(request).generate_login_code(current_user.id)  # 获取登录code
    if source_url:
        parsed_url = urlparse(source_url)  # 解析source_url
        params = parse_qs(parsed_url.query)  # 获取source_url的参数
        params['login_code'] = login_code  # 在参数中添加login_code
        updated_params = urlencode(params, doseq=True)  # 将参数编码为URL查询字符串
        new_url = urlunparse(parsed_url._replace(query=updated_params))  # 构建带有新参数的URL
        return redirect(new_url)  # 跳转到新的source_url
    else:
        return login_code

@app.route('/response_api', methods=['GET', 'POST'])
@cross_origin()
def responseApi():
    data = {}
    login_code = request.values.get("code", "")
    if login_code:
        login_flag, user_id = Login(request).parse_login_code(login_code)
        if login_flag:
            web = webControl.getWebControl()
            respCls = web.getResponse(request.values.get("prefix"))
            if respCls:
                resp = respCls(request, user_id)
                return resp.getResponse()
            else:
                return "未知的Response"
    return "没有登录"

@app.route('/api', methods=['GET', 'POST'])
@cross_origin()
def api():
    data = {}
    login_code = request.values.get("code", "")
    if login_code:
        login_flag, user_id = Login(request).parse_login_code(login_code)
        if login_flag:
            return ApiResponse(request).getResponse()
    return {"msg": "没有登录", "status": "error"}





def runFlask(type="web"):
    port_setting = "web_port" if type=="web" else "cdn_port"

    app.jinja_env.auto_reload = True
    debug = config.read("setting", "debug")
    # if system.getSystem() == "windows":
    #     logger.info("当前环境为windows, 启动调试模式")
    #     debug = True

    if not debug:
        # 关闭flask的日志输出
        log = logging.getLogger('werkzeug')
        log.disabled = True

    app.run(host=config.read("setting", "host"), port=config.read("setting", port_setting), debug=debug)
    # system_name = config.read("system", "name")
    # if system_name == "windows" or config.read("setting", "debug") :
    #     app.jinja_env.auto_reload = True
    #     app.run(host=config.read("setting", "host"), port=config.read("setting", port_setting), debug=config.read("setting", "debug"))
    # else:
    #     import gunicorn.app.base
    #     class StandaloneApplication(gunicorn.app.base.BaseApplication):
    #         def __init__(self, app, options=None):
    #             self.options = options or {}
    #             self.application = app
    #             super(StandaloneApplication, self).__init__()
    #
    #         def load_config(self):
    #             _config = dict([(key, value) for key, value in self.options.items()
    #                             if key in self.cfg.settings and value is not None])
    #             for key, value in _config.items():
    #                 self.cfg.set(key.lower(), value)
    #
    #         def load(self):
    #             return self.application
    #
    #     port = config.read("setting", port_setting)
    #     bind_address = [f'[::]:{port}']
    #     config_path = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    #     _options = {
    #         'bind': bind_address,
    #         'workers': 4,
    #         'accesslog': os.path.abspath(
    #             os.path.dirname(os.path.dirname(__file__))) + os.sep + 'log/gunicorn_acess.log',  # log to stdout
    #         'access_log_format': '%(h)s %(l)s %(t)s "%(r)s" %(s)s "%(a)s"'
    #     }
    #     StandaloneApplication(app,  _options).run()


def runFileServer():
    app.jinja_env.auto_reload = True
    app.run(host=config.read("setting", "host"), port=config.read("setting", "file_port"),
            debug=config.read("setting", "debug"))