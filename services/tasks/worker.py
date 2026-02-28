"""
任务Worker - 从桶中取任务并执行
"""

import threading
import time
import asyncio
from datetime import datetime
from typing import Optional
from services.tasks.buckets import high_speed_bucket, low_speed_bucket, result_bucket, processing_bucket
from services.tasks.task_model import Task, TaskResult, TaskStatus, TaskType, TaskPriority
from crawlers.task_runner import TaskRunner
from utils.logger import get_logger

logger = get_logger(__name__)


class TaskWorker:
    """任务Worker - 从桶中取任务并执行"""

    def __init__(self, worker_id: int):
        self.worker_id = worker_id
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        """启动Worker"""
        if self._running:
            logger.warning(f"Worker {self.worker_id} 已在运行")
            return

        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        logger.info(f"Worker {self.worker_id} 已启动")

    def stop(self):
        """停止Worker"""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
            logger.info(f"Worker {self.worker_id} 已停止")

    def _run_loop(self):
        """Worker主循环"""
        logger.info(f"Worker {self.worker_id} 进入工作循环")

        while self._running:
            try:
                # 优先从高速桶取任务
                task = high_speed_bucket.pop()

                # 如果高速桶为空，从低速桶取
                if task is None:
                    task = low_speed_bucket.dequeue()

                if task is None:
                    # 两个桶都为空，等待一段时间
                    time.sleep(1)
                    continue

                # 执行任务
                logger.info(f"Worker {self.worker_id} 开始执行任务: {task.task_id} ({task.task_type.value})")
                self._execute_task(task)

            except Exception as e:
                logger.error(f"Worker {self.worker_id} 执行任务异常: {e}", exc_info=True)
                time.sleep(5)  # 异常后等待一段时间

        logger.info(f"Worker {self.worker_id} 退出工作循环")

    def _execute_task(self, task: Task):
        """执行单个任务"""
        # 更新任务状态
        task.status = TaskStatus.PROCESSING
        task.started_at = datetime.now()

        # 添加到运行中桶
        processing_bucket.add(task)

        try:
            # 根据任务类型调用对应的爬虫
            result = self._run_crawler(task)

            if result.get('success'):
                # 任务成功
                task.status = TaskStatus.COMPLETED
                task.progress = 100.0
                task.result = result.get('data')
                task.completed_at = datetime.now()

                # 从request_info中提取调试信息（兼容新旧格式）
                request_info = result.get('request_info', {})

                # 保存到结果桶（包含详细信息）
                task_result = TaskResult(
                    task_id=task.task_id,
                    success=True,
                    data=result.get('data'),
                    file_path=result.get('file_path'),
                    url=result.get('url'),
                    metadata={
                        'created_at': datetime.now(),
                        'task_type': task.task_type.value,
                        'task_params': task.params,  # 包含任务参数，用于图片预览
                        'request_url': result.get('request_url') or request_info.get('url'),
                        'response_data': result.get('response_data') or request_info.get('response_data'),  # 原始响应数据
                        'response_html': result.get('response_html') or request_info.get('response_text'),    # HTML响应
                        'cookies': result.get('cookies') or request_info.get('cookies'),
                        'headers': result.get('headers') or request_info.get('headers'),
                        'response_status': request_info.get('response_status'),
                        'response_headers': request_info.get('response_headers'),
                        'request_method': request_info.get('method'),
                        'site': task.params.get('site_id') or task.params.get('site', 'cm'),
                        # 添加业务参数的便捷访问字段
                        'comic_id': task.params.get('comic_id') or task.params.get('aid'),
                        'chapter_id': task.params.get('chapter_id') or task.params.get('pid'),
                        'page': task.params.get('page'),
                        'image_type': task.params.get('image_type') or task.params.get('type', 'content')
                    }
                )
                result_bucket.save_result(task_result)

                # 发送WebSocket通知
                try:
                    from services.websocket_service import get_websocket_service
                    ws_service = get_websocket_service()

                    # 构造通知数据
                    notification_data = {
                        'task_id': task.task_id,
                        'task_type': task.task_type.value,
                        'resource_type': task.params.get('resource_type'),
                        'params': task.params,
                        'result': result.get('data')
                    }

                    ws_service.notify_task_complete(task.task_id, notification_data)
                except Exception as e:
                    logger.warning(f"发送WebSocket通知失败: {e}")

                logger.info(f"任务执行成功: {task.task_id}")

                # 从运行中桶移除
                processing_bucket.remove(task.task_id)
            else:
                # 任务失败 - 检查是否需要重试
                task.retry_count += 1

                if task.retry_count < task.max_retries:
                    # 还可以重试
                    task.status = TaskStatus.PENDING  # 重置为等待状态
                    task.progress = 0.0
                    task.started_at = None

                    # 重新加入桶（根据优先级）
                    if task.priority == TaskPriority.HIGH:
                        high_speed_bucket.push(task)
                        logger.warning(f"任务执行失败，重新加入高速桶等待重试: {task.task_id}, 重试次数={task.retry_count}/{task.max_retries}, error={task.error}")
                    else:
                        low_speed_bucket.enqueue(task)
                        logger.warning(f"任务执行失败，重新加入低速桶等待重试: {task.task_id}, 重试次数={task.retry_count}/{task.max_retries}, error={task.error}")

                    # 不保存到结果桶（等最终成功或失败后再保存）
                    # 从运行中桶移除（重试时不保留在运行中桶）
                    processing_bucket.remove(task.task_id)
                    return

                # 达到最大重试次数，标记为最终失败
                task.status = TaskStatus.FAILED
                # 兼容两种错误字段：message 和 error
                task.error = result.get('message') or result.get('error') or '未知错误'
                task.completed_at = datetime.now()

                # 从request_info中提取调试信息（兼容新旧格式）
                request_info = result.get('request_info', {})

                # 保存失败结果（也保存详细信息）
                task_result = TaskResult(
                    task_id=task.task_id,
                    success=False,
                    error=task.error,
                    metadata={
                        'created_at': datetime.now(),
                        'task_type': task.task_type.value,
                        'task_params': task.params,
                        'request_url': result.get('request_url') or request_info.get('url'),
                        'response_data': result.get('response_data') or request_info.get('response_data'),
                        'response_html': result.get('response_html') or request_info.get('response_text'),
                        'error_detail': result.get('error_detail') or result.get('error'),
                        'cookies': result.get('cookies') or request_info.get('cookies'),
                        'headers': result.get('headers') or request_info.get('headers'),
                        'response_status': request_info.get('response_status'),
                        'response_headers': request_info.get('response_headers'),
                        'request_method': request_info.get('method'),
                        'site': task.params.get('site_id') or task.params.get('site', 'cm'),
                        'retry_count': task.retry_count,
                        'max_retries': task.max_retries
                    }
                )
                result_bucket.save_result(task_result)

                # 发送WebSocket通知（失败）
                try:
                    from services.websocket_service import get_websocket_service
                    ws_service = get_websocket_service()

                    notification_data = {
                        'task_id': task.task_id,
                        'task_type': task.task_type.value,
                        'resource_type': task.params.get('resource_type'),
                        'params': task.params,
                        'error': task.error,
                        'success': False
                    }

                    ws_service.notify_task_complete(task.task_id, notification_data)
                except Exception as e:
                    logger.warning(f"发送WebSocket通知失败: {e}")

                logger.error(f"任务执行失败（已达最大重试次数）: {task.task_id}, retry_count={task.retry_count}, error={task.error}")

                # 从运行中桶移除
                processing_bucket.remove(task.task_id)

        except Exception as e:
            # 任务异常
            task.status = TaskStatus.FAILED
            task.error = str(e)
            task.completed_at = datetime.now()

            # 保存异常结果
            task_result = TaskResult(
                task_id=task.task_id,
                success=False,
                error=str(e)
            )
            result_bucket.save_result(task_result)

            # 从运行中桶移除
            processing_bucket.remove(task.task_id)

            logger.error(f"任务执行异常: {task.task_id}, error={e}", exc_info=True)

    def _run_crawler(self, task: Task) -> dict:
        """
        运行爬虫

        Args:
            task: 任务对象

        Returns:
            爬虫执行结果 {'success': bool, 'data': ..., 'message': ...}
        """
        try:
            # 调用任务运行器
            task_type = task.task_type.value  # TaskType枚举转字符串
            params = task.params

            # 从 params 中获取 site_id，支持 'site' 和 'site_id' 两种参数名
            # 优先使用 'site_id'，如果没有则尝试 'site'，最后默认使用 'cm'
            site_id = params.get('site_id') or params.get('site', 'cm')

            # 创建参数副本，排除 site_id 和 site，避免重复传递
            crawl_params = {k: v for k, v in params.items() if k not in ('site_id', 'site')}

            result = TaskRunner.run_task(site_id, task_type, **crawl_params)

            return result

        except Exception as e:
            logger.error(f"爬虫执行异常: {task.task_id}, {e}", exc_info=True)
            return {
                'success': False,
                'message': f'爬虫执行异常: {str(e)}'
            }


