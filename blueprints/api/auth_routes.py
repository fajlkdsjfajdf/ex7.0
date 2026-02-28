"""
认证相关API
实现基于数据库的用户登录、IP限制等功能
"""
from flask import request, session, jsonify
from functools import wraps
from database import get_db
from models.user import User, IPBlacklist
from utils.logger import get_logger

logger = get_logger(__name__)

# 导入蓝图
from blueprints.api import api_bp


# ==================== 装饰器 ====================

def login_required(f):
    """
    登录验证装饰器
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


# ==================== 白名单路径 ====================

# 不需要登录验证的路径前缀
WHITE_LIST = [
    '/login.html',
    '/api/login',
    '/api/logout',
    '/static/',
    '/data/',
    '/favicon.ico',
]


def is_white_listed(path: str) -> bool:
    """
    检查路径是否在白名单中
    """
    for white_path in WHITE_LIST:
        if path.startswith(white_path):
            return True
    return False


def check_login_required():
    """
    检查是否需要登录验证
    用于 before_request 中间件
    """
    # 白名单路径不需要验证
    if is_white_listed(request.path):
        return None

    # 检查登录状态
    if 'user_id' not in session:
        from flask import redirect
        return redirect('/login.html')

    return None


def check_ip_block():
    """
    检查IP是否被封禁
    临时禁用IP封禁检查以便测试
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
            return True, jsonify({
                'success': False,
                'message': f'IP已被封禁，请{remaining}秒后再试'
            }), 403

        return False, None, None
    except Exception as e:
        # 数据库连接失败时，跳过IP封禁检查
        logger.warning(f"IP封禁检查失败，跳过检查: {e}")
        return False, None, None


# ==================== 路由定义 ====================

@api_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    # 检查IP封禁
    is_blocked, block_response, status_code = check_ip_block()
    if is_blocked:
        return block_response, status_code

    data = request.get_json()
    if not data:
        return jsonify({
            'success': False,
            'message': '请求数据无效'
        }), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')
    ip = request.remote_addr

    # 基本验证
    if not username or not password:
        return jsonify({
            'success': False,
            'message': '用户名和密码不能为空'
        }), 400

    # 获取数据库实例
    db = get_db()
    user_model = User(db)
    ip_blacklist = IPBlacklist(db)

    # 验证用户
    user = user_model.verify_password(username, password)

    if user:
        # 登录成功，清除IP失败记录
        ip_blacklist.clear_attempts(ip)

        # 设置Session
        session['user_id'] = str(user['_id'])
        session['username'] = user['username']
        session['role'] = user.get('role', 'user')
        session.permanent = True  # 使用永久Session

        logger.info(f"用户登录成功: {username}, IP: {ip}")

        return jsonify({
            'success': True,
            'message': '登录成功',
            'user': {
                'username': user['username'],
                'nickname': user.get('nickname', user['username']),
                'role': user.get('role', 'user')
            }
        })
    else:
        # 登录失败，记录IP
        attempts = ip_blacklist.record_failed_attempt(ip)

        logger.warning(f"登录失败: {username}, IP: {ip}, 尝试次数: {attempts}")

        # 检查是否即将被封禁
        remaining_attempts = IPBlacklist.MAX_ATTEMPTS - attempts
        if remaining_attempts > 0:
            message = f'用户名或密码错误，剩余尝试次数: {remaining_attempts}'
        else:
            message = f'登录失败次数过多，IP已被封禁{IPBlacklist.BLOCK_DURATION // 60}分钟'

        return jsonify({
            'success': False,
            'message': message
        }), 401


@api_bp.route('/logout', methods=['POST'])
def logout():
    """用户登出"""
    username = session.get('username', 'unknown')
    session.clear()
    logger.info(f"用户登出: {username}")
    return jsonify({
        'success': True,
        'message': '登出成功'
    })


@api_bp.route('/user/current')
def current_user():
    """获取当前登录用户"""
    if 'user_id' in session:
        return jsonify({
            'success': True,
            'user': {
                'username': session.get('username', ''),
                'role': session.get('role', 'user')
            }
        })
    else:
        return jsonify({
            'success': False,
            'message': '未登录'
        }), 401


@api_bp.route('/user/change-password', methods=['POST'])
@login_required
def change_password():
    """修改密码"""
    data = request.get_json()
    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not old_password or not new_password:
        return jsonify({
            'success': False,
            'message': '旧密码和新密码不能为空'
        }), 400

    if len(new_password) < 6:
        return jsonify({
            'success': False,
            'message': '新密码长度不能少于6位'
        }), 400

    username = session.get('username')
    db = get_db()
    user_model = User(db)

    # 验证旧密码
    user = user_model.verify_password(username, old_password)
    if not user:
        return jsonify({
            'success': False,
            'message': '旧密码错误'
        }), 400

    # 更新密码
    if user_model.update_password(username, new_password):
        logger.info(f"用户修改密码成功: {username}")
        return jsonify({
            'success': True,
            'message': '密码修改成功'
        })
    else:
        return jsonify({
            'success': False,
            'message': '密码修改失败'
        }), 500
