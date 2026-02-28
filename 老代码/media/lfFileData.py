# 里番的文件管理类
from media.fileControl import FileControl
from db.mongodb import MongoDB
import os
from config.configParse import config
import cv2
from util import typeChange
from plugin.nfoTool import NfoTool
from util import system
from plugin.bgmModule import BgmModule
from lxml import etree
from xml.dom import minidom
from bson.objectid import ObjectId
import codecs
from media.fileControl import FileControl
from logger.logger import logger

class LfFileData:
    def __init__(self):
        self.db = MongoDB()
        self.lf_type = "普通"
        self.table_name = "zlf-lffile"
        self.main_dir = system.getMainDir()
        self.lf_path = f'{system.getMainDir()}/{config.read("setting", "org_lf_file")}'
        # self.lf_wait_path = f'{system.getMainDir()}/{config.read("setting", "wait_org_av_file")}'

    def __getVideos(self, path):
        v = []
        if path:
            videos = FileControl.getVideos(path)
            for video in videos:
                video_size = os.path.getsize(video["fullpath"])
                if video_size > 20 * 1024 * 1024:
                    full_path = video["fullpath"]
                    v.append(full_path)
        return v

    def getVideoResolution(self, video_path):
        return self.__getVideoResolution(video_path)

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
        elif width >= 320 or height >= 240:
            return '320p'
        else:
            return f'{width}x{height}'

    def __replacePath(self, path, add_main= True):
        # 替换路径为当前系统路径
        main_linux = config.read("setting", "main_linux")
        main_windows = config.read("setting", "main_windows")
        if str(path).startswith(main_linux):
            path = path.replace(main_linux, "")
        elif str(path).startswith(main_windows):
            path = path.replace(main_windows, "")
        if add_main:
            path = system.getMainDir()  + path
        return path


    def savewaitOrgFileToDb(self, source_path):
        """
        里番未整理信息存储到数据库
        """
        source_path = self.main_dir + os.sep + source_path
        videos = self.__getVideos(source_path)
        print(f"搜索视频文件完成 总计 {len(videos)} 个视频")
        for video in videos:
            nfo = FileControl.getFileWithSameName(video, "nfo")
            if nfo:
                nfo_data = NfoTool(nfo).toDict()
                if "movie" in nfo_data:
                    nfo_data = nfo_data["movie"]
                    nfo_data["org_file"] = video
                    self.db.processItem(self.table_name, nfo_data, "org_file")
                else:
                    print(f"nfo文件失效 {video}")
            else:
                print(f"nfo文件不存在 {video}")


    def getwaitOrgFileFromDb(self):
        """
        获取数据库中的待整理列表
        """
        data = self.db.getItems(self.table_name, {}, limit=99999,
                                field={"title": 1, "originaltitle": 1, "set": 1, "org_file": 1, "link_file": 1})
        return data




    def linkFile(self, file_data, bid, token):
        """
        整理里番
        """
        self.bid = bid
        bgm = BgmModule()
        bgm_subject = bgm.getSubject(bid, token)

        nfos = self.getNfoFiles(file_data)
        posters, fanarts = self.getPosts(file_data)
        nfo_str = self.getNfo(bgm_subject, nfos)
        year = bgm_subject["date"][:4]
        data_title = bgm_subject["name"]
        data_title_cn = bgm_subject["name_cn"]
        title = data_title_cn if data_title_cn else data_title
        path = f"{self.lf_path}/{self.lf_type}里番/{year}/{title}"
        # 写入nfo文件
        FileControl.saveNfo(path, "tvshow", nfo_str)
        # 写入图片文件
        if posters:
            FileControl.copyToFile(posters[0], f"{path}/poster.jpg")
        if fanarts:
            FileControl.copyToFile(fanarts[0], f"{path}/fanart.jpg")
        # 写入视频文件
        for f in file_data:
            oldpath = f["old_path"]
            oldpath = self.__replacePath(oldpath)
            newpath = f["path"]
            id = f["id"]
            juji = newpath.replace("S1/", "").split(" ")[0]
            file_name = typeChange.getFileName(oldpath)
            newpath = f"{path}/{juji} {file_name}"
            FileControl.linkToFile(oldpath, newpath, True)
            same_files = FileControl.getFileWithSameName(oldpath)
            for sf in same_files:
                new_sf = f"{path}/{juji} {typeChange.getFileName(sf)}"
                if ".nfo" not in new_sf:
                    FileControl.copyToFile(sf, new_sf)
                    if "-poster" in new_sf:
                        FileControl.linkToFile(new_sf, new_sf.replace("-poster", "-thumb"), True)
                else:
                    self.saveNfo(sf, new_sf)
            self.saveLinkDb(id, newpath)

        return {"status": "success"}

    def saveNfo(self, nfo_path, new_nfo_path):
        # 打开原始文件和目标文件
        tree = etree.parse(nfo_path)
        # 获取根元素
        root = tree.getroot()

        # 查找movie下面的plot元素
        plots = root.findall('.//plot')

        # 修改plot的值
        for plot in plots:
            plot.text =etree.CDATA(plot.text)

        xml_str = etree.tostring(root, pretty_print=True, encoding="utf-8")
        xml_string = etree.tostring(root, encoding="utf-8").decode("utf-8")
        pretty_xml = minidom.parseString(xml_string).toprettyxml(indent="  ")
        pretty_xml = typeChange.removeBlankLines(pretty_xml)
        # print(pretty_xml)
        FileControl.saveNfo(new_nfo_path, "", pretty_xml)

    def saveLinkDb(self, id, link_file):
        link_file = self.__replacePath(link_file, False)
        # 将完成连接传送到数据库
        data  = self.db.getItem(self.table_name, {"_id": ObjectId(id)})
        if data:
            self.db.processItem(self.table_name, {"_id": ObjectId(id), "link_file": link_file}, "_id")

    def getPosts(self, file_data):
        posters = []
        fanarts = []
        for f in file_data:
            oldpath = f["old_path"]
            oldpath = self.__replacePath(oldpath)
            sameFiles = FileControl.getFileWithSameName(oldpath)
            for sf in sameFiles:
                if "-fanart" in sf:
                    fanarts.append(sf)
                if "-poster" in sf:
                    posters.append(sf)
        return posters, fanarts

    def getNfoFiles(self, file_data):
        nfos = []
        for f in file_data:
            oldpath = f["old_path"]
            oldpath = self.__replacePath(oldpath)
            nfopath = FileControl.getFileWithSameName(oldpath, "nfo")
            if nfopath:
                nfos.append(nfopath)
        return nfos


    def getNfo(self, bgm_subject, nfos=[]):
        """
        从 bgm 以及 nfo列表取出指定数据组成一个新的数据集
        """
        data_title = bgm_subject["name"]
        data_title_cn = bgm_subject["name_cn"]
        date = bgm_subject["date"]
        data_plot = bgm_subject["summary"]

        year = date[:4]
        data_rating = str(bgm_subject["rating"]["score"])
        tags = set()
        for t in bgm_subject["tags"]:
            tags.add(t["name"])
        if nfos:
            nfo_data = NfoTool(nfos[0]).toDict()
            if "movie" in nfo_data and "plot" in nfo_data["movie"]:
                data_plot = nfo_data["movie"]["plot"]
            for nfo in nfos:
                nfotool = NfoTool(nfo)
                nfo_data = nfotool.toDict()
                if "movie" in nfo_data and "genre" in nfo_data["movie"] and type(nfo_data["movie"]["genre"] == list):
                    for g in nfo_data["movie"]["genre"]:
                        tags.add(g)
        if "无码" in tags or "无修正" in tags:
            self.lf_type = "无码"
        data_plot += f" bid: {self.bid}"
        # 建立xml
        root = etree.Element("tvshow")
        lockdata = etree.SubElement(root, "lockdata")
        lockdata.text = "false"
        plot = etree.SubElement(root, "plot")
        plot.text = etree.CDATA(data_plot)
        title = etree.SubElement(root, "title")
        title.text = data_title_cn if data_title_cn != "" else data_title
        originaltitle = etree.SubElement(root, "originaltitle")
        originaltitle.text = data_title
        releasedate = etree.SubElement(root, "releasedate")
        releasedate.text = date
        rating = etree.SubElement(root, "rating")
        rating.text = data_rating

        for tag in tags:
            genre = etree.SubElement(root, "genre")
            genre.text = str(tag)

        # 创建XML字符串
        xml_str = etree.tostring(root, pretty_print=True, encoding="utf-8")

        xml_string = etree.tostring(root, encoding="utf-8").decode("utf-8")

        pretty_xml = minidom.parseString(xml_string).toprettyxml(indent="  ")
        return pretty_xml


    def getLocalPoster(self, data):
        """
        根据传入mongodb 获取对应poster
        Args:
            data:

        Returns:
        """
        try:
            title = data["name_cn"] if data["name_cn"] else data["name"]
            year = data["date"][:4]
            path = FileControl.getExistsFile([
                f"{self.lf_path}/无码里番/{year}/{title}",
                f"{self.lf_path}/普通里番/{year}/{title}"
            ])
            if path:
                path_poster = FileControl.getExistsFile([
                    f"{path}/poster.jpg",
                    f"{path}/poster.png"
                ])
                if path_poster:
                    img = FileControl.readFile(path_poster)
                    logger.info(f"获取本地图片 {path_poster}")
                    return img

        except Exception as e:
            logger.error(f"获取里番本地图片出错 {e}")
        return  None


    def getLocalFanart(self, data):
        """
        根据传入mongodb 获取对应fanart
        Args:
            data:

        Returns:
        """
        try:
            title = data["name_cn"] if data["name_cn"] else data["name"]
            year = data["date"][:4]
            path = FileControl.getExistsFile([
                f"{self.lf_path}/无码里番/{year}/{title}",
                f"{self.lf_path}/普通里番/{year}/{title}"
            ])
            if path:
                path_poster = FileControl.getExistsFile([
                    f"{path}/fanart.jpg",
                    f"{path}/fanart.png"
                ])
                if path_poster:
                    img = FileControl.readFile(path_poster)
                    logger.info(f"获取本地图片 {path_poster}")
                    return img

        except Exception as e:
            logger.error(f"获取里番本地图片出错 {e}")
        return  None

    def getLocalVideo(self, data):
        file = data["file"]
        file = os.path.abspath(f'{system.getMainDir()}/{file}')
        if "mask" in data and data["mask"] == "finish":
            file = file.replace("无码里番", "破解里番").replace("普通里番", "破解里番")
            file, ext = os.path.splitext(file)
            file = f"{file}.mp4"
        if os.path.exists(file):
            logger.info(f"get video {file}")
            return file
        return None

if __name__ == '__main__':
    pass
    # path = "整理\\里番\\Hentai"
    # lf = LfFileData()
    # lf.savewaitOrgFileToDb(path)

