from util import system
import json
from control import crawlerControl
import tracemalloc
from plugin.webLogin import WebLogin


class ServiceStatus:
    def __init__(self, request):
        self.request = request


    def _getSystemInfo(self):
        data = system.getInfo()
        return data

    def response(self):
        type = self.request.args.get('type')
        if(type=="" or type==None):
            return self._getSystemInfo()
        if(type=="bilibilimanga_login"):
            check_url = WebLogin().biliblimanga_login()
            return {"check_url": check_url}




