# 文件控制
import os
import stat
import shutil
from util import typeChange

class FileControl:
    def __init__(self):
        pass

    @staticmethod
    def getVideos(path):
        """
        根据指定路径获取所有视频文件
        """
        path = os.path.abspath(path)
        files = []
        video_ext = [".avi", ".rmvb", ".rm", ".asf", ".divx", ".mpg", ".mpeg", ".mpe", ".wmv", ".mp4", ".mkv", ".ts"]
        for parent, dirnames, filenames in os.walk(path, followlinks=False, topdown=True):
            for file in filenames:
                file_ext = os.path.splitext(file)[1]
                file_name = os.path.splitext(file)[0]
                if file_ext in video_ext:
                    path = parent + os.sep + file
                    size = int(os.path.getsize(path) / 1024 / 1024)
                    files.append({"parent": parent, "file": file, "fullpath": path, "size": size})
                else:
                    if file_ext not in [".nfo", ".jpg", ".ass", ".ssa", '.png', ".srt"]:
                        print(parent + os.sep + file)
        # return files
        return sorted(files, key=lambda x: x["fullpath"])

    @staticmethod
    def linkFile(source_file, link_path, title):
        """
        文件硬链接
        Args:
            source_file: 文件源路径 完整路径
            link_path: 目标路径 不带文件名
            title: 文件标题

        Returns:
        """
        if not os.path.exists(link_path):
            print(f"创建目录{link_path}")
            os.makedirs(link_path)
            os.chmod(link_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        file_ext = typeChange.getFileExt(source_file)
        full_path = link_path + os.sep + title + "." + file_ext
        if not os.path.exists(full_path):
            os.link(source_file, full_path)
            os.chmod(full_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        else:
            print(f"{full_path} 已存在")
            # 对比两个文件大小，如果现存文件大于原始文件100mb以上， 替换
            source_file_size = os.path.getsize(source_file)
            full_path_size = os.path.getsize(full_path)
            if (source_file_size - full_path_size) > 100 * 1024 * 1024:
                os.remove(full_path)
                print(f"删除原始文件  {full_path} ")
                os.link(source_file, full_path)
                os.chmod(full_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        return full_path

    @staticmethod
    def linkToFile(source_file, link_file, remove=False):
        """
        文件硬链接
        Args:
            source_file: 文件源路径 完整路径
            link_file: 目标路径
        Returns:
        """
        link_path = os.path.dirname(link_file)
        if not os.path.exists(link_path):
            print(f"创建目录{link_path}")
            os.makedirs(link_path)
            os.chmod(link_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)

        full_path = link_file
        if not os.path.exists(full_path):
            os.link(source_file, full_path)
            os.chmod(full_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        else:
            if remove:
                os.remove(full_path)
                os.link(source_file, full_path)
                os.chmod(full_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)

    @staticmethod
    def copyToFile(source_file, link_file, remove=False):
        """
        文件硬链接
        Args:
            source_file: 文件源路径 完整路径
            link_file: 目标路径
        Returns:
        """
        link_path = os.path.dirname(link_file)
        if not os.path.exists(link_path):
            print(f"创建目录{link_path}")
            os.makedirs(link_path)
            os.chmod(link_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)

        full_path = link_file
        if not os.path.exists(full_path):
            shutil.copy(source_file, full_path)
            os.chmod(full_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        else:
            if remove:
                os.remove(full_path)
                os.link(source_file, full_path)
                os.chmod(full_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)

    @staticmethod
    def saveFile(path, title, ext, content):
        full_path = path + os.sep + title + "." + ext
        if not os.path.exists(path):
            print("创建目录%s" % path)
            os.makedirs(path)
            os.chmod(path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        with open(full_path, 'wb') as f:
            f.write(content)


    @staticmethod
    def saveNfo(path, title, nfo_str):
        if ".nfo" not in path:
            full_path = path + os.sep + title + ".nfo"
            if not os.path.exists(path):
                print("创建目录%s" % path)
                os.makedirs(path)
                os.chmod(path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        else:
            full_path = path
        with open(full_path, 'w', encoding='utf-8') as f1:
            f1.write(nfo_str)
        os.chmod(full_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)

    @staticmethod
    def hasFile(path):
        return os.path.exists(path)

    @staticmethod
    def getExistsFile(paths):
        """
        传入一个路径列表, 从中找到第一个真实存在的路径
        Args:
            paths:

        Returns:
        """
        for path in paths:
            if os.path.exists(path):
                return path
        return None



    @staticmethod
    def getFileWithSameName(file, ext=None):
        if ext:
            if not str(ext).startswith(".") and not str(ext).startswith("-"):
                ext = "." + ext
            file_name, file_extension = os.path.splitext(file)
            file2 = file_name + ext
            if os.path.exists(file2):
                return file2
            else:
                return None
        else:
            # 获取所有同名文件
            file_dir, file_name = os.path.split(file)
            file_name_without_extension, file_extension = os.path.splitext(file_name)

            same_name_files = [f"{file_dir}/{f}" for f in os.listdir(file_dir) if
                               f.startswith(file_name_without_extension) and f != file_name]
            return same_name_files

    @staticmethod
    def copyFilesWithoutVideo(source, target):
        if not os.path.exists(target):
            os.makedirs(target)
        video_ext = [".avi", ".rmvb", ".rm", ".asf", ".divx", ".mpg", ".mpeg", ".mpe", ".wmv", ".mp4", ".mkv", ".ts"]
        all_files = os.listdir(source)
        for f in all_files:
            f_fullpath = os.path.abspath(f"{source}/{f}")
            file_ext = os.path.splitext(f)[1]
            if file_ext not in video_ext:
                t_f = f"{target}/{f}"
                t_f = os.path.abspath(t_f)
                if not FileControl.hasFile(t_f):
                    print(f"copy: {f_fullpath} >> {t_f}")
                    shutil.copy(f_fullpath, t_f)

    @staticmethod
    def readFile(path):
        data = None
        with open(path, 'rb') as file:
            data = file.read()
        return data

if __name__ == '__main__':
    # path = "Z:\\整理\\av破解"
    # files = FileControl.getVideos(path)
    # print(len(files))
    s = "Z:\\手动整理\\普通里番\\2023\\青春抢夺"
    t = "Z:\\手动整理\\破解里番\\2023\\青春抢夺"
    FileControl.copyFilesWithoutVideo(s, t)