# 用于存储av文件信息到数据库 已经获取文件
from media.fileControl import FileControl
from db.mongodb import MongoDB
import os
from config.configParse import config
from util import system
import cv2
from util import typeChange

class AvFileData:
    def __init__(self):
        self.db = MongoDB()
        self.table = f"zlf-avfile"
        # 文件整理相关
        self.noraml_av_path = f'{system.getMainDir()}/{config.read("setting", "normal_av_file")}'
        self.decode_av_path = f'{system.getMainDir()}/{config.read("setting", "decode_av_file")}'

    def findAvData(self, fanhaos):
        # 根据番号列表 查找指定的项
        find = {"fanhao": {"$in": fanhaos}}
        data = self.db.getItems(self.table, find, limit=1000)
        if data:
            new_data = {}
            for d in data:
                new_data[d["fanhao"]+ d["type"]] = d

            return new_data
        else:
            return None


    def __getVideos(self, path):
        v = []
        if path:
            videos = FileControl.getVideos(path)
            for video in videos:
                video_size = os.path.getsize(video["fullpath"])
                if video_size > 200 * 1024 * 1024:
                    full_path = video["fullpath"]
                    v.append(full_path)
        return v

    def __getVideoResolution(self, video_path):
        video = cv2.VideoCapture(video_path)
        width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        video.release()
        return self.__resolutionToString(width, height)

    def __resolutionToString(self, width, height):
        if width >= 3840 or height >= 2160:
            return '4k'
        elif width >= 1920 or height >= 1080:
            return '1080p'
        elif width >= 1280 or height >= 720:
            return '720p'
        elif width >= 640 or height >= 480:
            return '480p'
        else:
            return f'{width}x{height}'

    def saveAvToDb(self,v_type, path):
        if os.path.isdir(path):
            videos = self.__getVideos(path)
        else:
            videos = [path]
        if videos:
            for v in videos:
                resolution = self.__getVideoResolution(v)
                fanhao = typeChange.getBaseName(v)
                data = {
                    "type": v_type,
                    "fanhao": fanhao,
                    "dpi": resolution,
                    "path": v
                }
                self.db.processItem(self.table, data, ["type", "fanhao"])



    def start(self):
        self.saveAvToDb("未解码", self.noraml_av_path)
        self.saveAvToDb("已解码",self.decode_av_path)

if __name__ == '__main__':
    a = AvFileData()
    a.start()