"""
通用任务运行器
根据站点ID和任务类型动态执行对应的爬虫

支持多站点（CM、JM、EX等），通过站点前缀自动查找对应的爬虫类
"""

from typing import Dict, Any
from utils.logger import get_logger
import importlib

logger = get_logger(__name__)


class TaskRunner:
    """
    通用任务运行器

    根据站点ID动态加载对应的爬虫类并执行任务
    """

    @staticmethod
    def _get_crawler_class(site_id: str, task_type: str):
        """
        根据站点ID和任务类型获取对应的爬虫类

        Args:
            site_id: 站点ID（如 'cm', 'jm', 'ex'）
            task_type: 任务类型（如 'list_page', 'info_page'）

        Returns:
            爬虫类，如果未找到返回None
        """
        try:
            # 任务类型到文件名的映射
            # 例如：list_page -> list_crawler（去掉_page后缀）
            task_to_file = {
                'list_page': 'list_crawler',
                'info_page': 'info_crawler',
                'content_page': 'content_crawler',
                'comment_page': 'comments_crawler',
                'cover_image': 'cover_crawler',
                'thumbnail_image': 'thumbnail_crawler',
                'content_image': 'content_image_crawler',
            }

            # 获取文件名
            file_name = task_to_file.get(task_type, f"{task_type}_crawler")

            # 动态导入站点模块
            # 例如：site_id='cm', task_type='list_page' -> crawlers.cm.cm_list_crawler.CMListCrawler
            module_name = f"crawlers.{site_id}.{site_id}_{file_name}"

            # 尝试导入模块
            module = importlib.import_module(module_name)

            # 获取爬虫类名（例如 CMListCrawler）
            class_name = f"{site_id.upper()}{TaskRunner._task_type_to_class_name(task_type)}"
            crawler_class = getattr(module, class_name)

            logger.debug(f"成功加载爬虫类: {module_name}.{class_name}")
            return crawler_class

        except (ImportError, AttributeError) as e:
            logger.warning(f"未找到爬虫类: site_id={site_id}, task_type={task_type}, error={e}")
            return None

    @staticmethod
    def _task_type_to_class_name(task_type: str) -> str:
        """
        将任务类型转换为类名后缀

        Args:
            task_type: 任务类型（如 'list_page'）

        Returns:
            类名后缀（如 'ListCrawler'）
        """
        # 任务类型到类名的映射
        mapping = {
            'list_page': 'ListCrawler',
            'info_page': 'InfoCrawler',
            'content_page': 'ContentCrawler',
            'comment_page': 'CommentsCrawler',
            'cover_image': 'CoverImageCrawler',
            'thumbnail_image': 'ThumbnailCrawler',
            'content_image': 'ContentImageCrawler',
        }

        return mapping.get(task_type, task_type.title())

    @classmethod
    def run_task(cls, site_id: str, task_type: str, **kwargs) -> Dict[str, Any]:
        """
        运行指定站点和类型的爬虫任务

        Args:
            site_id: 站点ID（如 'cm', 'jm', 'ex'）
            task_type: 任务类型（如 'list_page', 'info_page'）
            **kwargs: 任务参数

        Returns:
            任务执行结果
        """
        crawler = None
        try:
            logger.info(f"开始执行任务: site={site_id}, type={task_type}, params={kwargs}")

            # 获取对应的爬虫类
            crawler_class = cls._get_crawler_class(site_id, task_type)

            if not crawler_class:
                return {
                    'success': False,
                    'message': f'不支持的任务: site={site_id}, type={task_type}',
                    'site_id': site_id,
                    'task_type': task_type
                }

            # 创建爬虫实例
            crawler = crawler_class()

            # 调用爬虫的 crawl 或 crawl_batch 方法
            # 过滤掉路由用的参数（site, site_id 等），只传递爬虫需要的参数
            crawl_kwargs = {k: v for k, v in kwargs.items() if k not in ['site', 'site_id']}

            # 根据任务类型定义需要的参数和映射
            # 每种任务类型只处理它需要的参数，避免传递额外参数导致错误
            task_param_config = {
                'list_page': {
                    'allowed_params': ['page'],
                    'param_mapping': {}
                },
                'info_page': {
                    'allowed_params': ['comic_id', 'manga_id', 'aid'],
                    'param_mapping': {
                        'comic_id': 'aid',
                        'manga_id': 'aid',
                    }
                },
                'content_page': {
                    'allowed_params': ['comic_id', 'manga_id', 'aid', 'chapter_id', 'pid'],
                    'param_mapping': {
                        'comic_id': 'aid',
                        'manga_id': 'aid',
                        'chapter_id': 'pid',
                    }
                },
                'comment_page': {
                    'allowed_params': ['comic_id', 'manga_id', 'aid'],
                    'param_mapping': {
                        'comic_id': 'aid',
                        'manga_id': 'aid',
                    }
                },
                'cover_image': {
                    'allowed_params': ['comic_id', 'manga_id', 'aid'],
                    'param_mapping': {
                        'comic_id': 'aid',
                        'manga_id': 'aid',
                    }
                },
                'thumbnail_image': {
                    'allowed_params': ['comic_id', 'manga_id', 'aid'],
                    'param_mapping': {
                        'comic_id': 'aid',
                        'manga_id': 'aid',
                    }
                },
                'content_image': {
                    'allowed_params': ['comic_id', 'chapter_id', 'page', 'aid', 'pid'],
                    'param_mapping': {
                        'comic_id': 'aid',
                        'chapter_id': 'pid',
                    }
                },
            }

            # 获取当前任务类型的配置，如果没有配置则使用默认行为
            config = task_param_config.get(task_type, {
                'allowed_params': None,  # None 表示允许所有参数
                'param_mapping': {
                    'comic_id': 'aid',
                    'chapter_id': 'pid',
                    'manga_id': 'aid',
                }
            })

            # 过滤参数：只保留允许的参数
            if config['allowed_params'] is not None:
                filtered_kwargs = {k: v for k, v in crawl_kwargs.items() if k in config['allowed_params']}
            else:
                filtered_kwargs = crawl_kwargs

            # 应用参数映射
            mapped_kwargs = {}
            for key, value in filtered_kwargs.items():
                mapped_key = config['param_mapping'].get(key, key)
                mapped_kwargs[mapped_key] = value

            crawl_kwargs = mapped_kwargs

            # content_image 任务直接使用 crawl()，不支持 crawl_batch()
            # 因为任务是从前端单独提交的，不是批量模式
            if task_type == 'content_image' and hasattr(crawler, 'crawl'):
                result = crawler.crawl(**crawl_kwargs)
            # 优先使用 crawl_batch（批量处理），其次使用 crawl（单条处理）
            elif hasattr(crawler, 'crawl_batch') and len(crawl_kwargs) > 0:
                # crawl_batch 接受字典列表，任务传入的是单个字典，需要包装
                result = crawler.crawl_batch([crawl_kwargs])
            elif hasattr(crawler, 'crawl'):
                result = crawler.crawl(**crawl_kwargs)
            else:
                return {
                    'success': False,
                    'message': f'爬虫类没有 crawl 或 crawl_batch 方法: {crawler_class.__name__}',
                    'site_id': site_id,
                    'task_type': task_type
                }

            # 添加任务信息到结果
            if isinstance(result, dict):
                result['site_id'] = site_id
                result['task_type'] = task_type

            return result

        except Exception as e:
            logger.error(f"任务执行异常: site={site_id}, type={task_type}, error={e}", exc_info=True)

            return {
                'success': False,
                'message': f'任务执行异常: {str(e)}',
                'site_id': site_id,
                'task_type': task_type,
                'error': str(e)
            }

        finally:
            # 清理资源
            if crawler and hasattr(crawler, 'close'):
                try:
                    crawler.close()
                except:
                    pass


# 向后兼容的函数
def run_cm_task(task_type: str, **kwargs) -> Dict[str, Any]:
    """
    运行CM站点任务（向后兼容）

    Args:
        task_type: 任务类型
        **kwargs: 任务参数

    Returns:
        任务执行结果
    """
    return TaskRunner.run_task('cm', task_type, **kwargs)


def run_task(site_id: str, task_type: str, **kwargs) -> Dict[str, Any]:
    """
    运行任务（通用接口）

    Args:
        site_id: 站点ID（如 'cm', 'jm', 'ex'）
        task_type: 任务类型
        **kwargs: 任务参数

    Returns:
        任务执行结果
    """
    return TaskRunner.run_task(site_id, task_type, **kwargs)
