"""
WebSocket服务 - 用于实时任务完成通知
"""
import threading
import time
import json
from typing import Dict, Set, Callable, Any
from collections import defaultdict
from utils.logger import get_logger

logger = get_logger(__name__)


class WebSocketService:
    """
    WebSocket服务类
    管理客户端连接和消息广播
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        """单例模式"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """初始化WebSocket服务"""
        if hasattr(self, '_initialized'):
            return

        self._initialized = True
        self._clients: Dict[str, Set[str]] = defaultdict(set)  # {task_id: {client_ids}}
        self._client_tasks: Dict[str, Set[str]] = defaultdict(set)  # {client_id: {task_ids}}
        self._message_handlers: Dict[str, Callable] = {}
        self._socketio = None

        logger.info("[WebSocket] WebSocket服务初始化")

    def init_socketio(self, socketio):
        """初始化SocketIO实例"""
        self._socketio = socketio
        logger.info("[WebSocket] SocketIO已绑定")

    def subscribe_task(self, client_id: str, task_id: str):
        """
        客户端订阅任务

        参数:
            client_id: 客户端ID
            task_id: 任务ID
        """
        with self._lock:
            self._clients[task_id].add(client_id)
            self._client_tasks[client_id].add(task_id)
            logger.debug(f"[WebSocket] 客户端 {client_id} 订阅任务 {task_id}")

    def unsubscribe_task(self, client_id: str, task_id: str):
        """
        客户端取消订阅任务

        参数:
            client_id: 客户端ID
            task_id: 任务ID
        """
        with self._lock:
            if task_id in self._clients:
                self._clients[task_id].discard(client_id)
            if client_id in self._client_tasks:
                self._client_tasks[client_id].discard(task_id)
            logger.debug(f"[WebSocket] 客户端 {client_id} 取消订阅任务 {task_id}")

    def unsubscribe_client(self, client_id: str):
        """
        客户端断开连接，取消所有订阅

        参数:
            client_id: 客户端ID
        """
        with self._lock:
            if client_id in self._client_tasks:
                task_ids = self._client_tasks[client_id].copy()
                for task_id in task_ids:
                    self._clients[task_id].discard(client_id)
                del self._client_tasks[client_id]
                logger.debug(f"[WebSocket] 客户端 {client_id} 断开连接，取消 {len(task_ids)} 个任务订阅")

    def notify_task_complete(self, task_id: str, result: dict):
        """
        通知任务完成

        参数:
            task_id: 任务ID
            result: 任务结果
        """
        with self._lock:
            client_ids = self._clients.get(task_id, set()).copy()

        if client_ids:
            message = {
                'type': 'task_complete',
                'task_id': task_id,
                'data': result
            }
            self._broadcast_to_clients(list(client_ids), message)
            logger.info(f"[WebSocket] 任务 {task_id} 完成，通知 {len(client_ids)} 个客户端")

            # 清理任务订阅
            with self._lock:
                if task_id in self._clients:
                    del self._clients[task_id]

    def notify_task_progress(self, task_id: str, progress: dict):
        """
        通知任务进度

        参数:
            task_id: 任务ID
            progress: 进度信息 {'percent': 50, 'message': '处理中...'}
        """
        with self._lock:
            client_ids = self._clients.get(task_id, set()).copy()

        if client_ids:
            message = {
                'type': 'task_progress',
                'task_id': task_id,
                'data': progress
            }
            self._broadcast_to_clients(list(client_ids), message)

    def notify_resource_ready(self, resource_type: str, resource_id: str, url: str):
        """
        通知资源已准备就绪

        参数:
            resource_type: 资源类型 (cover_image, content_image等)
            resource_id: 资源ID
            url: 资源URL
        """
        message = {
            'type': 'resource_ready',
            'data': {
                'resource_type': resource_type,
                'resource_id': resource_id,
                'url': url
            }
        }
        self._broadcast_all(message)
        logger.info(f"[WebSocket] 资源就绪通知: {resource_type}={resource_id}")

    def _broadcast_to_clients(self, client_ids: list, message: dict):
        """向指定客户端广播消息"""
        if self._socketio:
            try:
                for client_id in client_ids:
                    self._socketio.emit('notification', message, room=client_id)
            except Exception as e:
                logger.error(f"[WebSocket] 广播消息失败: {e}")
        else:
            # 如果SocketIO未初始化，使用简单内存通知（仅用于开发测试）
            logger.warning(f"[WebSocket] SocketIO未初始化，消息未发送: {message}")

    def _broadcast_all(self, message: dict):
        """向所有客户端广播消息"""
        if self._socketio:
            try:
                self._socketio.emit('notification', message, broadcast=True)
            except Exception as e:
                logger.error(f"[WebSocket] 广播消息失败: {e}")

    def get_client_subscriptions(self, client_id: str) -> Set[str]:
        """
        获取客户端订阅的所有任务

        参数:
            client_id: 客户端ID

        返回:
            任务ID集合
        """
        with self._lock:
            return self._client_tasks.get(client_id, set()).copy()


# 全局WebSocket服务实例
_websocket_service: WebSocketService = None


def get_websocket_service() -> WebSocketService:
    """获取WebSocket服务实例"""
    global _websocket_service
    if _websocket_service is None:
        _websocket_service = WebSocketService()
    return _websocket_service
