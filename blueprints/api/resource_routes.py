"""
资源检查和按需触发爬取API
"""
from flask import jsonify, request, Response
from blueprints.api import api_bp
from utils.logger import get_logger
from models.image_library import get_image_library

logger = get_logger(__name__)


# ==================== 批量检查 ====================

@api_bp.route('/<site_id>/resource/check_batch', methods=['POST'])
def check_resources_batch(site_id):
    """
    批量检查多个资源是否存在

    参数:
        site_id: 站点ID
        body: {
            "resource_type": "cover_image",
            "comic_ids": [id1, id2, ...]
        }

    返回:
        {
            "success": true,
            "results": {
                "id1": {"status": "exists", "url": "..."},
                "id2": {"status": "not_exists"},
                ...
            }
        }
    """
    try:
        data = request.get_json() or {}
        resource_type = data.get('resource_type')
        comic_ids = data.get('comic_ids', [])

        if not resource_type or not comic_ids:
            return jsonify({
                'success': False,
                'message': '缺少必要参数'
            }), 400

        logger.info(f"[批量资源检查] site_id={site_id}, type={resource_type}, count={len(comic_ids)}")

        image_library = get_image_library(site_id)
        results = {}

        if resource_type == 'cover_image':
            for comic_id in comic_ids:
                image_info = image_library.get_image(
                    aid=int(comic_id),
                    image_type='cover'
                )

                if image_info:
                    results[str(comic_id)] = {
                        'status': 'exists',
                        'url': f"/api/media/image?site={site_id}&aid={comic_id}&type=cover"
                    }
                else:
                    results[str(comic_id)] = {
                        'status': 'not_exists',
                        'url': None
                    }

            return jsonify({
                'success': True,
                'results': results
            })

        else:
            return jsonify({
                'success': False,
                'message': f'不支持的资源类型: {resource_type}'
            }), 400

    except Exception as e:
        logger.error(f"[批量资源检查] 检查失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'检查失败: {str(e)}'
        }), 500


# ==================== 单个检查 ====================

@api_bp.route('/<site_id>/resource/check')
def check_resource(site_id):
    """
    检查资源是否存在

    参数:
        site_id: 站点ID
        resource_type: 资源类型（cover_image/thumbnail_image/content_image/comic_info/chapter_list）
        comic_id: 漫画ID（图片类必需）
        chapter_id: 章节ID（内容图必需）
        page: 页码（列表页图片必需）

    返回:
        {
            "success": true,
            "status": "exists" | "not_exists" | "crawling",
            "data": {...} | null
        }
    """
    try:
        resource_type = request.args.get('resource_type')
        comic_id = request.args.get('comic_id')
        chapter_id = request.args.get('chapter_id')
        page = request.args.get('page')

        if not resource_type:
            return jsonify({
                'success': False,
                'message': '缺少resource_type参数'
            }), 400

        logger.info(f"[资源检查] site_id={site_id}, type={resource_type}, comic_id={comic_id}")

        # 检查封面图片
        if resource_type == 'cover_image':
            return jsonify(check_cover_image(site_id, comic_id))

        # 检查缩略图
        elif resource_type == 'thumbnail_image':
            return jsonify(check_thumbnail_image(site_id, comic_id))

        # 检查内容图片（单张）
        elif resource_type == 'content_image':
            return jsonify(check_content_image(site_id, comic_id, chapter_id, page))

        # 检查章节所有图片
        elif resource_type == 'content_images':
            return jsonify(check_content_images(site_id, comic_id, chapter_id))

        # 检查章节所有图片（别名，用于阅读页）
        elif resource_type == 'content_page':
            return jsonify(check_content_images(site_id, comic_id, chapter_id))

        # 检查详情信息
        elif resource_type == 'comic_info':
            return jsonify(check_comic_info(site_id, comic_id))

        # 检查章节列表
        elif resource_type == 'chapter_list':
            return jsonify(check_chapter_list(site_id, comic_id))

        else:
            return jsonify({
                'success': False,
                'message': f'不支持的资源类型: {resource_type}'
            }), 400

    except Exception as e:
        logger.error(f"[资源检查] 检查失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'检查失败: {str(e)}'
        }), 500


def check_cover_image(site_id, comic_id):
    """检查封面图片是否存在 - 直接问图片库"""
    try:
        if not comic_id:
            return {
                'success': True,
                'status': 'not_exists',
                'data': None
            }

        image_library = get_image_library(site_id)

        # 直接问图片库
        image_info = image_library.get_image(
            aid=int(comic_id),
            pid=None,
            page_num=None,
            image_type='cover'
        )

        if image_info:
            return {
                'success': True,
                'status': 'exists',
                'data': {
                    'image_id': image_info['_id'],
                    'url': f"/api/media/image?site={site_id}&aid={comic_id}&type=cover"
                }
            }

        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }

    except Exception as e:
        logger.error(f"[资源检查] 检查封面图片失败: {e}")
        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }


