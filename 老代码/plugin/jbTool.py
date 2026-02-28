from PIL import Image
from io import BytesIO
class JbTool:
    def __init__(self):
        pass


    @staticmethod
    def checkIsLoadPic(data):
        # 将二进制数据转换为图像对象
        image = Image.open(BytesIO(data))
        if image.height == 800 and image.width == 590:
            return True
        else:
            return False