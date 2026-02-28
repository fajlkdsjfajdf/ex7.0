from flask import Blueprint,  Flask, render_template, request, abort, make_response
from pathlib import Path
from utils.image_query import ImageQuery
from utils.helpers import validate_path, get_file_modification_time, get_human_readable_size
from utils.safe_image_store import SafeImageStore
from config.configParse import config
from util import system

imgtool_bp = Blueprint('imgtool', __name__, 
                    url_prefix='/imgtool',
                    template_folder='../../templates/imgtool',
                    static_folder='../../static/imgtool')

store_path = f'{system.getMainDir()}/{config.read("setting", "img_file")}'

store = SafeImageStore(store_path)  # 初始化存储

image_query = ImageQuery(store)       # 初始化查询工具

@imgtool_bp.route('/')
def index():
    """第一级：显示所有子文件夹"""
    try:
        subdirs = image_query.get_subdirectories()
        return render_template('level1.html', subdirs=subdirs)
    except FileNotFoundError as e:
        return render_template('error.html', message=str(e)), 404

@imgtool_bp.route('/view_files/<path:subdir>')
def view_files(subdir):
    """第二级：显示子文件夹中的dat/idx文件对"""
    if not validate_path(Path(store.storage_dir), subdir):
        abort(404)
    
    try:
        file_pairs = image_query.get_file_pairs(subdir)
        return render_template('level2.html', files=file_pairs, subdir=subdir)
    except FileNotFoundError as e:
        return render_template('error.html', message=str(e)), 404

@imgtool_bp.route('/view_images/<path:subdir>/<filename>')
def view_images(subdir, filename):
    """第三级：显示文件中的图片信息"""
    if not validate_path(Path(store.storage_dir), subdir):
        abort(404)
    
    # 获取文件前缀（不带扩展名）
    if filename.endswith('.dat'):
        prefix = filename[:-4]
    elif filename.endswith('.idx'):
        prefix = filename[:-4]
    else:
        abort(404)
    
    try:
        data = store.get_image_metadata(prefix, subdir)
        return render_template('level3.html', 
                            images=data['images'], 
                            subdir=subdir, 
                            filename=filename,
                            prefix=prefix,
                            dat_file_size=get_human_readable_size(data['dat_file_size']),
                            idx_file_size=get_human_readable_size(data['idx_file_size']))
    except Exception as e:
        return render_template('error.html', message=str(e)), 400

@imgtool_bp.route('/get_image/<image_id>')
def get_image(image_id):
    """获取图片数据"""
    subdir = request.args.get('subdir')
    page = request.args.get('page', type=int)
    
    try:
        image_data = store.retrieve_image(image_id, subdir=subdir, page=page)
        if image_data is None:
            abort(404)
        response = make_response(image_data)
        response.headers.set('Content-Type', 'image/jpeg')
        return response

    except Exception as e:
        abort(500, description=str(e))

