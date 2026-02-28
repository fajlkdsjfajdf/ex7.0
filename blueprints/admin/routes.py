"""
后台管理路由
"""
from flask import render_template, redirect, url_for, session, current_app
from blueprints.admin import admin_bp
from functools import wraps


# 后台登录验证装饰器
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 检查是否登录
        if 'user_id' not in session:
            return redirect(url_for('frontend.login'))

        # TODO: 可以添加管理员权限验证
        # if session.get('role') != 'admin':
        #     return redirect(url_for('frontend.index'))

        return f(*args, **kwargs)
    return decorated_function


@admin_bp.route('/')
@admin_required
def index():
    """后台首页 - 仪表盘"""
    return render_template('dashboard.html')


@admin_bp.route('/dashboard')
@admin_required
def dashboard():
    """仪表盘"""
    return render_template('dashboard.html')


@admin_bp.route('/crawler')
@admin_required
def crawler():
    """爬虫管理"""
    return render_template('crawler.html')


@admin_bp.route('/config')
@admin_required
def config():
    """配置管理"""
    return render_template('config.html')


@admin_bp.route('/users')
@admin_required
def users():
    """用户管理"""
    return render_template('users.html')


@admin_bp.route('/buckets')
@admin_required
def buckets():
    """桶管理"""
    return render_template('buckets.html')


@admin_bp.route('/schedulers')
@admin_required
def schedulers():
    """定时任务"""
    return render_template('schedulers.html')


@admin_bp.route('/proxy')
@admin_required
def proxy():
    """代理管理"""
    return render_template('proxy.html')


@admin_bp.route('/scheduled-tasks')
@admin_required
def scheduled_tasks():
    """定时任务计划"""
    return render_template('scheduled_tasks.html')
