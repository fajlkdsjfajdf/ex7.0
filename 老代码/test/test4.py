# 将av 归档
from media.fileControl import FileControl
from plugin.avFileTool import AvFileTool
from util import typeChange
import os
from media.avFileData import AvFileData

path = "Z:\\下载中\\迅雷\\成人\\2024-02-02"

path_to = "Z:\\手动整理\\破解AV"

videos = FileControl.getVideos(path)
for video in videos:
    video_size = os.path.getsize(video["fullpath"])
    if video_size > 200 * 1024 * 1024:
        full_path = video["fullpath"]
        tool = AvFileTool(full_path)
        nfo_str = tool.getNfo()
        if nfo_str:
            new_path, title = tool.getPath()
            new_path = path_to + os.sep + new_path
            FileControl.saveNfo(new_path, title, nfo_str)
            FileControl.linkFile(full_path, new_path, title)
            FileControl.saveFile(new_path, f"{title}-fanart", "jpg", tool.getFanart())
            FileControl.saveFile(new_path, f"{title}-poster", "jpg", tool.getPoster())
            print(f"{new_path} over")
        else:
            print(f"{full_path}  未找到信息")

# print("开始整理文件信息")
# AvFileData().start()
