# 按需爬取功能实现进度

> 更新时间: 2026-02-23

## 概述

实现了前台的按需爬取功能，当用户访问缺失的资源时，系统会自动提交任务到高速桶，并在资源可用后自动更新页面。

## 已完成的功能

### 1. 资源检查API

**文件**: `blueprints/api/resource_routes.py`

**API端点**:
- `GET /api/<site_id>/resource/check` - 检查资源是否存在
  - 参数: `resource_type`, `comic_id`, `chapter_id`, `page`
  - 返回: `{success: true, status: "exists"|"not_exists"|"crawling", data: {...}}`

**支持检查的资源类型**:
- `cover_image` - 封面图片
- `thumbnail_image` - 缩略图
- `content_image` - 内容图片
- `comic_info` - 详情信息
- `chapter_list` - 章节列表

### 2. 任务提交API

**文件**: `blueprints/api/resource_routes.py`

**API端点**:
- `POST /api/<site_id>/crawler/submit` - 提交爬取任务到高速桶
  - 请求体: `{resource_type, comic_id, chapter_id, page, priority}`
  - 返回: `{success: true, task_id: "...", status: "pending"}`

**任务类型映射**:
| resource_type | TaskType |
|--------------|----------|
| cover_image | TaskType.COVER_IMAGE |
| thumbnail_image | TaskType.THUMBNAIL_IMAGE |
| content_image | TaskType.CONTENT_IMAGE |
| comic_info | TaskType.INFO_PAGE |
| chapter_list | TaskType.CONTENT_PAGE |

### 3. WebSocket实时通知服务

**文件**: `services/websocket_service.py`

**核心类**: `WebSocketService`

**主要功能**:
- 客户端连接管理
- 任务订阅/取消订阅
- 任务完成通知
- 任务进度通知
- 资源就绪通知

**文件**: `blueprints/api/websocket_routes.py`

**SocketIO事件**:
- `connect/disconnect` - 连接管理
- `subscribe_task/unsubscribe_task` - 任务订阅
- `notification` - 服务器通知
- `ping/pong` - 心跳检测

### 4. 前端WebSocket客户端

**文件**: `static/common/js/websocket-client.js`

**全局对象**: `window.WSClient`

**主要方法**:
```javascript
WSClient.connect()                    // 连接WebSocket
WSClient.subscribeTask(taskId, callback)  // 订阅任务
WSClient.unsubscribeTask(taskId)      // 取消订阅
WSClient.subscribeResource(type, id, callback)  // 订阅资源
```

### 5. 智能图片加载器

**文件**: `static/common/js/smart-image-loader.js`

**全局对象**: `window.SmartImageLoader`

**主要方法**:
```javascript
SmartImageLoader.setSiteId(siteId)           // 设置站点ID
SmartImageLoader.loadCoverImage(comicId, imgElement, fallbackUrl)
SmartImageLoader.loadContentImage(comicId, chapterId, page, imgElement)
```

**工作流程**:
1. 检查资源是否存在 (调用resource/check API)
2. 如果不存在，提交爬取任务到高速桶
3. 订阅WebSocket通知
4. 资源就绪后自动更新图片
5. 轮询备用方案 (每5秒检查一次，最多5分钟)

### 6. 应用启动配置

**文件**: `app.py`

**新增内容**:
- Flask-SocketIO集成 (可选，如果未安装会自动禁用)
- WebSocket事件处理器注册
- 条件性使用socketio.run()或app.run()

**配置**:
```python
# SocketIO初始化
if HAS_SOCKETIO:
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# WebSocket事件注册
from blueprints.api.websocket_routes import register_socketio_events
register_socketio_events(socketio)
```

### 7. 前端模板更新

**文件**: `blueprints/frontend/templates/base.html`

**新增引入**:
```html
<!-- SocketIO客户端 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.6.1/socket.io.min.js"></script>

<!-- 全局JS -->
<script src="/static/common/js/websocket-client.js"></script>
<script src="/static/common/js/smart-image-loader.js"></script>
```

**文件**: `templates/frontend/list.html`

**智能图片加载集成**:
```javascript
// 初始化智能图片加载器
if (window.SmartImageLoader) {
    window.SmartImageLoader.setSiteId(currentSiteId);
}

// 图片加载与回退处理
function loadImageWithFallback(imgElement, url, comicId) {
    imgElement.src = url;
    imgElement.addEventListener('error', function() {
        if (window.SmartImageLoader) {
            window.SmartImageLoader.loadCoverImage(comicId, imgElement, fallbackUrl);
        }
    });
}
```

