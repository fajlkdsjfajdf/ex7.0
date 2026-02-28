# 暗黑漫画站系统 - 后台设计文档

## 一、系统概述

暗黑漫画站系统是基于 Flask 构建的漫画站爬虫管理系统，后台负责爬虫调度、任务管理、配置管理等功能。

---

## 二、后台架构

### 2.1 蓝图结构

```
blueprints/admin/
├── __init__.py              # 后台蓝图定义
├── routes.py                # 后台主路由
├── api_routes.py            # API接口路由
├── config_routes.py         # 配置管理路由
├── log_routes.py            # 日志查看路由
├── media_library_routes.py  # 媒体库管理路由
├── scheduled_task_routes.py # 定时任务路由
└── task_api.py              # 任务API路由
```

### 2.2 后台路由

| 路由 | 功能 |
|------|------|
| `/admin/` | 后台首页（仪表盘） |
| `/admin/dashboard` | 数据统计仪表盘 |
| `/admin/crawler` | 爬虫管理 |
| `/admin/config` | 站点配置管理 |
| `/admin/logs` | 日志查看 |
| `/admin/tasks` | 定时任务管理 |
| `/admin/media` | 媒体库管理 |

---

## 三、爬虫系统

### 3.1 爬虫架构

```
crawlers/
├── base/                    # 基础爬虫
│   ├── base_crawler.py      # 爬虫基类
│   └── request_handler.py   # 请求处理器
└── cm/                      # CM站点爬虫
    ├── cm_base_crawler.py       # CM爬虫基类
    ├── cm_list_crawler.py       # 列表页爬虫
    ├── cm_info_crawler.py       # 详情页爬虫
    ├── cm_content_crawler.py    # 内容页爬虫
    ├── cm_cover_crawler.py      # 封面图爬虫
    ├── cm_thumbnail_crawler.py  # 缩略图爬虫
    ├── cm_content_image_crawler.py  # 内容图爬虫
    └── cm_comments_crawler.py   # 评论爬虫
```

### 3.2 基础爬虫类

```python
# crawlers/base/base_crawler.py

class BaseCrawler(ABC):
    """爬虫基类"""

    @abstractmethod
    def get_crawler_data(self, **kwargs) -> list:
        """获取爬取数据列表"""
        pass

    @abstractmethod
    def execute(self, **kwargs) -> dict:
        """执行爬取任务"""
        pass
```

### 3.3 请求处理器

```python
# crawlers/base/request_handler.py

class RequestHandler:
    """统一请求处理器"""

    def __init__(self, site_config: dict):
        self.site_config = site_config
        self.session = httpx.AsyncClient(
            timeout=30.0,
            verify=False,
            follow_redirects=True
        )

    async def get(self, url: str, **kwargs) -> httpx.Response:
        """发送GET请求"""
        # 自动处理CDN选择、Cookie注入、代理等
        pass
```

### 3.4 CM站点爬虫

| 爬虫类 | 功能 | 任务类型 |
|--------|------|----------|
| `CMListCrawler` | 爬取列表页 | `LIST_PAGE` |
| `CMInfoCrawler` | 爬取详情页 | `INFO_PAGE` |
| `CMContentCrawler` | 爬取章节列表 | `CONTENT_PAGE` |
| `CMCommentsCrawler` | 爬取评论 | `COMMENT_PAGE` |
| `CMCoverImageCrawler` | 下载封面图 | `COVER_IMAGE` |
| `CMThumbnailCrawler` | 下载缩略图 | `THUMBNAIL_IMAGE` |
| `CMContentImageCrawler` | 下载内容图 | `CONTENT_IMAGE` |

---

## 四、任务系统

### 4.1 三桶架构

```
services/tasks/
├── task_model.py         # 任务模型
├── buckets.py            # 桶实现
├── worker.py             # Worker实现
└── task_submitter.py     # 任务提交器
```

### 4.2 任务类型

