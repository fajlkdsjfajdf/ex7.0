# falsk反向代理
from flask import Blueprint, render_template, \
    request, redirect, url_for, session, jsonify, send_file, Response
from plugin.reverseProxy import ReverseProxy

reverse_proxy = Blueprint('proxy', __name__)





# https://sukebei.nyaa.si

@reverse_proxy.route('/sukebei.nyaa.si/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE'])
@reverse_proxy.route('/sukebei.nyaa.si/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def sukebei_nyaa_si(path):
    # 目标服务器的 URL
    url = "https://sukebei.nyaa.si"
    prefix = "/proxy/sukebei.nyaa.si"
    rp = ReverseProxy(url, prefix, True)
    response = rp.forward_request(path, request)
    return response

