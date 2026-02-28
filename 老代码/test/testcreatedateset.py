# 生成e绅士的cg训练数据集
from config.configParse import config
from db.mongodb import MongoDB
from db.minio import MinioClient
import os

db = MongoDB()
minio = MinioClient()

link = db.getItems("ex-mosaiclink", {}, limit=999999)

bucket = "eximage"

def save_img(title, img):
    path = os.path.abspath(f"D:/源码/马赛克数据集/{title}")
    if os.path.exists(path):
        return

    # 以二进制模式打开文件
    with open(path, 'wb') as file:
        # 将二进制数据写入文件
        file.write(img)

for item in link:
    gid1 = item["item_unmosaic_gid"]
    gid2 = item["item_mosaic_gid"]
    if "link_data" in item:
        for d in item["link_data"]:
            page1 = d[0]
            page2 = d[1]

            img_path1 = f"{gid1 // 1000}/{gid1}/{page1:04d}.jpg"
            img_path2 = f"{gid2 // 1000}/{gid2}/{page2:04d}.jpg"
            if minio.existImage(bucket, img_path1) and minio.existImage(bucket, img_path2):
                print(f"{page1} - {page2}")
                img1 = minio.getImage(bucket, img_path1)
                img2 = minio.getImage(bucket, img_path2)
                img1_name = f"{gid1}-{page1:04d}~{page2:04d}-a.jpg"
                img2_name = f"{gid1}-{page1:04d}~{page2:04d}-b.jpg"
                save_img(img1_name, img1)
                save_img(img2_name, img2)