```python
class TaskType(Enum):
    LIST_PAGE = "LIST_PAGE"           # 列表页爬取
    INFO_PAGE = "INFO_PAGE"           # 详情页爬取
    CONTENT_PAGE = "CONTENT_PAGE"     # 内容页爬取
    COMMENT_PAGE = "COMMENT_PAGE"     # 评论页爬取
    COVER_IMAGE = "COVER_IMAGE"       # 封面图下载
    THUMBNAIL_IMAGE = "THUMBNAIL_IMAGE"  # 缩略图下载
    CONTENT_IMAGE = "CONTENT_IMAGE"   # 内容图下载
```

### 4.3 任务优先级

```python
class TaskPriority(Enum):
    HIGH = 1      # 高速桶（前台触发的实时任务）
    LOW = 2       # 低速桶（定时调度任务）
```

### 4.4 三桶设计

| 桶名称 | 容量 | 用途 |
|--------|------|------|
| `high_speed_bucket` | 100 | 前台触发的实时任务 |
| `low_speed_bucket` | 5000 | 定时调度的批量任务 |
| `result_bucket` | 无限 | 存储任务结果 |

### 4.5 Worker池

```python
# services/tasks/worker.py

class WorkerPool:
    """Worker池管理器"""

    def __init__(self, high_speed_workers=5, low_speed_workers=2):
        self.high_speed_workers = high_speed_workers
        self.low_speed_workers = low_speed_workers

    def start(self):
        """启动Worker池"""
        # 启动高速Worker
        # 启动低速Worker
        pass
```

---

## 五、调度系统

### 5.1 APScheduler调度器

```python
# services/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

# 添加定时任务
@scheduler.scheduled_job('interval', minutes=30)
def cleanup_old_logs():
    """清理旧日志"""
    pass

scheduler.start()
```

### 5.2 站点调度器

```python
# services/site_scheduler.py

class SiteScheduler:
    """站点定时任务调度器"""

    def _execute_site_task(self, site_id: str, task_type: str, crawl_limits: dict):
        """执行站点的指定任务"""
        # 1. 获取爬虫数据
        # 2. 批量提交到低速桶
        pass
```

### 5.3 站点配置示例

```json
{
  "cm": {
    "site_id": "cm",
    "site_name": "成人漫画",
    "enabled": true,
    "schedule": {
      "list_page": 8,       // 每8小时执行一次
      "info_page": 11,
      "content_page": 4,
      "comment_page": 4,
      "cover_image": 4,
      "thumbnail_image": 0,
      "content_image": 4
    },
    "crawl_limits": {
      "list_page_max": 1,
      "info_page_max": 50,
      "content_page_max": 5
    }
  }
}
```

---

## 六、数据模型

### 6.1 数据库连接

```python
# database/__init__.py

class Database:
    """数据库管理类（单例）"""

    def __init__(self):
        self._client = MongoClient(
            f"mongodb://{MONGO_HOST}:{MONGO_PORT}/",
            maxPoolSize=50,
            minPoolSize=5,
            retryWrites=True,
            retryReads=True
        )
        self.db = self._client[MONGO_DB_NAME]
```

### 6.2 图片库模型

```python
# models/image_library.py

class ImageLibrary:
    """图片库模型 - 按站点分表"""

    def __init__(self, site_id: str):
        self.site_id = site_id
        self.collection_name = f"{site_id}_image_library"

    def save_image(self, file_path: str, source_url: str, ...) -> str:
        """保存图片，自动MD5去重"""
        # 1. 计算MD5
        # 2. 查询是否存在
        # 3. 存在则复用，不存在则保存
        pass
```

### 6.3 DAT文件存储

```python
# models/image_storage.py

class ImageStorage:
    """DAT文件存储管理器"""

    def save_image(self, image_data: bytes, image_id: str) -> dict:
        """保存图片到DAT文件"""
        # 多图片整合到1GB的.dat文件中
        pass

    def get_image(self, file_path: str, offset: int, length: int) -> bytes:
        """从DAT文件读取图片"""
        pass
```

---

## 七、API接口