class WorkerPool:
    """Worker池 - 管理多个Worker"""

    def __init__(self, num_workers: int = 4):
        self.num_workers = num_workers
        self.workers: list[TaskWorker] = []
        self._running = False

    def start(self):
        """启动Worker池"""
        if self._running:
            logger.warning("Worker池已在运行")
            return

        self._running = True

        # 创建并启动所有Worker
        for i in range(self.num_workers):
            worker = TaskWorker(worker_id=i)
            worker.start()
            self.workers.append(worker)

        logger.info(f"Worker池已启动: {self.num_workers} 个Worker")

    def stop(self):
        """停止Worker池"""
        if not self._running:
            return

        self._running = False

        # 停止所有Worker
        for worker in self.workers:
            worker.stop()

        self.workers.clear()
        logger.info("Worker池已停止")

    def get_status(self) -> dict:
        """获取Worker池状态"""
        return {
            'num_workers': self.num_workers,
            'running': self._running,
            'high_speed_bucket_size': high_speed_bucket.size(),
            'low_speed_bucket_size': low_speed_bucket.size(),
            'result_bucket_size': result_bucket.size()
        }


# 全局Worker池
_worker_pool: Optional[WorkerPool] = None


def get_worker_pool() -> WorkerPool:
    """获取全局Worker池"""
    global _worker_pool
    if _worker_pool is None:
        from utils.config_loader import load_system_config
        config = load_system_config()
        num_workers = config.get('crawler_num_workers', 4)
        _worker_pool = WorkerPool(num_workers=num_workers)
    return _worker_pool