def check_thumbnail_image(site_id, comic_id):
    """检查缩略图是否存在 - 直接问图片库"""
    try:
        if not comic_id:
            return {
                'success': True,
                'status': 'not_exists',
                'data': None
            }

        image_library = get_image_library(site_id)

        # 直接问图片库
        image_info = image_library.get_image(
            aid=int(comic_id),
            pid=None,
            page_num=None,
            image_type='thumbnail'
        )

        if image_info:
            return {
                'success': True,
                'status': 'exists',
                'data': {
                    'image_id': image_info['_id'],
                    'url': f"/api/media/image?site={site_id}&aid={comic_id}&type=thumbnail"
                }
            }

        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }

    except Exception as e:
        logger.error(f"[资源检查] 检查缩略图失败: {e}")
        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }


def check_content_image(site_id, comic_id, chapter_id, page):
    """检查单张内容图片是否存在 - 直接问图片库"""
    try:
        if not comic_id or not chapter_id or not page:
            return {
                'success': True,
                'status': 'not_exists',
                'data': None
            }

        image_library = get_image_library(site_id)

        # 直接问图片库
        image_info = image_library.get_image(
            aid=int(comic_id),
            pid=int(chapter_id),
            page_num=int(page),
            image_type='content'
        )

        if image_info:
            return {
                'success': True,
                'status': 'exists',
                'data': {
                    'image_id': image_info['_id'],
                    'url': f"/api/media/image?site={site_id}&aid={comic_id}&pid={chapter_id}&page={page}&type=content"
                }
            }

        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }

    except Exception as e:
        logger.error(f"[资源检查] 检查内容图片失败: {e}")
        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }


def check_content_images(site_id, comic_id, chapter_id):
    """检查章节的所有图片 - 查询章节的content_images数据，同时检查图片库中的下载状态"""
    from database import get_db

    try:
        if not comic_id or not chapter_id:
            return {
                'success': True,
                'status': 'not_exists',
                'data': None
            }

        db = get_db()
        chapters_collection = db.get_collection(f"{site_id}_manga_chapters")

        # 查询章节的 content_images 数据
        chapter = chapters_collection.find_one(
            {'aid': int(comic_id), 'pid': int(chapter_id)},
            {'content_images': 1, 'content_total': 1, 'content_loaded': 1}
        )

        if not chapter:
            return {
                'success': True,
                'status': 'not_exists',
                'data': None
            }

        content_images = chapter.get('content_images', [])

        if not content_images:
            return {
                'success': True,
                'status': 'not_exists',
                'data': None
            }

        # 检查图片库中的下载状态
        image_library = get_image_library(site_id)

        # 构造返回数据
        images = []
        loaded_count = 0

        for img in content_images:
            page = img.get('page')
            if not page:
                continue

            # 检查图片库是否存在
            is_downloaded = image_library.image_exists(
                aid=int(comic_id),
                pid=int(chapter_id),
                page_num=page,
                image_type='content'
            )

            images.append({
                'page': page,
                'url': f"/api/media/image?site={site_id}&aid={comic_id}&pid={chapter_id}&page={page}&type=content",
                'downloaded': is_downloaded
            })

            if is_downloaded:
                loaded_count += 1

        # 按page排序
        images.sort(key=lambda x: x['page'])

        return {
            'success': True,
            'status': 'exists',
            'data': {
                'images': images,
                'total': len(images),
                'loaded': loaded_count
            }
        }

    except Exception as e:
        logger.error(f"[资源检查] 检查章节图片失败: {e}", exc_info=True)
        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }


@api_bp.route('/<site_id>/resource/check_images_status', methods=['POST'])
def check_images_status(site_id):
    """
    批量查询指定页码的图片下载状态

    请求体:
        {
            "comic_id": 123,
            "chapter_id": 456,
            "pages": [1, 2, 3, ...]
        }

    返回:
        {
            "success": true,
            "data": {
                "1": { "downloaded": true, "url": "/api/media/image?..." },
                "2": { "downloaded": false },
                ...
            }
        }
    """
    try:
        data = request.get_json() or {}
        comic_id = data.get('comic_id')
        chapter_id = data.get('chapter_id')
        pages = data.get('pages', [])

        if not comic_id or not chapter_id or not pages:
            return jsonify({
                'success': False,
                'message': '缺少必要参数'
            }), 400

        logger.info(f"[批量状态查询] site={site_id}, comic={comic_id}, chapter={chapter_id}, pages={len(pages)}")

        image_library = get_image_library(site_id)
        result = {}

        for page in pages:
            # 检查图片库中是否存在
            is_downloaded = image_library.image_exists(
                aid=int(comic_id),
                pid=int(chapter_id),
                page_num=page,
                image_type='content'
            )

            if is_downloaded:
                result[str(page)] = {
                    'downloaded': True,
                    'url': f"/api/media/image?site={site_id}&aid={comic_id}&pid={chapter_id}&page={page}&type=content"
                }
            else:
                result[str(page)] = {
                    'downloaded': False
                }

        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        logger.error(f"[批量状态查询] 查询失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'查询失败: {str(e)}'
        }), 500


