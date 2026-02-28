from Crypto.Cipher import AES
from base64 import b64encode, b64decode
from datetime import datetime, timedelta
import json
try:
    from proxytools import config
except Exception as e:
    import config

KEY = config.key


def encrypt_text(text):
    cipher = AES.new(KEY, AES.MODE_EAX)
    ciphertext, tag = cipher.encrypt_and_digest(text.encode('utf-8'))
    nonce = cipher.nonce
    return b64encode(nonce + tag + ciphertext).decode('utf-8')


def decrypt_text(encrypted_text):
    data = b64decode(encrypted_text.encode('utf-8'))
    nonce = data[:16]
    tag = data[16:32]
    ciphertext = data[32:]
    cipher = AES.new(KEY, AES.MODE_EAX, nonce)
    decrypted_text = cipher.decrypt_and_verify(ciphertext, tag)
    return decrypted_text.decode('utf-8')


def create_encrypted_time():
    # 获取当前时间并加密
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    encrypted_time = encrypt_text(current_time)
    return encrypted_time

def check_decrypted_time(encrypted_time: str):
    decrypted_time = decrypt_text(encrypted_time)

    # 将解密后的时间转换为 datetime 对象
    decrypted_datetime = datetime.strptime(decrypted_time, "%Y-%m-%d %H:%M:%S")

    # 判断时间是否超过24小时
    time_difference = datetime.now() - decrypted_datetime
    if time_difference > timedelta(hours=24):
        return False
    else:
        return True

def encode_data(data):
    """
    加密数据串
    Args:
        data:

    Returns:

    """
    text = encrypt_text(json.dumps(data))
    return text

def decode_data(text: str):
    """
    解密数据串
    Args:
        data:

    Returns:

    """
    text = decrypt_text(text)
    data = json.loads(text)
    return data



def pad(data):
    """
    对数据进行填充，使其长度为16字节的倍数
    :param data: 需要填充的数据
    :return: 填充后的数据
    """
    length = 16 - (len(data) % 16)
    return data + bytes([length]) * length

def unpad(data):
    """
    移除填充
    :param data: 填充后的数据
    :return: 原始数据
    """
    return data[:-data[-1]]

def encrypt_data(data):
    """
    加密二进制数据（使用ECB模式）
    :param data: 需要加密的二进制数据
    :return: 返回加密后的数据
    """
    data = pad(data)
    cipher = AES.new(KEY, AES.MODE_ECB)
    ciphertext = cipher.encrypt(data)
    return ciphertext

def decrypt_data(ciphertext):
    """
    解密二进制数据（使用ECB模式）
    :param ciphertext: 加密后的二进制数据
    :return: 返回解密后的原始数据
    """
    cipher = AES.new(KEY, AES.MODE_ECB)
    plaintext = cipher.decrypt(ciphertext)
    return unpad(plaintext)



if __name__ == '__main__':
    print(create_encrypted_time())



