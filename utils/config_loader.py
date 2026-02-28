"""
配置加载工具
提供统一的配置文件读写接口
"""

import json
import os


# 配置文件路径
SITES_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'sites_config.json')
SYSTEM_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'system_config.json')
PROXY_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'proxy_config.json')
SCHEDULED_TASKS_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'scheduled_tasks_config.json')


def load_sites_config():
    """从文件加载站点配置"""
    try:
        if os.path.exists(SITES_CONFIG_FILE):
            with open(SITES_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {}
    except Exception as e:
        print(f"加载站点配置失败: {e}")
        return {}


def save_sites_config(config):
    """保存站点配置到文件"""
    try:
        os.makedirs(os.path.dirname(SITES_CONFIG_FILE), exist_ok=True)
        with open(SITES_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"保存站点配置失败: {e}")
        return False


def load_system_config():
    """从文件加载系统配置"""
    try:
        if os.path.exists(SYSTEM_CONFIG_FILE):
            with open(SYSTEM_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {}
    except Exception as e:
        print(f"加载系统配置失败: {e}")
        return {}


def save_system_config(config):
    """保存系统配置到文件"""
    try:
        os.makedirs(os.path.dirname(SYSTEM_CONFIG_FILE), exist_ok=True)
        with open(SYSTEM_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"保存系统配置失败: {e}")
        return False


def load_proxy_config():
    """从文件加载代理配置"""
    try:
        if os.path.exists(PROXY_CONFIG_FILE):
            with open(PROXY_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {'domestic': [], 'foreign': []}
    except Exception as e:
        print(f"加载代理配置失败: {e}")
        return {'domestic': [], 'foreign': []}


def save_proxy_config(config):
    """保存代理配置到文件"""
    try:
        os.makedirs(os.path.dirname(PROXY_CONFIG_FILE), exist_ok=True)
        with open(PROXY_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"保存代理配置失败: {e}")
        return False


def load_scheduled_tasks_config():
    """从文件加载定时任务配置"""
    try:
        if os.path.exists(SCHEDULED_TASKS_CONFIG_FILE):
            with open(SCHEDULED_TASKS_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # 默认配置
            default_config = {
                'tasks': {
                    'refresh_cm_cookies': {
                        'enabled': False,
                        'interval_hours': 24,
                        'last_run': None,
                        'next_run': None,
                        'config': {
                            'site_id': 'cm',
                            'timeout': 10
                        }
                    }
                }
            }
            save_scheduled_tasks_config(default_config)
            return default_config
    except Exception as e:
        print(f"加载定时任务配置失败: {e}")
        return {'tasks': {}}


def save_scheduled_tasks_config(config):
    """保存定时任务配置到文件"""
    try:
        os.makedirs(os.path.dirname(SCHEDULED_TASKS_CONFIG_FILE), exist_ok=True)
        with open(SCHEDULED_TASKS_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"保存定时任务配置失败: {e}")
        return False


def update_site_config(site_id, update_data):
    """更新站点配置的特定字段"""
    try:
        sites_config = load_sites_config()
        if site_id in sites_config:
            sites_config[site_id].update(update_data)
            save_sites_config(sites_config)
            return True
        return False
    except Exception as e:
        print(f"更新站点配置失败: {e}")
        return False
