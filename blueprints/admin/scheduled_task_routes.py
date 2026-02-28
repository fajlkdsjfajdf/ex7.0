"""
定时任务管理API路由
负责任务的配置和执行管理
"""

from flask import jsonify, request
from blueprints.admin import admin_bp
from utils.config_loader import load_scheduled_tasks_config, save_scheduled_tasks_config
from utils.logger import get_logger

logger = get_logger(__name__)


# 延迟导入避免循环依赖
def get_scheduler():
    """获取调度器实例"""
    from services.scheduler import scheduler
    return scheduler


def get_task_module():
    """获取任务模块"""
    from scheduled_tasks import list_all_tasks, get_task
    return list_all_tasks, get_task


@admin_bp.route('/api/scheduled-tasks', methods=['GET'])
def get_scheduled_tasks():
    """获取所有定时任务配置"""
    try:
        # 获取任务配置
        config = load_scheduled_tasks_config()
        tasks_config = config.get('tasks', {})

        # 获取可用任务列表
        try:
            list_all_tasks, _ = get_task_module()
            available_tasks = {t['id']: t for t in list_all_tasks()}
        except Exception as e:
            # 如果任务模块加载失败，返回空任务列表
            logger.warning(f"无法加载任务模块 - {e}")
            available_tasks = {}

        # 合并任务信息和配置
        result_tasks = []
        for task_id, task_info in available_tasks.items():
            task_config = tasks_config.get(task_id, {
                'enabled': False,
                'interval_hours': 24,
                'last_run': None,
                'next_run': None,
                'config': {}
            })

            result_tasks.append({
                'id': task_id,
                'name': task_info['name'],
                'description': task_info['description'],
                'version': task_info['version'],
                'enabled': task_config.get('enabled', False),
                'interval_hours': task_config.get('interval_hours', 24),
                'last_run': task_config.get('last_run'),
                'next_run': task_config.get('next_run'),
                'config': task_config.get('config', {})
            })

        return jsonify({
            'success': True,
            'data': {
                'tasks': result_tasks
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取定时任务列表失败: {str(e)}'
        }), 500


@admin_bp.route('/api/scheduled-tasks/<task_id>', methods=['GET'])
def get_scheduled_task(task_id):
    """获取单个定时任务配置"""
    try:
        config = load_scheduled_tasks_config()
        tasks = config.get('tasks', {})

        if task_id not in tasks:
            return jsonify({
                'success': False,
                'message': '任务不存在'
            }), 404

        # 获取任务基本信息
        _, get_task = get_task_module()
        task_instance = get_task(task_id)
        task_info = {
            'id': task_id,
            'name': task_instance.name if task_instance else '未知',
            'description': task_instance.description if task_instance else '',
            'version': task_instance.version if task_instance else '1.0.0'
        }

        # 合并配置
        task_config = tasks[task_id]
        task_info.update({
            'enabled': task_config.get('enabled', False),
            'interval_hours': task_config.get('interval_hours', 24),
            'last_run': task_config.get('last_run'),
            'next_run': task_config.get('next_run'),
            'config': task_config.get('config', {})
        })

        return jsonify({
            'success': True,
            'data': task_info
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取任务配置失败: {str(e)}'
        }), 500


@admin_bp.route('/api/scheduled-tasks/<task_id>', methods=['PUT'])
def update_scheduled_task(task_id):
    """更新定时任务配置"""
    try:
        data = request.get_json()

        # 加载现有配置
        config = load_scheduled_tasks_config()
        tasks = config.get('tasks', {})

        # 如果任务不存在，初始化配置
        if task_id not in tasks:
            tasks[task_id] = {
                'enabled': False,
                'interval_hours': 24,
                'last_run': None,
                'next_run': None,
                'config': {}
            }

        # 更新配置
        task_config = tasks[task_id]

        if 'enabled' in data:
            task_config['enabled'] = data['enabled']

            # 如果启用任务，设置下次执行时间
            if data['enabled'] and not task_config.get('next_run'):
                from datetime import datetime, timedelta
                interval_hours = task_config.get('interval_hours', 24)
                next_run = datetime.now() + timedelta(hours=interval_hours)
                task_config['next_run'] = next_run.isoformat()

            # 如果禁用任务，清除下次执行时间
            if not data['enabled']:
                task_config['next_run'] = None

        if 'interval_hours' in data:
            task_config['interval_hours'] = data['interval_hours']

            # 如果任务已启用，更新下次执行时间
            if task_config.get('enabled'):
                from datetime import datetime, timedelta
                next_run = datetime.now() + timedelta(hours=data['interval_hours'])
                task_config['next_run'] = next_run.isoformat()

        if 'config' in data:
            task_config['config'].update(data['config'])

        # 保存配置
        config['tasks'] = tasks
        save_scheduled_tasks_config(config)

        return jsonify({
            'success': True,
            'data': task_config,
            'message': '任务配置已更新'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'更新任务配置失败: {str(e)}'
        }), 500


@admin_bp.route('/api/scheduled-tasks/<task_id>/run', methods=['POST'])
def run_scheduled_task(task_id):
    """立即执行定时任务"""
    try:
        scheduler = get_scheduler()
        result = scheduler.run_task_now(task_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'执行任务失败: {str(e)}'
        }), 500


@admin_bp.route('/api/scheduled-tasks/available', methods=['GET'])
def get_available_tasks():
    """获取所有可用的定时任务类型"""
    try:
        list_all_tasks, _ = get_task_module()
        tasks = list_all_tasks()
        return jsonify({
            'success': True,
            'data': {
                'tasks': tasks
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取可用任务列表失败: {str(e)}'
        }), 500


@admin_bp.route('/api/scheduled-tasks/test', methods=['GET'])
def test_scheduled_tasks():
    """测试定时任务模块导入"""
    import traceback
    result = {
        'success': True,
        'tests': []
    }

    # 测试1: 加载配置文件
    try:
        config = load_scheduled_tasks_config()
        result['tests'].append({
            'name': '加载配置文件',
            'success': True,
            'data': list(config.keys())
        })
    except Exception as e:
        result['tests'].append({
            'name': '加载配置文件',
            'success': False,
            'error': str(e)
        })

    # 测试2: 导入任务模块
    try:
        list_all_tasks, get_task = get_task_module()
        tasks = list_all_tasks()
        result['tests'].append({
            'name': '导入任务模块',
            'success': True,
            'data': [t['id'] for t in tasks]
        })
    except Exception as e:
        result['tests'].append({
            'name': '导入任务模块',
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        })

    # 测试3: 获取任务实例
    try:
        _, get_task = get_task_module()
        task = get_task('refresh_cm_cookies')
        if task:
            result['tests'].append({
                'name': '获取任务实例',
                'success': True,
                'data': {
                    'name': task.name,
                    'version': task.version
                }
            })
        else:
            result['tests'].append({
                'name': '获取任务实例',
                'success': False,
                'error': '任务实例为 None'
            })
    except Exception as e:
        result['tests'].append({
            'name': '获取任务实例',
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        })

    return jsonify(result)

