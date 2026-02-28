# 文件操作类
import os
from media import avNfo
import stat
import requests



def linkFile(file_path, link_path):
    # os.link(file_path, link_path)
    if not os.path.exists(link_path):
        print("%s >> %s" % (file_path, link_path))
        parent_path = os.path.dirname(link_path)
        if not os.path.exists(parent_path):
            print("创建目录%s" % parent_path)
            os.makedirs(parent_path)
            os.chmod(parent_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
        os.link(file_path, link_path)
        os.chmod(link_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
    else:
        pass

def linkSameFile(file_path, new_file_path):
    path = os.path.dirname(file_path)
    path_to = os.path.dirname(new_file_path)
    file_name, file_ext = os.path.splitext(os.path.basename(file_path))
    files = os.listdir(path)
    for f in files:
        f_name, f_ext = os.path.splitext(os.path.basename(f))
        if f_name.startswith(file_name) and file_ext != f_ext:
            old_path = replacePath(os.path.join(path, f))
            new_path = replacePath(os.path.join(path_to, f))

            if not os.path.exists(new_path):
                os.link(old_path, new_path)
                print(old_path)
                print(">>")
                print(new_path)
                print("")

def linkSameFile2(file_path, new_file_path):
    path = os.path.dirname(file_path)
    path_to = os.path.dirname(new_file_path)

    # file_name = os.path.basename(file_path).split('.')[0]
    # file_ext = os.path.basename(file_path).split('.')[1]
    file_name, file_ext = os.path.splitext(os.path.basename(file_path))
    file_name2, file_ext2 = os.path.splitext(os.path.basename(new_file_path))
    file_top = file_name2.replace(file_name, "")
    # print(file_top)

    files = os.listdir(path)
    for f in files:
        f_name, f_ext = os.path.splitext(os.path.basename(f))
        # f_name = os.path.basename(f).split('.')[0]
        # f_ext = os.path.basename(f).split('.')[1]
        if f_name.startswith(file_name) and file_ext != f_ext:
            old_path = os.path.join(path, f)
            new_path = os.path.join(path_to, file_top + f)
            linkFile(old_path, new_path)
            if ("-poster" in f_name):
                new_path2 = os.path.join(path_to, file_top + f.replace("-poster", "-thumb"))
                linkFile(old_path, new_path2)
                new_path2 = (os.path.dirname(path_to) + os.path.sep + "." + os.path.sep + "poster" + f_ext)
                linkFile(old_path, new_path2)
            if ("-fanart" in f_name):
                new_path2 = (os.path.dirname(path_to) + os.path.sep + "." + os.path.sep + "fanart" + f_ext)
                linkFile(old_path, new_path2)


def bulidTvNfo(file_path, row):
    """
    bulidNfo
    生成nfo文件
    :param file_path 目录路径
    :return:
    """
    parent_path = os.path.dirname(file_path)
    if not os.path.exists(parent_path):
        print("创建目录%s" % parent_path)
        os.makedirs(parent_path)
        os.chmod(parent_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
    nfo_str = tvNfo.nfo_bulid(row)
    nfo_path = file_path + '.nfo'
    with open(nfo_path, 'w', encoding='utf-8') as f1:
        f1.write(nfo_str)
    os.chmod(nfo_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)


def bulidAvNfo(file_path, row):
    """
    bulidAvNfo
    生成nfo文件
    :param file_path 目录路径
    :return:
    """
    parent_path = os.path.dirname(file_path)
    if not os.path.exists(parent_path):
        print("创建目录%s" % parent_path)
        os.makedirs(parent_path)
        os.chmod(parent_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
    nfo_str = avNfo.nfo_bulid(row)
    nfo_path = file_path + '.nfo'
    with open(nfo_path, 'w', encoding='utf-8') as f1:
        f1.write(nfo_str)
    os.chmod(nfo_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)


def bulidActorNfo(file_path, row):
    """
    bulidNfo
    生成演员信息
    :param file_path 目录路径
    :return:
    """
    parent_path = os.path.dirname(file_path)
    if not os.path.exists(parent_path):
        print("创建目录%s" % parent_path)
        os.makedirs(parent_path)
        os.chmod(parent_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
    nfo_str = tvNfo.actor_bulid(row)
    nfo_path = file_path + '.nfo'
    with open(nfo_path, 'w', encoding='utf-8') as f1:
        f1.write(nfo_str)
    os.chmod(nfo_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)


def downloadPic(url,zhengli_path,headers = ''):
    """
    downloadPic
    下载图片
    :param dirname 父目录路径
    :param file_name 文件名
    :return:
    """
    if os.path.exists(zhengli_path +'.jpg'):
        return
    parent_path = os.path.dirname(zhengli_path)
    if not os.path.exists(parent_path):
        print("创建目录%s" % parent_path)
        os.makedirs(parent_path)
        os.chmod(parent_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)
    if url != "" and url != None and "http" in url:
        if headers == '':
            headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36Name'}
        req=requests.get(url=url,headers=headers)
        if req.status_code==200:
            pic_path = zhengli_path +'.jpg'
            with open(pic_path,'wb') as f:
                f.write(req.content)
            os.chmod(pic_path, stat.S_IRWXU | stat.S_IRWXG | stat.S_IRWXO)


def replacePath(path):
    return path.replace("\\", "/")
