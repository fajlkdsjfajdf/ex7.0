
# -*- coding: utf-8 -*-
# # # _____  __    __       _   _   _____   __   _        _____       ___   _
# # # | ____| \ \  / /      | | | | | ____| |  \ | |      |_   _|     /   | | |
# # # | |__    \ \/ /       | |_| | | |__   |   \| |        | |      / /| | | |
# # # |  __|    }  {        |  _  | |  __|  | |\   |        | |     / - - | | |
# # # | |___   / /\ \       | | | | | |___  | | \  |        | |    / -  - | | |
# # # |_____| /_/  \_\      |_| |_| |_____| |_|  \_|        |_|   /_/   |_| |_|

"""
-------------------------------------------------
   File Name：
   Description :   cm18的图片解密模块
   Author :        awei
   date：          2021/10/24
-------------------------------------------------
   Change Activity:
                   2021/10/24:
-------------------------------------------------
"""
import copy
import hashlib
from PIL import Image
from util import picCheck
import io

class CmDecode:
    def __init__(self):
        pass
    def getMd5(self, text):
        md5 = hashlib.md5()
        text = str(text)
        md5.update(text.encode("utf-8"))
        return md5.hexdigest()


    def getNum(self, pid, id):
        a = 10
        if pid >= 268850 and pid <= 421925:
            n = str(pid) + ('%05d' % id)
            n = self.getMd5(n)
            n = ord(n[-1])
            n %= 10
            a = (n + 1) * 2
        elif pid > 421925:
            n = str(pid) + ('%05d' % id)
            n = self.getMd5(n)
            n = ord(n[-1])
            n %= 8
            a = (n + 1) * 2
        return a


    def imageChange(self, im, pid, id):
        """
            所截区域图片保存
           :param im: PIL image对象
           :param pid: 图片集id
           :param id：图片id
           """
        img_data = copy.deepcopy(im)
        if isinstance(im, bytes):  # 检查 image_data 是bytes类型
            # 尝试打开并解码图像
            with io.BytesIO(im) as f:
                im = Image.open(f)
        elif isinstance(im, io.BytesIO):  # 检查 image_data 是 io.BytesIO 类型
            im = Image.open(im)
        if pid >= 220971:
            width = im.size[0]
            height = im.size[1]
            cut_count = self.getNum(pid, id)
            cut_height = int(height / cut_count)
            cut_lost_height = height % cut_count
            im_new = Image.new("RGB", (width, height), "black")
            for m in range(0, cut_count + 1):
                # 将图片切片，并且倒过来装
                if m == 0 :
                    cut_to_heigth = height
                else:
                    cut_to_heigth = (cut_count - m + 1) * cut_height
                old_box = (0, (cut_count - m) * cut_height, width, cut_to_heigth)

                img_cut = im.crop(old_box)
                if m == 0:
                    if cut_lost_height !=0:
                        im_new.paste(img_cut, (0, cut_height))
                elif m == 1:
                    im_new.paste(img_cut, (0, 0))
                else:
                    im_new.paste(img_cut, (0, (m - 1) * cut_height + cut_lost_height))
            # im_new.show()
            img_io = io.BytesIO()
            im_new.save(img_io, format='JPEG')
            im_new.close()
            img_io.seek(0)
            return img_io
        else:
            return img_data




if __name__ == '__main__':
    img = Image.open("G:\\源码\\e绅士-4.0\\test\\00002.jpg")  # 返回一个Image对象
    imageChange(img,  340947, 2).show()
    # img = Image.open("G:\\源码\\e绅士-4.0\\test\\2.jpg")  # 返回一个Image对象
    # imageChange(img, 373682, 2).show()
    # print(getNum(364091, 7))




