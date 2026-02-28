"""
站点定时任务调度器
根据站点配置中的schedule设置，定时批量提交爬取任务
"""

import threading
import time
from datetime import datetime, timedelta
from utils.config_loader import load_sites_config
from utils.logger import get_logger

logger = get_logger(__name__)


class SiteScheduler:
    """站点定时任务调度器"""

    # 任务类型到TaskType枚举的映射
    TASK_TYPES = {
        'list_page': 'LIST_PAGE',
        'info_page': 'INFO_PAGE',
        'content_page': 'CONTENT_PAGE',
        'comment_page': 'COMMENT_PAGE',
        'cover_image': 'COVER_IMAGE',
        'thumbnail_image': 'THUMBNAIL_IMAGE',
        'content_image': 'CONTENT_IMAGE',
    }

    # 任务类型到爬虫类名后缀的映射
    TASK_TYPE_TO_CLASS_SUFFIX = {
        'list_page': 'ListCrawler',
        'info_page': 'InfoCrawler',
        'content_page': 'ContentCrawler',
        'comment_page': 'CommentsCrawler',
        'cover_image': 'CoverImageCrawler',
        'thumbnail_image': 'ThumbnailCrawler',
        'content_image': 'ContentImageCrawler',
    }

    # 任务类型到文件名的映射
    TASK_TYPE_TO_FILE = {
        'list_page': 'list_crawler',
        'info_page': 'info_crawler',
        'content_page': 'content_crawler',
        'comment_page': 'comments_crawler',
        'cover_image': 'cover_crawler',
        'thumbnail_image': 'thumbnail_crawler',
        'content_image': 'content_image_crawler',
    }

    def __init__(self):
        self.running = False
        self.thread = None
        self.check_interval = 60  # 每60秒检查一次是否有任务需要执行
        # 记录每个站点每个任务的下次执行时间
        self.next_run_times = {}  # {site_id: {task_type: datetime}}

    def start(self):
        """启动调度器"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()
            logger.info("站点定时任务调度器已启动")

    def stop(self):
        """停止调度器"""
        if self.running:
            self.running = False
            if self.thread:
                self.thread.join(timeout=5)
            logger.info("站点定时任务调度器已停止")

    def _run_loop(self):
        """调度器主循环"""
        while self.running:
            try:
                self._check_and_run_tasks()
            except Exception as e:
                logger.error(f"站点调度器执行错误: {e}", exc_info=True)
            time.sleep(self.check_interval)

    def _check_and_run_tasks(self):
        """检查并运行到期的站点任务"""
        sites_config = load_sites_config()
        current_time = datetime.now()

        for site_id, site_config in sites_config.items():
            # 检查站点是否启用
            if not site_config.get('enabled', False):
                continue

            # 获取调度配置
            schedule = site_config.get('schedule', {})
            crawl_limits = site_config.get('crawl_limits', {})

            # 初始化该站点的下次执行时间记录
            if site_id not in self.next_run_times:
                self.next_run_times[site_id] = {}

            # 遍历所有任务类型
            for task_type, interval in schedule.items():
                # interval为0表示不启用该任务
                if interval == 0:
                    continue

                # 检查任务类型是否支持
                if task_type not in self.TASK_TYPES:
                    logger.warning(f"不支持的任务类型: {task_type}")
                    continue

                # 检查是否到了执行时间
                next_run = self.next_run_times[site_id].get(task_type)

                # 如果没有记录，初始化为当前时间+间隔时间（首次运行）
                if next_run is None:
                    next_run = current_time + timedelta(hours=interval)
                    self.next_run_times[site_id][task_type] = next_run
                    continue

                # 检查是否到期
                if current_time >= next_run:
                    # 执行任务
                    self._execute_site_task(site_id, task_type, crawl_limits)

                    # 更新下次执行时间（单位：小时）
                    next_run_time = current_time + timedelta(hours=interval)
                    self.next_run_times[site_id][task_type] = next_run_time
                    logger.debug(f"站点 {site_id} 的任务 {task_type} 下次执行时间: {next_run_time}")

    def _execute_site_task(self, site_id: str, task_type: str, crawl_limits: dict):
        """执行站点的指定任务"""
        try:
            logger.info(f"开始执行站点任务: site={site_id}, task={task_type}")

            # 获取任务类型枚举
            task_type_str = self.TASK_TYPES.get(task_type)
            if not task_type_str:
                logger.error(f"不支持的任务类型: {task_type}")
                return

            # 动态导入爬虫类
            # 模块名格式：crawlers.{site_id}.{site_id}_{file_name}
            # 例如：crawlers.km.km_info_crawler
            file_name = self.TASK_TYPE_TO_FILE.get(task_type, f"{task_type}_crawler")
            module_name = f"crawlers.{site_id}.{site_id}_{file_name}"

            # 类名格式：{SITE_ID}{Suffix}
            # 例如：KMInfoCrawler
            class_suffix = self.TASK_TYPE_TO_CLASS_SUFFIX.get(task_type, task_type.title().replace('_', '') + 'Crawler')
            class_name = f"{site_id.upper()}{class_suffix}"

            try:
                import importlib
                module = importlib.import_module(module_name)
                crawler_class = getattr(module, class_name)
                crawler = crawler_class()
                logger.debug(f"成功加载爬虫类: {module_name}.{class_name}")
            except (ImportError, AttributeError) as e:
                logger.error(f"加载爬虫类失败: module={module_name}, class={class_name}, error={e}")
                return

            # 获取爬取限制
            limit_key = f"{task_type}_max"
            max_count = crawl_limits.get(limit_key, 100)

            # 获取需要爬取的数据
            # 列表页使用 max_pages，其他使用 max_count
            if task_type == 'list_page':
                data_list = crawler.get_crawler_data(site_id=site_id, max_pages=max_count)
            else:
                data_list = crawler.get_crawler_data(site_id=site_id, max_count=max_count)

            if not data_list:
                logger.info(f"站点 {site_id} 的任务 {task_type} 没有需要处理的数据")
                return

            # 导入任务提交器
            from services import TaskSubmitter, TaskType, TaskPriority, TaskSource

            # 获取TaskType枚举
            # task_type 格式如 'list_page'， 'info_page' 等，需要转换为 TaskType 枚举名格式
            # 例如： list_page -> LIST_PAGE
            task_type_enum_name = self.TASK_TYPES.get(task_type)
            if not task_type_enum_name:
                logger.error(f"不支持的任务类型: {task_type}")
                return
            task_type_enum = getattr(TaskType, task_type_enum_name)

            # 批量提交任务到低速桶
            submitted_count = 0
            failed_count = 0

            for data in data_list:
                try:
                    # 构建任务参数
                    params = {'site': site_id}
                    params.update(data)

                    # 提交任务到低速桶
                    result = TaskSubmitter.submit_task(
                        task_type=task_type_enum,
                        params=params,
                        priority=TaskPriority.LOW,
                        source=TaskSource.SCHEDULED
                    )

                    if result['success']:
                        submitted_count += 1
                        logger.debug(f"任务提交成功: site={site_id}, task={task_type}, data={data}")
                    else:
                        failed_count += 1
                        logger.warning(f"任务提交失败: site={site_id}, task={task_type}, message={result.get('message')}")

                        # 如果桶满了，停止提交
                        if '已满' in result.get('message', ''):
                            logger.warning(f"桶已满，停止提交。已成功提交{submitted_count}个任务")
                            break

                except Exception as e:
                    failed_count += 1
                    logger.error(f"提交任务异常: site={site_id}, task={task_type}, data={data}, error={e}")
                    continue

            logger.info(f"站点任务执行完成: site={site_id}, task={task_type}, 成功={submitted_count}, 失败={failed_count}, 总计={len(data_list)}")

        except Exception as e:
            logger.error(f"执行站点任务异常: site={site_id}, task={task_type}, error={e}", exc_info=True)

    def run_site_task_now(self, site_id: str, task_type: str):
        """立即执行指定站点的指定任务"""
        try:
            sites_config = load_sites_config()
            site_config = sites_config.get(site_id)

            if not site_config:
                return {
                    'success': False,
                    'message': f'站点不存在: {site_id}'
                }

            # 获取爬取限制
            crawl_limits = site_config.get('crawl_limits', {})

            # 执行任务
            self._execute_site_task(site_id, task_type, crawl_limits)

            return {
                'success': True,
                'message': f'站点 {site_id} 的任务 {task_type} 已触发执行'
            }

        except Exception as e:
            logger.error(f"手动触发站点任务失败: site={site_id}, task={task_type}, error={e}", exc_info=True)
            return {
                'success': False,
                'message': f'触发任务失败: {str(e)}'
            }

    def get_status(self):
        """获取所有站点任务的调度状态"""
        try:
            sites_config = load_sites_config()
            current_time = datetime.now()
            status = []

            for site_id, site_config in sites_config.items():
                site_info = {
                    'site_id': site_id,
                    'site_name': site_config.get('site_name', site_id),
                    'enabled': site_config.get('enabled', False),
                    'tasks': []
                }

                # 获取调度配置
                schedule = site_config.get('schedule', {})

                # 初始化该站点的下次执行时间记录
                if site_id not in self.next_run_times:
                    self.next_run_times[site_id] = {}

                # 遍历所有任务类型
                for task_type, interval in schedule.items():
                    # interval为0表示不启用
                    enabled = interval != 0

                    # 获取下次执行时间
                    next_run = self.next_run_times.get(site_id, {}).get(task_type)

                    # 如果没有记录，初始化为当前时间+间隔时间（首次运行）
                    if next_run is None and enabled:
                        next_run = current_time + timedelta(hours=interval)
                        self.next_run_times[site_id][task_type] = next_run

                    # 计算剩余时间（秒）
                    remaining_seconds = None
                    if next_run:
                        delta = next_run - current_time
                        remaining_seconds = max(0, int(delta.total_seconds()))

                    # 任务类型显示名称
                    task_names = {
                        'list_page': '列表页更新',
                        'info_page': '详情页更新',
                        'content_page': '内容页下载',
                        'comment_page': '评论页更新',
                        'cover_image': '封面图片更新',
                        'thumbnail_image': '缩略图更新',
                        'content_image': '内容图片更新',
                    }

                    site_info['tasks'].append({
                        'task_type': task_type,
                        'task_name': task_names.get(task_type, task_type),
                        'enabled': enabled,
                        'interval': interval,  # 小时
                        'next_run': next_run.isoformat() if next_run else None,
                        'remaining_seconds': remaining_seconds
                    })

                status.append(site_info)

            return {
                'success': True,
                'data': status
            }

        except Exception as e:
            logger.error(f"获取站点调度状态失败: {e}", exc_info=True)
            return {
                'success': False,
                'message': f'获取状态失败: {str(e)}',
                'data': []
            }


# 全局站点调度器实例
site_scheduler = SiteScheduler()
