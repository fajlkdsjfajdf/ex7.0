

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

# Example usage:
public_key = """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkJZWIUIje8VjJ3okESY8stCs/a95hTUqK3fD/AST0F8mf7rTLoHCaW+AjmrqVR9NM/tvQNni67b5tGC5z3PD6oROJJ24QfcAW9urz8WjtrS/pTAfGeP/2AMCZfCu9eECidy16U2oQzBl9Q0SPoz0paJ9AfgcrHa0Zm3RVPL7JvOUzscL4AnirYImPsdaHZ52hAwz5y9bYoiWzUkuG7LvnAxO6JHQ71B3VTzM3ZmstS7wBsQ4lIbD318b49x+baaXVmC3yPW/E4Ol+OBZIBMWhzl7FgwIpgbGmsJSsqrOq3D8IgjS12K5CgkOT7EB/sil7lscgc22E5DckRpMYRG8dwIDAQAB
-----END PUBLIC KEY-----"""
rsa_key = RSAKey(public_key)
long_text = "wH8KKAgaq0LVgw7WMcFrKp9Wq9DB42dXKSyZCGBzMWIhPfbfWJEd4TdaTzN17NM30cNEUjxFkFpUkeCr2m1TqxV0Qy7+it6UYtgy71Ok0oqTQStKBGCshPMuN65vItk5ABbmPLld/WkaJ2YbU1rd9bwV9nXyQ67E+UWi7WdjxHFVN0V9nhQGlK4ujNFH7g6l2QUh555LTxIkJ7DL50b+F+VHcaGUMZlHzBiWOeTUVO7N1eEyOI48FcI+1C9UeKq0v8hftKF377tdhxBV8k88JWpvX2l9gY1FhGniB5zmf+8="
encrypted_text = rsa_key.encryptLong(long_text)
print("Encrypted Text:", encrypted_text)
