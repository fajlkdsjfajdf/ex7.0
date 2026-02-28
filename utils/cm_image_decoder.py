"""
CM站点图片解密工具类
处理CM站点图片的分块乱序解密
"""

import hashlib
import io
import copy
from PIL import Image
from utils.logger import get_logger

logger = get_logger(__name__)


class CMImageDecoder:
    """CM站点图片解密工具"""

    @staticmethod
    def get_md5(text: str) -> str:
        """
        计算MD5哈希值

        Args:
            text: 待哈希的字符串

        Returns:
            MD5哈希值（十六进制）
        """
        md5 = hashlib.md5()
        md5.update(str(text).encode('utf-8'))
        return md5.hexdigest()

    @classmethod
    def get_cut_count(cls, pid: int, image_id: int) -> int:
        """
        根据漫画ID和图片ID计算切分数量

        Args:
            pid: 漫画ID
            image_id: 图片序号

        Returns:
            切分数量
        """
        # 默认切分10块
        cut_count = 10

        if 268850 <= pid <= 421925:
            # 计算方式1
            n = f"{pid}{image_id:05d}"
            n = cls.get_md5(n)
            n = ord(n[-1])
            n %= 10
            cut_count = (n + 1) * 2
        elif pid > 421925:
            # 计算方式2
            n = f"{pid}{image_id:05d}"
            n = cls.get_md5(n)
            n = ord(n[-1])
            n %= 8
            cut_count = (n + 1) * 2

        return cut_count

    @classmethod
    def decode_image(cls, image_data, pid: int, image_id: int):
        """
        解码CM图片（切分乱序还原）

        Args:
            image_data: 图片数据（bytes、PIL.Image对象或io.BytesIO）
            pid: 漫画ID
            image_id: 图片序号

        Returns:
            io.BytesIO: 解码后的图片数据流
        """
        try:
            # 打开图片
            if isinstance(image_data, bytes):
                img = Image.open(io.BytesIO(image_data))
            elif isinstance(image_data, io.BytesIO):
                img = Image.open(image_data)
            elif isinstance(image_data, Image.Image):
                img = image_data
            else:
                raise ValueError(f"不支持的图片数据类型: {type(image_data)}")

            # 只有当pid >= 220971时才需要解密
            if pid < 220971:
                logger.debug(f"漫画 {pid} 的图片不需要解密")
                if isinstance(image_data, (bytes, io.BytesIO)):
                    return io.BytesIO(image_data) if isinstance(image_data, bytes) else image_data
                else:
                    output = io.BytesIO()
                    img.save(output, format='JPEG')
                    output.seek(0)
                    return output

            # 获取图片尺寸
            width, height = img.size

            # 计算切分数量
            cut_count = cls.get_cut_count(pid, image_id)
            cut_height = height // cut_count
            cut_lost_height = height % cut_count

            logger.debug(f"解密图片: pid={pid}, image_id={image_id}, cut_count={cut_count}")

            # 创建新图片
            img_new = Image.new("RGB", (width, height), "black")

            # 切分并倒序重组
            for m in range(cut_count + 1):
                # 计算切分的起始和结束位置
                if m == 0:
                    # 第一块（可能有残留高度）
                    cut_to_height = height
                else:
                    cut_to_height = (cut_count - m + 1) * cut_height

                old_box = (0, (cut_count - m) * cut_height, width, cut_to_height)
                img_cut = img.crop(old_box)

                # 粘贴到新位置
                if m == 0:
                    # 第一块贴到cut_height位置（上方留出cut_lost_height空间）
                    if cut_lost_height != 0:
                        img_new.paste(img_cut, (0, cut_height))
                elif m == 1:
                    # 第二块贴到顶部
                    img_new.paste(img_cut, (0, 0))
                else:
                    # 其他块贴到对应位置
                    new_y = (m - 1) * cut_height + cut_lost_height
                    img_new.paste(img_cut, (0, new_y))

            # 转换为BytesIO
            output = io.BytesIO()
            img_new.save(output, format='JPEG')
            img_new.close()
            output.seek(0)

            return output

        except Exception as e:
            logger.error(f"解码图片失败: pid={pid}, image_id={image_id}, error={e}")
            # 解码失败时返回原图
            if isinstance(image_data, (bytes, io.BytesIO)):
                return io.BytesIO(image_data) if isinstance(image_data, bytes) else image_data
            else:
                output = io.BytesIO()
                image_data.save(output, format='JPEG')
                output.seek(0)
                return output

    @classmethod
    def decode_and_save(cls, image_data, pid: int, image_id: int, save_path: str) -> bool:
        """
        解码图片并保存到文件

        Args:
            image_data: 图片数据
            pid: 漫画ID
            image_id: 图片序号
            save_path: 保存路径

        Returns:
            bool: 是否成功
        """
        try:
            # 解码图片
            decoded_image = cls.decode_image(image_data, pid, image_id)

            # 保存到文件
            with open(save_path, 'wb') as f:
                f.write(decoded_image.read())

            logger.debug(f"图片已保存: {save_path}")
            return True

        except Exception as e:
            logger.error(f"保存图片失败: {save_path}, error={e}")
            return False


if __name__ == '__main__':
    # 测试代码
    print("=== CM图片解密工具测试 ===")

    # 测试切分数量计算
    test_cases = [
        (200000, 1),  # 不需要解密
        (268850, 1),  # 第一种解密方式
        (300000, 5),  # 第一种解密方式
        (421925, 10), # 第一种解密方式边界
        (421926, 1),  # 第二种解密方式
        (500000, 20), # 第二种解密方式
    ]

    for pid, image_id in test_cases:
        cut_count = CMImageDecoder.get_cut_count(pid, image_id)
        print(f"pid={pid}, image_id={image_id}: cut_count={cut_count}")

    # 如果需要测试实际的图片解密，可以取消下面的注释
    # test_image_path = "path/to/test/image.jpg"
    # output_path = "path/to/output/image.jpg"
    # with open(test_image_path, 'rb') as f:
    #     image_data = f.read()
    # CMImageDecoder.decode_and_save(image_data, 300000, 1, output_path)
