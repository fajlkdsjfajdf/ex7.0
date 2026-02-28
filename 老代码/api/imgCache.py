import json

from logger.logger import logger
from util import system, typeChange
from flask import jsonify, send_file, redirect
from db.minio import MinioClient
import requests
from networking.webRequest import WebRequest
from networking.proxy import ProxyState

class ImgCache:
    def __init__(self, request):
        self.request = request
        self.minio = MinioClient()
        self.bucket = "imgcache"
        self._setFileInfo()

    def _downloadPic(self):
        """
        downloadPic
        下载图片
        :param url
        :return:
        """
        url = self.path_url
        if url != "" and url != None and "http" in url:
            new_headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36Name'}
            if self.down_headers:
                headers = self.down_headers
                for key in headers:
                    new_headers[key] = headers[key]

            web = WebRequest(httpComplete=self._downPicComplete)
            use_proxy = False
            proxy_state = ""
            if self.use_proxies == 1:
                # 使用国内带来
                use_proxy = True
                proxy_state = ProxyState.FLASK_DOMESTIC
            elif self.use_proxies == 2:
                # 使用海外代理
                use_proxy = True
                proxy_state = ProxyState.FLASK_FOREIGN

            if web.get(url, headers=new_headers, use_proxy=use_proxy, proxy_state=proxy_state, retry_limit=3, retry_interval=0.5, timeout=10):


                return True
            else:
                logger.warning(f"获取图片 {url} 失败, 使用代理: {use_proxy}")

        return False

    def _downPicComplete(self, response, url, kwargs):
        """
        下载图片完成事件
        判断下载的是否为一个正常的图片
        """
        path = self.path
        if self.minio.uploadImage(self.bucket, path, response.get("content", "")):
            return True
        else:
            return False


    def _setFileInfo(self):
        path = self.request.values.get("path", "")
        if path:
            if not str(path).endswith(".jpg"):
                path += ".jpg"
            self.path = path
            self.path_url = ""
            self.path_prefix = ""
            self.path_title = ""
        else:
            self.path_prefix = self.request.values.get("prefix", "")
            self.path_title = self.request.values.get("title", "")
            self.use_proxies = int(self.request.values.get("use_proxies", 0))
            self.down_headers = {}
            headers = self.request.values.get("headers", "")
            if headers:
                headers = headers.replace("'", "\"")
                headers = json.loads(headers)
                self.down_headers = headers
            self.path_url = self.request.values.get("url", "")
            file_name = typeChange.extractPathFromUrl(self.path_url)
            if self.path_title:
                file_name = self.path_title
            if not str(file_name).endswith(".jpg"):
                file_name += ".jpg"
            self.file_name = file_name
            prefix = self.path_prefix if self.path_prefix else "down"
            md5_str = typeChange.strToMd5(file_name)
            self.path = f"{prefix}/{md5_str[:1]}/{md5_str}"



    def _getImageData(self):
        data = self.minio.getImage(self.bucket, self.path)
        if data:
            return send_file(typeChange.convertBytesIO(data), mimetype="image/jpg")
        return redirect("/static/images/waitindexpic.gif")

    def getResponse(self):
        if self.path:
            if self.minio.existImage(self.bucket, self.path):
                # logger.info(f"图片以缓存 {self.path_url}")
                # 图片存在, 直接返回
                return self._getImageData()
            else:
                if self.path_url:
                    # 传入了图片的网址, 尝试下载后返回
                    if self._downloadPic():
                        return self._getImageData()
        return redirect("/static/images/waitindexpic.gif")