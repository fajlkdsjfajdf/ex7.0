/**
 * WebSocket客户端 - 用于实时任务通知
 */
(function(window) {
    'use strict';

    /**
     * WebSocket客户端类
     */
    class WebSocketClient {
        constructor() {
            this.socket = null;
            this.connected = false;
            this.pendingTasks = new Map(); // {task_id: {callbacks: [...], timeout: ...}}
            this.resourceCallbacks = new Map(); // {resource_key: callback}

            // 检测SocketIO是否可用
            this.hasSocketIO = typeof io !== 'undefined';
        }

        /**
         * 连接WebSocket服务器
         */
        connect() {
            if (!this.hasSocketIO) {
                console.warn('[WebSocket] SocketIO未加载，使用轮询模式');
                this._startPollingMode();
                return;
            }

            try {
                this.socket = io({
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 5
                });

                this._setupEventHandlers();
            } catch (e) {
                console.error('[WebSocket] 连接失败:', e);
                this._startPollingMode();
            }
        }

        /**
         * 设置事件处理器
         */
        _setupEventHandlers() {
            // 连接成功
            this.socket.on('connect', () => {
                this.connected = true;
                console.log('[WebSocket] 已连接到服务器');

                // 重新订阅之前的任务
                this._resubscribeTasks();
            });

            // 连接断开
            this.socket.on('disconnect', () => {
                this.connected = false;
                console.log('[WebSocket] 连接已断开');
            });

            // 服务器消息
            this.socket.on('notification', (data) => {
                this._handleNotification(data);
            });

            // 订阅成功
            this.socket.on('subscribed', (data) => {
                console.log('[WebSocket] 已订阅任务:', data.task_id);
            });

            // 心跳响应
            this.socket.on('pong', () => {
                // 心跳响应
            });
        }

        /**
         * 处理服务器通知
         */
        _handleNotification(data) {
            console.log('[WebSocket] 收到通知:', data);

            switch (data.type) {
                case 'task_complete':
                    this._handleTaskComplete(data.task_id, data.data);
                    break;

                case 'task_progress':
                    this._handleTaskProgress(data.task_id, data.data);
                    break;

                case 'resource_ready':
                    this._handleResourceReady(data.data);
                    break;
            }
        }

        /**
         * 处理任务完成
         */
        _handleTaskComplete(taskId, result) {
            // 处理pending tasks（通过subscribeTask订阅的任务）
            const pending = this.pendingTasks.get(taskId);
            if (pending) {
                pending.callbacks.forEach(callback => {
                    try {
                        callback(result);
                    } catch (e) {
                        console.error('[WebSocket] 回调执行失败:', e);
                    }
                });

                clearTimeout(pending.timeout);
                this.pendingTasks.delete(taskId);
            }

            // 同时检查是否有resourceCallbacks匹配这个任务
            // 任务完成时也可能触发资源就绪
            this._checkResourceCallbacksFromTask(taskId, result);
        }

        /**
         * 从任务完成中检查并触发资源回调
         */
        _checkResourceCallbacksFromTask(taskId, result) {
            // 检查任务结果中的资源类型和ID
            if (!result || !result.data) {
                return;
            }

            const resourceType = result.data.resource_type;
            const params = result.data.params || {};

            if (resourceType === 'comic_info') {
                const comicId = params.comic_id;
                this._triggerResourceCallback('comic_info', `info:${comicId}`, result);
            } else if (resourceType === 'content_page') {
                const comicId = params.comic_id;
                const chapterId = params.chapter_id;
                this._triggerResourceCallback('content_page', `content:${comicId}:${chapterId}`, result);
            }
        }

        /**
         * 触发资源回调
         */
        _triggerResourceCallback(resourceType, resourceKey, data) {
            const possibleKeys = [
                `${resourceType}:${resourceKey}`,
                resourceKey
            ];

            for (const key of possibleKeys) {
                const callback = this.resourceCallbacks.get(key);
                if (callback) {
                    try {
                        callback(data);
                    } catch (e) {
                        console.error('[WebSocket] 资源回调执行失败:', e);
                    }
                    this.resourceCallbacks.delete(key);
                    return;
                }
            }
        }

        /**
         * 处理任务进度
         */
        _handleTaskProgress(taskId, progress) {
            // 可以在UI上显示进度
            console.log('[WebSocket] 任务进度:', taskId, progress);
        }

        /**
         * 处理资源就绪
         */
        _handleResourceReady(data) {
            const { resource_type, resource_id } = data;
            // 支持两种格式的key: resource_type:resource_id 和完整的复合key
            const possibleKeys = [
                `${resource_type}:${resource_id}`,
                `${resource_type}:${data.resource_key || resource_id}`
            ];

            // 尝试匹配任意一种格式的key
            for (const key of possibleKeys) {
                const callback = this.resourceCallbacks.get(key);
                if (callback) {
                    try {
                        callback(data);
                    } catch (e) {
                        console.error('[WebSocket] 资源回调执行失败:', e);
                    }
                    this.resourceCallbacks.delete(key);
                    return;
                }
            }
        }

        /**
         * 订阅任务
         */
        subscribeTask(taskId, callback, timeoutMs = 60000) {
            if (this.socket && this.connected) {
                this.socket.emit('subscribe_task', { task_id: taskId });
            }

            // 存储回调
            if (!this.pendingTasks.has(taskId)) {
                this.pendingTasks.set(taskId, {
                    callbacks: [],
                    timeout: null
                });
            }

            const pending = this.pendingTasks.get(taskId);
            pending.callbacks.push(callback);

            // 设置超时
            if (pending.timeout) {
                clearTimeout(pending.timeout);
            }
            pending.timeout = setTimeout(() => {
                console.warn('[WebSocket] 任务超时:', taskId);
                this.pendingTasks.delete(taskId);
            }, timeoutMs);
        }

        /**
         * 取消订阅任务
         */
        unsubscribeTask(taskId) {
            if (this.socket && this.connected) {
                this.socket.emit('unsubscribe_task', { task_id: taskId });
            }

            const pending = this.pendingTasks.get(taskId);
            if (pending && pending.timeout) {
                clearTimeout(pending.timeout);
            }
            this.pendingTasks.delete(taskId);
        }

        /**
         * 订阅资源就绪通知
         */
        subscribeResource(resourceType, resourceId, callback) {
            const key = `${resourceType}:${resourceId}`;
            this.resourceCallbacks.set(key, callback);
        }

        /**
         * 重新订阅所有任务
         */
        _resubscribeTasks() {
            this.pendingTasks.forEach((pending, taskId) => {
                if (this.socket && this.connected) {
                    this.socket.emit('subscribe_task', { task_id: taskId });
                }
            });
        }

        /**
         * 启动轮询模式（当SocketIO不可用时）
         */
        _startPollingMode() {
            console.warn('[WebSocket] 使用轮询模式（实时通知不可用）');
            // 轮询模式：客户端定期检查任务状态
        }

        /**
         * 发送心跳
         */
        ping() {
            if (this.socket && this.connected) {
                this.socket.emit('ping');
            }
        }

        /**
         * 断开连接
         */
        disconnect() {
            if (this.socket) {
                this.socket.disconnect();
            }
            this.connected = false;
        }
    }

    // 创建全局单例
    const wsClient = new WebSocketClient();

    // 页面加载完成后自动连接
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => wsClient.connect());
    } else {
        wsClient.connect();
    }

    // 导出全局
    window.WSClient = wsClient;

    // 定时心跳
    setInterval(() => {
        wsClient.ping();
    }, 30000);

})(window);
