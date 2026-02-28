# 暗黑漫画站系统 - 前台设计文档

## 一、系统概述

暗黑漫画站系统前台采用 SPA（单页应用）架构，使用 Vanilla JavaScript 实现，无需前端框架依赖。支持多站点切换、多设备适配、双页阅读模式、智能资源加载、按需触发爬取等功能。

### 1.1 多站点设计理念

- **统一前台界面**：所有站点共享同一套前端模板和样式
- **数据源隔离**：每个站点使用独立的数据表前缀（如 `cm_comics`, `jm_comics`）
- **站点切换机制**：用户可在前台设置中切换当前查看的站点
- **字段兼容处理**：支持不同站点间的字段差异

### 1.2 按需触发爬取

- **图片未下载**：显示默认等待图，自动触发高速桶下载，完成后自动替换
- **信息未爬取**：显示提示框，自动触发高速桶爬取，完成后智能提醒（仅当用户仍在当前页面）

---

## 二、前台架构

### 2.1 蓝图结构

```
blueprints/frontend/
├── __init__.py              # 前台蓝图定义
└── routes.py                # 前台路由
```

### 2.2 前台路由

| 路由 | 功能 | 模板 |
|------|------|------|
| `/` | 首页（重定向到当前站点列表） | - |
| `/list.html` | 列表页 | `list.html` |
| `/info.html` | 详情页 | `info.html` |
| `/read.html` | 阅读页 | `read.html` |
| `/settings.html` | 设置页（站点切换） | `settings.html` |

**注意**：所有前台页面都基于用户当前选择的站点（`current_site_id`）来查询数据。

---

## 三、按需触发爬取机制

### 3.1 功能概述

当用户浏览到尚未爬取的资源时，前台自动检测并触发高速桶进行爬取：

| 资源类型 | 检测方式 | 缺失处理 | 完成后通知 |
|----------|----------|----------|------------|
| **封面图片** | 检查`cover_file_id`是否存在 | 显示默认等待图，自动触发下载 | 自动替换图片 |
| **缩略图** | 检查`thumbnail_file_id`是否存在 | 显示默认等待图，自动触发下载 | 自动替换图片 |
| **内容图片** | 检查章节图片`file_id`是否存在 | 显示等待图，自动触发下载 | 自动替换图片 |
| **详情信息** | 检查详情记录是否存在 | 显示"正在爬取"提示框 | 弹窗提醒（仅当用户仍在页面）|
| **章节列表** | 检查章节记录是否存在 | 显示"正在获取章节"提示框 | 弹窗提醒（仅当用户仍在页面）|

### 3.2 资源状态枚举

```javascript
// 资源状态
const ResourceStatus = {
    EXISTS: 'exists',           // 已存在，可直接使用
    NOT_EXISTS: 'not_exists',   // 不存在，未爬取
    CRAWLING: 'crawling',       // 爬取中
    FAILED: 'failed'            // 爬取失败
};

// 资源类型
const ResourceType = {
    COVER_IMAGE: 'cover_image',         // 封面图
    THUMBNAIL_IMAGE: 'thumbnail_image', // 缩略图
    CONTENT_IMAGE: 'content_image',     // 内容图
    COMIC_INFO: 'comic_info',           // 详情信息
    CHAPTER_LIST: 'chapter_list'        // 章节列表
};
```

### 3.3 核心API设计

#### 3.3.1 检查资源是否存在

```http
GET /api/{site_id}/resource/check
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `resource_type` | string | 是 | 资源类型（cover_image/thumbnail_image/content_image/comic_info/chapter_list）|
| `comic_id` | string | 条件 | 漫画ID（图片类必填）|
| `chapter_id` | string | 条件 | 章节ID（内容图必填）|
| `page` | int | 条件 | 页码（列表页图片必填）|

**响应示例：**

```json
// 图片存在
{
    "success": true,
    "status": "exists",
    "data": {
        "file_id": "507f1f77bcf86cd799439011",
        "url": "/api/media/image?file_id=507f1f77bcf86cd799439011&site_id=cm"
    }
}

// 图片不存在，但正在爬取
{
    "success": true,
    "status": "crawling",
    "data": {
        "task_id": "task_123456",
        "message": "图片正在下载中"
    }
}

// 图片不存在，未爬取
{
    "success": true,
    "status": "not_exists",
    "data": null
}
```

#### 3.3.2 提交爬取任务到高速桶

```http
POST /api/{site_id}/crawler/submit
```

**请求体：**

```json
{
    "resource_type": "cover_image",
    "comic_id": "123456",
    "chapter_id": null,
    "priority": "high",
    "source": "frontend"
}
```

**响应示例：**

```json
// 成功提交
{
    "success": true,
    "task_id": "task_123456",
    "status": "pending",
    "message": "任务已提交到高速桶"
}

