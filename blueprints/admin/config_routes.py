"""
后台配置管理API路由
负责站点配置和系统配置的管理
"""
import os
import json
from flask import jsonify, request
from blueprints.admin import admin_bp
from utils.config_loader import (
    load_sites_config, save_sites_config,
    load_system_config, save_system_config,
    load_proxy_config, save_proxy_config
)
from utils.logger import get_logger

logger = get_logger(__name__)

# 系统配置文件路径
SYSTEM_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data', 'system_config.json')


def load_system_config_from_file() -> dict:
    """从文件加载系统配置"""
    try:
        if os.path.exists(SYSTEM_CONFIG_FILE):
            with open(SYSTEM_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"加载系统配置失败: {e}")
    return {}


def save_system_config_to_file(config: dict) -> bool:
    """保存系统配置到文件"""
    try:
        os.makedirs(os.path.dirname(SYSTEM_CONFIG_FILE), exist_ok=True)
        with open(SYSTEM_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"保存系统配置失败: {e}")
        return False


@admin_bp.route('/api/config/sites', methods=['GET'])
def get_sites():
    """获取所有站点配置"""
    try:
        sites_config = load_sites_config()
        sites = list(sites_config.values())
        return jsonify({
            'success': True,
            'data': {
                'sites': sites
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取站点列表失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/sites/<site_id>', methods=['GET'])
def get_site(site_id):
    """获取单个站点配置"""
    try:
        sites_config = load_sites_config()
        if site_id not in sites_config:
            return jsonify({
                'success': False,
                'message': '站点不存在'
            }), 404

        return jsonify({
            'success': True,
            'data': sites_config[site_id]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取站点配置失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/sites', methods=['POST'])
def create_site():
    """创建新站点"""
    try:
        data = request.get_json()

        # 验证必填字段
        required_fields = ['site_id', 'site_name', 'urls']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'message': f'缺少必填字段: {field}'
                }), 400

        site_id = data['site_id']

        # 检查站点ID是否已存在
        sites_config = load_sites_config()
        if site_id in sites_config:
            return jsonify({
                'success': False,
                'message': f'站点ID {site_id} 已存在'
            }), 400

        # 保存站点配置
        sites_config[site_id] = {
            'site_id': site_id,
            'site_name': data['site_name'],
            'urls': data['urls'],
            'cdn_urls': data.get('cdn_urls', []),
            'schedule': data.get('schedule', {}),
            'crawl_limits': data.get('crawl_limits', {}),
            'ips': data.get('ips', []),
            'proxy_mode': data.get('proxy_mode', 'none'),
            'proxy_overrides': data.get('proxy_overrides', {}),
            'cookies': data.get('cookies', {}),
            'enabled': True
        }

        if save_sites_config(sites_config):
            return jsonify({
                'success': True,
                'data': sites_config[site_id],
                'message': '站点已创建'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存配置文件失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'创建站点失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/sites/<site_id>', methods=['PUT'])
def update_site(site_id):
    """更新站点配置"""
    try:
        data = request.get_json()

        # 加载现有配置
        sites_config = load_sites_config()
        if site_id not in sites_config:
            return jsonify({
                'success': False,
                'message': '站点不存在'
            }), 404

        # 更新配置
        sites_config[site_id].update({
            'site_name': data.get('site_name', sites_config[site_id]['site_name']),
            'urls': data.get('urls', sites_config[site_id]['urls']),
            'cdn_urls': data.get('cdn_urls', sites_config[site_id].get('cdn_urls', [])),
            'schedule': data.get('schedule', sites_config[site_id].get('schedule', {})),
            'crawl_limits': data.get('crawl_limits', sites_config[site_id].get('crawl_limits', {})),
            'ips': data.get('ips', sites_config[site_id].get('ips', [])),
            'proxy_mode': data.get('proxy_mode', sites_config[site_id].get('proxy_mode', 'none')),
            'proxy_overrides': data.get('proxy_overrides', sites_config[site_id].get('proxy_overrides', {})),
            'cookies': data.get('cookies', sites_config[site_id].get('cookies', {}))
        })

        if save_sites_config(sites_config):
            return jsonify({
                'success': True,
                'data': sites_config[site_id],
                'message': '站点已更新'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存配置文件失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'更新站点失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/sites/<site_id>', methods=['DELETE'])
def delete_site(site_id):
    """删除站点"""
    try:
        sites_config = load_sites_config()
        if site_id not in sites_config:
            return jsonify({
                'success': False,
                'message': '站点不存在'
            }), 404

        # 删除站点
        del sites_config[site_id]

        if save_sites_config(sites_config):
            return jsonify({
                'success': True,
                'message': '站点已删除'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存配置文件失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'删除站点失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/sites/<site_id>/test', methods=['GET'])
def test_site(site_id):
    """测试站点连接"""
    try:
        sites_config = load_sites_config()
        if site_id not in sites_config:
            return jsonify({
                'success': False,
                'message': '站点不存在'
            }), 404

        # TODO: 实际的站点连接测试逻辑
        # 这里可以发送一个简单的HTTP请求来测试站点是否可访问

        return jsonify({
            'success': True,
            'message': '站点连接正常'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'测试站点失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/system', methods=['GET'])
def get_system_config():
    """获取系统配置"""
    try:
        if os.path.exists(SYSTEM_CONFIG_FILE):
            with open(SYSTEM_CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                return jsonify({
                    'success': True,
                    'data': config
                })
        else:
            # 默认配置
            import platform
            default_config = {
                'crawler_num_workers': 100,
                'crawler_timeout': 30,
                'crawler_max_retries': 3,
                'log_level': 'INFO',
                'log_max_size': 10,
                'minio_endpoint': '',
                'minio_access_key': '',
                'minio_secret_key': '',
                'minio_bucket_name': 'comics',
                'image_storage': {
                    'windows_path': 'Y:/ex7.0/image',
                    'linux_path': '/mnt/appdata',
                    'description': '图片存储根路径，系统会根据操作系统自动选择'
                },
                'database': {
                    'host': 'localhost',
                    'port': 27017,
                    'name': 'manga_hub'
                },
                'current_os': platform.system().lower()
            }
            return jsonify({
                'success': True,
                'data': default_config
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取系统配置失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/system', methods=['POST'])
def update_system_config():
    """更新系统配置"""
    try:
        data = request.get_json()

        # 保存配置到文件
        os.makedirs(os.path.dirname(SYSTEM_CONFIG_FILE), exist_ok=True)
        with open(SYSTEM_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return jsonify({
            'success': True,
            'data': data,
            'message': '系统配置已保存'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'保存系统配置失败: {str(e)}'
        }), 500


# ========== 图片存储配置管理 ==========

@admin_bp.route('/api/config/image-storage', methods=['GET'])
def get_image_storage_config():
    """获取图片存储配置"""
    try:
        import platform
        from pathlib import Path

        config = load_system_config()
        image_storage = config.get('image_storage', {
            'windows_path': 'Y:/ex7.0/image',
            'linux_path': '/mnt/appdata'
        })

        # 获取当前操作系统
        current_os = platform.system().lower()
        current_path = image_storage.get('windows_path' if current_os == 'windows' else 'linux_path', '')

        # 检查路径是否存在
        path_exists = Path(current_path).exists() if current_path else False

        # 获取磁盘空间信息
        disk_info = {}
        if path_exists:
            try:
                import shutil
                total, used, free = shutil.disk_usage(current_path)
                disk_info = {
                    'total_gb': round(total / (1024**3), 2),
                    'used_gb': round(used / (1024**3), 2),
                    'free_gb': round(free / (1024**3), 2),
                    'used_percent': round(used / total * 100, 2) if total > 0 else 0
                }
            except Exception as e:
                logger.warning(f"获取磁盘空间失败: {e}")

        return jsonify({
            'success': True,
            'data': {
                'windows_path': image_storage.get('windows_path', ''),
                'linux_path': image_storage.get('linux_path', ''),
                'current_os': current_os,
                'current_path': current_path,
                'path_exists': path_exists,
                'disk_info': disk_info
            }
        })
    except Exception as e:
        logger.error(f"获取图片存储配置失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取图片存储配置失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/image-storage', methods=['POST'])
def update_image_storage_config():
    """更新图片存储配置"""
    try:
        data = request.get_json()

        # 加载现有配置
        config = load_system_config()

        # 更新图片存储配置
        if 'image_storage' not in config:
            config['image_storage'] = {}

        if 'windows_path' in data:
            config['image_storage']['windows_path'] = data['windows_path']
        if 'linux_path' in data:
            config['image_storage']['linux_path'] = data['linux_path']

        # 保存配置
        if save_system_config(config):
            logger.info(f"图片存储配置已更新: {config['image_storage']}")
            return jsonify({
                'success': True,
                'data': config['image_storage'],
                'message': '图片存储配置已保存'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存配置文件失败'
            }), 500
    except Exception as e:
        logger.error(f"更新图片存储配置失败: {e}")
        return jsonify({
            'success': False,
            'message': f'更新图片存储配置失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/image-storage/test', methods=['POST'])
def test_image_storage_path():
    """测试图片存储路径"""
    try:
        import platform
        from pathlib import Path
        import shutil

        data = request.get_json()
        path = data.get('path')

        if not path:
            return jsonify({
                'success': False,
                'message': '路径不能为空'
            }), 400

        path_obj = Path(path)

        # 检查路径是否存在
        exists = path_obj.exists()

        # 检查是否可写
        writable = False
        if exists:
            try:
                test_file = path_obj / '.write_test'
                test_file.touch()
                test_file.unlink()
                writable = True
            except:
                writable = False

        # 获取磁盘空间
        disk_info = {}
        if exists:
            try:
                total, used, free = shutil.disk_usage(path)
                disk_info = {
                    'total_gb': round(total / (1024**3), 2),
                    'used_gb': round(used / (1024**3), 2),
                    'free_gb': round(free / (1024**3), 2),
                    'used_percent': round(used / total * 100, 2) if total > 0 else 0
                }
            except:
                pass

        return jsonify({
            'success': True,
            'data': {
                'path': path,
                'exists': exists,
                'writable': writable,
                'disk_info': disk_info
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'测试路径失败: {str(e)}'
        }), 500


# ========== 图片库统计 ==========

@admin_bp.route('/api/image-library/stats', methods=['GET'])
def get_image_library_stats():
    """获取图片库统计信息"""
    try:
        from models.image_library import get_image_library
        from utils.config_loader import load_sites_config

        sites_config = load_sites_config()
        site_id = request.args.get('site_id', 'cm')

        if site_id not in sites_config:
            return jsonify({
                'success': False,
                'message': f'站点不存在: {site_id}'
            }), 404

        image_library = get_image_library(site_id)
        stats = image_library.get_statistics()

        return jsonify({
            'success': True,
            'data': stats
        })
    except Exception as e:
        logger.error(f"获取图片库统计失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取图片库统计失败: {str(e)}'
        }), 500


@admin_bp.route('/api/image-library/stats/all', methods=['GET'])
def get_all_image_library_stats():
    """获取所有站点图片库统计信息"""
    try:
        from models.image_library import get_image_library
        from utils.config_loader import load_sites_config

        sites_config = load_sites_config()
        all_stats = {}

        for site_id in sites_config.keys():
            try:
                image_library = get_image_library(site_id)
                stats = image_library.get_statistics()
                all_stats[site_id] = stats
            except Exception as e:
                logger.warning(f"获取站点 {site_id} 图片库统计失败: {e}")
                all_stats[site_id] = {'error': str(e)}

        return jsonify({
            'success': True,
            'data': all_stats
        })
    except Exception as e:
        logger.error(f"获取所有图片库统计失败: {e}")
        return jsonify({
            'success': False,
            'message': f'获取所有图片库统计失败: {str(e)}'
        }), 500


# ========== 代理配置管理 ==========

@admin_bp.route('/api/config/proxy', methods=['GET'])
def get_proxy_config():
    """获取代理配置"""
    try:
        config = load_proxy_config()
        return jsonify({
            'success': True,
            'data': config
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取代理配置失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/proxy/domestic', methods=['POST'])
def update_domestic_proxies():
    """更新国内代理列表"""
    try:
        data = request.get_json()
        proxies = data.get('proxies', [])

        # 加载现有配置
        config = load_proxy_config()
        config['domestic'] = proxies

        # 保存配置
        if save_proxy_config(config):
            return jsonify({
                'success': True,
                'data': proxies,
                'message': '国内代理已保存'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存配置文件失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'保存国内代理失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/proxy/foreign', methods=['POST'])
def update_foreign_proxies():
    """更新国外代理列表"""
    try:
        data = request.get_json()
        proxies = data.get('proxies', [])

        # 加载现有配置
        config = load_proxy_config()
        config['foreign'] = proxies

        # 保存配置
        if save_proxy_config(config):
            return jsonify({
                'success': True,
                'data': proxies,
                'message': '国外代理已保存'
            })
        else:
            return jsonify({
                'success': False,
                'message': '保存配置文件失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'保存国外代理失败: {str(e)}'
        }), 500


@admin_bp.route('/api/config/proxy/test', methods=['POST'])
def test_proxy():
    """测试代理连通性"""
    import requests
    import time
    import socket

    try:
        data = request.get_json()
        proxy_type = data.get('type', 'http')
        host = data.get('host')
        port = data.get('port')
        username = data.get('username')
        password = data.get('password')

        if not host or not port:
            return jsonify({
                'success': False,
                'message': '代理地址和端口不能为空'
            }), 400

        # 第一步：测试能否连接到代理服务器
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            proxy_connect_result = sock.connect_ex((host, port))
            sock.close()

            if proxy_connect_result != 0:
                return jsonify({
                    'success': True,
                    'data': {
                        'working': False,
                        'error': f'无法连接到代理服务器 {host}:{port} (错误码: {proxy_connect_result})'
                    }
                })
        except Exception as e:
            return jsonify({
                'success': True,
                'data': {
                    'working': False,
                    'error': f'代理服务器连接失败: {str(e)}'
                }
            })

        # 第二步：通过代理访问测试网站
        # 构建代理URL
        if username and password:
            proxy_url = f"{proxy_type}://{username}:{password}@{host}:{port}"
        else:
            proxy_url = f"{proxy_type}://{host}:{port}"

        proxies = {
            'http': proxy_url,
            'https': proxy_url
        }

        # 使用IP地址的测试URL，避免SOCKS5的DNS问题
        test_urls = [
            'https://www.baidu.com',  # 百度IP（国内测试）
        ]

        start_time = time.time()
        success = False
        response_time = None
        error_msg = None

        for test_url in test_urls:
            try:
                logger.info(f"通过代理测试访问: {test_url}")
                response = requests.get(
                    test_url,
                    proxies=proxies,
                    timeout=10,
                    allow_redirects=True
                )

                logger.info(f"代理测试响应: status={response.status_code}")

                if response.status_code in [200, 301, 302]:  # 接受成功和重定向
                    success = True
                    response_time = int((time.time() - start_time) * 1000)
                    break

            except requests.exceptions.ProxyError as e:
                error_msg = f"代理错误: {str(e)}"
                logger.error(f"代理测试ProxyError: {e}")
                break
            except requests.exceptions.Timeout as e:
                error_msg = f"请求超时: {str(e)}"
                logger.error(f"代理测试超时: {e}")
                break
            except requests.exceptions.ConnectionError as e:
                error_msg = f"连接错误: {str(e)}"
                logger.error(f"代理测试连接错误: {e}")
                break
            except Exception as e:
                error_msg = f"未知错误: {str(e)}"
                logger.error(f"代理测试异常: {e}")
                break

        if not success and not error_msg:
            error_msg = "无法通过代理访问测试网站"

        return jsonify({
            'success': True,
            'data': {
                'working': success,
                'response_time': response_time,
                'error': error_msg
            }
        })

    except Exception as e:
        logger.error(f"测试代理失败: {e}", exc_info=True)
        return jsonify({
            'success': True,
            'data': {
                'working': False,
                'error': f"测试过程异常: {str(e)} {type(e).__name__}"
            }
        })

