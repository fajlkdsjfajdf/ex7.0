import base64
import json
import requests
from config.configParse import config
#开发代码
import transmissionrpc
#有帐号密码的使用：
tc = transmissionrpc.Client(address=config.read("setting", "db_host"), port=9091, user='ainizai0904', password='yuwenwei1994')
# 添加下载任务
url = 'http://www.baidu.com'

# 设置下载路径和文件名
download_dir = '/downloads/下载中/'
filename = '1.html'
torrent = tc.add_torrent(url, download_dir=download_dir, filename=filename)



#
# class TransmissionRPC:
#     def __init__(self, rpc_url, username, password):
#         self.rpc_url = config.read("setting", "rpc_url")
#         self.username = config.read("setting", "rpc_username")
#         self.password = config.read("setting", "rpc_password")
#         self.session_id = None
#         self._authenticate()
#
#     def _authenticate(self):
#         credentials = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
#         headers = {
#             'Authorization': f'Basic {credentials}',
#             'Content-Type': 'application/json'
#         }
#         data = {
#             'method': 'session-get',
#             'arguments': {}
#         }
#         response = requests.post(self.rpc_url, headers=headers, data=json.dumps(data))
#         if response.status_code == 200:
#             result = response.json()
#             if result['result'] == 'success':
#                 self.session_id = result['arguments']['session-id']
#             else:
#                 raise Exception("Authentication failed")
#         else:
#             raise Exception(f"Failed to authenticate: {response.status_code}")
#
#     def add_torrent(self, download_url, download_dir, file_name):
#         if not self.session_id:
#             raise Exception("Not authenticated")
#
#         credentials = base64.b64encode(f"{self.username}:{self.password}".encode()).decode()
#         headers = {
#             'Authorization': f'Basic {credentials}',
#             'Content-Type': 'application/json',
#             'X-Transmission-Session-Id': self.session_id
#         }
#         data = {
#             'method': 'torrent-add',
#             'arguments': {
#                 'filename': download_url,
#                 'download-dir': download_dir,
#                 'rename': file_name
#             }
#         }
#         response = requests.post(self.rpc_url, headers=headers, data=json.dumps(data))
#         if response.status_code == 200:
#             result = response.json()
#             if result['result'] == 'success':
#                 print('Torrent added successfully:', result)
#             else:
#                 print('Error adding torrent:', result)
#         else:
#             print('Error:', response.status_code)
#
# # 使用示例
# transmission = TransmissionRPC('http://localhost:9091/transmission/rpc', 'your_username', 'your_password')
# transmission.add_torrent('http://example.com/path/to/torrent/file.torrent', '/path/to/download/directory', 'desired_filename.torrent')