### 7.1 爬虫API

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/admin/crawler/status` | GET | 获取爬虫状态 |
| `/api/admin/crawler/submit` | POST | 提交爬取任务 |
| `/api/admin/crawler/cancel` | POST | 取消任务 |
| `/api/admin/crawler/config` | GET | 获取爬虫配置 |

### 7.2 配置API

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/admin/config/sites` | GET | 获取站点配置 |
| `/api/admin/config/sites` | POST | 更新站点配置 |
| `/api/admin/config/test-url` | POST | 测试URL连通性 |
| `/api/admin/config/proxy` | GET/POST | 代理配置 |

### 7.3 任务API

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/admin/tasks/status` | GET | 获取调度状态 |
| `/api/admin/tasks/trigger` | POST | 手动触发任务 |
| `/api/admin/tasks/scheduled` | GET | 获取定时任务列表 |

### 7.4 日志API

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/admin/logs/tail` | GET | 获取最新日志 |
| `/api/admin/logs/stream` | WebSocket | 实时日志流 |

### 7.5 媒体库API

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/admin/media/stats` | GET | 获取媒体库统计 |
| `/api/admin/media/images` | GET | 获取图片列表 |
| `/api/admin/media/cleanup` | POST | 清理未使用图片 |

---

## 八、工具模块

### 8.1 日志系统

```python
# utils/logger.py

def get_logger(name: str) -> logging.Logger:
    """获取日志记录器"""
    logger = logging.getLogger(name)
    logger.setLevel(LOG_LEVEL)

    # 文件处理器
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=10*1024*1024,
        backupCount=5,
        encoding='utf-8'
    )

    # 控制台处理器
    console_handler = logging.StreamHandler()

    return logger
```

### 8.2 配置加载器

```python
# utils/config_loader.py

def load_sites_config() -> dict:
    """加载站点配置"""
    config_path = os.path.join(DATA_DIR, 'sites_config.json')
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_system_config() -> dict:
    """加载系统配置"""
    config_path = os.path.join(DATA_DIR, 'system_config.json')
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)
```

### 8.3 CM图片解密

```python
# crawlers/cm/cm_image_decoder.py

class CMImageDecoder:
    """CM图片解密器"""

    @staticmethod
    def decode(data: bytes) -> bytes:
        """解密CM图片数据"""
        # CM图片使用了自定义加密
        pass
```

### 8.4 CM加密处理

```python
# crawlers/cm/cm_crypto.py

class CMCrypto:
    """CM加密处理器"""

    @staticmethod
    def generate_ipm5() -> str:
        """生成ipm5参数"""
        pass
```

---

## 九、启动流程

```python
# app.py 启动流程

1. 注册蓝图（admin、frontend、api）
2. 初始化数据库连接
3. 创建图片库索引
4. 启动APScheduler调度器
5. 启动Worker池
6. 启动Flask应用
```

---

## 十、配置文件

### 10.1 系统配置 (config.py)

```python
class Config:
    SECRET_KEY = 'your-secret-key'
    DEBUG = True

    # 数据库
    MONGO_HOST = 'localhost'
    MONGO_PORT = 27017
    MONGO_DB_NAME = 'manga_hub'

    # 站点
    SITE_ID = 'cm'
    SITE_NAME = '暗黑漫画站'
```

### 10.2 站点配置 (data/sites_config.json)

```json
{
  "cm": {
    "site_id": "cm",
    "site_name": "成人漫画",
    "urls": ["https://www.cdngwc.cc"],
    "cdn_urls": ["..."],
    "schedule": {...},
    "crawl_limits": {...},
    "enabled": true
  }
}
```

---

## 十一、后台模板结构

```
templates/admin/
├── base.html           # 后台基础模板
├── dashboard.html      # 仪表盘
├── crawler.html        # 爬虫管理
├── config.html         # 配置管理
├── logs.html           # 日志查看
├── tasks.html          # 定时任务
└── media_library.html  # 媒体库管理
```

---

## 十二、安全设计

### 12.1 认证机制

```python
# 用户认证装饰器
from functools import wraps

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('admin.login'))
        return f(*args, **kwargs)
    return decorated_function
```

### 12.2 CSRF防护

```python
# Flask-WTF CSRF保护
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect(app)
```

---

*文档版本: 1.0.0*
*最后更新: 2026-02-23*
