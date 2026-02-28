"""
漫画相关API
"""
from flask import jsonify, request, send_file, Response
from blueprints.api import api_bp
from models.comic import get_comic_model
from utils.logger import get_logger

logger = get_logger(__name__)


@api_bp.route('/<site_id>/comics')
def get_comics(site_id):
    """
    获取漫画列表

    参数:
        site_id: 站点ID（如 cm, jm）
        page: 页码（默认1）
        per_page: 每页数量（默认20）
        skip: 跳过数量（用于无限滚动）
        limit: 限制数量（与skip配合使用）

    返回:
        {
            "success": true,
            "comics": [...],
            "total": 100,
            "page": 1,
            "pages": 5
        }
    """
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        skip = int(request.args.get('skip', 0))
        limit = request.args.get('limit')
        if limit:
            limit = int(limit)

        logger.info(f"[API] 获取漫画列表: site_id={site_id}, page={page}")

        comic_model = get_comic_model(site_id)
        result = comic_model.get_comics_list(
            page=page,
            per_page=per_page,
            skip=skip,
            limit=limit
        )

        return jsonify({
            'success': True,
            **result
        })

    except Exception as e:
        logger.error(f"[API] 获取漫画列表失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'comics': [],
            'total': 0,
            'page': page,
            'pages': 0,
            'error': str(e)
        })


@api_bp.route('/<site_id>/comics/search', methods=['POST'])
def search_comics(site_id):
    """
    搜索漫画

    参数:
        site_id: 站点ID
        body: {
            "keyword": "关键词",
            "tags": ["标签1", "标签2"],
            "page": 1,
            "per_page": 20
        }

    返回:
        {
            "success": true,
            "comics": [...],
            "total": 10,
            "page": 1,
            "pages": 1
        }
    """
    try:
        data = request.get_json() or {}
        keyword = data.get('keyword', '')
        tags = data.get('tags', [])
        page = int(data.get('page', 1))
        per_page = int(data.get('per_page', 20))

        logger.info(f"[API] 搜索漫画: site_id={site_id}, keyword={keyword}, tags={tags}")

        comic_model = get_comic_model(site_id)
        result = comic_model.search_comics(
            keyword=keyword,
            tags=tags,
            page=page,
            per_page=per_page
        )

        return jsonify({
            'success': True,
            **result
        })

    except Exception as e:
        logger.error(f"[API] 搜索漫画失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'comics': [],
            'total': 0,
            'page': page,
            'pages': 0,
            'error': str(e)
        })


@api_bp.route('/<site_id>/comic/<int:aid>')
def get_comic(site_id, aid):
    """
    获取漫画详情

    参数:
        site_id: 站点ID
        aid: 原站漫画ID

    返回:
        {
            "success": true,
            "comic": {...}
        }
    """
    try:
        logger.info(f"[API] 获取漫画详情: site_id={site_id}, aid={aid}")

        comic_model = get_comic_model(site_id)
        comic = comic_model.get_comic_by_aid(aid)

        if comic:
            return jsonify({
                'success': True,
                'comic': comic
            })
        else:
            return jsonify({
                'success': False,
                'message': '漫画不存在'
            }), 404

    except Exception as e:
        logger.error(f"[API] 获取漫画详情失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'获取详情失败: {str(e)}'
        }), 500


@api_bp.route('/<site_id>/comic/<int:aid>/chapters')
def get_chapters(site_id, aid):
    """
    获取章节列表

    参数:
        site_id: 站点ID
        aid: 原站漫画ID

    返回:
        {
            "success": true,
            "chapters": [...]
        }
    """
    try:
        logger.info(f"[API] 获取章节列表: site_id={site_id}, aid={aid}")

        comic_model = get_comic_model(site_id)
        comic = comic_model.get_comic_by_aid(aid)

        if comic:
            chapters = comic.get('chapters', [])
            return jsonify({
                'success': True,
                'chapters': chapters
            })
        else:
            return jsonify({
                'success': False,
                'message': '漫画不存在'
            }), 404

    except Exception as e:
        logger.error(f"[API] 获取章节列表失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'获取章节失败: {str(e)}'
        }), 500


