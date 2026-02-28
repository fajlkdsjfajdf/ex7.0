from db.mongodb import MongoDB
from db.minio import MinioClient
from utils.safe_image_store import SafeImageStore
from config.configParse import config
from util import system

store_path = f'{system.getMainDir()}/{config.read("setting", "img_file")}'

store = SafeImageStore(store_path)  # 初始化存储

db = MongoDB()
minio = MinioClient()
data = db.getItems("jb-main", {}, limit=999999999)


for i in data:
    id = i["aid"]
    bucket = "jbthumb"
    file_name = f"{id//1000}/{id}.jpg"
    if minio.existImage(bucket, file_name):
        print(file_name)
        print(id)

        img = minio.getImage(bucket, file_name)
        store.store_image(img, id, bucket)
        # break

    # break
