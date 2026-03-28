"""
历史记录 API 路由
提供阅读历史的记录、查询、删除功能
"""
from flask import request, jsonify, session
from blueprints.api import api_bp
from database import get_db
from models.history import History
from utils.logger import get_logger
from utils.auth_middleware import login_required

logger = get_logger(__name__)


def get_history_model(site_id: str) -> History:
    """获取历史记录模型"""
    db = get_db()
    return History(db, site_id)


@api_bp.route('/<site_id>/history', methods=['POST'])
@login_required
def site_record_history(site_id: str):
    """
    记录阅读历史

    请求体:
    {
        "aid": 123,       // 必填，漫画ID
        "pid": 456        // 可选，章节ID
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

        pid = data.get('pid')

        history_model = get_history_model(site_id)
        success = history_model.record_history(user_id, aid, pid)

        if success:
            return jsonify({'success': True, 'message': '记录成功'})
        else:
            return jsonify({'success': False, 'message': '记录失败'}), 500

    except Exception as e:
        logger.error(f"[历史记录API] 记录异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@api_bp.route('/<site_id>/history', methods=['GET'])
@login_required
def site_get_history_list(site_id: str):
    """
    获取历史记录列表

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

        history_model = get_history_model(site_id)
        result = history_model.get_history_list(user_id, page, per_page)

        return jsonify({
            'success': True,
            'data': result['data'],
            'count': result['count'],
            'page': result['page'],
            'page_count': result['page_count']
        })

    except Exception as e:
        logger.error(f"[历史记录API] 获取列表异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@api_bp.route('/<site_id>/history/<int:aid>', methods=['GET'])
@login_required
def site_get_history_detail(site_id: str, aid: int):
    """
    获取单个漫画的阅读历史

    路径参数:
    - site_id: 站点ID
    - aid: 漫画ID
    """
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': '未登录'}), 401

        history_model = get_history_model(site_id)
        record = history_model.get_history(user_id, aid)

        return jsonify({
            'success': True,
            'data': record
        })

    except Exception as e:
        logger.error(f"[历史记录API] 获取详情异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@api_bp.route('/<site_id>/history/<int:aid>', methods=['DELETE'])
@login_required
def site_delete_history(site_id: str, aid: int):
    """
    删除单条历史记录

    路径参数:
    - site_id: 站点ID
    - aid: 漫画ID
    """
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': '未登录'}), 401

        history_model = get_history_model(site_id)
        success = history_model.delete_history(user_id, aid)

        if success:
            return jsonify({'success': True, 'message': '删除成功'})
        else:
            return jsonify({'success': False, 'message': '记录不存在'}), 404

    except Exception as e:
        logger.error(f"[历史记录API] 删除异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@api_bp.route('/<site_id>/history/clear', methods=['POST'])
@login_required
def site_clear_history(site_id: str):
    """
    清空所有历史记录

    路径参数:
    - site_id: 站点ID
    """
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': '未登录'}), 401

        history_model = get_history_model(site_id)
        count = history_model.clear_history(user_id)

        return jsonify({
            'success': True,
            'message': f'已清空 {count} 条历史记录'
        })

    except Exception as e:
        logger.error(f"[历史记录API] 清空异常: {e}")
        return jsonify({'success': False, 'message': '服务器错误'}), 500
