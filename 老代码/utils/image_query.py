from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from .helpers import get_human_readable_size, get_file_modification_time

class ImageQuery:
    def __init__(self, store):
        self.store = store
    
    def get_subdirectories(self) -> List[Dict[str, str]]:
        """第一级查询：获取所有子目录"""
        base_dir = Path(self.store.storage_dir)
        if not base_dir.exists():
            raise FileNotFoundError(f"Base directory {base_dir} does not exist")
        
        subdirs = []
        for entry in base_dir.iterdir():
            if entry.is_dir():
                subdirs.append({
                    'name': entry.name,
                    'path': str(entry.relative_to(base_dir))
                })
        return sorted(subdirs, key=lambda x: x['name'])
    
    def get_file_pairs(self, subdir: str) -> List[Dict[str, any]]:
        """第二级查询：获取dat/idx文件对"""
        target_dir = Path(self.store.storage_dir) / subdir
        if not target_dir.exists() or not target_dir.is_dir():
            raise FileNotFoundError(f"Directory {subdir} does not exist")
        
        dat_files = {}
        for entry in target_dir.glob('*.dat'):
            dat_files[entry.stem] = {
                'dat_path': entry.name,
                'idx_path': entry.with_suffix('.idx').name,
                'exists': entry.with_suffix('.idx').exists()
            }
        
        for entry in target_dir.glob('*.idx'):
            if entry.stem not in dat_files:
                dat_files[entry.stem] = {
                    'dat_path': entry.with_suffix('.dat').name,
                    'idx_path': entry.name,
                    'exists': False
                }
        
        file_pairs = []
        for stem, info in dat_files.items():
            idx_path = target_dir / info['idx_path']
            file_pairs.append({
                'name': stem,
                'dat_exists': info['exists'],
                'dat_path': info['dat_path'],
                'idx_path': info['idx_path'],
                'mod_time': get_file_modification_time(idx_path) if info['exists'] else 'N/A',
                'size': idx_path.stat().st_size if info['exists'] and idx_path.exists() else 0
            })
        
        return sorted(file_pairs, key=lambda x: x['name'])