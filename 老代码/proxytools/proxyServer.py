from flask import Flask, request, jsonify, abort, Response
import requests
import auth
import config
import logging
from host import Host

# 配置日志格式和级别
log_format = "[%(asctime)s] [%(levelname)s] %(message)s"
logging.basicConfig(level=logging.INFO, format=log_format)

# 输出日志信息


host_app = Host()
app = Flask(__name__)

@app.before_request
def before_request():
    try:
        tt = request.values.get('t')
        if tt and auth.check_decrypted_time(tt):
            data_str = request.values.get("d")
            request.proxy_data = auth.decode_data(data_str)
        else:
            logging.warning("auth failed")
            abort(404)
    except Exception as e:
        logging.warning(e)
        abort(404)

@app.route(f'/{config.path}', methods=['GET', 'POST'])
def proxy_request():
    url = ""
    try:
        data = request.proxy_data
        # print(data)
        url = data.get('url')
        method = data.get('method', 'GET')
        headers = data.get('headers', {})
        params = data.get('params', {})
        post_data = data.get('data', {})
        cookies = data.get('cookies', {})
        timeout = data.get('timeout', 5)
        host_ip = data.get('host', "")
        if host_ip:
            # 设置自定义host
            host_app.update_host(url, host_ip)

        response = requests.request(method, url, headers=headers, params=params,
                                        data=post_data, cookies=cookies, verify=False, timeout=timeout)

        if response.status_code == 200:
            logging.info(f"status: 200  url: {url}")
            content = response.content
            content = auth.encrypt_data(content)
            return Response(content, content_type=response.headers['content-type'])
        else:
            logging.warning(f"status: {response.status_code}  url: {url}")
            return Response(status=response.status_code)
    except Exception as e:
        logging.warning(f"error: {str(e)}  url: {url}")
        return Response(str(e), status=500)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=config.port)