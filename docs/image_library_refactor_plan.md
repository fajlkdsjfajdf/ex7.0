# 图片库重构方案

## 一、目标

将图片库从主数据库抽离，实现独立数据库存储，支持通过业务参数（site, aid, pid, page_num, image_type）精确定位图片。

## 二、数据库设计

### 2.1 独立数据库

```
image_library (独立数据库)
├── cm_images          # CM站图片索引表（每张图一条记录）
├── cm_storage         # CM站存储表（MD5去重）
├── km_images          # KM站图片索引表
├── km_storage         # KM站存储表
└── ...
```

### 2.2 图片索引表 `{site}_images`

每张图片一条记录，通过业务参数定位。

```python
{
    "_id": ObjectId,
    # 业务定位（联合唯一索引）
    "aid": 123,                # 漫画ID
    "pid": 456,                # 章节ID (封面/缩略图为 null)
    "page_num": 1,             # 页码 (封面/缩略图为 null)
    "image_type": "content",   # cover / thumbnail / content

    # 存储引用
    "storage_id": ObjectId,    # 指向 storage 表的引用

    # 元数据
    "source_url": "...",       # 原始URL
    "md5": "abc123...",        # MD5（用于去重判断）
    "file_size": 123456,       # 文件大小
    "width": 800,
    "height": 1200,
    "mime_type": "image/webp",

    "created_at": datetime
}
```

**索引设计**：
- `(aid, pid, page_num, image_type)` - 联合唯一索引，精确定位
- `(storage_id)` - 关联查询
- `(md5)` - 去重查询

### 2.3 存储表 `{site}_storage`

MD5去重后的实际存储，多个image记录可引用同一个storage。

```python
{
    "_id": ObjectId,
    "md5": "abc123...",        # 唯一索引
    "ref_count": 5,            # 被引用次数

    # DAT 存储位置
    "dat_file": "cm_images_0001.dat",
    "offset": 123456,
    "length": 234567,

    "created_at": datetime
}
```

**索引设计**：
- `(md5)` - 唯一索引
- `(ref_count)` - 清理未使用图片

## 三、图片存储路径配置

### 3.1 系统配置 (`data/system_config.json`)

```json
{
  "image_storage": {
    "windows_path": "Y:/ex7.0/image",
    "linux_path": "/mnt/appdata",
    "description": "图片存储根路径，系统会根据操作系统自动选择"
  }
}
```

### 3.2 路径选择规则

- **Windows**: 使用 `windows_path`
- **Linux/其他**: 使用 `linux_path`

### 3.3 后台管理 API

| API | 说明 |
|-----|------|
| `GET /admin/api/config/image-storage` | 获取图片存储配置（含磁盘空间信息） |
| `POST /admin/api/config/image-storage` | 更新图片存储配置 |
| `POST /admin/api/config/image-storage/test` | 测试图片存储路径是否可用 |

### 3.4 后台图片库统计 API

| API | 说明 |
|-----|------|
| `GET /admin/api/image-library/stats?site_id=cm` | 获取单个站点图片库统计 |
| `GET /admin/api/image-library/stats/all` | 获取所有站点图片库统计 |

## 四、ImageLibrary API 设计

