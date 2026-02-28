from PIL import Image
import io
import copy

def is_valid_image(image_data):
    """
    判断给定的图片数据是否是一张有效的图片。
    Args:
        image_data: 图片数据（bytes）。

    Returns:
        如果图片是有效的，则返回True，否则返回False。
    """
    image_data = copy.deepcopy(image_data)
    try:
        if isinstance(image_data, bytes):  # 检查 image_data 是bytes类型
            # 尝试打开并解码图像
            with io.BytesIO(image_data) as f:
                image = Image.open(f)
                image.verify()
        elif isinstance(image_data, io.BytesIO):  # 检查 image_data 是 io.BytesIO 类型
            image = Image.open(image_data)
            image.verify()
        else:
            print(f"img类型不正确{type(image_data)}")
            return False
        # 检查图像的格式是否受支持
        if image.format not in ["JPEG", "PNG", "WEBP", "GIF"]:
            return False

        # 检查图像的大小是否有效
        if image.size[0] == 0 or image.size[1] == 0:
            return False

        # 检查图像的像素数据是否有效
        # pixels = image.load()
        # for x in range(image.size[0]):
        #     for y in range(image.size[1]):
        #         pixel = pixels[x, y]
        #         if isinstance(pixel, int):
        #             continue
        #         if len(pixel) != 3:
        #             return False
        #         if not all(isinstance(channel, int) and 0 <= channel <= 255 for channel in pixel):
        #             return False
        return True
    except Exception as e:
        # 解码、验证、或其他异常情况
        print(f"Error verifying image: {e}")
        return False

def get_image_size(image_data):
    """
        判断给定的图片数据是否是一张有效的图片。
        Args:
            image_data: 图片数据（bytes）。

        Returns:
            如果图片是有效的，则返回True，否则返回False。
        """
    image_data = copy.deepcopy(image_data)
    try:
        if isinstance(image_data, bytes):  # 检查 image_data 是bytes类型
            # 尝试打开并解码图像
            with io.BytesIO(image_data) as f:
                image = Image.open(f)
                image.verify()
        elif isinstance(image_data, io.BytesIO):  # 检查 image_data 是 io.BytesIO 类型
            image = Image.open(image_data)
            image.verify()
        else:
            print(f"img类型不正确{type(image_data)}")
            return False
        return image.size

    except Exception as e:
        # 解码、验证、或其他异常情况
        print(f"Error verifying image: {e}")
        return False
    

def compress_image(image_data):
    """
    压缩给定的二进制图片数据到宽度为500的JPEG图像。
    
    Args:
        image_data: 二进制图片数据（bytes）。
        
    Returns:
        压缩后的图像数据（bytes）。
    """
    try:
        img_byte_arr = None
        # 尝试打开并解码图像
        with io.BytesIO(image_data) as f:
            img = Image.open(f)
            # img.verify()

            if img.mode == 'P':
                # Convert the image to 'RGB' mode
                img = img.convert('RGB')
            # Check if the image is in 'RGBA' mode
            elif img.mode == 'RGBA':
                # Convert the image to 'RGB' mode
                img = img.convert('RGB')

            
            # 获取原始尺寸
            original_width, original_height = img.size
            
            # 计算新的高度，保持宽高比
            new_width = 500
            new_height = int((new_width / original_width) * original_height)
            
            # 调整图像大小
            resized_img = img.resize((new_width, new_height), Image.ANTIALIAS)

            # 将图像保存到字节流中
            img_byte_arr = io.BytesIO()
            resized_img.save(img_byte_arr, format='JPEG')
        if img_byte_arr:
            return img_byte_arr.getvalue()
        else:
            return None
    
    except Exception as e:
        print(f"Error compressing image: {e}")
        return None