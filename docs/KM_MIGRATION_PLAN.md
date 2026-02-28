# KM 站点迁移方案

## 一、KM 站点信息

| 项目 | 值 |
|------|-----|
| **站点ID** | `km` |
| **站点名称** | 宅漫畫 |
| **URL** | https://komiic.com |
| **API类型** | GraphQL (POST `/api/query`) |
| **需要加密** | 不需要 |
| **图片解密** | 不需要 |

---

## 二、需要创建的文件

```
crawlers/km/
├── __init__.py
├── km_base_crawler.py        # KM基础爬虫（不需要加密解密）
├── km_list_crawler.py        # 列表页爬虫
├── km_info_crawler.py        # 详情页爬虫（章节信息）
├── km_content_crawler.py     # 内容页爬虫（图片列表）
├── km_cover_crawler.py       # 封面图爬虫
└── km_content_image_crawler.py  # 内容图片下载爬虫
```

---

## 三、数据表字段映射

### 3.1 主表 `km_manga_main` 对应 `cm_manga_main`

| CM 字段 | KM 字段来源 | 转换说明 |
|---------|------------|----------|
| `aid` | `id` | 直接转换 int |
| `title` | `title` | 直接使用 |
| `title_alias` | - | **留空** |
| `summary` | - | **留空** |
| `author` | `authors[].name` | 提取数组 |
| `actors` | - | **留空** |
| `likes` | - | **留空** |
| `favorites` | `favoriteCount` | 直接使用 |
| `views` | `views` | 直接使用 |
| `types` | `categories[].name` | 提取数组 |
| `tags` | `authors + categories` | 合并提取 |
| `series_id` | - | **默认 0** |
| `is_end` | `status` | 转换判断 |
| `total_photos` | - | **留空** |
| `list_count` | 计算值 | 从章节表统计 |
| `cover_path` | `imageUrl` | 直接使用 |
| `cover_file_id` | 下载后填充 | 图片库file_id |
| `cover_load` | 状态 | 0/1/2 |
| `create_time` | - | **留空** |
| `update_time` | `dateUpdated` | ISO格式转换 |
| `list_update` | 爬取时填充 | datetime |
| `info_update` | 爬取时填充 | datetime |
| `cover_update` | 爬取时填充 | datetime |
| `status` | `status` | 直接使用 |

### 3.2 章节表 `km_manga_chapters` 对应 `cm_manga_chapters`

| CM 字段 | KM 字段来源 | 转换说明 |
|---------|------------|----------|
| `aid` | `aid` | 漫画ID |
| `pid` | `id` | 章节ID (int) |
| `title` | `serial` | 章节标题 |
| `order` | 计算值 | 递增排序 |
| `page_count` | `size` | 图片数量 |
| `content_images` | `images[]` | 图片数组（新格式） |
| `content_total` | `images.length` | 图片总数 |
| `content_loaded` | 下载后更新 | 已下载数 |
| `update_time` | `dateUpdated` | 更新时间 |
| `info_update` | 爬取时填充 | datetime |
| `content_update` | 爬取时填充 | datetime |
| `update_comments` | - | **留空** |
| `status` | 状态 | pending/completed |
| `error_message` | 错误时填充 | string |

### 3.3 图片数组格式 `content_images`

```python
# KM 站点图片信息转换
content_images = [
    {
        'page': 1,
        'url': '/path/to/image.jpg',  # 从 kid 字段拼接
        'kid': 'xxx',                  # KM 特有字段
        'width': 800,
        'height': 1200,
        'file_id': None,               # 下载后填充
        'status': 0                    # 0=未下载 1=下载中 2=已完成
    },
    ...
]
```

---

## 四、API 端点对比

| 功能 | CM 端点 | KM 端点 | 请求方式 |
|------|---------|---------|----------|
| 列表页 | GET `/categories/filter` | POST `/api/query` (GraphQL) | GraphQL |
| 详情页 | GET `/album?id={aid}` | POST `/api/query` (GraphQL) | GraphQL |
| 章节内容 | GET `/comic_read?id={pid}` | POST `/api/query` (GraphQL) | GraphQL |
| 封面图 | CDN路径 | `imageUrl` 直接下载 | GET |
| 内容图 | CDN路径 | 从 `kid` 拼接CDN路径 | GET |

