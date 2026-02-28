import os
import json
import threading
import time
import sys
from pathlib import Path
from typing import Optional, Dict, Union, Any, BinaryIO
from . import helpers

# 跨平台文件锁实现
if sys.platform == 'win32':
    # import portalocker
    def _lock_file(f: BinaryIO, exclusive: bool = True):
        try:
            portalocker.lock(f, portalocker.LOCK_EX if exclusive else portalocker.LOCK_SH)
        except portalocker.exceptions.LockException as e:
            raise RuntimeError(f"Lock failed: {str(e)}")
    def _unlock_file(f: BinaryIO):
        try:
            portalocker.unlock(f)
        except:
            pass
else:
    import fcntl
    def _lock_file(f: BinaryIO, exclusive: bool = True):
        fcntl.flock(f, fcntl.LOCK_EX if exclusive else fcntl.LOCK_SH)
    def _unlock_file(f: BinaryIO):
        fcntl.flock(f, fcntl.LOCK_UN)



class SafeImageStore:
    """
    重构后的图片存储类，支持子目录
    """
    
    def __init__(self, storage_dir: Union[str, Path] = "image_storage"):
        self.storage_dir = Path(storage_dir).absolute()
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        
        # 资源管理
        self._global_lock = threading.Lock()
        self._file_locks: Dict[Path, threading.Lock] = {}

    def _get_file_lock(self, file_path: Path) -> threading.Lock:
        """获取文件级线程锁"""
        with self._global_lock:
            if file_path not in self._file_locks:
                self._file_locks[file_path] = threading.Lock()
            return self._file_locks[file_path]

    def _get_file_prefix(self, image_id: str) -> str:
        """生成安全的文件前缀"""

        prefix = str(image_id)[:4].lower()
        return ''.join(c for c in prefix if c.isalnum())

    def _resolve_path(self, subdir: Optional[str], filename: str) -> Path:
        """
        解析完整文件路径
        :param subdir: 可选的子目录（相对于storage_dir）
        :param filename: 文件名
        """
        if subdir:
            path = (self.storage_dir / subdir / filename).absolute()
            # 确保路径安全（防止目录遍历）
            if not path.resolve().relative_to(self.storage_dir.resolve()):
                raise ValueError("Invalid subdirectory path")
            return path
        return (self.storage_dir / filename).absolute()

    def _ensure_file_exists(self, path: Path, mode: str = 'ab+'):
        """确保文件存在（不存在则创建空文件）"""
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            with open(path, mode):
                pass  # 创建空文件
        return path

    def store_image(self, image_data: bytes, image_id: str, 
                   subdir: Optional[str] = None, page: Optional[int] = None):
        """
        存储图片（支持子目录）
        """
        if not image_id:
            raise ValueError("image_id cannot be empty")
        if not image_data:
            raise ValueError("image_data cannot be empty")
        image_id= str(image_id)
        prefix = self._get_file_prefix(image_id)
        data_path = self._resolve_path(subdir, f"{prefix}.dat")
        index_path = self._resolve_path(subdir, f"{prefix}.idx")
        file_lock = self._get_file_lock(data_path)  # 数据文件和索引文件共用锁
        
        with file_lock:
            try:
                # 确保文件存在（自动创建）
                self._ensure_file_exists(data_path)
                self._ensure_file_exists(index_path)
                
                # 写入数据
                with open(data_path, 'ab+') as data_file:
                    _lock_file(data_file, exclusive=True)
                    try:
                        data_file.seek(0, 2)
                        position = data_file.tell()
                        data_file.write(image_data)
                        data_file.flush()
                        
                        # 更新索引
                        with open(index_path, 'rb+') as index_file:
                            _lock_file(index_file, exclusive=True)
                            try:
                                index_file.seek(0)
                                content = index_file.read().decode('utf-8')
                                index = json.loads(content) if content else {}
                                
                                key = f"{image_id}:{page}" if page is not None else image_id
                                index[key] = {
                                    'id': image_id,
                                    'position': position,
                                    'length': len(image_data),
                                    'timestamp': int(time.time())
                                }
                                
                                index_file.seek(0)
                                index_file.truncate()
                                index_file.write(json.dumps(index).encode('utf-8'))
                                index_file.flush()
                            finally:
                                _unlock_file(index_file)
                    finally:
                        _unlock_file(data_file)
            except Exception as e:
                raise RuntimeError(f"Store image failed: {str(e)}")

    def retrieve_image(self, image_id: str, 
                      subdir: Optional[str] = None, page: Optional[int] = None) -> Optional[bytes]:
        """
        检索图片（支持子目录）
        """
        prefix = self._get_file_prefix(image_id)
        data_path = self._resolve_path(subdir, f"{prefix}.dat")
        index_path = self._resolve_path(subdir, f"{prefix}.idx")

        if not index_path.exists():
            return None

        key = f"{image_id}:{page}" if page is not None else image_id
        
        # 读取索引
        try:
            with open(index_path, 'rb') as index_file:
                _lock_file(index_file, exclusive=False)
                try:
                    content = index_file.read().decode('utf-8')
                    index = json.loads(content) if content else {}
                    if key not in index:
                        return None
                    info = index[key]
                finally:
                    _unlock_file(index_file)
        except Exception as e:
            raise RuntimeError(f"Read index failed: {str(e)}")

        # 读取数据
        try:
            with open(data_path, 'rb') as data_file:
                _lock_file(data_file, exclusive=False)
                try:
                    data_file.seek(info['position'])
                    data = data_file.read(info['length'])
                    return data if len(data) == info['length'] else None
                finally:
                    _unlock_file(data_file)
        except Exception as e:
            raise RuntimeError(f"Read data failed: {str(e)}")

    def get_image_metadata(self, prefix: str, subdir: Optional[str] = None) -> Dict[str, Any]:
        """
        获取图片元数据（支持子目录）
        """
        data_path = self._resolve_path(subdir, f"{prefix}.dat")
        index_path = self._resolve_path(subdir, f"{prefix}.idx")
        
        if not index_path.exists():
            return {}

        file_lock = self._get_file_lock(index_path)
        
        with file_lock:
            try:
                with open(index_path, 'rb') as index_file:
                    _lock_file(index_file, exclusive=False)
                    try:
                        content = index_file.read().decode('utf-8')
                        index = json.loads(content) if content else {}
                        
                        images = []
                        for image_id, info in index.items():
                            id = info["id"]
                            if ':' in image_id:
                                img_name, page = image_id.rsplit(':', 1)
                            else:
                                img_name, page = image_id, None
                            
                            images.append({
                                'id': id,
                                'title': image_id,
                                'name': img_name,
                                'page': page,
                                'position': info['position'],
                                'length': info['length'],
                                'size_kb': info['length'] / 1024,
                                'size_mb': info['length'] / 1024 / 1024,
                                'human_size': helpers.human_size(info['length']),
                                'timestamp': info['timestamp'],
                                'formatted_time': helpers.format_timestamp(info['timestamp'])
                            })
                        
                        return {
                            'images': images,
                            'dat_file_size': data_path.stat().st_size if data_path.exists() else 0,
                            'idx_file_size': index_path.stat().st_size,
                            'subdir': subdir,
                            'prefix': prefix
                        }
                    finally:
                        _unlock_file(index_file)
            except Exception as e:
                raise RuntimeError(f"Get image metadata failed: {str(e)}")

   