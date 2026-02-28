"""
三桶系统实现
高速桶、低速桶、结果桶
"""

import threading
import json
import os
from collections import deque
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from services.tasks.task_model import Task, TaskResult, TaskStatus, TaskPriority
from utils.logger import get_logger

logger = get_logger(__name__)


def load_bucket_config():
    """从配置文件加载桶容量配置"""
    try:
        # 配置文件路径（统一使用根目录下的data文件夹）
        config_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                                   'data', 'bucket_config.json')

        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
                logger.info(f"从配置文件加载桶配置: {config}")
                return config
        else:
            logger.warning(f"桶配置文件不存在: {config_file}，使用默认值")
            return {
                'high_speed_max': 100,
                'low_speed_max': 1000,
                'result_max': 10000
            }
    except Exception as e:
        logger.error(f"加载桶配置失败: {e}，使用默认值")
        return {
            'high_speed_max': 100,
            'low_speed_max': 1000,
            'result_max': 10000
        }


class HighSpeedBucket:
    """高速桶 - 接收前台请求，栈结构（先进后出）"""

    def __init__(self, max_size: int = 100):
        self.max_size = max_size
        self._stack = []  # 使用列表作为栈
        self._lock = threading.Lock()
        self._task_map = {}  # task_id -> Task，用于快速查找

    def push(self, task: Task) -> Dict[str, Any]:
        """
        推入任务（栈顶）

        Args:
            task: 任务对象

        Returns:
            操作结果 {'success': bool, 'message': str}
        """
        with self._lock:
            if len(self._stack) >= self.max_size:
                return {'success': False, 'message': f'高速桶已满（max_size={self.max_size}）'}

            self._stack.append(task)
            self._task_map[task.task_id] = task

            logger.info(f"任务推入高速桶: {task.task_id} ({task.task_type.value}), 栈大小: {len(self._stack)}")
            return {'success': True, 'message': '任务已推入高速桶'}

    def pop(self) -> Optional[Task]:
        """
        取出任务（栈顶）

        Returns:
            任务对象，如果桶为空返回None
        """
        with self._lock:
            if not self._stack:
                return None

            task = self._stack.pop()
            # 从map中移除
            if task.task_id in self._task_map:
                del self._task_map[task.task_id]

            logger.info(f"任务从高速桶取出: {task.task_id} ({task.task_type.value}), 栈大小: {len(self._stack)}")
            return task

    def remove_by_id(self, task_id: str) -> Optional[Task]:
        """
        根据ID移除任务

        Args:
            task_id: 任务ID

        Returns:
            被移除的任务，如果不存在返回None
        """
        with self._lock:
            # 从栈中查找并移除
            for i, task in enumerate(self._stack):
                if task.task_id == task_id:
                    removed = self._stack.pop(i)
                    if task_id in self._task_map:
                        del self._task_map[task_id]
                    logger.info(f"任务从高速桶移除: {task_id}")
                    return removed
            return None

    def get_task(self, task_id: str) -> Optional[Task]:
        """获取任务（不移除）"""
        with self._lock:
            return self._task_map.get(task_id)

    def size(self) -> int:
        """获取桶中任务数量"""
        with self._lock:
            return len(self._stack)

    def is_empty(self) -> bool:
        """是否为空"""
        with self._lock:
            return len(self._stack) == 0

    def peek(self) -> Optional[Task]:
        """查看栈顶任务（不移除）"""
        with self._lock:
            return self._stack[-1] if self._stack else None

    def clear(self):
        """清空桶"""
        with self._lock:
            count = len(self._stack)
            self._stack.clear()
            self._task_map.clear()
            logger.info(f"高速桶已清空: 移除 {count} 个任务")

    def get_all_tasks(self) -> List[Task]:
        """获取所有任务（用于展示）"""
        with self._lock:
            return list(self._stack)

    def set_max_size(self, max_size: int):
        """设置最大容量"""
        with self._lock:
            self.max_size = max_size
            logger.info(f"高速桶最大容量已更新为: {max_size}")