### 8. 等待图片占位符

**文件**: `static/common/images/waiting-image.svg`

**效果**: 动画加载图标，显示"加载中..."和"正在获取资源"

### 9. MCP工具安装

**已安装**: Playwright MCP

**配置位置**: `C:/Users/34317/.claude.json`

**配置**:
```json
"playwright": {
  "type": "stdio",
  "command": "npx",
  "args": ["@playwright/mcp@latest"],
  "env": {}
}
```

**注意**: 需要重启Claude Code才能生效

## API路由导入

**文件**: `blueprints/api/routes.py`

**新增导入**:
```python
# ========== 资源相关 ==========
from .resource_routes import *  # noqa
```

## 可用API端点汇总

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/<site_id>/resource/check` | GET | 检查资源是否存在 |
| `/api/<site_id>/crawler/submit` | POST | 提交爬取任务 |
| `/api/crawler/task/<task_id>` | GET | 查询任务状态 |
| `/api/<site_id>/comics` | GET | 获取漫画列表 |
| `/api/<site_id>/comic/<aid>` | GET | 获取漫画详情 |
| `/api/<site_id>/comic/<aid>/chapters` | GET | 获取章节列表 |
| `/api/<site_id>/comic/<aid>/chapter/<pid>` | GET | 获取章节图片 |
| `/api/media/image` | GET | 获取图片文件 |

## 依赖状态

### 当前已安装
- Flask
- MongoDB ( pymongo )
- APScheduler
- PIL/Pillow

### 可选依赖 (建议安装)
- `flask-socketio` - WebSocket实时通知支持

**安装命令**:
```bash
pip install flask-socketio
```

## 工作流程图

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│ 前端页面 │───>│ 智能加载 │───>│ 资源检查API │───>│ MongoDB │
└─────────┘    └─────────┘    └──────────┘    └─────────┘
     │              │               │               │
     │              │    ┌──────────▼──────────┐     │
     │              │    │ 资源不存在?          │     │
     │              │    └──────────┬──────────┘     │
     │              │               │               │
     │              │    ┌──────────▼──────────┐     │
     │              │    │ 提交任务到高速桶     │     │
     │              │    └──────────┬──────────┘     │
     │              │               │               │
     │              │    ┌──────────▼──────────┐     │
     │              │    │ WebSocket订阅通知    │     │
     │              │    └──────────┬──────────┘     │
     │              │               │               │
     │              │    ┌──────────▼──────────┐     │
     │              │    │ Worker处理任务       │     │
     │              │    └──────────┬──────────┘     │
     │              │               │               │
     │              │    ┌──────────▼──────────┐     │
     │              │    │ 通知前端资源就绪     │     │
     │              │    └──────────┬──────────┘     │
     │              │               │               │
     └──────────────┴───────────────┴───────────────┘
                        │
                    更新显示
```

## 待完成功能

1. **内容图片检查实现** - `check_content_image()` 函数需要完整实现
2. **章节列表查询** - 从章节集合查询真实数据
3. **Flask-SocketIO安装** - 安装后启用完整的WebSocket实时通知
4. **前端测试** - 使用Playwright MCP进行完整的功能测试

## 注意事项

1. **WebSocket降级**: 如果Flask-SocketIO未安装，系统会自动降级到轮询模式
2. **超时处理**: 资源订阅默认5分钟超时，避免无限等待
3. **错误处理**: 所有API都有完整的错误处理和日志记录
4. **图片回退**: 加载失败的图片会自动使用默认封面

## 文件清单

### 新增文件
- `services/websocket_service.py` - WebSocket服务
- `blueprints/api/websocket_routes.py` - WebSocket路由
- `blueprints/api/resource_routes.py` - 资源检查和任务提交API
- `static/common/js/websocket-client.js` - WebSocket客户端
- `static/common/js/smart-image-loader.js` - 智能图片加载器
- `static/common/images/waiting-image.svg` - 加载等待图

### 修改文件
- `app.py` - 添加SocketIO支持
- `blueprints/api/routes.py` - 导入资源路由
- `blueprints/frontend/templates/base.html` - 引入新JS库
- `templates/frontend/list.html` - 集成智能图片加载

## 配置文件位置

- **Claude MCP配置**: `C:/Users/34317/.claude.json`
- **Flask应用配置**: `config.py`
- **站点配置**: `data/sites_config.json`
