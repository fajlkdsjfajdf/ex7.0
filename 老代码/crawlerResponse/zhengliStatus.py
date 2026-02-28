# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：     crawlerStatus
   Description :   获取爬虫的状态
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""



from util import system
from media.avModule import AvModule
from util import typeChange
from config.configParse import config
from media import mediaFile
import random
import json
from plugin.bgmModule import BgmModule
from media.lfFileData import LfFileData
import os
from media.avFileData import AvFileData

from media.fileControl import FileControl
from plugin.avFileTool import AvFileTool
from plugin.lmzl import LocationManhua




class ZhengliStatus:
    def __init__(self, request):
        self.request = request


    def _logBgm(self):
        code = self.request.args.get("code")
        temp = self.request.args.get("temp")
        url = self.request.host_url
        bgm = BgmModule()
        token = bgm.getToken(code, url, temp)
        if token != "":
            return {"type": "url", "url": f"/?temp={temp}&token={token}"}
        else:
            return {"type": "error", "msg": "登录失败"}

    def get_modified_time(self, filename):
        # print(os.path.getmtime(filename))
        return os.path.getmtime(filename)

    def _getFiles(self):
        node = self.request.args.get('node')
        if node == None or node == "":
            node = f"{system.getMainDir()}/"
        else:
            node = f"{system.getMainDir()}/{node}"
        files = os.listdir(node)
        # print(files)
        files = sorted(files, key=lambda x: self.get_modified_time(os.path.join(node, x)))
        data = []
        for file in files:
            if os.path.isdir(os.path.join(node, file)):
                data.append({"children": True, "id": file, "text": file})
            else:
                data.append({"children": False, "id": file, "text": file})

        return data

    def _searchFiles(self):
        ext = self.request.args.get('ext')
        node = self.request.args.get('node')
        files = []
        zip_ext = [".zip", ".rar"]

        node = f"{system.getMainDir()}/{node}"
        if(ext== "rar" or ext == "zip"):
            for parent, dirnames, filenames in os.walk(node, followlinks=False, topdown=True):
                for file in filenames:
                    file_ext = os.path.splitext(file)[1]
                    file_name = os.path.splitext(file)[0]
                    if file_ext in zip_ext:
                        files.append({"file": file, "fullpath": parent + "/" + file})
            # return files
            return sorted(files, key=lambda x: x["fullpath"])
        if(ext== "video"):
            video_ext = [".avi", ".rmvb", ".rm", ".asf", ".divx", ".mpg", ".mpeg", ".mpe", ".wmv", ".mp4", ".mkv"]
            for parent, dirnames, filenames in os.walk(node, followlinks=False, topdown=True):
                for file in filenames:
                    file_ext = os.path.splitext(file)[1]
                    file_name = os.path.splitext(file)[0]
                    if file_ext in video_ext:
                        path = parent + "/" + file
                        size = int(os.path.getsize(path) / 1024 / 1024)
                        files.append({"parent": parent, "file": file, "fullpath": path, "size": size})
            # return files
            return sorted(files, key=lambda x: x["fullpath"])



    def _zhengli(self):
        node = self.request.args.get('node')
        node = f"{system.getMainDir()}/{node}"
        token = self.request.args.get("token")
        bid = self.request.args.get("bid")
        manhua = Manhua(token)
        manhua.build(bid, node)
        return {"msg": "完成"}


    def _assSearch(self):
        text = self.request.form.get("text")
        data = self.skyey.searchAss(text)
        return data

    def _assZip(self):
        href = self.request.form.get("href")
        zipurl = self.skyey.getAssUrl(href)
        if zipurl != "":
            id, dirs, paths = self.skyey.getAssZip(zipurl)
            return {"id": id, "assfiles": dirs, "asspaths": paths}
        else:
            return {"msg": "没有字幕压缩包"}


    def _findImg(self):
        tvdb_id = int(self.request.form.get("id"))
        data = self.fanArt.getData(tvdb_id)
        return data

    def _linkLog(self):
        return log.linkData

    def _searchyouma(self):
        fanhao = self.request.args.get("search_text")
        m = AvModule()
        data = m.search(fanhao)
        return data

    def _searchwuma(self):
        fanhao = self.request.args.get("search_text")
        m = AvModule()
        data = m.searchWuma(fanhao)
        return data

    def _youmaavlink(self):
        row = self.request.json["item"]
        path = self.request.json["path"]
        is_uncensored = self.request.json["is_uncensored"]

        data = {}
        fanhao = row["fanhao"]
        data["name"] = f'{fanhao} {row["title"].replace(fanhao, "").strip()}'
        row["title"] = data["name"]
        title = row["title"] if len(row["title"])< 60 else fanhao
        data["actors"] = row["stars"]
        data["tags"] = row["tags"]
        data["releasedate"] = row["ReleaseDate"]
        v_type = "未解码"
        if is_uncensored:
            main_path = f"{system.getMainDir()}/{config.read('setting', 'decode_av_file')}/{data['releasedate'][0:4]}/{fanhao}/{title}"
            v_type = "已解码"
        else:
            main_path = f"{system.getMainDir()}/{config.read('setting', 'normal_av_file')}/{data['releasedate'][0:4]}/{fanhao}/{title}"
        fanart_path = f"{main_path}-fanart"
        mediaFile.downloadPic(row["pic_l"], fanart_path)
        poster_path = f"{main_path}-poster"
        poster_url = row["pic_l"].replace("pl.jpg", "ps.jpg").replace("_b.jpg", ".jpg").replace("/pics/cover/", "/pics/thumb/")
        # print(poster_url)
        mediaFile.downloadPic(poster_url, poster_path)
        mediaFile.bulidAvNfo(main_path, data)
        file_ext = path.split(".")[-1]
        link_path = f"{main_path}.{file_ext}"
        mediaFile.linkFile(path, link_path)
        m = AvModule()
        m.linklog(path, link_path)

        AvFileData().saveAvToDb(v_type, link_path)

        # print(item)
        return {"state": "success", "source": path, "target": link_path}



    def _getavlink(self):
        m = AvModule()
        return m.getLinkLog()

    def _linkNeedDecode(self):
        emby = EmbyManager()
        user_id = emby.getUserId("ainizai0904")
        if user_id:
            favorites_boxsets = emby.getUserFavoritesBoxSet(user_id, 100)
            if favorites_boxsets:
                for boxset in favorites_boxsets["Items"]:
                    boxset_id = boxset["Id"]
                    items = emby.getSubItems(boxset_id, user_id)
                    if items:
                        for item in items["Items"]:
                            item_id = item["Id"]
                            item_info = emby.getItem(item_id, user_id)
                            if (item_info):
                                source_path = item_info["Path"]
                                if source_path.startswith("/movies"):
                                    source_path = f"{system.getMainDir()}/{source_path[8:]}".replace("\\", "/")
                                    file_name = os.path.basename(source_path)
                                    target_folder = boxset["Name"]
                                    target_path = config.read("DIR", "decode_folder")
                                    target_path = f"{system.getMainDir()}/{target_path}/{target_folder}"
                                    if os.path.exists(target_path) == False:
                                        os.makedirs(target_path)
                                        print(f"创建了目录{target_path}")
                                    target_path = f"{target_path}/{file_name}"
                                    if os.path.exists(target_path) == False:
                                        os.link(source_path, target_path)
                                        print(f"{source_path}>>>>>>>>>>>>>{target_path}")
                                        mediaFile.linkSameFile(source_path, target_path)
                                    else:
                                        print(f"{target_path} 已存在")
        # print("完成")
        return {"status": "success"}

    def _linkFile(self):
        try:
            media_type = self.request.args.get("mtype")
            source_file = self.request.args.get("source")
            if not media_type:
                return {"state": "error", "msg": "no mtype"}
            if not source_file:
                return {"state": "error", "msg": "no source_file"}
            # source_file like '/movies/整理/成人整理/2023/DVDMS-948.mp4'
            if not source_mediaFile.startswith("/movies"):
                return {"state": "error", "msg": "source_file has not /movies"}
            source_file = f"{system.getMainDir()}/{source_file[8:]}".replace("\\", "/")
            if not os.path.exists(source_file):
                return {"state": "error", "msg": "source_file is not exist"}

            source_name, source_ext = os.path.splitext(os.path.basename(source_file))
            target_file = f"{system.getMainDir()}/{config.read('DIR', 'decode_av_folder')}/{source_name}/{source_name}{source_ext}"
            target_dir = os.path.dirname(target_file)
            print(target_dir)
            if not os.path.exists(target_dir):
                os.makedirs(target_dir)
                print(f"创建目录{target_dir}")
            if os.path.exists(target_file):
                os.unlink(target_file)
            os.link(source_file, target_file)
            mediaFile.linkSameFile(source_file, target_file)
            return {"state": "success", "source": source_file, "target": target_file}
        except Exception as e:
            return {"state": "error", "msg": e}

    def _getLfFiles(self):
        ld  = LfFileData()
        return ld.getwaitOrgFileFromDb()

    def _search(self):
        search_text = self.request.args.get("search_text")
        search_type = self.request.args.get("search_type")
        token = self.request.args.get("token")
        bgm = BgmModule()
        if search_type == None or search_type == "text":
            return bgm.search(search_text, token)

    def _lfzlFiles(self):
        bid = self.request.json.get("bid")
        zl = self.request.json.get("zl")
        token = self.request.json.get("token")
        return  LfFileData().linkFile(zl, bid, token)

    def _youmaAutoAdd(self):
        path = self.request.args.get("node")
        path = f'{system.getMainDir()}/{path}'
        is_uncensored = self.request.args.get("is_uncensored")
        is_uncensored = True if is_uncensored  == 'true' else False
        v_type = "已解码" if is_uncensored else "未解码"
        path_to = f"{system.getMainDir()}/{config.read('setting', 'normal_av_file')}"
        if is_uncensored:
            path_to = f"{system.getMainDir()}/{config.read('setting', 'decode_av_file')}"

        if os.path.exists(path):
            videos = FileControl.getVideos(path)
            for video in videos:
                video_size = os.path.getsize(video["fullpath"])
                if video_size > 200 * 1024 * 1024:
                    full_path = video["fullpath"]
                    tool = AvFileTool(full_path)
                    nfo_str = tool.getNfo()
                    if nfo_str:
                        new_path, title = tool.getPath()
                        new_path = os.path.abspath(f"{path_to}/{new_path}")
                        FileControl.saveNfo(new_path, title, nfo_str)
                        link_path = FileControl.linkFile(full_path, new_path, title)
                        FileControl.saveFile(new_path, f"{title}-fanart", "jpg", tool.getFanart())
                        FileControl.saveFile(new_path, f"{title}-poster", "jpg", tool.getPoster())

                        AvFileData().saveAvToDb(v_type, link_path)
                        print(f"{new_path} over")
                    else:
                        print(f"{full_path}  未找到信息")
            return {"msg": f"完成"}
        else:
            return {"msg": f"没找到文件夹 path"}

        return {}

    def _lm_zl(self):
        """
        本地漫画整理
        Returns:

        """
        path = self.request.args.get("node")
        path = f'{system.getMainDir()}/{path}'
        mh = LocationManhua(path)
        msg = mh.zhengli()
        return {"msg": msg}

    def response(self):
        type = self.request.args.get('type')
        if(type=="getfiles"):
            return self._getFiles()
        elif(type=="searchfiles"):
            return self._searchFiles()
        elif(type=="getlffiles"):
            return self._getLfFiles()
        elif(type=="lfzl"):
            return self._lfzlFiles()
        elif(type=="lmzl"):
            return self._lm_zl()

        elif(type=="loginbgm"):
            return self._logBgm()
        elif(type=="search"):
            return self._search()
        elif(type=="asssearch"):
            return self._assSearch()
        elif(type=="asszip"):
            return self._assZip()
        elif(type=="tarktsearch"):
            return self._getTraktTv()
        elif(type=="findimg"):
            return self._findImg()

        elif(type=="linklog"):
            return self._linkLog()
        elif(type=="zhengli"):
            return self._zhengli()
        elif(type=="searchyouma"):
            return self._searchyouma()
        elif(type=="youmaavlink"):
            return self._youmaavlink()
        elif(type=="autoadd"):
            return self._youmaAutoAdd()
        elif(type=="getavlink"):
            return self._getavlink()
        elif(type=="searchwuma"):
            return self._searchwuma()
        elif(type=="wumaavlink"):
            return self._wumaavlink()
        elif(type=="linkdecode"):
            return self._linkNeedDecode()
        elif(type=="linkfile"):
            return self._linkFile()




if __name__ == '__main__':
    zl = ZhengliStatus(None)
    zl._linkNeedDecode()