class LowSpeedBucket:
    """低速桶 - 接收后台定时任务，队列结构（先进先出）"""

    def __init__(self, max_size: int = 1000):
        self.max_size = max_size
        self._queue = deque()  # 使用deque作为队列
        self._lock = threading.Lock()
        self._task_map = {}

    def enqueue(self, task: Task) -> Dict[str, Any]:
        """
        入队

        Args:
            task: 任务对象

        Returns:
            操作结果 {'success': bool, 'message': str}
        """
        with self._lock:
            if len(self._queue) >= self.max_size:
                return {'success': False, 'message': f'低速桶已满（max_size={self.max_size}）'}

            self._queue.append(task)
            self._task_map[task.task_id] = task

            logger.info(f"任务入低速桶: {task.task_id} ({task.task_type.value}), 队列大小: {len(self._queue)}")
            return {'success': True, 'message': '任务已入低速桶'}

    def dequeue(self) -> Optional[Task]:
        """
        出队

        Returns:
            任务对象，如果队列为空返回None
        """
        with self._lock:
            if not self._queue:
                return None

            task = self._queue.popleft()
            if task.task_id in self._task_map:
                del self._task_map[task.task_id]

            logger.info(f"任务出低速桶: {task.task_id} ({task.task_type.value}), 队列大小: {len(self._queue)}")
            return task

    def remove_by_id(self, task_id: str) -> Optional[Task]:
        """根据ID移除任务"""
        with self._lock:
            # 在队列中查找并移除
            for i, task in enumerate(self._queue):
                if task.task_id == task_id:
                    # 将队列转换为列表，移除元素，再转回deque
                    temp_list = list(self._queue)
                    removed = temp_list.pop(i)
                    self._queue = deque(temp_list)
                    if task_id in self._task_map:
                        del self._task_map[task_id]
                    logger.info(f"任务从低速桶移除: {task_id}")
                    return removed
            return None

    def get_task(self, task_id: str) -> Optional[Task]:
        """获取任务（不移除）"""
        with self._lock:
            return self._task_map.get(task_id)

    def size(self) -> int:
        """获取队列长度"""
        with self._lock:
            return len(self._queue)

    def is_empty(self) -> bool:
        """是否为空"""
        with self._lock:
            return len(self._queue) == 0

    def clear(self):
        """清空队列"""
        with self._lock:
            count = len(self._queue)
            self._queue.clear()
            self._task_map.clear()
            logger.info(f"低速桶已清空: 移除 {count} 个任务")

    def get_all_tasks(self) -> List[Task]:
        """获取所有任务（用于展示）"""
        with self._lock:
            return list(self._queue)

    def set_max_size(self, max_size: int):
        """设置最大容量"""
        with self._lock:
            self.max_size = max_size
            logger.info(f"低速桶最大容量已更新为: {max_size}")


class ResultBucket:
    """结果桶 - 存储任务执行结果"""

    def __init__(self, max_size: int = 10000, ttl_hours: int = 24):
        """
        Args:
            max_size: 最大结果数量
            ttl_hours: 结果保留时间（小时）
        """
        self.max_size = max_size
        self.ttl_hours = ttl_hours
        self._results: Dict[str, TaskResult] = {}  # task_id -> TaskResult
        self._lock = threading.Lock()

    def save_result(self, result: TaskResult) -> bool:
        """
        保存任务结果

        Args:
            result: 任务结果

        Returns:
            是否成功
        """
        with self._lock:
            # 如果超过最大数量，删除最旧的结果
            if len(self._results) >= self.max_size:
                # 找到最旧的结果并删除
                oldest_task_id = min(self._results.keys(),
                                     key=lambda k: self._results[k].metadata.get('created_at', datetime.now()))
                del self._results[oldest_task_id]
                logger.debug(f"结果桶已满，删除最旧结果: {oldest_task_id}")

            self._results[result.task_id] = result
            result.metadata['created_at'] = datetime.now()
            logger.info(f"任务结果已保存: {result.task_id}, 成功: {result.success}")
            return True

    def get_result(self, task_id: str) -> Optional[TaskResult]:
        """
        获取任务结果

        Args:
            task_id: 任务ID

        Returns:
            任务结果，如果不存在返回None
        """
        with self._lock:
            result = self._results.get(task_id)

            # 检查是否过期
            if result and result.metadata.get('created_at'):
                created_at = result.metadata['created_at']
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at)

                if datetime.now() - created_at > timedelta(hours=self.ttl_hours):
                    del self._results[task_id]
                    logger.debug(f"任务结果已过期并删除: {task_id}")
                    return None

            return result

    def remove_result(self, task_id: str) -> bool:
        """移除任务结果"""
        with self._lock:
            if task_id in self._results:
                del self._results[task_id]
                logger.info(f"任务结果已移除: {task_id}")
                return True
            return False

    def cleanup_expired(self) -> int:
        """清理过期结果"""
        with self._lock:
            expired_ids = []
            cutoff_time = datetime.now() - timedelta(hours=self.ttl_hours)

            for task_id, result in self._results.items():
                created_at = result.metadata.get('created_at')
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at)

                if created_at and created_at < cutoff_time:
                    expired_ids.append(task_id)

            for task_id in expired_ids:
                del self._results[task_id]

            if expired_ids:
                logger.info(f"清理过期结果: {len(expired_ids)} 个")

            return len(expired_ids)

    def clear(self):
        """清空结果桶"""
        with self._lock:
            count = len(self._results)
            self._results.clear()
            logger.info(f"结果桶已清空: 移除 {count} 个结果")

    def size(self) -> int:
        """获取结果数量"""
        with self._lock:
            return len(self._results)

    def get_all_results(self) -> List[TaskResult]:
        """获取所有结果"""
        with self._lock:
            return list(self._results.values())

    def set_max_size(self, max_size: int):
        """设置最大容量"""
        with self._lock:
            self.max_size = max_size
            logger.info(f"结果桶最大容量已更新为: {max_size}")


