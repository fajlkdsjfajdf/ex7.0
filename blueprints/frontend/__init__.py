"""
前台展示蓝图
"""
from flask import Blueprint

frontend_bp = Blueprint('frontend', __name__,
                       template_folder='../../templates/frontend')

from . import routes
