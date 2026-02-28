"""
API路由总入口
"""
from flask import jsonify
from blueprints.api import api_bp


# ========== 认证相关 ==========
from .auth_routes import *  # noqa


# ========== 漫画相关 ==========
from .comic_routes import *  # noqa


# ========== 爬虫相关 ==========
from .crawler_routes import *  # noqa


# ========== 用户相关 ==========
from .user_routes import *  # noqa


# ========== 资源相关 ==========
from .resource_routes import *  # noqa


@api_bp.errorhandler(404)
def api_not_found(error):
    """API 404错误处理"""
    return jsonify({
        'success': False,
        'message': 'API接口不存在'
    }), 404


@api_bp.errorhandler(500)
def api_internal_error(error):
    """API 500错误处理"""
    return jsonify({
        'success': False,
        'message': '服务器内部错误'
    }), 500