def check_comic_info(site_id, comic_id):
    """检查详情信息是否存在"""
    try:
        from models.comic import get_comic_model
        from database import get_db

        comic_model = get_comic_model(site_id)
        comic = comic_model.get_comic_by_aid(int(comic_id))

        if not comic:
            return {
                'success': True,
                'status': 'not_exists',
                'data': None
            }

        # 检查是否已爬取详情页
        info_update = comic.get('info_update')
        has_title = bool(comic.get('title'))
        has_description = bool(comic.get('description') or comic.get('summary'))

        # 如果没有 info_update，认为详情页未爬取
        if not info_update:
            return {
                'success': True,
                'status': 'not_exists',
                'data': None
            }

        # 如果没有任何有效信息，认为未爬取
        if not has_title and not has_description:
            return {
                'success': True,
                'status': 'not_exists',
                'data': None
            }

        # 获取章节列表
        db = get_db()
        chapters_collection = db.get_collection(f"{site_id}_manga_chapters")

        chapters_cursor = chapters_collection.find(
            {'aid': int(comic_id)},
            {
                'pid': 1,
                'title': 1,
                'created_at': 1,
                'info_update': 1,
                'update_time': 1,
                'order': 1,
                'chapter_type': 1
            }
        )

        chapters_list = list(chapters_cursor)

        def get_sort_key(ch):
            chapter_type = ch.get('chapter_type', 'chapter')
            if chapter_type == 'book':
                type_weight = 0
            elif chapter_type == 'chapter':
                type_weight = 1
            else:
                type_weight = 2
            order = ch.get('order', 0) or 0
            return (type_weight, order)

        chapters_list.sort(key=get_sort_key)

        chapters = []
        for ch in chapters_list:
            chapter_data = {
                'id': ch.get('pid'),
                'title': ch.get('title', f'第{ch.get("pid")}话'),
                'created_at': ch.get('created_at') or ch.get('info_update'),
                'update_time': ch.get('update_time'),
                'order': ch.get('order', 0),
                'chapter_type': ch.get('chapter_type', 'chapter')
            }
            chapters.append(chapter_data)

        comic['chapters'] = chapters

        return {
            'success': True,
            'status': 'exists',
            'data': comic
        }

    except Exception as e:
        logger.error(f"[资源检查] 检查详情失败: {e}")
        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }


def check_chapter_list(site_id, comic_id):
    """检查章节列表是否存在"""
    try:
        from models.comic import get_comic_model
        comic_model = get_comic_model(site_id)
        comic = comic_model.get_comic_by_aid(int(comic_id))

        if comic:
            return {
                'success': True,
                'status': 'exists',
                'data': {'chapters': []}
            }

        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }

    except Exception as e:
        logger.error(f"[资源检查] 检查章节失败: {e}")
        return {
            'success': True,
            'status': 'not_exists',
            'data': None
        }


# ==================== 图片获取 API ====================

@api_bp.route('/media/image/by-params')
def get_image_by_params():
    """
    获取图片（新接口 - 用业务参数定位）

    参数:
        site: 站点ID
        aid: 漫画ID
        pid: 章节ID (封面/缩略图可省略)
        page: 页码 (封面/缩略图可省略)
        type: 图片类型 (cover/thumbnail/content)

    返回:
        图片二进制数据
    """
    try:
        site_id = request.args.get('site')
        aid = request.args.get('aid')
        pid = request.args.get('pid')
        page = request.args.get('page')
        image_type = request.args.get('type', 'content')

        if not site_id or not aid:
            return jsonify({'error': '缺少必要参数'}), 400

        image_library = get_image_library(site_id)

        # 直接用业务参数获取图片数据
        image_data = image_library.get_image_data(
            aid=int(aid),
            pid=int(pid) if pid else None,
            page_num=int(page) if page else None,
            image_type=image_type
        )

        if not image_data:
            return jsonify({'error': 'Image not found'}), 404

        # 获取图片信息以确定 MIME 类型
        image_info = image_library.get_image(
            aid=int(aid),
            pid=int(pid) if pid else None,
            page_num=int(page) if page else None,
            image_type=image_type
        )

        mime_type = 'image/jpeg'
        if image_info and image_info.get('mime_type'):
            mime_type = image_info['mime_type']

        return Response(
            image_data,
            mimetype=mime_type,
            headers={
                'Cache-Control': 'public, max-age=86400',
                'Content-Disposition': f'inline; filename="{aid}_{image_type}.jpg"'
            }
        )

    except Exception as e:
        logger.error(f"[图片获取] 获取图片失败: {e}", exc_info=True)
        return jsonify({'error': f'获取图片失败: {str(e)}'}), 500


