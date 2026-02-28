import os
from pathlib import Path
from datetime import datetime

def get_human_readable_size(size_bytes):
    """将字节大小转换为可读格式"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def get_file_modification_time(filepath):
    """获取文件修改时间"""
    timestamp = os.path.getmtime(filepath)
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

def validate_path(base_dir, relative_path):
    """验证路径是否在基础目录内，防止目录遍历攻击"""
    try:
        full_path = (base_dir / relative_path).resolve()
        base_dir_resolved = base_dir.resolve()
        if base_dir_resolved not in full_path.parents and full_path != base_dir_resolved:
            return None
        return full_path
    except (ValueError, RuntimeError):
        return None
    

def format_timestamp(timestamp) -> str:
    """格式化时间戳为可读字符串"""
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

def human_size(size_bytes):
    """将字节大小转换为可读格式"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"