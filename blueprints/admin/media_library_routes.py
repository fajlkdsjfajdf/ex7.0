"""
图片库管理路由
"""

import os
from flask import render_template, send_file, jsonify
from blueprints.admin import admin_bp
from blueprints.admin.routes import admin_required


@admin_bp.route('/media-library')
@admin_required
def media_library():
    """图片库管理页面"""
    return render_template('admin/media_library.html')


@admin_bp.route('/api/media/image')
@admin_required
def get_media_image():
    """获取媒体图片用于预览"""
    from flask import request
    from utils.logger import get_logger

    logger = get_logger(__name__)

    try:
        image_path = request.args.get('path')

        if not image_path:
            return jsonify({'error': '缺少图片路径参数'}), 400

        # 安全检查：确保路径不包含目录遍历攻击
        if '..' in image_path or image_path.startswith('/'):
            return jsonify({'error': '非法的图片路径'}), 400

        # 检查文件是否存在
        if not os.path.exists(image_path):
            return jsonify({'error': f'图片文件不存在: {image_path}'}), 404

        # 检查文件扩展名
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        ext = os.path.splitext(image_path)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({'error': f'不支持的文件类型: {ext}'}), 400

        # 发送文件
        return send_file(image_path, mimetype=f'image/{ext[1:]}')

    except Exception as e:
        logger.error(f"获取图片失败: {e}", exc_info=True)
        return jsonify({'error': f'获取图片失败: {str(e)}'}), 500