// 桶已满
{
    "success": false,
    "message": "高速桶已满，请稍后重试"
}
```

#### 3.3.3 WebSocket任务状态推送

```javascript
// 连接WebSocket
const ws = new WebSocket('ws://localhost:5000/ws/tasks');

// 订阅任务状态
ws.send(JSON.stringify({
    action: 'subscribe',
    task_ids: ['task_123456', 'task_789012']
}));

// 接收任务完成通知
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.action === 'task_completed') {
        // 任务完成，更新UI
        handleTaskCompleted(data.task_id, data.result);
    }
};
```

### 3.4 前端实现：智能图片加载器

```javascript
// 智能图片加载器
class SmartImageLoader {
    constructor() {
        this.loadingImages = new Map();      // 正在加载的图片 {elementKey: taskId}
        this.completedImages = new Map();    // 已完成的图片 {file_id: url}
        this.connectWebSocket();
    }

    // 连接WebSocket
    connectWebSocket() {
        this.ws = new WebSocket('ws://localhost:5000/ws/tasks');

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.action === 'task_completed') {
                this.handleImageCompleted(data.task_id, data.result);
            } else if (data.action === 'task_progress') {
                this.handleImageProgress(data.task_id, data.progress);
            }
        };
    }

    // 加载图片（自动检测并触发下载）
    async loadImage(siteId, resourceId, resourceType, element) {
        const elementKey = this.getElementKey(element);

        // 1. 检查资源是否已在本地缓存
        if (this.completedImages.has(resourceId)) {
            element.src = this.completedImages.get(resourceId);
            return;
        }

        // 2. 显示默认等待图
        element.src = '/static/common/images/loading-placeholder.png';
        element.dataset.status = 'loading';

        // 3. 检查资源是否已存在
        const checkResult = await this.checkResource(siteId, resourceId, resourceType);

        if (checkResult.status === 'exists') {
            // 资源存在，直接使用
            element.src = checkResult.data.url;
            this.completedImages.set(resourceId, checkResult.data.url);
            return;
        }

        if (checkResult.status === 'crawling') {
            // 正在爬取，记录taskId等待完成
            this.loadingImages.set(elementKey, checkResult.data.task_id);
            return;
        }

        // 4. 资源不存在，提交下载任务
        const submitResult = await this.submitDownloadTask(siteId, resourceId, resourceType);

        if (submitResult.success) {
            // 记录任务ID
            this.loadingImages.set(elementKey, submitResult.task_id);
        } else {
            // 提交失败，显示错误图
            element.src = '/static/common/images/error-placeholder.png';
            element.dataset.status = 'error';
        }
    }

    // 检查资源是否存在
    async checkResource(siteId, resourceId, resourceType) {
        const params = new URLSearchParams({
            resource_type: resourceType,
            comic_id: resourceId
        });

        const response = await fetch(`/api/${siteId}/resource/check?${params}`);
        return await response.json();
    }

    // 提交下载任务
    async submitDownloadTask(siteId, resourceId, resourceType) {
        const response = await fetch(`/api/${siteId}/crawler/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resource_type: resourceType,
                comic_id: resourceId,
                priority: 'high',
                source: 'frontend'
            })
        });

        return await response.json();
    }

    // 处理图片下载完成
    handleImageCompleted(taskId, result) {
        // 查找所有等待这个任务的图片元素
        document.querySelectorAll(`img[data-task-id="${taskId}"]`).forEach(img => {
            // 替换为真实图片
            img.src = result.url;
            img.dataset.status = 'loaded';

            // 添加淡入动画
            img.style.opacity = '0';
            setTimeout(() => {
                img.style.transition = 'opacity 0.3s';
                img.style.opacity = '1';
            }, 10);

            // 缓存图片URL
            this.completedImages.set(img.dataset.resourceId, result.url);
        });
    }

    // 处理下载进度
    handleImageProgress(taskId, progress) {
        document.querySelectorAll(`img[data-task-id="${taskId}"]`).forEach(img => {
            const progressOverlay = img.nextElementSibling;
            if (progressOverlay && progressOverlay.classList.contains('progress-overlay')) {
                progressOverlay.querySelector('.progress-text').textContent = `${progress}%`;
            }
        });
    }

    // 获取元素唯一标识
    getElementKey(element) {
        return element.id || `${element.dataset.resourceId}_${element.dataset.resourceType}`;
    }
}

// 全局实例
const smartImageLoader = new SmartImageLoader();
```

### 3.5 前端实现：智能信息加载器

```javascript
// 智能信息加载器（详情页、章节列表）
class SmartInfoLoader {
    constructor() {
        this.pendingTasks = new Map();      // 待处理任务 {taskId: pageInfo}
        this.pageVisible = true;           // 当前页面是否可见
        this.connectWebSocket();
        this.setupVisibilityListener();
    }

    // 监听页面可见性
    setupVisibilityListener() {
        // 页面隐藏时标记为不可见
        document.addEventListener('visibilitychange', () => {
            this.pageVisible = !document.hidden;
        });

        // 页面卸载时标记为不可见
        window.addEventListener('beforeunload', () => {
            this.pageVisible = false;
        });
    }

    // 连接WebSocket
    connectWebSocket() {
        this.ws = new WebSocket('ws://localhost:5000/ws/tasks');

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.action === 'task_completed') {
                this.handleInfoCompleted(data.task_id, data.result);
            }
        };
    }

    // 加载详情信息
    async loadComicInfo(siteId, comicId) {
        // 1. 检查详情是否存在
        const checkResult = await this.checkResource(siteId, comicId, 'comic_info');

        if (checkResult.status === 'exists') {
            // 详情存在，直接显示
            return checkResult.data;
        }

        if (checkResult.status === 'crawling') {
            // 正在爬取，显示等待状态
            this.showCrawlingNotice('详情信息正在获取中...');
            this.pendingTasks.set(checkResult.data.task_id, {
                type: 'comic_info',
                comicId: comicId
            });
            return null;
        }

        // 2. 详情不存在，显示提示框并触发爬取
        this.showCrawlingNotice('详情信息尚未爬取，正在获取中...');

        // 提交爬取任务
        const submitResult = await this.submitCrawlTask(siteId, comicId, 'comic_info');

        if (submitResult.success) {
            this.pendingTasks.set(submitResult.task_id, {
                type: 'comic_info',
                comicId: comicId
            });
        }

        return null;
    }

    // 加载章节列表
    async loadChapterList(siteId, comicId) {
        const checkResult = await this.checkResource(siteId, comicId, 'chapter_list');

        if (checkResult.status === 'exists') {
            return checkResult.data;
        }

        if (checkResult.status === 'crawling') {
            this.showCrawlingNotice('章节列表正在获取中...');
            this.pendingTasks.set(checkResult.data.task_id, {
                type: 'chapter_list',
                comicId: comicId
            });
            return null;
        }

        this.showCrawlingNotice('章节列表尚未爬取，正在获取中...');

        const submitResult = await this.submitCrawlTask(siteId, comicId, 'chapter_list');

        if (submitResult.success) {
            this.pendingTasks.set(submitResult.task_id, {
                type: 'chapter_list',
                comicId: comicId
            });
        }

        return null;
    }

    // 显示爬取提示框
    showCrawlingNotice(message) {
        // 移除旧提示框
        const oldNotice = document.getElementById('crawling-notice');
        if (oldNotice) oldNotice.remove();

        // 创建新提示框
        const notice = document.createElement('div');
        notice.id = 'crawling-notice';
        notice.className = 'crawling-notice';
        notice.innerHTML = `
            <div class="notice-content">
                <div class="loading-spinner"></div>
                <span class="notice-text">${message}</span>
            </div>
        `;

        document.body.appendChild(notice);
    }

    // 移除提示框
    hideCrawlingNotice() {
        const notice = document.getElementById('crawling-notice');
        if (notice) {
            notice.classList.add('hiding');
            setTimeout(() => notice.remove(), 300);
        }
    }

    // 处理信息爬取完成
    handleInfoCompleted(taskId, result) {
        const pageInfo = this.pendingTasks.get(taskId);

        if (!pageInfo) {
            return; // 不是当前页面的任务
        }

        // 移除任务记录
        this.pendingTasks.delete(taskId);

        // 检查用户是否仍在当前页面
        if (!this.pageVisible) {
            return; // 用户已离开，不提醒
        }

        // 移除等待提示框
        this.hideCrawlingNotice();

        // 显示完成通知
        this.showCompletionNotice(pageInfo.type);

        // 刷新页面数据
        if (pageInfo.type === 'comic_info') {
            this.refreshComicInfo(pageInfo.comicId);
        } else if (pageInfo.type === 'chapter_list') {
            this.refreshChapterList(pageInfo.comicId);
        }
    }

    // 显示完成通知
    showCompletionNotice(type) {
        const messages = {
            'comic_info': '详情信息获取完成！',
            'chapter_list': '章节列表获取完成！'
        };

        const notice = document.createElement('div');
        notice.className = 'completion-notice';
        notice.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${messages[type]}</span>
        `;

        document.body.appendChild(notice);

        // 3秒后自动消失
        setTimeout(() => {
            notice.classList.add('hiding');
            setTimeout(() => notice.remove(), 300);
        }, 3000);
    }

    // 刷新详情信息
    async refreshComicInfo(comicId) {
        const siteId = SiteManager.getCurrentSiteId();
        const response = await fetch(`/api/${siteId}/comic/${comicId}`);
        const data = await response.json();

        if (data.success) {
            // 更新页面显示
            renderComicInfo(data.comic);
        }
    }

    // 刷新章节列表
    async refreshChapterList(comicId) {
        const siteId = SiteManager.getCurrentSiteId();
        const response = await fetch(`/api/${siteId}/comic/${comicId}/chapters`);
        const data = await response.json();

        if (data.success) {
            // 更新章节列表显示
            renderChapterList(data.chapters);
        }
    }

    // 检查资源是否存在
    async checkResource(siteId, resourceId, resourceType) {
        const params = new URLSearchParams({
            resource_type: resourceType,
            comic_id: resourceId
        });

        const response = await fetch(`/api/${siteId}/resource/check?${params}`);
        return await response.json();
    }

    // 提交爬取任务
    async submitCrawlTask(siteId, resourceId, resourceType) {
        const response = await fetch(`/api/${siteId}/crawler/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resource_type: resourceType,
                comic_id: resourceId,
                priority: 'high',
                source: 'frontend'
            })
        });

        return await response.json();
    }
}

// 全局实例
const smartInfoLoader = new SmartInfoLoader();
```

### 3.6 CSS样式

```css
/* 爬取提示框 */
.crawling-notice {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    border-radius: 12px;
    padding: 30px 40px;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
}

.crawling-notice .notice-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(106, 90, 205, 0.3);
    border-top-color: #6a5acd;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

.crawling-notice.hiding {
    animation: fadeOut 0.3s ease forwards;
}

@keyframes fadeOut {
    to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
}

/* 完成通知 */
.completion-notice {
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50, #45a049);
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
}

.completion-notice i {
    font-size: 20px;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.completion-notice.hiding {
    animation: slideOut 0.3s ease forwards;
}

@keyframes slideOut {
    to { transform: translateX(100%); opacity: 0; }
}

/* 图片等待状态 */
img[data-status="loading"] {
    filter: blur(5px);
    transition: filter 0.3s;
}

img[data-status="loaded"] {
    filter: none;
}
```

### 3.7 列表页使用示例

```html
<!-- 漫画卡片 -->
<div class="comic-card">
    <img class="comic-cover"
         data-resource-id="{{ comic.id }}"
         data-resource-type="cover_image"
         alt="{{ comic.title }}">
    <div class="comic-info">
        <h3>{{ comic.title }}</h3>
    </div>
</div>

<script>
// 初始化时加载所有封面图片
document.addEventListener('DOMContentLoaded', () => {
    const siteId = SiteManager.getCurrentSiteId();

    document.querySelectorAll('.comic-cover').forEach(img => {
        const resourceId = img.dataset.resourceId;
        smartImageLoader.loadImage(siteId, resourceId, 'cover_image', img);
    });
});
</script>
```

### 3.8 详情页使用示例

```javascript
// 详情页加载逻辑
async function loadComicPage(comicId) {
    const siteId = SiteManager.getCurrentSiteId();

    // 尝试加载详情信息
    const comicInfo = await smartInfoLoader.loadComicInfo(siteId, comicId);

    if (comicInfo) {
        renderComicInfo(comicInfo);
    }

    // 尝试加载章节列表
    const chapters = await smartInfoLoader.loadChapterList(siteId, comicId);

    if (chapters) {
        renderChapterList(chapters);
    }
}
```

---

## 四、多站点机制

### 4.1 站点配置结构

每个站点在 `data/sites_config.json` 中配置：

```json
{
  "cm": {
    "site_id": "cm",
    "site_name": "成人漫画",
    "enabled": true,
    ...
  },
  "jm": {
    "site_id": "jm",
    "site_name": "禁漫天堂",
    "enabled": true,
    ...
  }
}
```

### 4.2 当前站点管理

#### 4.2.1 站点选择存储

```javascript
// 站点管理器
const SiteManager = {
    // 获取当前站点ID
    getCurrentSiteId() {
        return localStorage.getItem('current_site_id') || 'cm';
    },

    // 设置当前站点
    setCurrentSiteId(siteId) {
        localStorage.setItem('current_site_id', siteId);
        // 触发站点变更事件
        document.dispatchEvent(new CustomEvent('siteChanged', { detail: { siteId } }));
    },

    // 获取所有可用站点
    getAvailableSites() {
        return fetch('/api/sites')
            .then(res => res.json())
            .then(data => data.sites.filter(s => s.enabled));
    }
};
```

---

## 五、模板结构

### 5.1 前台模板目录

```
templates/frontend/
├── base.html               # 基础模板
├── list.html               # 列表页
├── info.html               # 详情页
├── read.html               # 阅读页
└── settings.html           # 设置页
```

### 5.2 组件目录

```
templates/frontend/components/
├── sidebar.html            # 侧边栏（含站点切换）
├── header.html             # 顶部栏
├── site-selector.html      # 站点选择器
├── search-modal.html       # 搜索弹窗
└── task-notices.html       # 任务通知组件
```

---

## 六、页面设计

### 6.1 列表页 (list.html)

#### 功能特性

- 网格布局展示漫画
- 横版/竖版切换
- 列数调节（1-10列）
- 标签搜索（基于当前站点）
- 响应式设计
- **智能封面加载**（自动检测并触发下载）

### 6.2 详情页 (info.html)

#### 功能特性

- 漫画基本信息展示
- 章节列表展示
- 收藏功能
- 阅读历史记录
- **按需加载详情和章节**（未爬取时自动触发）

### 6.3 阅读页 (read.html)

#### 功能特性

- 翻页模式（page1）
- 滚动模式（page2）
- 双页/单页切换
- 键盘快捷键
- 预加载相邻章节
- 阅读进度保存
- **智能内容图加载**（自动检测并触发下载）

---

## 七、前端API

### 7.1 资源检查API

| API | 方法 | 功能 |
|-----|------|------|
| `/api/{site_id}/resource/check` | GET | 检查资源是否存在 |
| `/api/{site_id}/crawler/submit` | POST | 提交爬取任务到高速桶 |
| `/api/crawler/status` | GET | 查询任务状态 |

### 7.2 WebSocket接口

| 事件 | 方向 | 说明 |
|------|------|------|
| `subscribe` | 客户端→服务端 | 订阅任务状态 |
| `task_completed` | 服务端→客户端 | 任务完成通知 |
| `task_progress` | 服务端→客户端 | 任务进度更新 |

---

## 八、按需触发流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        前台页面                                  │
│                                                                 │
│  用户浏览 → 检测资源 → 资源存在？ → 显示资源                      │
│                      │                                          │
│                      ├ 否                                       │
│                      ↓                                          │
│              正在爬取？                                          │
│                      │                                          │
│           ┌──────────┴──────────┐                               │
│           ↓                     ↓                               │
│        是（等待）            否（触发）                             │
│           │                     │                               │
│           │              提交任务到高速桶                          │
│           │                     │                               │
│           ←─────────────────────┘                               │
│                      │                                          │
│                      ↓                                          │
│              WebSocket监听                                       │
│                      │                                          │
│               ┌──────┴──────┐                                    │
│               ↓             ↓                                    │
│          任务完成        任务进度                                 │
│               │             │                                    │
└───────────────┴─────────────┴────────────────────────────────────┘
                │
                ↓
        ┌───────────────┐
        │  页面可见？   │
        └───────────────┘
                │
        ┌──────────┴──────────┐
        ↓                     ↓
       是                    否
        │                     │
        ↓                     ×（不提醒）
   自动替换图片/刷新数据
   显示完成通知
```

---

## 九、待实现功能

- [x] 按需触发爬取机制
- [x] 智能图片加载器
- [x] 智能信息加载器
- [x] WebSocket实时任务状态推送
- [ ] 任务状态面板
- [ ] 评论系统
- [ ] 评分系统
- [ ] 推荐系统
- [ ] 跨站点搜索

---

## 十、多站点开发注意事项

### 10.1 按需爬取与多站点

- 任务提交时必须携带正确的 `site_id`
- 不同站点的资源隔离存储
- WebSocket通知需要包含站点信息

### 10.2 页面可见性检测

- 使用 `document.hidden` 检测页面是否隐藏
- 使用 `beforeunload` 事件检测页面卸载
- 用户离开页面后不再显示完成通知

### 10.3 性能考虑

- 图片加载使用懒加载 + IntersectionObserver
- 限制同时触发的任务数量
- 已完成的资源使用 localStorage 缓存资源ID

---

*文档版本: 3.0.0*
*最后更新: 2026-02-23*
