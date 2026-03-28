"""
收藏 API 路由
提供漫画收藏的添加、查询、删除功能
"""
from flask import request, jsonify, session
from blueprints.api import api_bp
from database import get_db
from models.favorite import Favorite
from utils.logger import get_logger
from utils.auth_middleware import login_required

logger = get_logger(__name__)


def get_favorite_model(site_id: str) -> Favorite:
    """获取收藏模型"""
    db = get_db()
    return Favorite(db, site_id)


@api_bp.route('/<site_id>/favorite', methods=['POST'])
@login_required
def site_add_favorite(site_id: str):
    """
    添加收藏

    请求体:
    {
        "aid": 123    // 必填，漫画ID
    }
    """
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': '未登录'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': '无效请求数据'}), 400

        aid = data.get('aid')
        if aid is None:
            return jsonify({'success': False, 'message': '缺少漫画ID'}), 400

        favorite_model = get_favorite_model(site_id)
        success = favorite_model.add_favorite(user_id, aid)

        if success:
            return jsonify({'success': True, 'message': '收藏成功'})
        else:
            return jsonify({'success': False, 'message': '收藏失败'}), 500

    except Exception as e:
        logger.error(f"[收藏API] 添加异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@api_bp.route('/<site_id>/favorite/<int:aid>', methods=['DELETE'])
@login_required
def site_remove_favorite(site_id: str, aid: int):
    """
    取消收藏

    路径参数:
    - site_id: 站点ID
    - aid: 漫画ID
    """
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': '未登录'}), 401

        favorite_model = get_favorite_model(site_id)
        success = favorite_model.remove_favorite(user_id, aid)

        if success:
            return jsonify({'success': True, 'message': '取消收藏成功'})
        else:
            return jsonify({'success': False, 'message': '未找到收藏记录'}), 404

    except Exception as e:
        logger.error(f"[收藏API] 取消异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@api_bp.route('/<site_id>/favorite/<int:aid>', methods=['GET'])
@login_required
def site_check_favorite(site_id: str, aid: int):
    """
    检查是否已收藏

    路径参数:
    - site_id: 站点ID
    - aid: 漫画ID
    """
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': '未登录'}), 401

        favorite_model = get_favorite_model(site_id)
        is_favorited = favorite_model.is_favorited(user_id, aid)

        return jsonify({
            'success': True,
            'data': {
                'is_favorited': is_favorited
            }
        })

    except Exception as e:
        logger.error(f"[收藏API] 检查异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@api_bp.route('/<site_id>/favorites', methods=['GET'])
@login_required
def site_get_favorite_list(site_id: str):
    """
    获取收藏列表

    查询参数:
    - page: 页码，默认1
    - per_page: 每页数量，默认20
    """
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': '未登录'}), 401

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # 限制每页最大数量
        per_page = min(per_page, 50)

        favorite_model = get_favorite_model(site_id)
        result = favorite_model.get_favorite_list(user_id, page, per_page)

        return jsonify({
            'success': True,
            'data': result['data'],
            'count': result['count'],
            'page': result['page'],
            'page_count': result['page_count']
        })

    except Exception as e:
        logger.error(f"[收藏API] 获取列表异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@api_bp.route('/<site_id>/favorites/clear', methods=['POST'])
@login_required
def site_clear_favorites(site_id: str):
    """
    清空所有收藏

    路径参数:
    - site_id: 站点ID
    """
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': '未登录'}), 401

        favorite_model = get_favorite_model(site_id)
        count = favorite_model.clear_favorites(user_id)

        return jsonify({
            'success': True,
            'message': f'已清空 {count} 条收藏'
        })

    except Exception as e:
        logger.error(f"[收藏API] 清空异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500
