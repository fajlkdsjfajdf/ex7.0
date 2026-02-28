import sys
from flask import jsonify, render_template, abort, redirect, send_file
from crawlerResponse.serviceStatus import ServiceStatus
from crawlerResponse.crawlerStatus import CrawlerStatus
from crawlerResponse.zhengliStatus import ZhengliStatus
from logger.logger import logger


class CrawlerResponse:
    def __init__(self, request):
        self.request = request

    def response(self):
        try:
            cls_name = self.request.args.get('cls')
            if cls_name:
                cls = self.getCls(cls_name)
                if cls:
                    resp =  cls(self.request).response()
                    if resp:
                        if "type" in resp and resp["type"] == "url":
                            return redirect(resp["url"])
                        else:
                            return resp
                    else:
                        return {"msg": f"not response data: {cls_name}"}
                else:
                    return {"msg": f"not found cls: {cls_name}"}
            else:
                return {"msg": f"not found cls: {cls_name}"}
        except Exception as e:
            logger.error(f"返回{cls_name}错误 {e}")
        return {}


    def getCls(self, name):
        sn = sys.modules[__name__]
        c = [i for i in dir(sn) if callable(getattr(sn, i))]
        temp_list = [current_usr.lower() for current_usr in c]
        if name.lower() in temp_list:
            p = temp_list.index(name.lower())
            return getattr(sn, (c[p]))
        else:
            return None