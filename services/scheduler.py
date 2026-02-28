"""
定时任务调度器
负责任务的调度和执行
"""

import threading
import time
from datetime import datetime, timedelta
from utils.config_loader import load_scheduled_tasks_config, save_scheduled_tasks_config
from scheduled_tasks import get_task
from utils.logger import get_logger

logger = get_logger(__name__)


class TaskScheduler:
    """任务调度器"""

    def __init__(self):
        self.running = False
        self.thread = None
        self.check_interval = 60  # 每60秒检查一次是否有任务需要执行

    def start(self):
        """启动调度器"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()
            logger.info("任务调度器已启动")

    def stop(self):
        """停止调度器"""
        if self.running:
            self.running = False
            if self.thread:
                self.thread.join(timeout=5)
            logger.info("任务调度器已停止")

    def _run_loop(self):
        """调度器主循环"""
        while self.running:
            try:
                self._check_and_run_tasks()
            except Exception as e:
                logger.error(f"调度器执行错误: {e}", exc_info=True)
            time.sleep(self.check_interval)

    def _check_and_run_tasks(self):
        """检查并运行到期的任务"""
        config = load_scheduled_tasks_config()
        tasks = config.get('tasks', {})
        current_time = datetime.now()

        for task_id, task_config in tasks.items():
            # 检查任务是否启用
            if not task_config.get('enabled', False):
                continue

            # 检查是否到了执行时间
            next_run = task_config.get('next_run')
            if next_run:
                next_run_time = datetime.fromisoformat(next_run)
                if current_time >= next_run_time:
                    # 执行任务
                    self._execute_task(task_id, task_config)

    def _execute_task(self, task_id, task_config):
        """执行指定任务"""
        try:
            logger.info(f"开始执行任务: {task_id}")

            # 获取任务实例
            task_instance = get_task(task_id)
            if not task_instance:
                logger.error(f"任务不存在: {task_id}")
                return

            # 执行任务
            result = task_instance.execute(task_config.get('config', {}))

            # 更新任务配置
            config = load_scheduled_tasks_config()
            task_config_ref = config['tasks'][task_id]

            # 更新最后执行时间
            task_config_ref['last_run'] = datetime.now().isoformat()

            # 计算下次执行时间
            interval_hours = task_config_ref.get('interval_hours', 24)
            next_run_time = datetime.now() + timedelta(hours=interval_hours)
            task_config_ref['next_run'] = next_run_time.isoformat()

            # 保存配置
            save_scheduled_tasks_config(config)

            # 记录执行结果
            if result['success']:
                logger.info(f"任务 {task_id} 执行成功: {result['message']}")
            else:
                logger.error(f"任务 {task_id} 执行失败: {result['message']}")

        except Exception as e:
            logger.error(f"执行任务 {task_id} 时出错: {e}", exc_info=True)

    def run_task_now(self, task_id):
        """立即执行指定任务"""
        config = load_scheduled_tasks_config()
        tasks = config.get('tasks', {})

        if task_id not in tasks:
            return {
                'success': False,
                'message': f'任务不存在: {task_id}'
            }

        task_config = tasks[task_id]
        self._execute_task(task_id, task_config)

        return {
            'success': True,
            'message': f'任务 {task_id} 已触发执行'
        }


# 全局调度器实例
scheduler = TaskScheduler()
