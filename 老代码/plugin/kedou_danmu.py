# 从https://www.kedou.life/ 提取弹幕
import requests
from util import typeChange
import xml.etree.ElementTree as ET
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import Crypto
import base64
import json
from base64 import b64decode, b64encode
import unicodedata
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
from Crypto.Cipher import PKCS1_v1_5
import re


class RSAKey:
    def __init__(self, key):
        self.key = RSA.import_key(key)
        self.cipher = PKCS1_v1_5.new(self.key)
        self.n = self.key.size_in_bits() // 8

    def hex2b64(self, bytes_data):

        # 使用base64库进行编码
        base64_encoded = base64.b64encode(bytes_data)
        # 将结果转换为字符串并返回
        return base64_encoded.decode('utf-8')
    def encrypt(self, text):
        return self.cipher.encrypt(text.encode('utf-8'))



    def encryptLong(self, text):
        try:
            maxLength = (self.n - 11)
            if len(text) > maxLength:
                ct_1 = b""
                lt = re.findall(r'.{1,117}', text)
                for t in lt:
                    print(t)
                    ct_1 += self.encrypt(t)
                    print(ct_1)
                return self.hex2b64(ct_1)
            else:
                t = self.encrypt(text)
                return self.hex2b64(t)
        except Exception as ex:
            print(f"Encryption error: {ex}")
            return False


class KedouDanmu:
    def __init__(self):
        self.host = "https://www.kedou.life"
        self.api_url = f"{self.host}/api/video/danmakuExtract"
        self.key = "kedou@8989!63239"
        self.iv = "a2Vkb3VAODk4OSE2MzIzMw=="
        self.public_key = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkJZWIUIje8VjJ3okESY8stCs/a95hTUqK3fD/AST0F8mf7rTLoHCaW+AjmrqVR9NM/tvQNni67b5tGC5z3PD6oROJJ24QfcAW9urz8WjtrS/pTAfGeP/2AMCZfCu9eECidy16U2oQzBl9Q0SPoz0paJ9AfgcrHa0Zm3RVPL7JvOUzscL4AnirYImPsdaHZ52hAwz5y9bYoiWzUkuG7LvnAxO6JHQ71B3VTzM3ZmstS7wBsQ4lIbD318b49x+baaXVmC3yPW/E4Ol+OBZIBMWhzl7FgwIpgbGmsJSsqrOq3D8IgjS12K5CgkOT7EB/sil7lscgc22E5DckRpMYRG8dwIDAQAB