```python
class ImageLibrary:
    def __init__(self, site_id: str):
        """连接独立数据库 image_library"""

    # ===== 核心方法 =====

    def save_image(
        self,
        image_data: bytes,        # 图片二进制数据
        aid: int,
        pid: int = None,          # 封面/缩略图为 None
        page_num: int = None,     # 封面/缩略图为 None
        image_type: str = 'content',
        source_url: str = ''
    ) -> str:
        """
        保存图片到图片库
        - 计算 MD5
        - 查 storage 表是否已存在
        - 存在则复用，ref_count++
        - 不存在则写入 DAT，创建 storage 记录
        - 创建 images 记录
        Returns: image_id (images表的_id)
        """

    def image_exists(
        self,
        aid: int,
        pid: int = None,
        page_num: int = None,
        image_type: str = 'content'
    ) -> bool:
        """检查图片是否存在"""

    def get_image(
        self,
        aid: int,
        pid: int = None,
        page_num: int = None,
        image_type: str = 'content'
    ) -> Optional[dict]:
        """获取图片信息（含 storage_id）"""

    def get_image_data(
        self,
        aid: int,
        pid: int = None,
        page_num: int = None,
        image_type: str = 'content'
    ) -> Optional[bytes]:
        """获取图片二进制数据"""

    def delete_image(
        self,
        aid: int,
        pid: int = None,
        page_num: int = None,
        image_type: str = 'content'
    ) -> bool:
        """删除图片（减少 storage 引用计数）"""

    # ===== 批量方法 =====

    def get_chapter_images(
        self,
        aid: int,
        pid: int,
        image_type: str = 'content'
    ) -> List[dict]:
        """获取章节的所有图片"""

    def get_manga_images(
        self,
        aid: int,
        image_type: str = None
    ) -> List[dict]:
        """获取漫画的所有图片"""

    def batch_check_exists(
        self,
        items: List[dict]
    ) -> Dict[str, dict]:
        """批量检查图片是否存在"""

    def delete_chapter_images(self, aid: int, pid: int):
        """删除章节所有图片"""

    def delete_manga_images(self, aid: int):
        """删除漫画所有图片"""

    # ===== 统计方法 =====

    def get_statistics(self) -> Dict[str, Any]:
        """获取图片库统计信息"""
```

## 五、爬虫改造

### 5.1 基类 download_image 简化

```python
def download_image(
    self,
    image_url: str,
    aid: int,
    pid: Optional[int],
    image_type: str,
    decode: bool = True,
    page: int = 1
) -> Optional[str]:
    """
    下载图片并提交给图片库
    只负责：下载 → 解密 → 提交给图片库
    """
    # 1. 下载图片
    image_data = self._download_raw_image(image_url)

    # 2. 解密（如果需要）
    if decode:
        image_data = self._decode_image(image_data, pid or aid, page)

    # 3. 提交给图片库
    image_library = get_image_library(self.site_id)
    image_id = image_library.save_image(
        image_data=image_data,
        aid=aid,
        pid=pid,
        page_num=page if image_type == 'content' else None,
        image_type=image_type,
        source_url=image_url
    )

    return image_id
```

### 5.2 封面爬虫

```python
class CMCoverImageCrawler(CMBaseCrawler):
    def crawl(self, aid: int, cover_url: str = None):
        image_library = get_image_library(self.site_id)

        # 1. 先问图片库是否存在
        image_info = image_library.get_image(aid=aid, image_type='cover')

        if image_info:
            # 2. 存在，检查业务表标记
            if not self._is_marked(aid):
                # 补打标记
                self._mark_cover_downloaded(aid, image_info['_id'])
            return self.create_result(success=True, data={'skipped': True})

        # 3. 不存在才下载
        image_id = self.download_image(cover_url, aid, None, 'cover', decode=False)

        if image_id:
            # 4. 打标记
            self._mark_cover_downloaded(aid, image_id)
            return self.create_result(success=True, data={'image_id': image_id})

        return self.create_result(success=False, error="下载失败")
```

### 5.3 内容图爬虫

```python
class CMContentImageCrawler(CMBaseCrawler):
    def crawl(self, aid: int, pid: int, page: int, image_url: str):
        image_library = get_image_library(self.site_id)

        # 1. 先问图片库是否存在
        image_info = image_library.get_image(
            aid=aid, pid=pid, page_num=page, image_type='content'
        )

        if image_info:
            # 2. 存在，检查业务表标记
            if not self._is_marked(aid, pid, page):
                # 补打标记
                self._mark_content_downloaded(aid, pid, page, image_info['_id'])
            return self.create_result(success=True, data={'skipped': True})

        # 3. 不存在才下载
        image_id = self.download_image(image_url, aid, pid, 'content', decode=True, page=page)

        if image_id:
            # 4. 打标记
            self._mark_content_downloaded(aid, pid, page, image_id)
            return self.create_result(success=True, data={'image_id': image_id})

        return self.create_result(success=False, error="下载失败")
```

