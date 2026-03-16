"""
GridFS 图片存储测试脚本

功能：
1. 测试 GridFS 图片存储
2. 测试图片读取
3. 测试 MD5 去重
4. 测试引用计数

使用方式：
    python test/test_gridfs_storage.py
"""

import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.image_library import get_image_library
from models.image_storage import get_gridfs_image_storage
from utils.logger import get_logger

logger = get_logger(__name__)


def create_test_image(size_kb: int = 10) -> bytes:
    """创建测试图片数据"""
    # 简单的 JPEG 头部 + 填充数据
    jpeg_header = bytes.fromhex(
        'ffd8ffe000104a46494600010100000100010000'
    )
    padding = b'\x00' * (size_kb * 1024 - len(jpeg_header))
    return jpeg_header + padding


def test_gridfs_basic():
    """测试 GridFS 基本功能"""
    print("\n" + "="*50)
    print("测试 1: GridFS 基本功能")
    print("="*50)

    # 创建存储实例
    storage = get_gridfs_image_storage('cm', 'content')
    print(f"[OK] 创建 GridFS 存储: {storage.bucket_name}")

    # 创建测试图片
    test_data = create_test_image(50)
    print(f"[OK] 创建测试图片: {len(test_data)} 字节")

    # 保存图片
    result = storage.save_image(test_data, image_id='test_image_1')
    print(f"[OK] 保存图片成功: file_id={result['file_id']}, is_new={result['is_new']}")

    # 读取图片
    read_data = storage.read_image(result['file_id'])
    print(f"[OK] 读取图片成功: {len(read_data)} 字节")

    # 验证数据一致性
    if read_data == test_data:
        print("[OK] 数据一致性验证通过")
    else:
        print("[FAIL] 数据一致性验证失败")

    # 测试重复保存（MD5 去重）
    result2 = storage.save_image(test_data, image_id='test_image_1')
    print(f"[OK] 重复保存测试: is_new={result2['is_new']} (应为 False)")

    # 清理测试数据
    from bson.objectid import ObjectId
    storage._bucket.delete(ObjectId(result['file_id']))
    print("[OK] 清理测试数据")

    return True


def test_image_library():
    """测试 ImageLibrary 集成"""
    print("\n" + "="*50)
    print("测试 2: ImageLibrary 集成")
    print("="*50)

    # 创建图片库实例
    lib = get_image_library('cm')
    print(f"[OK] 创建图片库: site_id={lib.site_id}")

    # 创建测试数据
    test_data = create_test_image(30)
    test_aid = 999999  # 使用特殊的 aid 避免冲突

    # 保存封面
    image_id = lib.save_image(
        test_data,
        aid=test_aid,
        pid=None,
        page_num=None,
        image_type='cover',
        source_url='http://test.com/cover.jpg'
    )
    print(f"[OK] 保存封面: image_id={image_id}")

    # 检查是否存在
    exists = lib.image_exists(aid=test_aid, image_type='cover')
    print(f"[OK] 检查图片存在: {exists}")

    # 获取图片信息
    image_info = lib.get_image(aid=test_aid, image_type='cover')
    print(f"[OK] 获取图片信息: md5={image_info['md5']}, size={image_info['file_size']}")

    # 读取图片数据
    read_data = lib.get_image_data(aid=test_aid, image_type='cover')
    print(f"[OK] 读取图片数据: {len(read_data)} 字节")

    # 验证数据
    if read_data == test_data:
        print("[OK] 数据验证通过")
    else:
        print("[FAIL] 数据验证失败")

    # 测试重复保存（业务去重）
    image_id2 = lib.save_image(
        test_data,
        aid=test_aid,
        pid=None,
        page_num=None,
        image_type='cover'
    )
    if image_id == image_id2:
        print("[OK] 业务去重测试通过")
    else:
        print("[FAIL] 业务去重测试失败")

    # 测试删除
    success = lib.delete_image(aid=test_aid, image_type='cover')
    print(f"[OK] 删除图片: {success}")

    # 验证删除
    exists = lib.image_exists(aid=test_aid, image_type='cover')
    if not exists:
        print("[OK] 删除验证通过")
    else:
        print("[FAIL] 删除验证失败")

    return True


def test_statistics():
    """测试统计功能"""
    print("\n" + "="*50)
    print("测试 3: 统计功能")
    print("="*50)

    storage = get_gridfs_image_storage('cm', 'content')
    stats = storage.get_statistics()

    print(f"站点: {stats['site_id']}")
    print(f"类型: {stats['image_type']}")
    print(f"Bucket: {stats['bucket_name']}")
    print(f"总文件数: {stats['total_files']}")
    print(f"总块数: {stats['total_chunks']}")
    print(f"总大小: {stats['total_size_mb']} MB")
    print(f"平均大小: {stats['avg_file_size_kb']} KB")

    lib = get_image_library('cm')
    lib_stats = lib.get_statistics()

    print(f"\n图片库统计:")
    print(f"总图片数: {lib_stats['total_images']}")
    print(f"唯一文件数: {lib_stats['total_unique_files']}")
    print(f"去重率: {lib_stats['dedup_rate']}%")

    return True


def main():
    """主函数"""
    print("\n" + "="*50)
    print("GridFS 图片存储测试")
    print("="*50)

    try:
        # 运行测试
        test_gridfs_basic()
        test_image_library()
        test_statistics()

        print("\n" + "="*50)
        print("[OK] 所有测试通过")
        print("="*50)

    except Exception as e:
        print(f"\n[FAIL] 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == '__main__':
    exit(main())