-----END PUBLIC KEY-----"""


    def aes(self, a, e, t):
        # 输入数据
        x1 = a
        x2 = e
        x3 = t
        # 解析密钥和IV
        key = x2.encode('utf-8')
        iv = b64decode(x3)
        # print("Key:", key)
        # print("IV:", iv)
        # 创建AES加密器
        cipher = AES.new(key, AES.MODE_CBC, iv)
        # 对数据进行填充并加密
        encrypted_data = cipher.encrypt(pad(x1.encode('utf-8'), AES.block_size))
        # 将加密后的数据转换为Base64编码的字符串
        encrypted_data_base64 = b64encode(encrypted_data).decode('utf-8')
        # print("Encrypted Data:", encrypted_data_base64)
        return encrypted_data_base64

    def decode_danmu_xml(self, xml_str):
        try:
            root = ET.fromstring(xml_str)
            return root
        except Exception as e:
            valid_utf8_pattern = re.compile(r'[\x09\x0A\x0D\x20-\x7E\x80-\xFF]*')
            xml_str = ''.join(c for c in xml_str if unicodedata.category(c)[0] != 'C')
            root = ET.fromstring(xml_str)
            return root

    def getdanmu(self, url):
        try:
            # 请求参数
            payload = {
                "url": url
            }
            payload = json.dumps(payload)
            payload = self.aes(payload, self.key, self.iv)
            # payload = "wH8KKAgaq0LVgw7WMcFrKp9Wq9DB42dXKSyZCGBzMWIhPfbfWJEd4TdaTzN17NM30cNEUjxFkFpUkeCr2m1TqxV0Qy7+it6UYtgy71Ok0oqTQStKBGCshPMuN65vItk5ABbmPLld/WkaJ2YbU1rd9bwV9nXyQ67E+UWi7WdjxHFVN0V9nhQGlK4ujNFH7g6l2QUh555LTxIkJ7DL50b+F+VHcaGUMZlHzBiWOeTUVO7N1eEyOI48FcI+1C9UeKq0v8hftKF377tdhxBV8k88JWpvX2l9gY1FhGniB5zmf+8="
            rsa_key = RSAKey(self.public_key)
            payload = rsa_key.encryptLong(payload)

            # payload = """SXt50ingOzghW+bQu7FJxv5buWXwdd/U+3XgNqKSKvfkvJQY5apyjDDNnlQn4P81KYajk8k5aKYMY/C7EqGLrWWgbfaNavFPnphyYka8JiDVKZ/IjPbweWpQDMJluyfrEh4YI7DIUThraU4WZsJW/I+Cqr4kE0BnLMSkejoMA7matk9zunJenmP5s5hINxviTIdOhVXOyv2DuoURlc5NH9Ke6Ao/0gW+sq6w5UseantNJcRR+iW1ySWAUYq/uBwiYxn5wye4JCIwJRiBx6QkLsORhMtqJWxM0hlNsXPBmCleU9jMJri34rydp4Rb08/gqk0vfuqoYocV+W/McyW9Yxd1FgHh8JQjre/7ROars5BXOoLBZCDQgV4wPAs3RNxBiAGamUVwvJ5LpH5UPlK5X/zTce0ZkfhxloR6Ze3DT3UIz04ZxBTyzcgxUJVsg82qZOFGInwkLsv1hiWMHTzCmbZ0JXkd8oZ1SvAGxiZXzLRXcTAckQbD5mlxzTpgHjaRF5QKNQKPiThGyCGYlQ4M2HQFKolxoIxOWCBbszA0CJdYFvWKkJcqdcHI/FWDlw8C8MtLvzyY513/UGsbDtVos8CcDRhwlIx881YF94JkY6MVTeZ2yMu1K1QZJPantFP/ZfEh6VB/mu4R2AKBGdcIF2HiJWZ2+FzJ/DCc89jKHSaHt9qsRX/h+AGYR080o7J2TXd6ocwkR1VZo8GxgDemZfY5M2uMpOM6Ll9zY/6EcmClwxb4mrUV7FVyM7cO5HIGZ/yQfHg65ypu3b1g5bLWus/05iYq54BwWVdxHc4T6gjrd7/Wq280M2iFaXupoEtrG+pdEwYdEL69oJJ24s8IVFnkV4LEeNaHNjuSlylZpjAN1nrumS3T7evmzugRzYFo1pfPmebyLcRL9vndP2tGfuurGq7eBiQx3uDDL/q82BXoKisjfwsPaAXWrQWEn6pd7Rf+3AHd24+43qOw1a92MiAQyP37RppjDD6slEVruSen+iJKpbU5MW9YnbvIbV+P"""
            # 发送POST请求
            response = requests.post(self.api_url, json=payload, timeout=60)
            # 打印响应内容
            if response.status_code == 200 and response.json()["code"] == 200:

                data = response.json()
                xml_str = data["data"]["content"]

                # 解析XML字符串
                root = self.decode_danmu_xml(xml_str)
                # 遍历所有的<d>标签
                record = []
                for d in root.findall('d'):
                    p_value = d.get('p')
                    content = d.text
                    p = p_value.split(",")
                    danmu ={
                        'cid': 0,
                        'p': f"{float(p[0]):.2f},1,{p[3]},[kedou]0",
                        'm': content
                    }
                    record.append(danmu)
                print(f"获取弹幕 {len(record)} 条")
                return record
            else:
                print(response.text)

        except Exception as e:
            print(e)
        return []



if __name__ == '__main__':
    url = "https://v.youku.com/v_show/id_XNDQ1Nzg4NDY3Mg==.html"
    k = KedouDanmu()
    k.getdanmu(url)