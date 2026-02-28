from minio import Minio
from io import BytesIO
import io
from PIL import Image
from config.configParse import config
from util import picCheck
import os

class MinioClient:
    def __init__(self):
        endpoint = f'{config.read("setting", "db_host")}:{config.read("setting", "minio_port")}'
        access_key = config.read("setting", "minio_access_key")
        secret_key = config.read("setting", "minio_secret_key")
        self.client = Minio(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=False
        )

    def uploadImage(self, bucket_name, object_name, image_data, metadata=None):
        try:
            if isinstance(image_data, bytes):
                length = len(image_data.strip())
                data = BytesIO(image_data)
            elif isinstance(image_data, io.BytesIO):
                length = len(image_data.getbuffer())
                data = image_data
            else:
                with open(image_data, "rb") as f:
                    length = os.stat(image_data).st_size
                    data = io.BytesIO(f.read())
            if picCheck.is_valid_image(data) == False:
                print(f"{object_name}不是一张正确的图片")
                return False

            self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=data,
                length=length,
                metadata=metadata,
                content_type="image/jpeg"
            )
            # print(f"{object_name} uploaded successfully to {bucket_name}!")
            return True
        except Exception as e:
            print(f"Error uploading {object_name} to {bucket_name}: {e}")
            return False

    def getImage(self, bucket_name, object_name):
        try:
            data = self.client.get_object(bucket_name, object_name).read()
            if picCheck.is_valid_image(data):
                return data
            else:
                return None
        except Exception as e:
            # print(f"Error getting {object_name} from {bucket_name}: {e}")
            return None

    def existImage(self, bucket_name, object_name):
        try:
            self.client.stat_object(bucket_name, object_name)
            return True
        except Exception as e:
            # print(f"Error minio exist {e}")
            return False

    def removeImage(self, bucket_name, object_name):
        try:
            self.client.remove_object(bucket_name, object_name)
            return True
        except Exception as e:
            # print(f"Error minio exist {e}")
            return False

    def countFile(self, bucket_name, folder_name):
        try:
            # 列出指定前缀的对象
            objects = self.client.list_objects(bucket_name, prefix=folder_name, recursive=True)
            # 计算对象数量
            count = sum(1 for _ in objects)  # 使用生成器表达式计数
            return count
        except Exception as e:
            return 0