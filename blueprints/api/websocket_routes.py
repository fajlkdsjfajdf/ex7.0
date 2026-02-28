"""
WebSocket路由 - 实时任务通知
"""
try:
    from flask_socketio import emit, join_room, leave_room, rooms
    HAS_SOCKETIO = True
except ImportError:
    HAS_SOCKETIO = False
    # 简单的模拟实现，用于开发测试
    def emit(event, data, room=None, broadcast=False):
        pass
    def join_room(room):
        pass
    def leave_room(room):
        pass
    def rooms():
        return []

from flask import request
from blueprints.api import api_bp
from utils.logger import get_logger

logger = get_logger(__name__)


def register_socketio_events(socketio):
    """
    注册SocketIO事件处理器

    参数:
        socketio: Flask-SocketIO实例
    """
    if not HAS_SOCKETIO:
        logger.warning("[WebSocket] Flask-SocketIO未安装，WebSocket功能不可用")
        return

    from services.websocket_service import get_websocket_service
    ws_service = get_websocket_service()
    ws_service.init_socketio(socketio)

    @socketio.on('connect')
    def handle_connect():
        """客户端连接"""
        client_id = request.sid
        logger.info(f"[WebSocket] 客户端连接: {client_id}")
        emit('connected', {'client_id': client_id})

    @socketio.on('disconnect')
    def handle_disconnect():
        """客户端断开连接"""
        client_id = request.sid
        logger.info(f"[WebSocket] 客户端断开: {client_id}")
        ws_service.unsubscribe_client(client_id)

    @socketio.on('subscribe_task')
    def handle_subscribe_task(data):
        """订阅任务"""
        client_id = request.sid
        task_id = data.get('task_id')

        if task_id:
            room_name = f"task_{task_id}"
            join_room(room_name)
            ws_service.subscribe_task(client_id, task_id)
            logger.info(f"[WebSocket] 客户端 {client_id} 订阅任务 {task_id}")
            emit('subscribed', {'task_id': task_id})

    @socketio.on('unsubscribe_task')
    def handle_unsubscribe_task(data):
        """取消订阅任务"""
        client_id = request.sid
        task_id = data.get('task_id')

        if task_id:
            room_name = f"task_{task_id}"
            leave_room(room_name)
            ws_service.unsubscribe_task(client_id, task_id)
            logger.info(f"[WebSocket] 客户端 {client_id} 取消订阅任务 {task_id}")
            emit('unsubscribed', {'task_id': task_id})

    @socketio.on('ping')
    def handle_ping():
        """心跳检测"""
        emit('pong')

    logger.info("[WebSocket] SocketIO事件处理器已注册")


# 当任务完成时调用此函数来通知客户端
def notify_task_completion(task_id: str, result: dict):
    """
    通知任务完成

    参数:
        task_id: 任务ID
        result: 任务结果
    """
    from services.websocket_service import get_websocket_service
    ws_service = get_websocket_service()
    ws_service.notify_task_complete(task_id, result)


def notify_resource_ready(resource_type: str, resource_id: str, url: str):
    """
    通知资源已准备就绪

    参数:
        resource_type: 资源类型
        resource_id: 资源ID
        url: 资源URL
    """
    from services.websocket_service import get_websocket_service
    ws_service = get_websocket_service()
    ws_service.notify_resource_ready(resource_type, resource_id, url)
