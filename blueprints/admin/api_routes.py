"""
后台管理API路由
提供系统状态、爬虫控制等API
"""
from flask import jsonify, request
from blueprints.admin import admin_bp
import os
import json
from datetime import datetime
from utils.logger import get_logger

logger = get_logger(__name__)

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
    logger.warning("psutil未安装，使用模拟数据监控系统资源")


def _serialize_metadata(obj):
    """
    序列化metadata对象，处理ObjectId等MongoDB特殊类型

    Args:
        obj: 要序列化的对象

    Returns:
        序列化后的对象（ObjectId转为字符串）
    """
    from bson.objectid import ObjectId

    if obj is None:
        return None

    if isinstance(obj, ObjectId):
        return str(obj)

    if isinstance(obj, dict):
        return {k: _serialize_metadata(v) for k, v in obj.items()}

    if isinstance(obj, list):
        return [_serialize_metadata(item) for item in obj]

    if isinstance(obj, datetime):
        return obj.timestamp()

    return obj


# 桶配置文件路径（统一使用根目录下的data文件夹）
BUCKET_CONFIG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'bucket_config.json')


def load_bucket_config():
    """从文件加载桶配置"""
    try:
        if os.path.exists(BUCKET_CONFIG_FILE):
            with open(BUCKET_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # 默认配置
            default_config = {
                'high_speed_max': 100,
                'low_speed_max': 1000,
                'result_max': 10000
            }
            save_bucket_config(default_config)
            return default_config
    except Exception as e:
        logger.error(f"加载桶配置失败: {e}")
        return {
            'high_speed_max': 100,
            'low_speed_max': 1000,
            'result_max': 10000
        }


def save_bucket_config(config):
    """保存桶配置到文件"""
    try:
        os.makedirs(os.path.dirname(BUCKET_CONFIG_FILE), exist_ok=True)
        with open(BUCKET_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"保存桶配置失败: {e}")
        return False


@admin_bp.route('/api/system/status', methods=['GET'])
def get_system_status():
    """获取系统状态（资源监控、三桶状态）"""
    try:
        # 获取资源使用情况
        if PSUTIL_AVAILABLE:
            cpu_percent = psutil.cpu_percent(interval=0.1)

            memory = psutil.virtual_memory()
            memory_info = {
                'percent': memory.percent,
                'used': memory.used / (1024**3),  # 转换为GB
                'total': memory.total / (1024**3)
            }

            disk = psutil.disk_usage('/')
            disk_info = {
                'percent': disk.percent,
                'used': disk.used / (1024**3),  # 转换为GB
                'total': disk.total / (1024**3)
            }

            resources = {
                'cpu': cpu_percent,
                'memory': memory_info,
                'disk': disk_info
            }
        else:
            # 使用模拟数据
            resources = {
                'cpu': 25.5,
                'memory': {
                    'percent': 45.2,
                    'used': 3.6,
                    'total': 8.0
                },
                'disk': {
                    'percent': 62.8,
                    'used': 314.0,
                    'total': 500.0
                }
            }

        # 从真实的三桶系统获取状态
        try:
            from services import high_speed_bucket, low_speed_bucket, result_bucket, processing_bucket

            buckets = {
                'high_speed': {
                    'count': high_speed_bucket.size(),
                    'max': high_speed_bucket.max_size
                },
                'low_speed': {
                    'count': low_speed_bucket.size(),
                    'max': low_speed_bucket.max_size
                },
                'processing': {
                    'count': processing_bucket.size(),
                    'max': processing_bucket.max_size
                },
                'result': {
                    'count': result_bucket.size(),
                    'max': result_bucket.max_size
                }
            }
            logger.info(f"[API] /admin/api/system/status 返回桶状态: "
                       f"高速={buckets['high_speed']['count']}/{buckets['high_speed']['max']}, "
                       f"低速={buckets['low_speed']['count']}/{buckets['low_speed']['max']}, "
                       f"运行中={buckets['processing']['count']}/{buckets['processing']['max']}, "
                       f"结果={buckets['result']['count']}/{buckets['result']['max']}")
        except ImportError:
            # 如果桶系统不可用，使用配置文件
            bucket_config = load_bucket_config()
            buckets = {
                'high_speed': {
                    'count': 0,
                    'max': bucket_config.get('high_speed_max', 100)
                },
                'low_speed': {
                    'count': 0,
                    'max': bucket_config.get('low_speed_max', 1000)
                },
                'processing': {
                    'count': 0,
                    'max': 100
                },
                'result': {
                    'count': 0,
                    'max': bucket_config.get('result_max', 10000)
                }
            }
            logger.warning("桶系统不可用，使用配置文件中的默认值")

        return jsonify({
            'success': True,
            'data': {
                'resources': resources,
                'buckets': buckets
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取系统状态失败: {str(e)}'
        }), 500


@admin_bp.route('/api/crawler/run', methods=['POST'])
def run_crawler():
    """手动运行爬虫 - 支持批量提交"""
    try:
        data = request.get_json()

        site = data.get('site')
        task_type = data.get('task_type')
        priority_str = data.get('priority', 'low')
        aid = data.get('aid')

        # 验证必填字段
        if not site or not task_type:
            return jsonify({
                'success': False,
                'message': '缺少必填字段'
            }), 400

        if task_type == 'single_comic' and not aid:
            return jsonify({
                'success': False,
                'message': '单本漫画模式需要提供漫画ID'
            }), 400

        # 使用TaskSubmitter提交任务到桶系统
        from services import TaskSubmitter, TaskType, TaskPriority, TaskSource

        # 映射前端任务类型到系统任务类型
        task_type_mapping = {
            'list_page': TaskType.LIST_PAGE,
            'info_page': TaskType.INFO_PAGE,
            'content_page': TaskType.CONTENT_PAGE,
            'comment_page': TaskType.COMMENT_PAGE,
            'cover_image': TaskType.COVER_IMAGE,
            'thumbnail_image': TaskType.THUMBNAIL_IMAGE,
            'content_image': TaskType.CONTENT_IMAGE,
            'single_comic': TaskType.INFO_PAGE,  # 单本漫画先爬取信息页
        }

        system_task_type = task_type_mapping.get(task_type, TaskType.INFO_PAGE)
        system_priority = TaskPriority.HIGH if priority_str == 'high' else TaskPriority.LOW

        logger.info(f"[API] 收到爬虫请求: site={site}, task_type={task_type}, priority={priority_str}, aid={aid}")

        # 从站点配置获取爬取数量限制
        from utils.config_loader import load_sites_config
        sites_config = load_sites_config()
        site_config = sites_config.get(site, {})
        crawl_limits = site_config.get('crawl_limits', {})

        # ========== 列表页任务：批量提交指定页数 ==========
        if task_type == 'list_page':
            max_pages = crawl_limits.get('list_page_max', 100)  # 默认100页
            submitted_count = 0
            failed_count = 0
            task_ids = []

            logger.info(f"[API] 开始批量提交列表页任务: 1-{max_pages}页, 优先级={priority_str}")

            # 提交任务（根据配置数量）
            for page in range(1, max_pages + 1):
                params = {'site': site, 'page': page}
                result = TaskSubmitter.submit_task(
                    task_type=TaskType.LIST_PAGE,
                    params=params,
                    priority=system_priority,
                    source=TaskSource.MANUAL
                )

                if result['success']:
                    submitted_count += 1
                    task_ids.append(result['task_id'])
                    logger.debug(f"[API] 第{page}页任务提交成功: {result['task_id']}")
                else:
                    failed_count += 1
                    logger.warning(f"[API] 第{page}页任务提交失败: {result.get('message')}")

                    # 如果桶满了，停止提交
                    if '已满' in result.get('message', ''):
                        logger.error(f"[API] 桶已满，停止提交。已成功提交{submitted_count}页")
                        break

            logger.info(f"[API] 列表页任务提交完成: 成功={submitted_count}, 失败={failed_count}")

            if submitted_count > 0:
                return jsonify({
                    'success': True,
                    'data': {
                        'task_ids': task_ids,
                        'submitted_count': submitted_count,
                        'failed_count': failed_count
                    },
                    'message': f'已成功提交{submitted_count}个列表页任务到{priority_str}桶'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': '所有任务提交失败，请检查桶是否已满'
                }), 500

        # ========== 详情页任务：批量提交 ==========
        elif task_type == 'info_page':
            # TODO: 从数据库查询需要更新详情的漫画
            # 暂时简化：如果指定了aid则爬单个，否则返回提示
            if aid:
                params = {'site': site, 'aid': aid}
                result = TaskSubmitter.submit_task(
                    task_type=TaskType.INFO_PAGE,
                    params=params,
                    priority=system_priority,
                    source=TaskSource.MANUAL
                )

                if result['success']:
                    return jsonify({
                        'success': True,
                        'data': {'task_id': result['task_id'], 'submitted_count': 1},
                        'message': f'已成功提交详情页任务到{result["bucket"]}桶'
                    })
                else:
                    return jsonify({
                        'success': False,
                        'message': result.get('message', '提交任务失败')
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'message': '详情页批量提交需要指定漫画ID（aid），或等待定时任务自动处理'
                }), 400

        # ========== 内容页任务：批量提交 ==========
        elif task_type == 'content_page':
            # TODO: 从数据库查询需要更新内容的漫画
            if aid:
                params = {'site': site, 'aid': aid}
                result = TaskSubmitter.submit_task(
                    task_type=TaskType.CONTENT_PAGE,
                    params=params,
                    priority=system_priority,
                    source=TaskSource.MANUAL
                )

                if result['success']:
                    return jsonify({
                        'success': True,
                        'data': {'task_id': result['task_id'], 'submitted_count': 1},
                        'message': f'已成功提交内容页任务到{result["bucket"]}桶'
                    })
                else:
                    return jsonify({
                        'success': False,
                        'message': result.get('message', '提交任务失败')
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'message': '内容页批量提交需要指定漫画ID（aid），或等待定时任务自动处理'
                }), 400

        # ========== 评论页任务：批量提交 ==========
        elif task_type == 'comment_page':
            # TODO: 从数据库查询有评论的漫画
            if aid:
                params = {'site': site, 'aid': aid}
                result = TaskSubmitter.submit_task(
                    task_type=TaskType.COMMENT_PAGE,
                    params=params,
                    priority=system_priority,
                    source=TaskSource.MANUAL
                )

                if result['success']:
                    return jsonify({
                        'success': True,
                        'data': {'task_id': result['task_id'], 'submitted_count': 1},
                        'message': f'已成功提交评论页任务到{result["bucket"]}桶'
                    })
                else:
                    return jsonify({
                        'success': False,
                        'message': result.get('message', '提交任务失败')
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'message': '评论页批量提交需要指定漫画ID（aid），或等待定时任务自动处理'
                }), 400

        # ========== 封面图任务：批量提交 ==========
        elif task_type == 'cover_image':
            # TODO: 从数据库查询缺少封面的漫画
            max_count = crawl_limits.get('cover_image_max', 500)

            if aid:
                # 单个任务
                params = {'site': site, 'aid': aid, 'cover_url': data.get('cover_url')}
                result = TaskSubmitter.submit_task(
                    task_type=TaskType.COVER_IMAGE,
                    params=params,
                    priority=system_priority,
                    source=TaskSource.MANUAL
                )

                if result['success']:
                    return jsonify({
                        'success': True,
                        'data': {'task_id': result['task_id'], 'submitted_count': 1},
                        'message': f'已成功提交封面图任务到{result["bucket"]}桶'
                    })
                else:
                    return jsonify({
                        'success': False,
                        'message': result.get('message', '提交任务失败')
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'message': f'封面图批量提交需要指定漫画ID（aid）和URL，或等待定时任务自动处理（最多{max_count}个）'
                }), 400

        # ========== 缩略图任务：批量提交 ==========
        elif task_type == 'thumbnail_image':
            # TODO: 从数据库查询缺少缩略图的漫画
            max_count = crawl_limits.get('thumbnail_image_max', 1000)

            if aid:
                # 单个任务
                params = {'site': site, 'aid': aid, 'thumb_url': data.get('thumb_url')}
                result = TaskSubmitter.submit_task(
                    task_type=TaskType.THUMBNAIL_IMAGE,
                    params=params,
                    priority=system_priority,
                    source=TaskSource.MANUAL
                )

                if result['success']:
                    return jsonify({
                        'success': True,
                        'data': {'task_id': result['task_id'], 'submitted_count': 1},
                        'message': f'已成功提交缩略图任务到{result["bucket"]}桶'
                    })
                else:
                    return jsonify({
                        'success': False,
                        'message': result.get('message', '提交任务失败')
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'message': f'缩略图批量提交需要指定漫画ID（aid）和URL，或等待定时任务自动处理（最多{max_count}个）'
                }), 400

        # ========== 内容图任务：批量提交 ==========
        elif task_type == 'content_image':
            # TODO: 从数据库查询缺少内容图的漫画
            max_count = crawl_limits.get('content_image_max', 5000)

            if aid:
                # 单个任务
                params = {'site': site, 'aid': aid, 'image_urls': data.get('image_urls', [])}
                result = TaskSubmitter.submit_task(
                    task_type=TaskType.CONTENT_IMAGE,
                    params=params,
                    priority=system_priority,
                    source=TaskSource.MANUAL
                )

                if result['success']:
                    return jsonify({
                        'success': True,
                        'data': {'task_id': result['task_id'], 'submitted_count': 1},
                        'message': f'已成功提交内容图任务到{result["bucket"]}桶'
                    })
                else:
                    return jsonify({
                        'success': False,
                        'message': result.get('message', '提交任务失败')
                    }), 500
            else:
                return jsonify({
                    'success': False,
                    'message': f'内容图批量提交需要指定漫画ID（aid）和URL列表，或等待定时任务自动处理（最多{max_count}个）'
                }), 400

        # ========== 单本漫画任务：提交单个任务 ==========
        else:
            params = {'site': site}
            if aid:
                params['aid'] = aid

            result = TaskSubmitter.submit_task(
                task_type=system_task_type,
                params=params,
                priority=system_priority,
                source=TaskSource.MANUAL
            )

            logger.info(f"[API] 任务提交结果: {result}")

            if result['success']:
                return jsonify({
                    'success': True,
                    'data': {
                        'task_id': result['task_id'],
                        'message': '任务已提交'
                    },
                    'message': f'爬虫任务已成功提交到{result["bucket"]}桶'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': result.get('message', '提交任务失败')
                }), 500

    except Exception as e:
        logger.error(f"运行爬虫失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'运行爬虫失败: {str(e)}'
        }), 500


@admin_bp.route('/api/buckets/<bucket_type>', methods=['GET'])
def get_bucket_tasks(bucket_type):
    """获取指定桶的任务列表"""
    try:
        # 验证桶类型
        valid_types = ['high_speed', 'low_speed', 'processing', 'result']
        if bucket_type not in valid_types:
            return jsonify({
                'success': False,
                'message': '无效的桶类型'
            }), 400

        # 从真实的桶系统获取任务列表
        from services import high_speed_bucket, low_speed_bucket, result_bucket, processing_bucket

        if bucket_type == 'high_speed':
            tasks = high_speed_bucket.get_all_tasks()
        elif bucket_type == 'low_speed':
            tasks = low_speed_bucket.get_all_tasks()
        elif bucket_type == 'processing':
            tasks = processing_bucket.get_all_tasks()
        else:  # result
            tasks = result_bucket.get_all_results()

        # 转换为字典格式（保持与前端期望的数据结构一致）
        task_dicts = []
        for task in tasks:
            # 判断是 Task 对象还是 TaskResult 对象
            if hasattr(task, 'success'):  # TaskResult 对象
                # 结果桶：TaskResult 对象
                created_at = task.metadata.get('created_at')
                if created_at:
                    # 如果是字符串，转换为datetime；如果是datetime，直接使用
                    if isinstance(created_at, str):
                        created_at = datetime.fromisoformat(created_at)
                    timestamp = created_at.timestamp()
                else:
                    timestamp = None

                task_dict = {
                    'id': str(task.task_id) if task.task_id else None,  # ObjectId转字符串
                    'type': 'result',  # 结果类型
                    'priority': 'N/A',  # 结果没有优先级
                    'site': task.metadata.get('site', 'cm'),  # 从 metadata 获取
                    'created_at': timestamp,
                    'status': 'completed' if task.success else 'failed',  # 根据 success 设置状态
                    'success': task.success,  # 额外字段
                    'error': task.error,
                    'file_path': task.file_path,
                    'url': task.url,
                    'data': task.data,  # 返回数据
                    'metadata': _serialize_metadata(task.metadata)  # 序列化metadata，处理ObjectId
                }
            else:  # Task 对象
                # 高速/低速/运行中桶：Task 对象
                task_dict = {
                    'id': str(task.task_id) if hasattr(task, 'task_id') and task.task_id else str(id(task)),
                    'type': task.task_type.value if hasattr(task, 'task_type') else 'unknown',
                    'priority': task.priority.value if hasattr(task, 'priority') else 'medium',
                    'site': (task.params.get('site_id') or task.params.get('site', 'cm')) if hasattr(task, 'params') else 'cm',
                    'created_at': task.created_at.timestamp() if hasattr(task, 'created_at') and task.created_at else None,
                    'started_at': task.started_at.timestamp() if hasattr(task, 'started_at') and task.started_at else None,  # 开始执行时间
                    'status': task.status.value if hasattr(task, 'status') else 'pending'
                }
            task_dicts.append(task_dict)

        # 结果桶按时间倒序排列（最近完成的在前）
        if bucket_type == 'result':
            task_dicts.sort(key=lambda x: x.get('created_at') or 0, reverse=True)

        return jsonify({
            'success': True,
            'data': {
                'bucket_type': bucket_type,
                'tasks': task_dicts
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取任务列表失败: {str(e)}'
        }), 500


@admin_bp.route('/api/buckets/<bucket_type>/clear', methods=['POST'])
def clear_bucket(bucket_type):
    """清空指定桶"""
    try:
        # 验证桶类型
        valid_types = ['high_speed', 'low_speed', 'result']
        if bucket_type not in valid_types:
            return jsonify({
                'success': False,
                'message': '无效的桶类型'
            }), 400

        # 从真实的桶系统清空
        from services import high_speed_bucket, low_speed_bucket, result_bucket

        if bucket_type == 'high_speed':
            count = high_speed_bucket.clear()
        elif bucket_type == 'low_speed':
            count = low_speed_bucket.clear()
        else:  # result
            count = result_bucket.clear()

        return jsonify({
            'success': True,
            'data': {
                'cleared_count': count
            },
            'message': f'已清空 {bucket_type} 桶'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'清空桶失败: {str(e)}'
        }), 500


@admin_bp.route('/api/buckets/config', methods=['GET'])
def get_bucket_config():
    """获取桶容量配置"""
    try:
        # 从实际的桶系统获取当前配置
        try:
            from services import high_speed_bucket, low_speed_bucket, result_bucket, processing_bucket
            config = {
                'high_speed_max': high_speed_bucket.max_size,
                'low_speed_max': low_speed_bucket.max_size,
                'result_max': result_bucket.max_size
            }
        except ImportError:
            # 如果桶系统不可用，从配置文件读取
            config = load_bucket_config()

        return jsonify({
            'success': True,
            'data': config
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取桶配置失败: {str(e)}'
        }), 500


@admin_bp.route('/api/buckets/config', methods=['POST'])
def update_bucket_config():
    """更新桶容量配置"""
    try:
        data = request.get_json()

        # 验证必填字段
        required_fields = ['high_speed_max', 'low_speed_max', 'result_max']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'缺少必填字段: {field}'
                }), 400

        # 验证数值范围
        if data['high_speed_max'] < 1 or data['high_speed_max'] > 10000:
            return jsonify({
                'success': False,
                'message': '高速桶容量必须在1-10000之间'
            }), 400

        if data['low_speed_max'] < 1 or data['low_speed_max'] > 100000:
            return jsonify({
                'success': False,
                'message': '低速桶容量必须在1-100000之间'
            }), 400

        if data['result_max'] < 1 or data['result_max'] > 1000000:
            return jsonify({
                'success': False,
                'message': '结果桶容量必须在1-1000000之间'
            }), 400

        # 保存配置到文件
        config = {
            'high_speed_max': data['high_speed_max'],
            'low_speed_max': data['low_speed_max'],
            'result_max': data['result_max']
        }

        if save_bucket_config(config):
            # 同时更新实际桶的最大容量
            try:
                from services import high_speed_bucket, low_speed_bucket, result_bucket, processing_bucket
                high_speed_bucket.set_max_size(data['high_speed_max'])
                low_speed_bucket.set_max_size(data['low_speed_max'])
                result_bucket.set_max_size(data['result_max'])
                logger.info(f"桶配置已更新: 高速桶={data['high_speed_max']}, 低速桶={data['low_speed_max']}, 结果桶={data['result_max']}")
            except ImportError:
                logger.warning("无法更新桶的实际容量限制，桶系统可能未初始化")

            return jsonify({
                'success': True,
                'data': config,
                'message': '桶配置已更新'
            })
        else:
            logger.error("保存桶配置文件失败")
            return jsonify({
                'success': False,
                'message': '保存配置文件失败'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'更新桶配置失败: {str(e)}'
        }), 500


