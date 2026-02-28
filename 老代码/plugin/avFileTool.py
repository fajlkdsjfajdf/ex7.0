# av文件管理类
from db.mongodb import MongoDB
from db.minio import MinioClient
from crawler.jbCrawlerProcess import *
from util import typeChange
import re
from PIL import Image
from io import BytesIO
import xml.etree.ElementTree as ET
from xml.dom import minidom
import os
from media.fileControl import FileControl


class AvFileTool:

    def __init__(self, file):
        self.db = MongoDB()
        self.minio = MinioClient()
        self.av_source = "jb"   # 数据源
        self.av_table = f"{self.av_source}-main"
        self.thumb_path= f"{self.av_source}thumb"
        self.file = file
        self.data = None
        self.fanart = None
        self.poster = None
        self.thumbCrawler = JbThumbCrawlerProcess()
        self.infoCrawler = JbInfoCrawlerProcess()


    def searchFanhao(self):
        pattern = r'[A-Za-z][A-Za-z0-9]{1,6}-\d{2,5}'
        result = re.findall(pattern, self.file)
        if result:
            return result[0]
        else:
            # 尝试使用纯数字的组合再找一次， 这种只可能出现在无码的av上
            pattern = r'[A-Za-z][A-Za-z0-9]{1,6}-[A-Za-z0-9]{2,5}'
            pattern += r'|[0-9]{1,6}-[0-9]{2,4}'
            pattern += r'|[0-9]{1,6}_[0-9]{2,4}'

            result = re.findall(pattern, self.file)
            if result:
                return result[0]
            else:
                pattern = r'[A-Za-z]{1,2}[0-9]{2,4}'
                result = re.findall(pattern, self.file)
                if result:
                    return result[0]

        return None

    def getFanhao(self):
        """
        getFanhao 根据文件名称或者路径获取对应番号
        :return:
        """
        file_name = typeChange.getFileName(self.file)
        if file_name:
            fanhao = self.searchFanhao()
            return fanhao
        return None

    def getAvData(self):
        fanhao = self.getFanhao()
        if fanhao:
            print(fanhao)
            find = {"fanhao": re.compile(fanhao, re.IGNORECASE)}
            data = self.db.getItem(self.av_table, find)
            if data:
                self.data = data
                self.data["title"] = typeChange.cleanPath(self.data["title"])
                return data
            else:
                # 尝试在线获取番号
                search_data = self.infoCrawler.getCrawlerDataById([fanhao])
                if not search_data:
                    return None
                self.infoCrawler.setCrawlerData(search_data)
                self.infoCrawler.setUseProxy(False)
                self.infoCrawler.run()
                data = self.db.getItem(self.av_table, find)
                if data:
                    self.data = data
                    self.data["title"] = typeChange.cleanPath(self.data["title"])
                    return data
                # print(self.mainCrawler.crawler_data)

        return None

    def getNfo(self):
        if not self.data:
            self.getAvData()
        if self.data:
            # print(self.data)
            # 处理参数
            data_fanhao = self.data['fanhao']
            data_title = self.data['title']
            if data_fanhao not in data_title:
                data_title = f"{data_fanhao} {data_title}"
            data_date = self.data["ReleaseDate"].strftime("%Y-%m-%d") if 'ReleaseDate' in self.data else "1900-01-01"
            data_tags = self.data["tags"]
            data_tags = [s for s in data_tags if s != "0"]
            data_stars = self.data["stars"]
            # data_stars = [s for s in data_stars if "StarName" in s and s["StarName"] != ""]
            # 建立xml
            root = ET.Element("tvshow")
            lockdata = ET.SubElement(root, "lockdata")
            lockdata.text = "false"
            title = ET.SubElement(root, "title")
            title.text = data_title
            releasedate = ET.SubElement(root, "releasedate")
            releasedate.text = data_date
            for tag in data_tags:
                genre = ET.SubElement(root, "genre")
                genre.text = str(tag)
            for star in data_stars:
                actor = ET.SubElement(root, "actor")
                actor_name = ET.SubElement(actor, "name")
                actor_name.text = star
                actor_type = ET.SubElement(actor, "type")
                actor_type.text = "Actor"


            xml_string = ET.tostring(root, encoding="utf-8").decode("utf-8")

            pretty_xml = minidom.parseString(xml_string).toprettyxml(indent="  ")

            return pretty_xml
        return None

    def getPath(self):
        # 获取相对路径
        if not self.data:
            self.getAvData()
        if self.data:
            data_date = self.data["ReleaseDate"].strftime("%Y") if 'ReleaseDate' in self.data else "1900"
            data_fanhao = self.data['fanhao']
            data_title = self.data['title']
            if data_fanhao not in data_title:
                if len(data_title) <= 50:
                    data_title = f"{data_fanhao} {data_title}"
                else:
                    data_title = data_fanhao
            path = data_date + os.sep + data_fanhao
            return path, data_title
        return None

    def getFanart(self):
        if not self.data:
            self.getAvData()
        if self.data and "pic_l" in self.data:
            url = self.data["pic_l"]
            aid = self.data["aid"]
            bucket, path = self.thumbCrawler._getMinioFile(aid)
            if self.minio.existImage(bucket, path):
                # 本地已经缓存
                pass
            else:
                self.thumbCrawler.setCrawlerData([self.data])
                self.thumbCrawler.setUseProxy(False)
                self.thumbCrawler.run()
            if self.minio.existImage(bucket, path):
                fanart = self.minio.getImage(bucket, path)
                self.fanart = fanart
                return fanart
            else:
                return None

    def getPoster(self):
        if not self.data:
            self.getAvData()
        if not self.fanart:
            self.getFanart()
        if self.fanart:
            # 将二进制数据转换为图像对象
            image = Image.open(BytesIO(self.fanart))
            # 判断图像是否横向图 即宽大于高
            if image.width > image.height:
                # 计算截取的宽度和起始位置
                width = int(image.width * 0.47)
                start_x = image.width - width

                # 截取图片
                right_half = image.crop((start_x, 0, image.width, image.height))

                # 显示图片
                # right_half.show()
                img_io = BytesIO()
                right_half.save(img_io, format='JPEG')
                right_half.close()
                img_io.seek(0)
                data = img_io.getvalue()
                img_io.close()
                self.poster = data
                return data
            else:
                self.poster = self.fanart
                return self.poster
        return None






if __name__ == '__main__':
    file = "032411_652 神さまの生贄 後編 波多野結衣-poster.jpg"
    a = AvFileTool(file)
    a.getFanhao()
    # print(a.getAvData())
    a.getPath()