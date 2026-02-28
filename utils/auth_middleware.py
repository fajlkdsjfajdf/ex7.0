"""
认证中间件
实现登录状态验证和IP限制
"""
from functools import wraps
from flask import request, redirect, session, jsonify
from database import get_db
from models.user import User, IPBlacklist
from utils.logger import get_logger

logger = get_logger(__name__)


# ==================== 白名单路径 ====================

# 不需要登录验证的路径前缀
WHITE_LIST = [
    '/login.html',
    '/api/login',
    '/api/logout',
    '/static/',
    '/data/',
    '/favicon.ico',
    '/api/media/image',        # 图片资源公开访问
    '/api/media/image/by-params',  # 图片资源公开访问
    '/resource/check',         # 资源检查公开访问
    '/crawler/submit',         # 任务提交公开访问
    '/crawler/task/',          # 任务状态查询公开访问
]


def is_white_listed(path: str) -> bool:
    """
    检查路径是否在白名单中

    Args:
        path: 请求路径

    Returns:
        是否在白名单中
    """
    for white_path in WHITE_LIST:
        if path.startswith(white_path):
            return True
    return False


# ==================== IP封禁检查 ====================

def check_ip_block():
    """
    检查IP是否被封禁

    Returns:
        tuple: (is_blocked, response_or_none, status_code_or_none)
        当is_blocked=True时,返回 (True, response, 403)
        当is_blocked=False时,返回 (False, None, None)
    """
    # 临时禁用IP封禁检查以便测试
    return False, None, None

    try:
        ip = request.remote_addr
        db = get_db()
        ip_blacklist = IPBlacklist(db)

        is_blocked, remaining = ip_blacklist.is_blocked(ip)
        if is_blocked:
            logger.warning(f"IP被封禁: {ip}, 剩余时间: {remaining}秒")
            response = jsonify({
                'success': False,
                'message': f'IP已被封禁，请{remaining}秒后再试'
            })
            return True, response, 403

        return False, None, None
    except Exception as e:
        # 数据库连接失败时，跳过IP封禁检查
        logger.warning(f"IP封禁检查失败，跳过检查: {e}")
        return False, None, None


# ==================== 登录状态验证中间件 ====================

def login_required(f):
    """
    登录验证装饰器
    用于需要登录才能访问的API
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({
                'success': False,
                'message': '请先登录'
            }), 401
        return f(*args, **kwargs)
    return decorated_function


# ==================== 登录状态检查 ====================

def check_login_status():
    """
    检查是否需要登录验证
    用于 before_request 中间件

    Returns:
        None 或 重定向响应
    """
    # 白名单路径不需要验证
    if is_white_listed(request.path):
        return None

    # 检查IP封禁状态
    is_blocked, block_response, status_code = check_ip_block()
    if is_blocked:
        return block_response, status_code

    # 检查登录状态
    if 'user_id' not in session:
        # API请求返回JSON
        if request.path.startswith('/api/'):
            return jsonify({
                'success': False,
                'message': '请先登录'
            }), 401
        # 页面请求重定向到登录页
        return redirect('/login.html')

    return None


# ==================== 初始化默认用户 ====================

def init_default_user():
    """
    初始化默认用户
    如果数据库中没有用户，则创建默认用户
    """
    db = get_db()
    user_model = User(db)
    ip_blacklist = IPBlacklist(db)

    # 创建索引
    user_model.create_indexes()
    ip_blacklist.create_indexes()

    # 检查是否已存在管理员
    admin = user_model.get_user_by_username('ainizai0904')
    if not admin:
        # 创建管理员用户
        admin = user_model.create_user(
            username='ainizai0904',
            password='yuwenwei1994',
            nickname='管理员',
            role='admin'
        )
        if admin:
            logger.info("创建默认管理员用户: ainizai0904 / yuwenwei1994")
        else:
            logger.info("管理员用户已存在")

    return admin
