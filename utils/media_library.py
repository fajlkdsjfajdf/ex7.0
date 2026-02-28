"""
图片存储库管理
统一管理系统中所有图片的存储、统计和清理
"""

import os
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path
from utils.logger import get_logger
from utils.config_loader import load_system_config, save_system_config

logger = get_logger(__name__)


class MediaLibrary:
    """图片存储库管理类"""

    # 默认配置
    DEFAULT_CONFIG = {
        'libraries': {
            'covers': {
                'name': '封面图片库',
                'path': 'data/media/covers',
                'description': '存储所有漫画的封面图片'
            },
            'thumbnails': {
                'name': '缩略图库',
                'path': 'data/media/thumbnails',
                'description': '存储列表页缩略图'
            },
            'content': {
                'name': '内容图片库',
                'path': 'data/media/content',
                'description': '存储章节内容图片'
            }
        },
        'last_scan': None
    }

    def __init__(self):
        """初始化图片存储库"""
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """加载图片库配置"""
        try:
            system_config = load_system_config()
            media_config = system_config.get('media_library', {})

            if not media_config:
                logger.info("图片库配置不存在，使用默认配置")
                media_config = self.DEFAULT_CONFIG.copy()
                self._save_config(media_config)

            return media_config
        except Exception as e:
            logger.error(f"加载图片库配置失败: {e}")
            return self.DEFAULT_CONFIG.copy()

    def _save_config(self, config: Dict[str, Any]):
        """保存图片库配置"""
        try:
            system_config = load_system_config()
            system_config['media_library'] = config
            save_system_config(system_config)
            logger.info("图片库配置已保存")
        except Exception as e:
            logger.error(f"保存图片库配置失败: {e}")

    def get_library_path(self, library_id: str) -> str:
        """
        获取图片库的存储路径

        Args:
            library_id: 图片库ID (covers/thumbnails/content)

        Returns:
            存储路径
        """
        libraries = self.config.get('libraries', {})
        if library_id not in libraries:
            raise ValueError(f"图片库不存在: {library_id}")

        library = libraries[library_id]
        return library.get('path', f'data/media/{library_id}')

    def scan_library(self, library_id: str) -> Dict[str, Any]:
        """
        扫描图片库，统计文件信息

        Args:
            library_id: 图片库ID

        Returns:
            统计信息
        """
        try:
            library_path = self.get_library_path(library_id)

            if not os.path.exists(library_path):
                os.makedirs(library_path, exist_ok=True)
                return {
                    'library_id': library_id,
                    'total_files': 0,
                    'total_size': 0,
                    'total_size_mb': 0,
                    'file_types': {},
                    'scan_time': datetime.now().isoformat()
                }

            total_files = 0
            total_size = 0
            file_types = {}

            for root, dirs, files in os.walk(library_path):
                for file in files:
                    file_path = os.path.join(root, file)

                    # 获取文件大小
                    try:
                        file_size = os.path.getsize(file_path)
                        total_size += file_size
                        total_files += 1

                        # 统计文件类型
                        file_ext = os.path.splitext(file)[1].lower()
                        if file_ext:
                            file_types[file_ext] = file_types.get(file_ext, 0) + 1

                    except Exception as e:
                        logger.warning(f"无法获取文件信息: {file_path}, {e}")
                        continue

            total_size_mb = round(total_size / (1024 * 1024), 2)

            # 更新扫描时间
            if 'last_scan' not in self.config:
                self.config['last_scan'] = {}
            self.config['last_scan'][library_id] = datetime.now().isoformat()
            self._save_config(self.config)

            return {
                'library_id': library_id,
                'total_files': total_files,
                'total_size': total_size,
                'total_size_mb': total_size_mb,
                'file_types': file_types,
                'scan_time': self.config['last_scan'][library_id]
            }

        except Exception as e:
            logger.error(f"扫描图片库失败: {library_id}, {e}")
            return {
                'library_id': library_id,
                'error': str(e)
            }

    def scan_all_libraries(self) -> Dict[str, Dict[str, Any]]:
        """
        扫描所有图片库

        Returns:
            所有图片库的统计信息
        """
        results = {}
        libraries = self.config.get('libraries', {})

        for library_id in libraries.keys():
            results[library_id] = self.scan_library(library_id)

        return results

    def get_library_info(self, library_id: str) -> Dict[str, Any]:
        """
        获取图片库信息

        Args:
            library_id: 图片库ID

        Returns:
            图片库信息
        """
        libraries = self.config.get('libraries', {})
        if library_id not in libraries:
            raise ValueError(f"图片库不存在: {library_id}")

        library = libraries[library_id]

        # 获取最新统计信息
        stats = self.scan_library(library_id)

        return {
            'id': library_id,
            'name': library.get('name', ''),
            'path': library.get('path', ''),
            'description': library.get('description', ''),
            'stats': stats
        }

    def list_all_libraries(self) -> List[Dict[str, Any]]:
        """
        列出所有图片库

        Returns:
            图片库列表
        """
        libraries = self.config.get('libraries', {})
        result = []

        for library_id, library in libraries.items():
            result.append({
                'id': library_id,
                'name': library.get('name', ''),
                'path': library.get('path', ''),
                'description': library.get('description', '')
            })

        return result

    def save_image(
        self,
        library_id: str,
        image_data: bytes,
        filename: str,
        subpath: str = ''
    ) -> str:
        """
        保存图片到指定图片库

        Args:
            library_id: 图片库ID
            image_data: 图片二进制数据
            filename: 文件名
            subpath: 子路径（可选，用于分类存储）

        Returns:
            保存的完整路径
        """
        try:
            library_path = self.get_library_path(library_id)

            # 构建完整路径
            if subpath:
                save_dir = os.path.join(library_path, subpath)
            else:
                save_dir = library_path

            os.makedirs(save_dir, exist_ok=True)

            # 保存文件
            save_path = os.path.join(save_dir, filename)
            with open(save_path, 'wb') as f:
                f.write(image_data)

            logger.debug(f"图片已保存: {save_path}")
            return save_path

        except Exception as e:
            logger.error(f"保存图片失败: {library_id}/{filename}, {e}")
            raise

    def get_image_path(
        self,
        library_id: str,
        filename: str,
        subpath: str = ''
    ) -> str:
        """
        获取图片的存储路径

        Args:
            library_id: 图片库ID
            filename: 文件名
            subpath: 子路径

        Returns:
            完整路径
        """
        library_path = self.get_library_path(library_id)

        if subpath:
            return os.path.join(library_path, subpath, filename)
        else:
            return os.path.join(library_path, filename)

    def image_exists(
        self,
        library_id: str,
        filename: str,
        subpath: str = ''
    ) -> bool:
        """
        检查图片是否存在

        Args:
            library_id: 图片库ID
            filename: 文件名
            subpath: 子路径

        Returns:
            是否存在
        """
        image_path = self.get_image_path(library_id, filename, subpath)
        return os.path.exists(image_path)

    def delete_image(
        self,
        library_id: str,
        filename: str,
        subpath: str = ''
    ) -> bool:
        """
        删除图片

        Args:
            library_id: 图片库ID
            filename: 文件名
            subpath: 子路径

        Returns:
            是否成功
        """
        try:
            image_path = self.get_image_path(library_id, filename, subpath)

            if os.path.exists(image_path):
                os.remove(image_path)
                logger.info(f"图片已删除: {image_path}")
                return True
            else:
                logger.warning(f"图片不存在: {image_path}")
                return False

        except Exception as e:
            logger.error(f"删除图片失败: {image_path}, {e}")
            return False

    def clear_library(self, library_id: str) -> Dict[str, Any]:
        """
        清空图片库

        Args:
            library_id: 图片库ID

        Returns:
            清理结果
        """
        try:
            library_path = self.get_library_path(library_id)

            if not os.path.exists(library_path):
                return {
                    'success': True,
                    'message': f'图片库目录不存在: {library_path}',
                    'deleted_count': 0
                }

            deleted_count = 0
            for root, dirs, files in os.walk(library_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        os.remove(file_path)
                        deleted_count += 1
                    except Exception as e:
                        logger.warning(f"删除文件失败: {file_path}, {e}")

            logger.info(f"图片库已清空: {library_id}, 删除 {deleted_count} 个文件")

            return {
                'success': True,
                'message': f'图片库已清空，删除 {deleted_count} 个文件',
                'deleted_count': deleted_count
            }

        except Exception as e:
            logger.error(f"清空图片库失败: {library_id}, {e}")
            return {
                'success': False,
                'message': f'清空图片库失败: {str(e)}',
                'deleted_count': 0
            }

    def update_library_path(self, library_id: str, new_path: str) -> bool:
        """
        更新图片库的存储路径

        Args:
            library_id: 图片库ID
            new_path: 新路径

        Returns:
            是否成功
        """
        try:
            libraries = self.config.get('libraries', {})
            if library_id not in libraries:
                return False

            # 创建新目录
            os.makedirs(new_path, exist_ok=True)

            # 更新配置
            libraries[library_id]['path'] = new_path
            self.config['libraries'] = libraries
            self._save_config(self.config)

            logger.info(f"图片库路径已更新: {library_id} -> {new_path}")
            return True

        except Exception as e:
            logger.error(f"更新图片库路径失败: {library_id}, {e}")
            return False


# 全局实例
media_library = MediaLibrary()


def get_media_library() -> MediaLibrary:
    """获取图片存储库实例"""
    return media_library
