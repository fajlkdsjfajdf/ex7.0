"""
任务提交器 - 将任务提交到桶系统
"""

from typing import Dict, List, Any
from services.tasks.task_model import Task, TaskType, TaskPriority, TaskSource
from services.tasks.buckets import high_speed_bucket, low_speed_bucket
from utils.logger import get_logger

logger = get_logger(__name__)


class TaskSubmitter:
    """任务提交器 - 统一的任务提交接口"""

    @staticmethod
    def submit_task(
        task_type: TaskType,
        params: Dict[str, Any],
        priority: TaskPriority = TaskPriority.HIGH,
        source: TaskSource = TaskSource.MANUAL
    ) -> Dict[str, Any]:
        """
        提交任务到桶

        Args:
            task_type: 任务类型
            params: 任务参数
            priority: 优先级
            source: 任务来源

        Returns:
            提交结果 {'success': bool, 'task_id': str, 'message': str}
        """
        # 创建任务
        task = Task(
            task_type=task_type,
            priority=priority,
            source=source,
            params=params
        )

        # 根据优先级选择桶
        if priority == TaskPriority.HIGH:
            # 高优先级 -> 高速桶
            result = high_speed_bucket.push(task)
        else:
            # 低优先级 -> 低速桶
            result = low_speed_bucket.enqueue(task)

        if result['success']:
            return {
                'success': True,
                'task_id': task.task_id,
                'message': f'任务已提交到{"高速桶" if priority == TaskPriority.HIGH else "低速桶"}',
                'bucket': 'high_speed' if priority == TaskPriority.HIGH else 'low_speed'
            }
        else:
            return result

    @staticmethod
    def submit_list_page(page: int = 1, priority: TaskPriority = TaskPriority.LOW) -> Dict[str, Any]:
        """提交列表页爬取任务"""
        return TaskSubmitter.submit_task(
            task_type=TaskType.LIST_PAGE,
            params={'page': page},
            priority=priority,
            source=TaskSource.SCHEDULED
        )

    @staticmethod
    def submit_info_page(aid: int, priority: TaskPriority = TaskPriority.HIGH) -> Dict[str, Any]:
        """提交信息页爬取任务"""
        return TaskSubmitter.submit_task(
            task_type=TaskType.INFO_PAGE,
            params={'aid': aid},
            priority=priority,
            source=TaskSource.FRONTEND
        )

    @staticmethod
    def submit_content_page(aid: int, scramble_id: int = None, priority: TaskPriority = TaskPriority.HIGH) -> Dict[str, Any]:
        """提交内容页爬取任务"""
        params = {'aid': aid}
        if scramble_id:
            params['scramble_id'] = scramble_id

        return TaskSubmitter.submit_task(
            task_type=TaskType.CONTENT_PAGE,
            params=params,
            priority=priority,
            source=TaskSource.FRONTEND
        )

    @staticmethod
    def submit_comment_page(aid: int, page: int = 1, priority: TaskPriority = TaskPriority.LOW) -> Dict[str, Any]:
        """提交评论页爬取任务"""
        return TaskSubmitter.submit_task(
            task_type=TaskType.COMMENT_PAGE,
            params={'aid': aid, 'page': page},
            priority=priority,
            source=TaskSource.SCHEDULED
        )

    @staticmethod
    def submit_cover_image(aid: int, cover_url: str, priority: TaskPriority = TaskPriority.HIGH) -> Dict[str, Any]:
        """提交封面图片下载任务"""
        return TaskSubmitter.submit_task(
            task_type=TaskType.COVER_IMAGE,
            params={'aid': aid, 'cover_url': cover_url},
            priority=priority,
            source=TaskSource.FRONTEND
        )

    @staticmethod
    def submit_thumbnail_image(items: List[Dict[str, Any]], priority: TaskPriority = TaskPriority.LOW) -> Dict[str, Any]:
        """提交缩略图批量下载任务"""
        return TaskSubmitter.submit_task(
            task_type=TaskType.THUMBNAIL_IMAGE,
            params={'items': items},
            priority=priority,
            source=TaskSource.SCHEDULED
        )

    @staticmethod
    def submit_content_image(aid: int, image_urls: List[str], priority: TaskPriority = TaskPriority.HIGH) -> Dict[str, Any]:
        """提交内容图片下载任务"""
        return TaskSubmitter.submit_task(
            task_type=TaskType.CONTENT_IMAGE,
            params={'aid': aid, 'image_urls': image_urls},
            priority=priority,
            source=TaskSource.FRONTEND
        )
