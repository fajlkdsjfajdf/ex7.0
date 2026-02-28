"""
图片存储管理 - DAT文件存储
将多个图片整合到.dat文件中，减少文件系统压力

存储格式：
[图片大小4字节][图片数据][图片大小4字节][图片数据]...

目录结构：
local_files/
├── cm/
│   ├── cm_images_001.dat
│   ├── cm_images_002.dat
│   └── index.json
"""

import os
import json
import struct
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from utils.logger import get_logger

logger = get_logger(__name__)


class ImageStorage:
    """
    图片存储管理器 - DAT文件存储

    功能：
    1. 将多个图片整合到1GB的.dat文件中
    2. 维护index.json索引（记录每个图片的偏移量）
    3. 线程安全（使用文件锁）
    """

    def __init__(self, site_id: str, storage_dir: Optional[str] = None):
        """
        初始化图片存储

        Args:
            site_id: 站点ID (cm/jm/ex等)
            storage_dir: 存储根目录，如果为None则从系统配置读取
        """
        self.site_id = site_id

        # 如果没有指定存储目录，从系统配置读取
        if storage_dir is None:
            storage_dir = self._get_storage_path_from_config()

        self.storage_dir = Path(storage_dir) / site_id
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # DAT文件编号范围：001-999（不再限制文件大小）
        self.min_file_num = 1
        self.max_file_num = 999

        # 文件锁（用于线程安全）- 每个DAT文件独立锁
        self._locks: Dict[str, threading.Lock] = {}
        self._global_lock = threading.Lock()

        # 随机选择文件的最大尝试次数
        self.max_select_attempts = 100

    def _get_storage_path_from_config(self) -> str:
        """
        从系统配置获取存储路径

        根据操作系统自动选择：
        - Windows: 使用 windows_path
        - Linux/其他: 使用 linux_path

        Returns:
            存储路径
        """
        import platform
        from utils.config_loader import load_system_config

        system_config = load_system_config()
        image_storage_config = system_config.get('image_storage', {})

        # 根据操作系统选择路径
        current_os = platform.system().lower()

        if current_os == 'windows':
            path = image_storage_config.get('windows_path', 'Y:/ex7.0/image')
        else:
            # Linux 和其他系统
            path = image_storage_config.get('linux_path', '/mnt/appdata')

        logger.info(f"图片存储路径 (OS={current_os}): {path}")
        return path

    def _get_lock(self, file_path: str) -> threading.Lock:
        """获取文件锁"""
        with self._global_lock:
            if file_path not in self._locks:
                self._locks[file_path] = threading.Lock()
            return self._locks[file_path]

    def _try_acquire_lock(self, lock: threading.Lock, timeout: float = 0.01) -> bool:
        """
        尝试获取锁（非阻塞）

        Args:
            lock: 线程锁
            timeout: 超时时间（秒）

        Returns:
            是否成功获取锁
        """
        import time
        start_time = time.time()
        while time.time() - start_time < timeout:
            if lock.acquire(blocking=False):
                return True
            time.sleep(0.001)  # 短暂休眠
        return False

    def _select_random_dat_file_with_lock(self) -> Tuple[str, threading.Lock]:
        """
        随机选择一个可用的DAT文件并获取锁

        策略：
        1. 随机选择一个DAT文件编号（001-999）
        2. 检查该文件的锁是否可用
        3. 如果被锁定，重新随机选择（最多尝试max_select_attempts次）

        Returns:
            (dat_filename, lock): DAT文件名和已获取的锁（调用者负责释放）
        """
        import random

        for attempt in range(self.max_select_attempts):
            # 随机选择文件编号
            file_num = random.randint(self.min_file_num, self.max_file_num)
            dat_filename = f"{self.site_id}_images_{file_num:04d}.dat"
            dat_path = self.storage_dir / dat_filename

            # 获取该文件的锁
            lock = self._get_lock(str(dat_path))

            # 尝试非阻塞获取锁
            if self._try_acquire_lock(lock):
                logger.debug(f"成功选择DAT文件: {dat_filename} (尝试次数: {attempt + 1})")
                return dat_filename, lock

            # 如果锁被占用，继续尝试下一个

        # 如果所有尝试都失败，使用第一个文件并阻塞等待
        logger.warning(f"随机选择文件失败，使用默认文件并阻塞等待")
        dat_filename = f"{self.site_id}_images_{self.min_file_num:04d}.dat"
        dat_path = self.storage_dir / dat_filename
        lock = self._get_lock(str(dat_path))
        lock.acquire()  # 阻塞等待
        return dat_filename, lock

    def _write_dat_file(self, dat_filename: str, image_data: bytes) -> int:
        """
        写入图片数据到DAT文件（自动获取锁）

        Args:
            dat_filename: DAT文件名
            image_data: 图片数据

        Returns:
            offset: 图片在DAT文件中的偏移量
        """
        dat_path = self.storage_dir / dat_filename
        lock = self._get_lock(str(dat_path))

        with lock:
            return self._write_dat_file_locked(dat_path, image_data)

    def _write_dat_file_locked(self, dat_path: Path, image_data: bytes) -> int:
        """
        写入图片数据到DAT文件（不获取锁，调用者必须已持有锁）

        Args:
            dat_path: DAT文件路径
            image_data: 图片数据

        Returns:
            offset: 图片在DAT文件中的偏移量
        """
        # 计算偏移量（文件末尾）
        if dat_path.exists():
            offset = dat_path.stat().st_size
        else:
            offset = 0

        # 写入数据：[大小4字节][图片数据]
        with open(dat_path, 'ab') as f:
            # 写入图片大小（4字节，小端序）
            f.write(struct.pack('<I', len(image_data)))
            # 写入图片数据
            f.write(image_data)
            f.flush()
            os.fsync(f.fileno())  # 强制刷新到磁盘

        return offset

    def save_image(self, image_data: bytes, image_id: str = None) -> Dict[str, Any]:
        """
        保存图片到DAT文件（高并发写入）

        工作流程：
        1. 随机选择一个DAT文件（001-999）并获取锁
        2. 如果被锁定就换下一个（最多尝试100次）
        3. 写入数据
        4. 释放锁
        5. 返回存储信息（不更新index.json，由ImageLibrary负责MongoDB）

        Args:
            image_data: 图片二进制数据
            image_id: 图片ID（可选，仅用于日志）

        Returns:
            存储信息：
            {
                'dat_file': 'cm_images_0001.dat',
                'offset': 123456,
                'length': 234567,
                'file_path': '/local_files/cm/cm_images_0001.dat'
            }
        """
        # 步骤1：随机选择一个可用的DAT文件并获取锁
        dat_filename, lock = self._select_random_dat_file_with_lock()
        dat_path = self.storage_dir / dat_filename

        try:
            # 步骤2：写入DAT文件（锁已经在_select_random_dat_file_with_lock中获取）
            offset = self._write_dat_file_locked(dat_path, image_data)

            logger.debug(f"图片已保存到DAT: {image_id}, file={dat_filename}, offset={offset}, size={len(image_data)}")

            return {
                'dat_file': dat_filename,
                'offset': offset,
                'length': len(image_data),
                'file_path': str(dat_path)
            }

        except Exception as e:
            logger.error(f"保存图片到DAT文件失败: {e}")
            raise
        finally:
            # 确保锁被释放
            lock.release()

    def read_image_raw(self, dat_file: str, offset: int, length: int) -> Optional[bytes]:
        """
        从DAT文件读取图片数据（底层方法）

        Args:
            dat_file: DAT文件名
            offset: 偏移量
            length: 数据长度

        Returns:
            图片二进制数据，如果失败返回None
        """
        try:
            dat_path = self.storage_dir / dat_file
            if not dat_path.exists():
                logger.error(f"DAT文件不存在: {dat_path}")
                return None

            lock = self._get_lock(str(dat_path))

            with lock:
                with open(dat_path, 'rb') as f:
                    # 定位到图片位置
                    f.seek(offset)

                    # 读取大小（4字节）
                    size_bytes = f.read(4)
                    if len(size_bytes) < 4:
                        logger.error(f"读取图片大小失败: {dat_file}, offset={offset}")
                        return None

                    stored_size = struct.unpack('<I', size_bytes)[0]

                    # 验证长度是否匹配
                    if stored_size != length:
                        logger.warning(f"图片长度不匹配: expected={length}, stored={stored_size}")

                    # 读取图片数据
                    image_data = f.read(stored_size)

                    if len(image_data) != stored_size:
                        logger.error(f"图片数据不完整: {dat_file}, offset={offset}, expected={stored_size}, actual={len(image_data)}")
                        return None

                    logger.debug(f"从DAT文件读取图片成功: {dat_file}, offset={offset}, size={len(image_data)}")
                    return image_data

        except Exception as e:
            logger.error(f"从DAT文件读取图片失败: {dat_file}, offset={offset}, {e}")
            return None


# 便捷函数
def get_image_storage(site_id: str) -> ImageStorage:
    """
    获取指定站点的图片存储实例

    Args:
        site_id: 站点ID

    Returns:
        ImageStorage实例
    """
    return ImageStorage(site_id)