@admin_bp.route('/api/buckets/<bucket_type>/tasks/<task_id>', methods=['DELETE'])
def delete_bucket_task(bucket_type, task_id):
    """从桶中删除指定任务"""
    try:
        # 验证桶类型
        valid_types = ['high_speed', 'low_speed', 'result']
        if bucket_type not in valid_types:
            return jsonify({
                'success': False,
                'message': '无效的桶类型'
            }), 400

        # 从真实的桶系统删除任务
        from services import high_speed_bucket, low_speed_bucket, result_bucket

        if bucket_type == 'high_speed':
            removed = high_speed_bucket.remove_by_id(task_id)
            success = removed is not None
        elif bucket_type == 'low_speed':
            removed = low_speed_bucket.remove_by_id(task_id)
            success = removed is not None
        else:  # result
            removed = result_bucket.remove_result(task_id)
            success = removed is not None

        if success:
            return jsonify({
                'success': True,
                'data': {
                    'task_id': task_id
                },
                'message': '任务已删除'
            })
        else:
            return jsonify({
                'success': False,
                'message': '任务不存在'
            }), 404

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'删除任务失败: {str(e)}'
        }), 500


# ==================== 日志相关API ====================

@admin_bp.route('/api/logs', methods=['GET'])
def get_logs():
    """获取日志列表"""
    try:
        import glob

        # 日志目录
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data', 'logs')

        # 获取所有日志文件
        log_files = []
        if os.path.exists(log_dir):
            pattern = os.path.join(log_dir, '*.log*')
            files = glob.glob(pattern)

            for file_path in files:
                filename = os.path.basename(file_path)
                file_stat = os.stat(file_path)

                # 确定日志类型
                if 'error' in filename.lower():
                    log_type = 'error'
                    log_name = '错误日志'
                else:
                    log_type = 'app'
                    log_name = '应用日志'

                log_files.append({
                    'filename': filename,
                    'type': log_type,
                    'name': log_name,
                    'size': file_stat.st_size,
                    'modified': file_stat.st_mtime
                })

            # 按修改时间排序（最新的在前）
            log_files.sort(key=lambda x: x['modified'], reverse=True)

        return jsonify({
            'success': True,
            'data': {
                'logs': log_files
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取日志列表失败: {str(e)}'
        }), 500


@admin_bp.route('/api/logs/<log_type>/content', methods=['GET'])
def get_log_content(log_type):
    """
    获取日志内容

    Args:
        log_type: 日志类型 (app, error)
    """
    try:
        # 获取查询参数
        lines = request.args.get('lines', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        level = request.args.get('level', '')  # 日志级别过滤

        # 日志文件路径
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data', 'logs')

        if log_type == 'error':
            log_file = os.path.join(log_dir, 'error.log')
        else:
            log_file = os.path.join(log_dir, 'app.log')

        if not os.path.exists(log_file):
            return jsonify({
                'success': True,
                'data': {
                    'content': '',
                    'lines': [],
                    'total_lines': 0
                }
            })

        # 读取日志文件
        with open(log_file, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()

        total_lines = len(all_lines)

        # 应用级别过滤
        if level:
            filtered_lines = [line for line in all_lines if level.upper() in line]
        else:
            filtered_lines = all_lines

        # 应用偏移量和行数限制
        start_idx = offset
        end_idx = min(start_idx + lines, len(filtered_lines))
        paginated_lines = filtered_lines[start_idx:end_idx]

        # 解析日志行
        parsed_lines = []
        for line in paginated_lines:
            parsed = parse_log_line(line)
            if parsed:
                parsed_lines.append(parsed)

        return jsonify({
            'success': True,
            'data': {
                'content': ''.join(paginated_lines),
                'lines': parsed_lines,
                'total_lines': len(filtered_lines),
                'offset': offset,
                'count': len(paginated_lines)
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'读取日志失败: {str(e)}'
        }), 500


@admin_bp.route('/api/logs/<log_type>/download', methods=['GET'])
def download_log(log_type):
    """下载日志文件"""
    try:
        import flask
        from datetime import datetime

        # 日志文件路径
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data', 'logs')

        if log_type == 'error':
            log_file = os.path.join(log_dir, 'error.log')
        else:
            log_file = os.path.join(log_dir, 'app.log')

        if not os.path.exists(log_file):
            return jsonify({
                'success': False,
                'message': '日志文件不存在'
            }), 404

        # 生成文件名（带时间戳）
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        download_name = f"{log_type}_log_{timestamp}.log"

        return flask.send_file(
            log_file,
            as_attachment=True,
            download_name=download_name,
            mimetype='text/plain'
        )
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'下载日志失败: {str(e)}'
        }), 500


@admin_bp.route('/api/logs/clear', methods=['POST'])
def clear_logs():
    """清空所有日志文件"""
    try:
        import glob

        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data', 'logs')

        if os.path.exists(log_dir):
            # 删除所有日志文件
            pattern = os.path.join(log_dir, '*.log*')
            files = glob.glob(pattern)

            cleared_count = 0
            for file_path in files:
                try:
                    # 清空文件内容而不是删除文件
                    with open(file_path, 'w') as f:
                        f.write('')
                    cleared_count += 1
                except Exception:
                    pass

            return jsonify({
                'success': True,
                'data': {
                    'cleared_count': cleared_count
                },
                'message': f'已清空 {cleared_count} 个日志文件'
            })
        else:
            return jsonify({
                'success': True,
                'data': {
                    'cleared_count': 0
                },
                'message': '日志目录不存在'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'清空日志失败: {str(e)}'
        }), 500


def parse_log_line(line):
    """
    解析日志行

    Args:
        line: 日志行字符串

    Returns:
        dict: 解析后的日志信息，如果解析失败返回None
    """
    try:
        # 日志格式: [2024-01-01 12:00:00] [INFO] [module_name] message
        import re

        pattern = r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[(\w+)\] \[(.*?)\] (.*)'
        match = re.match(pattern, line)

        if match:
            return {
                'timestamp': match.group(1),
                'level': match.group(2),
                'module': match.group(3),
                'message': match.group(4).strip()
            }
        else:
            # 如果无法解析，返回原始行
            return {
                'timestamp': '',
                'level': 'UNKNOWN',
                'module': '',
                'message': line.strip()
            }
    except Exception:
        return None


# ==================== 图片库管理API ====================

@admin_bp.route('/api/media-library/libraries', methods=['GET'])
def get_media_libraries():
    """获取所有图片库列表"""
    try:
        from utils.media_library import get_media_library

        media_lib = get_media_library()
        libraries = media_lib.list_all_libraries()

        return jsonify({
            'success': True,
            'data': {
                'libraries': libraries
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取图片库列表失败: {str(e)}'
        }), 500


@admin_bp.route('/api/media-library/libraries/<library_id>', methods=['GET'])
def get_media_library(library_id):
    """获取单个图片库信息"""
    try:
        from utils.media_library import get_media_library

        media_lib = get_media_library()
        library_info = media_lib.get_library_info(library_id)

        return jsonify({
            'success': True,
            'data': library_info
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取图片库信息失败: {str(e)}'
        }), 500


@admin_bp.route('/api/media-library/scan/<library_id>', methods=['POST'])
def scan_media_library(library_id):
    """扫描图片库"""
    try:
        from utils.media_library import get_media_library

        media_lib = get_media_library()
        stats = media_lib.scan_library(library_id)

        if 'error' in stats:
            return jsonify({
                'success': False,
                'message': stats['error']
            }), 500

        return jsonify({
            'success': True,
            'data': stats,
            'message': f'图片库扫描完成: {library_id}'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'扫描图片库失败: {str(e)}'
        }), 500


@admin_bp.route('/api/media-library/scan-all', methods=['POST'])
def scan_all_media_libraries():
    """扫描所有图片库"""
    try:
        from utils.media_library import get_media_library

        media_lib = get_media_library()
        results = media_lib.scan_all_libraries()

        return jsonify({
            'success': True,
            'data': {
                'libraries': results
            },
            'message': '所有图片库扫描完成'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'扫描图片库失败: {str(e)}'
        }), 500


@admin_bp.route('/api/media-library/path', methods=['POST'])
def update_library_path():
    """更新图片库存储路径"""
    try:
        data = request.get_json()
        library_id = data.get('library_id')
        new_path = data.get('path')

        if not library_id or not new_path:
            return jsonify({
                'success': False,
                'message': '缺少参数: library_id 或 path'
            }), 400

        from utils.media_library import get_media_library

        media_lib = get_media_library()
        success = media_lib.update_library_path(library_id, new_path)

        if success:
            return jsonify({
                'success': True,
                'message': f'图片库路径已更新: {library_id}'
            })
        else:
            return jsonify({
                'success': False,
                'message': '更新图片库路径失败'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'更新图片库路径失败: {str(e)}'
        }), 500


@admin_bp.route('/api/media-library/clear/<library_id>', methods=['POST'])
def clear_media_library(library_id):
    """清空图片库"""
    try:
        from utils.media_library import get_media_library

        media_lib = get_media_library()
        result = media_lib.clear_library(library_id)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'清空图片库失败: {str(e)}'
        }), 500


@admin_bp.route('/api/media-library/images/<site_id>', methods=['GET'])
def get_site_images(site_id):
    """获取指定站点的图片列表（分页）"""
    try:
        from flask import request
        from models.image_library import get_image_library

        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        image_library = get_image_library(site_id)

        # 获取总数
        total_count = image_library.images_collection.count_documents({})

        # 分页查询 - 按创建时间倒序
        skip = (page - 1) * per_page
        cursor = image_library.images_collection.find().skip(skip).limit(per_page).sort('created_at', -1)

        images = []
        for img in cursor:
            img['_id'] = str(img['_id'])
            if 'storage_id' in img and img['storage_id']:
                img['storage_id'] = str(img['storage_id'])
            images.append(img)

        return jsonify({
            'success': True,
            'data': {
                'images': images,
                'total': total_count,
                'page': page,
                'per_page': per_page,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取图片列表失败: {str(e)}'
        }), 500


@admin_bp.route('/api/media-library/sites', methods=['GET'])
def get_media_library_sites():
    """获取所有已配置的站点列表"""
    try:
        from utils.config_loader import load_sites_config

        sites_config = load_sites_config()
        sites = []

        for site_id, config in sites_config.items():
            sites.append({
                'site_id': site_id,
                'site_name': config.get('site_name', site_id.upper()),
                'enabled': config.get('enabled', False)
            })

        return jsonify({
            'success': True,
            'data': {
                'sites': sites
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取站点列表失败: {str(e)}'
        }), 500


@admin_bp.route('/api/media-library/storage-path', methods=['GET', 'POST'])
def media_library_storage_path():
    """获取或设置图片库存储总路径"""
    try:
        from utils.config_loader import load_system_config, save_system_config, load_sites_config
        import os
        import platform

        if request.method == 'GET':
            # 获取当前配置
            system_config = load_system_config()
            image_storage_config = system_config.get('image_storage', {})

            # 根据操作系统选择路径
            current_os = platform.system().lower()
            if current_os == 'windows':
                storage_path = image_storage_config.get('windows_path', 'local_files')
            else:
                storage_path = image_storage_config.get('linux_path', '/mnt/appdata')

            # 获取每个站点的实际存储情况
            sites_info = {}
            sites_config = load_sites_config()

            for site_id in sites_config.keys():
                site_path = os.path.join(storage_path, site_id)
                sites_info[site_id] = {
                    'path': site_path,
                    'exists': os.path.exists(site_path)
                }

            return jsonify({
                'success': True,
                'data': {
                    'storage_path': storage_path,
                    'sites': sites_info,
                    'os': current_os
                }
            })
        else:
            # 设置新路径
            data = request.get_json()
            new_path = data.get('storage_path')

            if not new_path:
                return jsonify({
                    'success': False,
                    'message': '缺少storage_path参数'
                }), 400

            # 更新系统配置（根据当前操作系统更新对应路径）
            system_config = load_system_config()
            if 'image_storage' not in system_config:
                system_config['image_storage'] = {}

            current_os = platform.system().lower()
            if current_os == 'windows':
                system_config['image_storage']['windows_path'] = new_path
            else:
                system_config['image_storage']['linux_path'] = new_path

            if save_system_config(system_config):
                return jsonify({
                    'success': True,
                    'message': '图片库存储路径已更新，请重启应用后生效'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': '保存配置失败'
                }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'操作失败: {str(e)}'
        }), 500


@admin_bp.route('/api/site-scheduler/status', methods=['GET'])
def get_site_scheduler_status():
    """获取站点调度器状态"""
    try:
        from services.site_scheduler import site_scheduler

        result = site_scheduler.get_status()

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        logger.error(f"获取站点调度器状态失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'获取状态失败: {str(e)}'
        }), 500


@admin_bp.route('/api/site-scheduler/run', methods=['POST'])
def run_site_scheduler_task():
    """手动触发站点任务"""
    try:
        data = request.get_json()
        site_id = data.get('site_id')
        task_type = data.get('task_type')

        if not site_id or not task_type:
            return jsonify({
                'success': False,
                'message': '缺少必要参数: site_id 或 task_type'
            }), 400

        from services.site_scheduler import site_scheduler

        result = site_scheduler.run_site_task_now(site_id, task_type)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500

    except Exception as e:
        logger.error(f"触发站点任务失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'触发任务失败: {str(e)}'
        }), 500