@api_bp.route('/<site_id>/comic/<int:aid>/chapter/<int:pid>')
def get_chapter_images(site_id, aid, pid):
    """
    获取章节图片

    参数:
        site_id: 站点ID
        aid: 原站漫画ID
        pid: 章节ID

    返回:
        {
            "success": true,
            "images": [...]
        }
    """
    try:
        logger.info(f"[API] 获取章节图片: site_id={site_id}, aid={aid}, pid={pid}")

        comic_model = get_comic_model(site_id)
        comic = comic_model.get_comic_by_aid(aid)

        if not comic:
            return jsonify({
                'success': False,
                'message': '漫画不存在'
            }), 404

        # 查找对应章节
        chapters = comic.get('chapters', [])
        chapter = None
        for ch in chapters:
            if ch.get('pid') == pid:
                chapter = ch
                break

        if not chapter:
            return jsonify({
                'success': False,
                'message': '章节不存在'
            }), 404

        # 获取章节图片列表
        images = chapter.get('images', [])

        # 格式化图片URL
        formatted_images = []
        for img in images:
            if isinstance(img, dict):
                file_id = img.get('file_id')
                if file_id:
                    formatted_images.append({
                        'file_id': file_id,
                        'url': f"/api/media/image?file_id={file_id}&site_id={site_id}",
                        'page': img.get('page', 0)
                    })
                else:
                    formatted_images.append({
                        'url': img.get('url', ''),
                        'page': img.get('page', 0)
                    })
            else:
                formatted_images.append({
                    'url': img,
                    'page': 0
                })

        return jsonify({
            'success': True,
            'chapter': {
                'pid': chapter.get('pid'),
                'title': chapter.get('title', ''),
                'images_count': len(formatted_images)
            },
            'images': formatted_images
        })

    except Exception as e:
        logger.error(f"[API] 获取章节图片失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'获取图片失败: {str(e)}'
        }), 500


@api_bp.route('/media/image')
def get_image():
    """
    从图片库读取图片并返回

    支持两种调用方式：
    1. 通过file_id获取:
        file_id: 图片库中的file_id（MongoDB的_id）
        site_id: 站点ID (可选，默认为cm)

    2. 通过业务参数获取:
        site: 站点ID
        aid: 漫画ID
        pid: 章节ID (封面/缩略图可省略)
        page: 页码 (封面/缩略图可省略)
        type: 图片类型 (cover/thumbnail/content)
    """
    try:
        from utils.logger import get_logger
        logger = get_logger(__name__)

        file_id = request.args.get('file_id')
        site_id = request.args.get('site_id') or request.args.get('site', 'cm')

        # 业务参数
        aid = request.args.get('aid')
        pid = request.args.get('pid')
        page = request.args.get('page')
        image_type = request.args.get('type', 'content')

        from models.image_library import get_image_library
        image_library = get_image_library(site_id)

        # 方式1：通过file_id获取
        if file_id:
            logger.info(f"[图片加载] 通过file_id获取: file_id={file_id}, site_id={site_id}")
            image_info = image_library.get_image_by_id(file_id)
        # 方式2：通过业务参数获取
        elif aid:
            logger.info(f"[图片加载] 通过业务参数获取: site={site_id}, aid={aid}, pid={pid}, page={page}, type={image_type}")
            image_info = image_library.get_image(
                aid=int(aid),
                pid=int(pid) if pid else None,
                page_num=int(page) if page else None,
                image_type=image_type
            )
        else:
            logger.error("[图片加载] 缺少必要参数")
            return jsonify({'success': False, 'message': '缺少file_id或aid参数'}), 400

        if not image_info:
            logger.error(f"[图片加载] 图片不存在")
            return jsonify({'success': False, 'message': '图片不存在'}), 404

        logger.info(f"[图片加载] 找到图片: md5={image_info.get('md5')}, mime_type={image_info.get('mime_type')}")

        # 直接获取图片数据
        image_data = image_library.get_image_data(
            aid=image_info.get('aid'),
            pid=image_info.get('pid'),
            page_num=image_info.get('page_num'),
            image_type=image_info.get('image_type', 'content')
        )

        if not image_data:
            logger.error(f"[图片加载] 图片数据读取失败")
            return jsonify({'success': False, 'message': '图片数据读取失败'}), 500

        logger.info(f"[图片加载] 成功读取图片数据: {len(image_data)} bytes")

        # 返回图片
        return Response(
            image_data,
            mimetype=image_info.get('mime_type', 'image/jpeg'),
            headers={
                'Cache-Control': 'public, max-age=31536000',  # 缓存1年
                'Content-Disposition': f'inline; filename="{image_info.get("_id", "image")}.{image_info.get("mime_type", "image/jpeg").split("/")[1]}"'
            }
        )

    except Exception as e:
        from utils.logger import get_logger
        logger = get_logger(__name__)
        logger.error(f"[图片加载] 异常: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': f'读取图片失败: {str(e)}'}), 500


@api_bp.route('/sites')
def get_sites():
    """
    获取所有可用站点

    返回:
        {
            "success": true,
            "sites": [...]
        }
    """
    try:
        import json
        import os

        sites_config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'data', 'sites_config.json')

        with open(sites_config_path, 'r', encoding='utf-8') as f:
            sites_config = json.load(f)

        sites = []
        for site_id, config in sites_config.items():
            sites.append({
                'site_id': config.get('site_id', site_id),
                'site_name': config.get('site_name', ''),
                'enabled': config.get('enabled', False)
            })

        return jsonify({
            'success': True,
            'sites': sites
        })

    except Exception as e:
        logger.error(f"[API] 获取站点列表失败: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'sites': [],
            'error': str(e)
        })