## 六、前台检测改造

### 6.1 检测函数改造

所有检测函数改为直接问图片库，不再查业务表。

| 函数 | 改造 |
|------|------|
| `check_cover_image` | `image_library.get_image(aid, type=cover)` |
| `check_thumbnail_image` | `image_library.get_image(aid, type=thumbnail)` |
| `check_content_image` | `image_library.get_image(aid, pid, page, type=content)` |
| `check_content_images` | `image_library.get_chapter_images(aid, pid)` |
| `check_resources_batch` | 批量调用图片库API |

### 6.2 图片获取 API

```python
@api_bp.route('/media/image')
def get_image():
    """
    获取图片（新接口 - 用业务参数定位）

    参数:
        site: 站点ID
        aid: 漫画ID
        pid: 章节ID (封面/缩略图可省略)
        page: 页码 (封面/缩略图可省略)
        type: 图片类型 (cover/thumbnail/content)
    """
    site_id = request.args.get('site')
    aid = request.args.get('aid')
    pid = request.args.get('pid')
    page = request.args.get('page')
    image_type = request.args.get('type', 'content')

    image_library = get_image_library(site_id)

    # 直接用业务参数获取图片
    image_data = image_library.get_image_data(
        aid=int(aid),
        pid=int(pid) if pid else None,
        page_num=int(page) if page else None,
        image_type=image_type
    )

    if not image_data:
        return jsonify({'error': 'Image not found'}), 404

    return Response(image_data, mimetype='image/jpeg')
```

## 七、改动清单

| 文件 | 改动内容 |
|------|---------|
| `data/system_config.json` | 添加 `image_storage` 配置 |
| `models/image_library.py` | 完全重写：独立数据库、两层表结构、新API |
| `models/image_storage.py` | 修改：根据系统配置自动选择存储路径 |
| `database/image_library_db.py` | 新增：图片库独立数据库连接 |
| `crawlers/cm/cm_base_crawler.py` | `download_image` 简化 |
| `crawlers/cm/cm_cover_crawler.py` | 先问图片库→存在补标记→不存在才下载 |
| `crawlers/cm/cm_content_image_crawler.py` | 同上 |
| `blueprints/api/resource_routes.py` | 所有检测函数改为直接问图片库 |
| `blueprints/admin/config_routes.py` | 添加图片存储配置和图片库统计API |

## 八、数据流程

### 保存流程
```
1. 爬虫下载图片
2. 爬虫调用 image_library.save_image(image_data, aid, pid, page_num, image_type)
3. 图片库：
   a. 计算 MD5
   b. 查 storage 表是否存在
   c. 存在：ref_count++
   d. 不存在：写入 DAT，创建 storage 记录
   e. 创建 images 记录（引用 storage_id）
4. 爬虫在业务表打标记
```

### 获取流程
```
前台请求 → API(aid, pid, page, type) → 图片库.get_image() → 读取 DAT → 返回图片
```

### 检测流程
```
前台检测 → API → 图片库.image_exists() → 返回结果
```

### 删除流程
```
1. 调用 image_library.delete_image(aid, pid, page, type)
2. 删除 images 记录
3. storage.ref_count--
4. 如果 ref_count=0，可清理 DAT 空间
```

## 九、使用前准备

1. **创建索引** - 首次运行时需要创建索引：
```python
from models.image_library import ImageLibrary
ImageLibrary.create_indexes_for_site('cm')
ImageLibrary.create_indexes_for_site('km')
```

2. **配置存储路径** - 在 `data/system_config.json` 中配置：
```json
{
  "image_storage": {
    "windows_path": "Y:/ex7.0/image",
    "linux_path": "/mnt/appdata"
  }
}
```

3. **确保存储目录存在** - 系统会自动创建，但确保父目录有写权限
