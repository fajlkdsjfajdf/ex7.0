from api.avApi import AvApi
from logger.logger import logger
from util import system, typeChange
from flask import jsonify, send_file, redirect
from api.bigFileCache import BigFileCache
class ApiResponse:
    def __init__(self, request):
        self.request = request


    def getResponse(self):
        resp_type = self.request.values.get("type", "")
        data = None
        data_type = None
        if resp_type == "dcav":
            path = self.request.values.get("path", "")
            if path:
                data, data_type = AvApi().decodeAv(path)
        elif resp_type == "getdcav":
            data, data_type = AvApi().getwaitAv()
        elif resp_type == "downbigfile":
            url = self.request.values.get("url", "")
            file = self.request.values.get("file", "")
            path = self.request.values.get("path", "")
            if url and file and path:
                data, data_type = BigFileCache(url, file, path).start_download()
            else:
                data, data_type = {"msg": "文件下载 参数异常", "status": "error"}, "json"


        if data_type:
            try:
                # 返回值的类型
                if data_type == "json":
                    data = typeChange.cleanJson(data)  # 清洗数据
                    response = jsonify(data)
                    response.headers['Content-Type'] = 'application/json; charset=utf-8'
                    return response
                elif data_type == "file":
                    return send_file(data)
                elif data_type == "url":
                    return redirect(data)
                elif data_type == "image/jpg":
                    return send_file(typeChange.convertBytesIO(data), mimetype="image/jpg")
            except Exception as e:
                msg = f"无法返回数据 原因{e}"
                data = self.request.values
                data["msg"] = msg
                logger.error(msg)
                return data, 200, {'ContentType': 'application/json'}
        else:
            # 啥都不是的默认返回值
            data = self.request.values
            data["msg"] = "unknow request"
            return data, 200, {'ContentType': 'application/json'}