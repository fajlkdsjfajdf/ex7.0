"""
漫画站系统 - Flask主应用
统一管理前台展示、后台管理、API接口


### 启动 Flask 应用

**错误方式**（不要使用）:
```bash
python app.py  # [X] 使用系统 Python，缺少依赖
```

**正确方式**:
```bash
直接使用虚拟环境中的 Python
C:/Users/34317/.conda/envs/ex-web/python.exe D:/源码/ex7.0/app.py
```
"""
import os
import sys
from datetime import datetime
from flask import Flask, render_template, send_from_directory, session, request, jsonify

# 尝试导入Flask-SocketIO
try:
    from flask_socketio import SocketIO
    HAS_SOCKETIO = True
except ImportError:
    HAS_SOCKETIO = False
    SocketIO = None

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入配置
from config import Config

# 初始化日志系统
from utils.logger import get_logger
logger = get_logger(__name__)
logger.info("="*50)
logger.info("应用正在启动...")
logger.info("="*50)

# 创建Flask应用
# 设置全局static_folder，统一管理静态文件
# 不设置template_folder，让各蓝图独立管理模板
app = Flask(__name__, static_folder='static')
app.config.from_object(Config)

# 初始化SocketIO（如果可用）
if HAS_SOCKETIO:
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
    logger.info("WebSocket支持已启用 (Flask-SocketIO)")
else:
    socketio = None
    logger.warning("Flask-SocketIO未安装，WebSocket功能不可用")

# 站点配置
SITE_ID = Config.SITE_ID
SITE_NAME = Config.SITE_NAME


# ==================== 注册蓝图 ====================

# 导入蓝图
from blueprints.frontend import frontend_bp
from blueprints.admin import admin_bp
from blueprints.api import api_bp

# 注册蓝图
app.register_blueprint(admin_bp)         # 后台管理（/admin前缀）- 先注册
app.register_blueprint(frontend_bp)      # 前台展示（无URL前缀）
app.register_blueprint(api_bp)           # API接口（/api前缀）


# ==================== 登录状态验证中间件 ====================

from utils.auth_middleware import check_login_status, init_default_user

@app.before_request
def before_request():
    """
    请求预处理中间件
    1. 检查IP封禁状态
    2. 检查登录状态
    """
    return check_login_status()


# ==================== 初始化WebSocket ====================

if HAS_SOCKETIO and socketio:
    try:
        from blueprints.api.websocket_routes import register_socketio_events
        register_socketio_events(socketio)
        logger.info("WebSocket事件处理器已注册")
    except Exception as e:
        logger.error(f"WebSocket事件处理器注册失败: {e}")


# ==================== 初始化数据库和====================

try:
    from database import get_db
    from models.image_library import ImageLibrary
    from utils.config_loader import load_sites_config
    from utils.auth_middleware import init_default_user

    # 初始化数据库连接
    db = get_db()

    # 从配置文件动态加载站点ID
    sites_config = load_sites_config()
    site_ids = list(sites_config.keys())

    if site_ids:
        # 创建图片库索引（仅针对已配置的站点）
        ImageLibrary.create_all_indexes(site_ids=site_ids)
        logger.info(f"数据库索引创建成功: {site_ids}")
    else:
        logger.warning("未找到已配置的站点，跳过图片库索引创建")

    # 初始化默认用户
    init_default_user()

except Exception as e:
    logger.error(f"数据库初始化失败: {e}")
    logger.warning("应用将继续运行,但数据库功能可能不可用")


# ==================== 启动定时任务调度器 ====================

try:
    from services.scheduler import scheduler
    scheduler.start()
    logger.info("定时任务调度器已启动")
except Exception as e:
    logger.error(f"定时任务调度器启动失败: {e}")
    logger.warning("应用将继续运行，但定时任务功能可能不可用")


# ==================== 启动Worker池 ====================

try:
    from services import get_worker_pool
    worker_pool = get_worker_pool()
    worker_pool.start()
    logger.info("Worker池已启动")
except Exception as e:
    logger.error(f"Worker池启动失败: {e}")
    logger.warning("应用将继续运行，但任务处理功能可能不可用")


# ==================== 错误处理 ====================

@app.errorhandler(404)
def not_found(error):
    """404错误处理"""
    # 如果是API请求，返回JSON
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'message': '页面未找到'
        }), 404

    # 如果是普通请求，返回404页面
    return render_template('errors/404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    """500错误处理"""
    # 如果是API请求，返回JSON
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'message': '服务器内部错误'
        }), 500

    # 如果是普通请求，返回500页面
    return render_template('errors/500.html'), 500


# ==================== 数据文件服务 ====================

@app.route('/data/<path:filename>')
def serve_data(filename):
    """提供数据文件访问"""
    data_dir = app.config.get('DATA_DIR', 'data')
    return send_from_directory(data_dir, filename)


# ==================== 启动应用 ====================

if __name__ == '__main__':
    startup_info = f"""
    ╔══════════════════════════════════════════════════════╗
    ║          暗黑漫画站系统 - Flask应用                      ║
    ╠══════════════════════════════════════════════════════╣
    ║   启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}           ║
    ║   站点ID: {SITE_ID}                                   ║
    ║   站点名称: {SITE_NAME}                                ║
    ╠══════════════════════════════════════════════════════╣
    ║   访问地址: http://localhost:5000                      ║
    ║                                                      ║
    ║   [功能模块]                                          ║
    ║   ├─ 前台展示: /                                    ║
    ║   ├─ 后台管理: /admin                                ║
    ║   └─ API接口:  /api                                  ║
    ║                                                      ║
    ║   [默认账号]                                          ║
    ║   用户名: admin                                      ║
    ║   密码: 123456                                        ║
    ╚══════════════════════════════════════════════════════╝
    """
    logger.info(startup_info)
    print(startup_info)  # 同时保留控制台输出，方便查看启动信息

    # 如果使用SocketIO，使用socketio.run()替代app.run()
    if HAS_SOCKETIO and socketio:
        socketio.run(
            app,
            host='0.0.0.0',
            port=5000,
            debug=True,
            allow_unsafe_werkzeug=True
        )
    else:
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True
        )
