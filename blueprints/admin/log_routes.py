"""
系统日志页面路由
"""

from flask import render_template
from blueprints.admin import admin_bp
from blueprints.admin.routes import admin_required


@admin_bp.route('/logs')
@admin_required
def logs():
    """系统日志页面"""
    return render_template('admin/logs.html')


@admin_bp.route('/logs/<log_type>')
@admin_required
def view_log(log_type):
    """
    查看特定类型的日志

    Args:
        log_type: 日志类型 (app, error)
    """
    return render_template('admin/view_log.html', log_type=log_type)
