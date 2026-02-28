"""
定时任务模块
每个.py文件代表一个定时任务
"""

from .base_task import BaseTask
from .refresh_cm_cookies import RefreshCMCookiesTask


# 所有可用的定时任务
AVAILABLE_TASKS = {
    'refresh_cm_cookies': RefreshCMCookiesTask,

}


def get_task(task_id):
    """获取指定的定时任务实例"""
    task_class = AVAILABLE_TASKS.get(task_id)
    if task_class:
        return task_class()
    return None


def list_all_tasks():
    """列出所有可用的定时任务"""
    tasks = []
    for task_id, task_class in AVAILABLE_TASKS.items():
        task_instance = task_class()
        tasks.append({
            'id': task_id,
            'name': task_instance.name,
            'description': task_instance.description,
            'version': task_instance.version
        })
    return tasks
