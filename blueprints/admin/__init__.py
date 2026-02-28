"""
后台管理蓝图
"""
from flask import Blueprint

admin_bp = Blueprint('admin', __name__,
                     template_folder='../../templates/admin',
                     url_prefix='/admin')

from . import routes, api_routes, config_routes, scheduled_task_routes, log_routes, media_library_routes, task_api
