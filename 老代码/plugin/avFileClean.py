# 这是一个清理 普通av  文件夹的工具

# 清理规则，  判断该av在破解av中是否存在， 存在就删除所有相关项目


import os
import platform
import shutil

def find_videos(path):
    video_extensions = ['.mp4', '.avi', '.mkv', '.flv', '.mov', '.wmv']
    video_files = []
    def search_files(current_path):
        for entry in os.scandir(current_path):
            if entry.is_file() and any(entry.name.endswith(ext) for ext in video_extensions):
                video_files.append(entry.path)
            elif entry.is_dir():
                search_files(entry.path)

    search_files(path)
    return video_files


def check_pojie(file_path):
    # 获取文件的上级文件夹路径
    parent_dir = os.path.dirname(file_path)
    # 将路径中的 "普通" 替换为 "破解"
    new_path = parent_dir.replace("普通", "破解")
    # 判断新路径是否存在
    if not os.path.exists(new_path):
        return False
    # 判断新路径下是否有视频文件
    video_extensions = ['.mp4', '.avi', '.mkv', '.flv', '.mov', '.wmv']
    for root, dirs, files in os.walk(new_path):
        for file in files:
            if any(file.endswith(ext) for ext in video_extensions):
                return True

    return False





def delete_folder(file_path):
    # 获取文件的上级路径
    parent_dir = os.path.dirname(file_path)

    # 删除文件夹
    print(f"删除文件夹: {parent_dir}")
    shutil.rmtree(parent_dir)

def get_hardlink_paths(file_path):
    hardlink_paths = []
    for root, dirs, files in os.walk('/'):
        for file in files:
            if os.path.samefile(os.path.join(root, file), file_path):
                hardlink_paths.append(os.path.join(root, file))
    return hardlink_paths

def get_os_type():
    os_type = platform.system()
    if os_type == "Windows":
        return "Windows"
    elif os_type == "Linux":
        return "Linux"
    else:
        return "Unknown"



if __name__ == '__main__':
    path1 = "/手动整理/普通AV"
    path2 = "/手动整理/破解AV"
    if get_os_type() == "Windows":
        path1 = "Z:" + path1
        path2 = "Z:" + path2
    else:
        path1 = "/mnt/maindir" + path1
        path2 = "/mnt/maindir" + path2

    pt_av = find_videos(path1)
    for f in pt_av:
        pojie_exists = check_pojie(f)
        if pojie_exists:
            delete_folder(f)

