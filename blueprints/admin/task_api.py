"""
任务API接口 - 提供任务提交和查询功能
"""

from flask import request, jsonify
from blueprints.admin import admin_bp
from services import TaskSubmitter, get_worker_pool, high_speed_bucket, low_speed_bucket, result_bucket
from services.tasks import Task, TaskStatus
from utils.logger import get_logger

logger = get_logger(__name__)


@admin_bp.route('/api/tasks/submit', methods=['POST'])
def submit_task():
    """
    提交任务到桶

    Request Body:
        {
            "task_type": "list_page|info_page|content_page|comment_page|cover_image|thumbnail_image|content_image",
            "params": {},
            "priority": "high|medium|low",  // 可选，默认high
            "source": "frontend|scheduled|manual"  // 可选，默认manual
        }

    Returns:
        {
            "success": true/false,
            "task_id": "任务ID",
            "message": "任务已提交到高速桶/低速桶"
        }
    """
    try:
        data = request.get_json()

        task_type_str = data.get('task_type')
        params = data.get('params', {})
        priority_str = data.get('priority', 'high')
        source_str = data.get('source', 'manual')

        # 转换任务类型
        from services.tasks import TaskType, TaskPriority, TaskSource
        task_type = TaskType(task_type_str)
        priority = TaskPriority[priority_str.upper()]
        source = TaskSource[source_str.lower()]

        # 提交任务
        result = TaskSubmitter.submit_task(
            task_type=task_type,
            params=params,
            priority=priority,
            source=source
        )

        return jsonify(result)

    except Exception as e:
        logger.error(f"提交任务失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'提交任务失败: {str(e)}'
        }), 500


@admin_bp.route('/api/tasks/<task_id>/status', methods=['GET'])
def get_task_status(task_id: str):
    """
    查询任务状态

    Args:
        task_id: 任务ID

    Returns:
        {
            "task_id": "xxx",
            "status": "pending|processing|completed|failed",
            "progress": 0-100,
            "result": {...},
            "error": null,
            "created_at": "2026-02-08T12:00:00",
            "started_at": "2026-02-08T12:00:01",
            "completed_at": "2026-02-08T12:00:05"
        }
    """
    try:
        # 从结果桶获取结果
        task_result = result_bucket.get_result(task_id)

        if task_result:
            # 任务已完成
            return jsonify({
                'task_id': task_id,
                'status': 'completed' if task_result.success else 'failed',
                'result': task_result.data,
                'error': task_result.error,
                'file_path': task_result.file_path,
                'url': task_result.url
            })

        # 从高速桶查找
        task = high_speed_bucket.get_task(task_id)
        if task:
            return jsonify(task.to_dict())

        # 从低速桶查找
        task = low_speed_bucket.get_task(task_id)
        if task:
            return jsonify(task.to_dict())

        # 未找到任务
        return jsonify({
            'success': False,
            'message': '任务不存在或已过期'
        }), 404

    except Exception as e:
        logger.error(f"查询任务状态失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'查询任务状态失败: {str(e)}'
        }), 500


@admin_bp.route('/api/tasks/buckets/status', methods=['GET'])
def get_buckets_status():
    """
    获取桶状态

    Returns:
        {
            "high_speed_bucket": {
                "size": 10,
                "max_size": 100
            },
            "low_speed_bucket": {
                "size": 50,
                "max_size": 1000
            },
            "result_bucket": {
                "size": 100,
                "max_size": 10000
            },
            "worker_pool": {
                "num_workers": 4,
                "running": true
            }
        }
    """
    try:
        worker_pool_status = get_worker_pool().get_status()

        return jsonify({
            'high_speed_bucket': {
                'size': high_speed_bucket.size(),
                'max_size': high_speed_bucket.max_size
            },
            'low_speed_bucket': {
                'size': low_speed_bucket.size(),
                'max_size': low_speed_bucket.max_size
            },
            'result_bucket': {
                'size': result_bucket.size(),
                'max_size': result_bucket.max_size
            },
            'worker_pool': {
                'num_workers': worker_pool_status['num_workers'],
                'running': worker_pool_status['running']
            }
        })

    except Exception as e:
        logger.error(f"获取桶状态失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'获取桶状态失败: {str(e)}'
        }), 500


@admin_bp.route('/api/tasks/buckets/high_speed/tasks', methods=['GET'])
def get_high_speed_tasks():
    """获取高速桶中的所有任务"""
    try:
        tasks = high_speed_bucket.get_all_tasks()
        return jsonify({
            'success': True,
            'tasks': [task.to_dict() for task in tasks]
        })
    except Exception as e:
        logger.error(f"获取高速桶任务失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'获取失败: {str(e)}'
        }), 500


@admin_bp.route('/api/tasks/buckets/low_speed/tasks', methods=['GET'])
def get_low_speed_tasks():
    """获取低速桶中的所有任务"""
    try:
        tasks = low_speed_bucket.get_all_tasks()
        return jsonify({
            'success': True,
            'tasks': [task.to_dict() for task in tasks]
        })
    except Exception as e:
        logger.error(f"获取低速桶任务失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'获取失败: {str(e)}'
        }), 500


@admin_bp.route('/api/tasks/<task_id>/cancel', methods=['POST'])
def cancel_task(task_id: str):
    """
    取消任务

    Args:
        task_id: 任务ID

    Returns:
        {
            "success": true/false,
            "message": "任务已取消"
        }
    """
    try:
        # 从高速桶移除
        removed = high_speed_bucket.remove_by_id(task_id)
        if removed:
            removed.status = TaskStatus.CANCELLED
            return jsonify({
                'success': True,
                'message': '任务已取消'
            })

        # 从低速桶移除
        removed = low_speed_bucket.remove_by_id(task_id)
        if removed:
            removed.status = TaskStatus.CANCELLED
            return jsonify({
                'success': True,
                'message': '任务已取消'
            })

        return jsonify({
            'success': False,
            'message': '任务不存在或已执行完成'
        }), 404

    except Exception as e:
        logger.error(f"取消任务失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'取消任务失败: {str(e)}'
        }), 500
