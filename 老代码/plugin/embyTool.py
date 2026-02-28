from config.configParse import config
import requests
from logger.logger import logger
import base64
from db import mongodb

class EmbyTool:
    def __init__(self):
        self.host = config.read("setting", "db_host")
        self.port = config.read("setting", "emby_port")
        self.api_key = config.read("setting", "emby_key")
        self.user_name = config.read("setting", "user")
        self.base_url = f"http://{self.host}:{self.port}"
        self.user_id = self.getUserId(self.user_name)

    def tryDecorator(func):
        def wrapper(self, *args, **kwargs):
            try:
                return func(self, *args, **kwargs)
            except Exception as e:
                logger.warning(f"embyTool fun:({func.__name__}) error {e}")
                return None
        return wrapper

    @tryDecorator
    def getResponse(self, url, resp_type="json"):
        if url.startswith('/'):
            url = url[1:]
        url = f"{self.base_url}/{url}"
        headers = {
            "X-Emby-Token": self.api_key
        }
        # print(url)
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            # print(response.json())
            if resp_type == "json":
                return response.json()
            elif resp_type == "content":
                return response.content
        else:
            return None

    @tryDecorator
    def postResponse(self, url, data,headers={}, resp_type="json"):
        if url.startswith('/'):
            url = url[1:]
        url = f"{self.base_url}/{url}"
        headers["X-Emby-Token"] = self.api_key


        response = requests.post(url,data=data, headers=headers)
        if response.status_code == 200:
            # print(response.json())
            if resp_type == "json":
                return response.json()
            elif resp_type == "content":
                return response.content
        else:
            print(response.text)
            return None

    @tryDecorator
    def getUsers(self):
        url = f"/emby/Users"
        return self.getResponse(url)

    @tryDecorator
    def getUser(self, user_name):
        data = self.getUsers()
        data = [x for x in data if user_name == x['Name']] if user_name and data else data
        return data[0] if data else None

    @tryDecorator
    def getUserId(self, user_name):
        data = self.getUser(user_name)
        return data["Id"] if data else None

    @tryDecorator
    def getMediaLibraries(self, library_name=""):
        """
        Args:
            library_name: 如果输入，返回包含该名称的媒体库，留空返回全部媒体库

        Returns:
            返回媒体库信息
        """

        url = f"/emby/Library/MediaFolders"
        data = self.getResponse(url)
        data = data["Items"] if data else None
        data = [x  for x in data if library_name in x['Name']]  if library_name and data else None
        return data



    @tryDecorator
    def getTvs(self, library_id):
        url = f"/emby/Users/{self.user_id}/Items?ParentId={library_id}&IncludeItemTypes=Series&Recursive=True"
        data =  self.getResponse(url)
        data = data["Items"] if data else None
        return data


    @tryDecorator
    def getPersons(self):
        url = f"/emby/Persons"
        data =  self.getResponse(url)
        data = data["Items"] if data else None
        return data

    @tryDecorator
    def getPersonByName(self, star_name):
        """
            根据演员名称找到对应演员
            Args:
                star_name: 演员名称

            Returns:
                返回演员信息
        """
        url = f"/emby/Persons/{star_name}"
        data =  self.getResponse(url)
        return data

    @tryDecorator
    def getPersonImgByName(self, star_name):
        """
            根据演员名称找到对应演员照片
            Args:
                star_name: 演员名称

            Returns:
                返回演员信息
        """
        url = f"/emby/Persons/{star_name}/Images/Primary"
        data =  self.getResponse(url, "content")
        return data

    @tryDecorator
    def setItemImgById(self, id, img):
        """
            根据演员名称设置对应演员照片
            Args:
                star_name: 演员名称

            Returns:
                返回演员信息
        """
        url = f"/emby/Items/{id}/Images/Primary"
        img = base64.b64encode(img).decode('utf-8')
        headers = {
            'accept': '*/*',
            'Content-Type': 'image/jpg'
        }
        data =  self.postResponse(url, img, headers)
        return data

    def updateEmbyList(self):
        # 更新emby数据到数据库
        db = mongodb()
        logger.info(f"更新emby数据到数据库")
        emby_tool = EmbyTool()
        medias = emby_tool.getMediaLibraries("里番")
        for media in medias:
            data = emby_tool.getTvs(media["Id"])
            if data:
                for item in data:
                    info = {
                        "media_name": media["Name"],
                        "title": item["Name"],
                        "id": item["Id"],
                        "server_id": item["ServerId"],
                        "type": item["Type"]
                    }
                    db.processItem("lf-emby-series", info, "id")

if __name__ == '__main__':
    e = EmbyTool()
