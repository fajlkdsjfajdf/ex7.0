
from flask import Flask, send_file
from flask import Response
import os

app = Flask(__name__)

@app.route('/download')
def download_large_file():
    file_path = "D:/源码/e绅士-6.0/test/test.mp4"

    def send_file():
        store_path = file_path
        with open(store_path, 'rb') as targetfile:
            while 1:
                data = targetfile.read(20 * 1024 * 1024)  # 每次读取20M
                if not data:
                    break
                yield data

    response = Response(send_file(), content_type='application/octet-stream')
    response.headers["Content-disposition"] = 'attachment; filename=%s' % "test.mp4"  # 如果不加上这行代码，导致下图的问题
    return response

if __name__ == '__main__':
    app.run()