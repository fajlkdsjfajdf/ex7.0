import requests
import time
import hashlib
import os
import threading
from pathlib import Path
from config.configParse import config
from util import system
from logger.logger import logger

downloading_files = []
class BigFileCache:
    def __init__(self, url, filename, path):
        self.url = url
        self.filename = filename
        self.path = path
        self.total_size = 0
        self.retry_count = 5
        self.md5 = hashlib.md5(self.url.encode()).hexdigest()
        self.cache_dir = f"{system.getMainDir()}/{config.read('setting', 'down_cache_file')}"
        self.cache_file_path = f"{self.cache_dir}/{self.md5}"
        self.final_dir = f"{system.getMainDir()}/{self.path}"
        self.final_file_path = f"{self.final_dir}/{self.filename}"
        Path(self.cache_dir).mkdir(parents=True, exist_ok=True)
        Path(self.final_dir).mkdir(parents=True, exist_ok=True)

    def download(self):
        retry_num = 0
        while retry_num <= self.retry_count:
            try:
                headers = {}
                if os.path.exists(self.cache_file_path):
                    headers['Range'] = f'bytes={os.path.getsize(self.cache_file_path)}-'

                response = requests.get(self.url, stream=True)
                self.total_size = int(response.headers.get('content-length', 0))
                downloaded_size = 0

                with open(self.cache_file_path, 'wb') as file:
                    i = 0;
                    for data in response.iter_content(chunk_size=1024):
                        downloaded_size += len(data)
                        file.write(data)
                        i += 1
                        if i % 10000 == 0:
                            self.print_progress(downloaded_size)
                os.rename(self.cache_file_path, self.final_file_path)
                print(f"Download completed and moved to the target directory. {self.final_file_path}")
                downloading_files.remove(self.md5)
                return
            except Exception as e:
                print(f"Download failed: {e} {retry_num} / {self.retry_count}")
                retry_num += 1
                time.sleep(5)
                downloading_files.remove(self.md5)


    def print_progress(self, downloaded_size):
        percent_complete = (downloaded_size / self.total_size) * 100
        print(f"Download progress: {percent_complete:.2f}%")

    def start_download(self):
        if os.path.exists(self.final_file_path):
            msg = f"文件已经下载完成,请勿重复下载 {self.final_file_path}"
            logger.warning(msg)
            return {"msg": msg, "status": "error"}, "json"

        if os.path.exists(self.cache_file_path):
            if self.md5 in downloading_files:
                print("File is already being downloaded or partially downloaded.")
                msg = f"文件正在下载中,如有必要清空缓存目录 {self.cache_file_path}"
                logger.warning(msg)
                return {"msg": msg, "status": "error"}, "json"
            else:
                # 缓存文件存在, 但是记录不存在, 是异常退出了, 重上次的断点继续就行
                pass

        download_thread = threading.Thread(target=self.download)
        download_thread.start()
        msg = f"{self.filename} 开始下载"
        downloading_files.append(self.md5)
        logger.info(msg)
        return {"msg": msg, "status": "success"}, "json"







if __name__ == '__main__':
    # Example usage:
    url = "https://eu48.a1e6a123561e5555ac4610a91560c3b5.r2.cloudflarestorage.com/260000/260563/260563_720p.mp4?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=2a2a645851f2acf122c8bd4809ee7f5d%2F20241125%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20241125T075134Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Signature=31b55921b8f9c24291c3e4f570e96af2c4a3462d42933457c8393d514b3da5cf"
    filename = "vrtm-159"
    path = "D://"
    downloader = BigFileCache(url, filename, path)
    downloader.start_download()
