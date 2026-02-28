# 四种阅读模式重构方案（更新版）

## 一、四种模式分析

| 模式 | 说明 | 纵向滚动条 | 横向滚动条 |
|------|------|-----------|-----------|
| **scroll** | 下拉式 | 显示 | 禁止 |
| **scroll-seamless** | 下拉式无缝 | 显示 | 禁止 |
| **page-flip** | 翻页式单页 | 禁止 | 禁止 |
| **page-flip-double** | 翻页式双页（自动） | 禁止 | 禁止 |

**核心原则**: 严格禁止用CSS直接禁用滚动条（如 `overflow: hidden`），全部通过JS精确计算高度实现。

---

## 二、翻页式双页模式详解

### 模式说明
翻页式双页（`page-flip-double`）是翻页式模式的扩展，支持**自动双页显示**：

1. **默认单页显示**：每张图片单独占据一页
2. **自动双页检测**：当满足以下条件时，自动并排显示两张图片
   - 窗口横屏（宽 > 高）
   - 两张图片都是竖图（高 > 宽）
   - 两张图并排能放入容器宽度中

3. **双页显示规则**（日漫/中漫阅读顺序）：
   - **左边放第二页，右边放第一页**
   - 保持图片原始比例
   - 高度尽可能占满容器

### 技术实现
```javascript
// 双页检测逻辑
_checkAndUpdateDoublePageDisplay(section) {
    // 1. 检查是否横屏
    const isLandscapeWindow = div_width > div_height;

    // 2. 检查两张是否都是竖图
    const bothPortrait = pic1_height > pic1_width && pic2_height > pic2_width;

    // 3. 计算缩放后检查是否能并排放下
    const max_height = div_height * 0.95;
    const total_width = img1_scaled_width + img2_scaled_width + gap;
    const canFitTwoImages = total_width <= div_width;

    // 满足所有条件时启用双页
    if (isLandscapeWindow && bothPortrait && canFitTwoImages) {
        section.classList.add('double-page-active');
    }
}
```

---

## 三、测试URL

**统一测试地址**: `http://127.0.0.1:5000/read.html?site=cm&aid=1292143&pid=1292143`

所有测试场景均使用此URL进行验证。

---

## 四、新架构设计

```
static/frontend/js/
├── read-core.js              # 核心通用模块
│   ├── ReadModeBase          # 基类
│   ├── HeightCalculator      # 高度计算器 (核心)
│   ├── ImageLoader           # 图片加载器
│   ├── DeviceDetector        # 设备检测器
│   └── ScrollbarController   # 滚动条控制器
│
├── read-modes/
│   ├── ScrollMode.js         # 下拉式模式
│   ├── ScrollSeamlessMode.js # 下拉式无缝模式
│   ├── PageFlipMode.js       # 翻页式模式
│   └── PageFlipDoubleMode.js # 翻页式双页模式（自动双页）
│
└── read.js                    # 主控制器 (精简)
```

---

## 五、ScrollMode 修复

### 问题
新代码直接添加 `<img>` 元素，但CSS样式针对 `.comic-image-container` 包装元素。

### 解决方案
```javascript
// 修复前（错误）
const imgEl = this.imageLoader.createImageElement(imgData, index);
this.container.appendChild(imgEl);

// 修复后（正确）
const imgContainer = document.createElement('div');
imgContainer.className = 'comic-image-container';
imgContainer.dataset.page = imgData.page;
const imgEl = this.imageLoader.createImageElement(imgData, index);
imgContainer.appendChild(imgEl);

// 添加页码指示器
const pageBadge = document.createElement('div');
pageBadge.className = 'page-indicator-badge';
pageBadge.textContent = `${index + 1}/${images.length}`;
pageBadge.dataset.page = imgData.page;
imgContainer.appendChild(pageBadge);

this.container.appendChild(imgContainer);
```

---

## 六、多设备测试计划

### 测试URL
**统一测试地址**: `http://127.0.0.1:5000/read.html?site=cm&aid=1292143&pid=1292143`

### 测试场景

| 序号 | 设备类型 | 屏幕方向 | 分辨率 | 测试重点 |
|------|---------|---------|--------|---------|
| 1 | 手机 | 竖屏 | 390x844 | 控件缩减、纵向滚动 |
| 2 | 手机 | 横屏 | 844x390 | 双页检测、控件显示 |
| 3 | 平板 | 竖屏 | 768x1024 | 中等布局、控件适中 |
| 4 | 平板 | 横屏 | 1024x768 | 双页显示、章节标题 |
| 5 | PC | 全屏 | 1920x1080 | 图片最大化、控件间隙 |
| 6 | PC | 小窗口 | 1280x720 | 最小高度保证 |
| 7 | PC | 超宽屏 | 2560x1440 | 图片居中、无边距 |
| 8 | PC | 窄窗口 | 800x600 | 紧急适配、滚动条 |

### 测试矩阵

| 模式 | 手机竖 | 手机横 | 平板竖 | 平板横 | PC全屏 | PC小窗 | 超宽屏 | 窗窗口 |
|------|--------|--------|--------|--------|--------|--------|--------|--------|
| scroll | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| scroll-seamless | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| page-flip | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| page-flip-double | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**总计**: 8种场景 × 4种模式 = 32项测试

---

## 七、核心要点总结

| 要点 | 实现方式 |
|------|---------|
| **翻页模式无滚动条** | JS精确计算高度 = 视口高度 - 固定元素高度 - 间隙 |
| **下拉模式纵向滚动** | `overflow-y: auto`, `overflow-x: hidden` |
| **禁止横向滚动** | 图片max-width: 100%，JS检测并调整 |
| **图片最大化** | 间隙缩减至4-8px，移除不必要的padding |
| **实时响应** | 监听resize和orientationchange事件 |
| **移动端适配** | DeviceDetector检测，缩减/隐藏非必要控件 |
| **禁止CSS隐藏滚动条** | 全部通过JS计算实现，不使用`overflow: hidden`强制隐藏 |
| **双页自动检测** | 横屏 + 两张竖图 + 能并排 → 自动双页 |
| **双页阅读顺序** | 左边第二页，右边第一页（日漫顺序） |

---

## 八、实施步骤

1. [x] 创建核心模块 `read-core.js`
2. [x] 创建 `read-modes/` 目录和4个模式类
3. [x] 重构主控制器 `read.js`
4. [x] 更新 `read.html` 引入新JS文件
5. [x] 移除CSS强制隐藏滚动条规则
6. [ ] **修复 ScrollMode 布局**（添加 comic-image-container 包装）
7. [ ] **重写 PageFlipDoubleMode**（实现自动双页检测）
8. [ ] 多设备测试（32项）