class ProcessingBucket:
    """运行中桶 - 存储正在执行的任务"""

    def __init__(self, max_size: int = 100):
        self.max_size = max_size
        self._tasks: Dict[str, Task] = {}  # task_id -> Task
        self._lock = threading.Lock()

    def add(self, task: Task) -> bool:
        """
        添加正在运行的任务

        Args:
            task: 任务对象

        Returns:
            是否成功
        """
        with self._lock:
            if len(self._tasks) >= self.max_size:
                logger.warning(f"运行中桶已满（max_size={self.max_size}）")
                return False

            self._tasks[task.task_id] = task
            logger.info(f"任务加入运行中桶: {task.task_id} ({task.task_type.value})")
            return True

    def remove(self, task_id: str) -> Optional[Task]:
        """移除任务"""
        with self._lock:
            if task_id in self._tasks:
                task = self._tasks.pop(task_id)
                logger.info(f"任务从运行中桶移除: {task_id}")
                return task
            return None

    def get_task(self, task_id: str) -> Optional[Task]:
        """获取任务（不移除）"""
        with self._lock:
            return self._tasks.get(task_id)

    def size(self) -> int:
        """获取任务数量"""
        with self._lock:
            return len(self._tasks)

    def is_empty(self) -> bool:
        """是否为空"""
        with self._lock:
            return len(self._tasks) == 0

    def get_all_tasks(self) -> List[Task]:
        """获取所有任务（用于展示）"""
        with self._lock:
            return list(self._tasks.values())


# 全局单例 - 从配置文件初始化
_bucket_config = load_bucket_config()
high_speed_bucket = HighSpeedBucket(max_size=_bucket_config.get('high_speed_max', 100))
low_speed_bucket = LowSpeedBucket(max_size=_bucket_config.get('low_speed_max', 1000))
result_bucket = ResultBucket(max_size=_bucket_config.get('result_max', 10000), ttl_hours=24)
processing_bucket = ProcessingBucket(max_size=100)  # 运行中桶

logger.info(f"三桶系统初始化完成: 高速桶容量={high_speed_bucket.max_size}, "
           f"低速桶容量={low_speed_bucket.max_size}, 结果桶容量={result_bucket.max_size}")


class Buckets:
    """桶系统管理类"""

    def __init__(self):
        self.high_speed = high_speed_bucket
        self.low_speed = low_speed_bucket
        self.result = result_bucket

    def submit_to_high_speed_bucket(self, task):
        """提交任务到高速桶"""
        result = self.high_speed.push(task)
        if result['success']:
            return task.task_id
        else:
            raise Exception(result['message'])

    def get_task_from_result_bucket(self, task_id):
        """从结果桶获取任务"""
        task_result = self.result.get_result(task_id)
        if task_result:
            # 返回一个简单的任务对象
            return TaskResult(
                task_id=task_id,
                success=task_result.success,
                result=task_result.result,
                error=task_result.error,
                metadata=task_result.metadata
            )
        return None


# 全局桶管理器实例
_buckets_manager = Buckets()


def get_buckets():
    """获取桶管理器实例"""
    return _buckets_manager


def get_result_bucket():
    """获取结果桶实例"""
    return result_bucket