# ==================== 任务提交 ====================

@api_bp.route('/<site_id>/crawler/submit', methods=['POST'])
def submit_crawl_task(site_id):
    """
    提交爬取任务到高速桶

    参数:
        site_id: 站点ID
        body: {
            "resource_type": "cover_image" | "comic_info" | ...,
            "comic_id": int,
            "chapter_id": int | None,
            "page": int | None,
            "priority": "high" | "low"
        }

    返回:
        {
            "success": true,
            "task_id": "task_xxx",
            "status": "pending"
        }
    """
    try:
        data = request.get_json() or {}
        resource_type = data.get('resource_type')
        comic_id = data.get('comic_id')
        chapter_id = data.get('chapter_id')
        page = data.get('page')
        priority = data.get('priority', 'high')

        if not resource_type or comic_id is None:
            return jsonify({
                'success': False,
                'message': '缺少必要参数'
            }), 400

        logger.info(f"[任务提交] site_id={site_id}, type={resource_type}, comic_id={comic_id}, priority={priority}")

        from services.tasks.buckets import get_buckets
        from services.tasks.task_model import Task, TaskType, TaskPriority

        buckets = get_buckets()

        task_type_map = {
            'cover_image': TaskType.COVER_IMAGE,
            'thumbnail_image': TaskType.THUMBNAIL_IMAGE,
            'content_image': TaskType.CONTENT_IMAGE,
            'comic_info': TaskType.INFO_PAGE,
            'chapter_list': TaskType.CONTENT_PAGE,
            'content_page': TaskType.CONTENT_PAGE,
        }

        task_type = task_type_map.get(resource_type)

        if not task_type:
            return jsonify({
                'success': False,
                'message': f'不支持的资源类型: {resource_type}'
            }), 400

        task_priority = TaskPriority.HIGH if priority == 'high' else TaskPriority.LOW

        task = Task(
            task_type=task_type,
            priority=task_priority,
            params={
                'site_id': site_id,
                'comic_id': comic_id,
                'chapter_id': chapter_id,
                'page': page,
                'resource_type': resource_type
            }
        )

        task_id = buckets.submit_to_high_speed_bucket(task)

        logger.info(f"[任务提交] 任务已提交到高速桶: task_id={task_id}")

        return jsonify({
            'success': True,
            'task_id': task_id,
            'status': 'pending'
        })

    except Exception as e:
        logger.error(f"[任务提交] 提交失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'提交失败: {str(e)}'
        }), 500


@api_bp.route('/<site_id>/chapters/delete', methods=['POST'])
def delete_chapters(site_id):
    """
    删除指定漫画的章节数据

    参数:
        site_id: 站点ID
        body: {
            "comic_id": int
        }

    返回:
        {
            "success": true,
            "deleted_count": int
        }
    """
    try:
        from database import get_db

        data = request.get_json()
        comic_id = data.get('comic_id')

        if not comic_id:
            return jsonify({
                'success': False,
                'message': '缺少 comic_id 参数'
            }), 400

        db = get_db()
        collection_name = f"{site_id}_manga_chapters"
        collection = db.get_collection(collection_name)

        result = collection.delete_many({'aid': int(comic_id)})

        logger.info(f"[章节删除] 已删除漫画章节: site={site_id}, comic_id={comic_id}, count={result.deleted_count}")

        return jsonify({
            'success': True,
            'deleted_count': result.deleted_count
        })

    except Exception as e:
        logger.error(f"[章节删除] 删除失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'删除失败: {str(e)}'
        }), 500


@api_bp.route('/crawler/task/<task_id>')
def get_task_status(task_id):
    """
    查询任务状态

    参数:
        task_id: 任务ID

    返回:
        {
            "success": true,
            "task": {...}
        }
    """
    try:
        from services.tasks.buckets import get_result_bucket

        result_bucket = get_result_bucket()
        task = result_bucket.get_task(task_id)

        if task:
            return jsonify({
                'success': True,
                'task': {
                    'task_id': task.task_id,
                    'status': task.status.value,
                    'result': task.result
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': '任务不存在'
            }), 404

    except Exception as e:
        logger.error(f"[任务查询] 查询失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'查询失败: {str(e)}'
        }), 500
