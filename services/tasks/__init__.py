"""
任务系统模块
"""

from .task_model import Task, TaskResult, TaskStatus, TaskType, TaskPriority, TaskSource
from .buckets import high_speed_bucket, low_speed_bucket, result_bucket, processing_bucket, HighSpeedBucket, LowSpeedBucket, ResultBucket, ProcessingBucket
from .worker import TaskWorker, WorkerPool, get_worker_pool
from .task_submitter import TaskSubmitter

__all__ = [
    # 任务模型
    'Task',
    'TaskResult',
    'TaskStatus',
    'TaskType',
    'TaskPriority',
    'TaskSource',

    # 桶
    'high_speed_bucket',
    'low_speed_bucket',
    'result_bucket',
    'processing_bucket',
    'HighSpeedBucket',
    'LowSpeedBucket',
    'ResultBucket',
    'ProcessingBucket',

    # Worker
    'TaskWorker',
    'WorkerPool',
    'get_worker_pool',

    # 任务提交器
    'TaskSubmitter',
]