---

## 五、GraphQL 查询语句

### 5.1 列表页查询 (comicByCategories)

```graphql
query comicByCategories($categoryId: [ID!]!, $pagination: Pagination!) {
  comicByCategories(categoryId: $categoryId, pagination: $pagination) {
    id
    title
    status
    year
    imageUrl
    authors { id name }
    categories { id name }
    dateUpdated
    monthViews
    views
    favoriteCount
    lastBookUpdate
    lastChapterUpdate
  }
}
```

**请求参数:**
```json
{
  "operationName": "comicByCategories",
  "variables": {
    "categoryId": [],
    "pagination": {
      "limit": 1000,
      "offset": 0,
      "orderBy": "DATE_UPDATED",
      "asc": false,
      "status": ""
    }
  },
  "query": "query comicByCategories($categoryId: [ID!]!, $pagination: Pagination!) {\n  comicByCategories(categoryId: $categoryId, pagination: $pagination) {\n    id\n    title\n    status\n    year\n    imageUrl\n    authors {\n      id\n      name\n      __typename\n    }\n    categories {\n      id\n      name\n      __typename\n    }\n    dateUpdated\n    monthViews\n    views\n    favoriteCount\n    lastBookUpdate\n    lastChapterUpdate\n    __typename\n  }\n}"
}
```

### 5.2 章节查询 (chapterByComicId)

```graphql
query chapterByComicId($comicId: ID!) {
  chaptersByComicId(comicId: $comicId) {
    id
    serial
    type
    dateCreated
    dateUpdated
    size
  }
}
```

**请求参数:**
```json
{
  "operationName": "chapterByComicId",
  "variables": {
    "comicId": "12345"
  },
  "query": "query chapterByComicId($comicId: ID!) {\n  chaptersByComicId(comicId: $comicId) {\n    id\n    serial\n    type\n    dateCreated\n    dateUpdated\n    size\n    __typename\n  }\n}"
}
```

### 5.3 图片列表查询 (imagesByChapterId)

```graphql
query imagesByChapterId($chapterId: ID!) {
  imagesByChapterId(chapterId: $chapterId) {
    id
    kid
    height
    width
  }
}
```

**请求参数:**
```json
{
  "operationName": "imagesByChapterId",
  "variables": {
    "chapterId": "12345"
  },
  "query": "query imagesByChapterId($chapterId: ID!) {\n  imagesByChapterId(chapterId: $chapterId) {\n    id\n    kid\n    height\n    width\n    __typename\n  }\n}"
}
```

---

## 六、关键差异点

| 差异项 | CM 站点 | KM 站点 |
|--------|---------|---------|
| API类型 | REST API | GraphQL |
| 请求方式 | GET + Headers认证 | POST + JSON Body |
| 加密 | token/tokenparam + AES解密 | **无加密** |
| 图片解密 | 分块乱序还原 | **无需解密** |
| 图片URL | 相对路径+CDN | `kid` 字段拼接 |
| 章节类型 | 无 | chapter/book/其他 |
| 评论 | 有独立API | 通过B站绑定获取 |

---

## 七、KM 图片 URL 拼接规则

根据老代码分析，KM 站点的图片 URL 需要从 `kid` 字段拼接：

```python
# 图片 URL 格式
image_url = f"{cdn_url}{image['kid']}"

# 或者直接使用 kid 作为路径
image_url = image['kid']  # kid 已经是完整路径
```

---

## 八、后台配置内容

在后台添加 KM 站点时，需要填写以下配置：

```json
{
  "site_id": "km",
  "site_name": "宅漫畫",
  "urls": ["https://komiic.com"],
  "cdn_urls": ["https://komiic.com"],
  "schedule": {
    "list_page": 8,
    "info_page": 11,
    "content_page": 4,
    "cover_image": 4,
    "thumbnail_image": 0,
    "content_image": 4,
    "comment_page": 0
  },
  "crawl_limits": {
    "list_page_max": 2,
    "info_page_max": 1000,
    "content_page_max": 1000,
    "cover_image_max": 10000,
    "thumbnail_image_max": 0,
    "content_image_max": 1000,
    "comment_page_max": 0
  },
  "proxy_mode": "none",
  "cookies": {}
}
```

