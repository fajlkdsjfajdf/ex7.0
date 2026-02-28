import os
import zipfile
from pathlib import Path
import re
import hashlib
from db.mongodb import MongoDB
from db.minio import MinioClient
import datetime
class LocationManhua:
    """
    本地漫画整理工具
    """
    def __init__(self, full_path:str):
        self.path = full_path
        self.minio = MinioClient()
        self.db = MongoDB()
        self.main_table = "lm-main"
        self.list_table = "lm-list"
        self.image_bucket = "lmimage"
        self.thumb_bucket = "lmthumb"
        self.main_id = "aid"
        self.list_id = "pid"

    def generate_md5(self, input_string):
        return hashlib.md5(input_string.encode('utf-8')).hexdigest()

    def support_gbk(self, zip_file):
        real_name = ""

        name_to_info = zip_file.NameToInfo
        # copy map first
        for name, info in name_to_info.copy().items():
            real_name = name.encode('cp437', errors='ignore').decode('gbk', errors='ignore')
            if real_name != name:
                info.filename = real_name
                del name_to_info[name]
                name_to_info[real_name] = info

        return zip_file


    def find_zip_files(self, folder_path):
        """
        找到所有zip文件
        Returns:

        """
        zip_files = []
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                if file.endswith(".zip"):
                    zip_files.append(f"{root}/{file}")
        return zip_files


    def find_image_folders(self, zip_path):
        if not os.path.exists(zip_path):
            print("文件不存在")
            return []

        title = Path(zip_path).stem
        id = self.generate_md5(title)
        data = {}
        file_list = []

        with self.support_gbk(zipfile.ZipFile(zip_path, 'r')) as zip_ref:
            file_list = zip_ref.namelist()



        title_set = set()
        for file in file_list:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                parent_folder = os.path.dirname(file)
                if parent_folder:
                    title_set.add(parent_folder)


        title_set = list(title_set)
        title_set = sorted(title_set, key=lambda x: (len(x), x))

        if title_set:
            for dir_title in title_set:
                print(dir_title)
                # db_file = file.replace("/", " ").replace("\\", " ")
                with self.support_gbk(zipfile.ZipFile(zip_path, 'r')) as zip_ref:
                    file_list = zip_ref.namelist()
                    for file_name in file_list:
                        if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')) and os.path.dirname(file_name) == dir_title:
                            file_title = os.path.basename(file_name)
                            file_path = f"{title}/{dir_title}/{file_title}"
                            if dir_title not in data:
                                data[dir_title] = []
                            data[dir_title].append(file_title)
                            if not self.minio.existImage(self.image_bucket, file_path):
                                with zip_ref.open(file_name) as file:
                                    file_content = file.read()
                                    self.minio.uploadImage(self.image_bucket, file_path, file_content)

        else:
            dir_title = title
            title_set.append(dir_title)
            print(dir_title)

            with self.support_gbk(zipfile.ZipFile(zip_path, 'r')) as zip_ref:
                file_list = zip_ref.namelist()
                for file_name in file_list:
                    if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):

                        file_title = os.path.basename(file_name)
                        file_path = f"{title}/{dir_title}/{file_title}"
                        if dir_title not in data:
                            data[dir_title] = []
                        data[dir_title].append(file_title)
                        if not self.minio.existImage(self.image_bucket, file_path):
                            with zip_ref.open(file_name) as file:
                                file_content = file.read()
                                self.minio.uploadImage(self.image_bucket, file_path, file_content)

        #title_set = [i.replace("/", " ").replace("\\", " ") for i in title_set]
        for key in data:
            data[key].sort(key=lambda x: (len(x), x))

        return data



    def zhengli(self):
        """
        开始整理
        Returns:

        """

        zip_files = self.find_zip_files(self.path)
        for zip in zip_files:
            title = Path(zip).stem
            files = self.find_image_folders(zip)
            if files:
                first_key = list(files.keys())[0]
                if files[first_key] and files[first_key][0]:
                    thumb = f"{title}/{first_key}/{files[first_key][0]}"
                    aid = self.generate_md5(title)
                    self.db.processItem(self.main_table, {self.main_id: aid, "title": title, "thumb": thumb, "update_time": datetime.datetime.now()}, self.main_id)
                index = 0
                for key, value in files.items():
                    index+=1
                    pid = self.generate_md5(key)
                    # print(len(pid))
                    self.db.processItem(self.list_table, {self.list_id: pid, self.main_id: aid, "title": key, "pages": value, "order": index}, self.list_id)





if __name__ == '__main__':
    path = "C:/Users/Administrator/Desktop/新建文件夹"
    lm = LocationManhua(path)
    lm.zhengli()