---

## 九、实现步骤

1. **通过后台添加 KM 站点配置**
   - 启动服务器
   - 登录后台
   - 在配置管理中添加 KM 站点

2. **创建爬虫目录和基础文件**
   - `crawlers/km/__init__.py`
   - `crawlers/km/km_base_crawler.py` (简化版，无加密)

3. **实现列表页爬虫**
   - `km_list_crawler.py` - GraphQL 查询 + 数据转换

4. **实现详情页爬虫**
   - `km_info_crawler.py` - 获取章节信息

5. **实现内容页爬虫**
   - `km_content_crawler.py` - 获取图片列表

6. **实现图片下载爬虫**
   - `km_cover_crawler.py` - 封面下载
   - `km_content_image_crawler.py` - 内容图下载

7. **测试验证**
   - 测试列表页爬取
   - 测试详情页爬取
   - 测试图片下载

---

## 十、数据转换代码示例

### 10.1 列表页数据转换

```python
@staticmethod
def _convert_manga_data(raw_data: Dict) -> Dict[str, Any]:
    """转换KM站漫画数据格式为数据库格式"""
    from datetime import datetime

    # 提取作者和分类
    authors = [author.get('name', '') for author in raw_data.get('authors', [])]
    categories = [cat.get('name', '') for cat in raw_data.get('categories', [])]

    # 合并标签
    tags = authors + categories

    # 转换时间
    update_time = None
    if raw_data.get('dateUpdated'):
        try:
            update_time = datetime.fromisoformat(
                raw_data['dateUpdated'].replace('Z', '+00:00')
            )
        except:
            pass

    # 判断是否完结
    is_end = raw_data.get('status', '') == 'ENDED'

    return {
        'aid': int(raw_data.get('id', 0)),
        'title': raw_data.get('title', ''),
        'author': authors,
        'views': raw_data.get('views', 0),
        'favorites': raw_data.get('favoriteCount', 0),
        'types': categories,
        'tags': tags,
        'is_end': is_end,
        'cover_path': raw_data.get('imageUrl', ''),
        'cover_load': 0,
        'update_time': update_time,
        'series_id': 0,
        'status': raw_data.get('status', ''),
    }
```

### 10.2 章节数据转换

```python
@staticmethod
def _convert_chapter_data(aid: int, raw_chapters: List[Dict]) -> List[Dict[str, Any]]:
    """转换KM站章节数据格式为数据库格式"""
    from datetime import datetime

    chapters = []
    for order, item in enumerate(raw_chapters, start=1):
        update_time = None
        if item.get('dateUpdated'):
            try:
                update_time = datetime.fromisoformat(
                    item['dateUpdated'].replace('Z', '+00:00')
                )
            except:
                pass

        chapters.append({
            'aid': aid,
            'pid': int(item.get('id', 0)),
            'title': item.get('serial', ''),
            'order': order,
            'page_count': int(item.get('size', 0)),
            'update_time': update_time,
            'status': 'pending'
        })

    return chapters
```

### 10.3 图片数据转换

```python
@staticmethod
def _convert_images_data(raw_images: List[Dict]) -> List[Dict[str, Any]]:
    """转换KM站图片数据格式为数据库格式"""
    images = []
    for idx, item in enumerate(raw_images, start=1):
        images.append({
            'page': idx,
            'url': item.get('kid', ''),  # kid 就是图片路径
            'kid': item.get('kid', ''),
            'width': item.get('width', 0),
            'height': item.get('height', 0),
            'file_id': None,
            'status': 0
        })

    return images
```

---

## 十一、注意事项

1. **GraphQL 请求必须设置 Content-Type 为 application/json**
2. **KM 站点不需要任何加密解密处理**
3. **图片直接下载，不需要解密**
4. **章节有类型区分 (chapter/book)，需要保留**
5. **KM 的评论功能依赖 B站绑定，暂不实现**
