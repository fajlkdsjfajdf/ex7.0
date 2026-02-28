/**
 * 阅读模式核心模块
 * 包含设备检测、高度计算、滚动条控制、图片加载等通用功能
 */

// ==================== DeviceDetector - 设备检测器 ====================
class DeviceDetector {
    static _deviceType = null;
    static _configCache = null;

    /**
     * 检测设备类型
     * @returns {string} 'mobile' | 'tablet' | 'desktop'
     */
    static detect() {
        if (this._deviceType) {
            return this._deviceType;
        }

        const width = window.innerWidth;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile || width < 768) {
            this._deviceType = 'mobile';
        } else if (width < 1024) {
            this._deviceType = 'tablet';
        } else {
            this._deviceType = 'desktop';
        }

        return this._deviceType;
    }

    /**
     * 判断是否为移动设备
     */
    static isMobile() {
        return this.detect() === 'mobile';
    }

    /**
     * 判断是否为平板设备
     */
    static isTablet() {
        return this.detect() === 'tablet';
    }

    /**
     * 判断是否为桌面设备
     */
    static isDesktop() {
        return this.detect() === 'desktop';
    }

    /**
     * 判断是否为横屏
     */
    static isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    /**
     * 获取设备对应的控件配置
     * @returns {Object} 控件配置对象
     */
    static getControlsConfig() {
        if (this._configCache) {
            return this._configCache;
        }

        const device = this.detect();
        const landscape = this.isLandscape();

        const configs = {
            mobile: {
                showHeader: true,
                showChapterTitle: false,  // 移动端隐藏章节标题节省空间
                showNav: true,
                compactNav: true,
                buttonSize: 'small',
                gap: 4,
                controlBarHeight: 44
            },
            tablet: {
                showHeader: true,
                showChapterTitle: landscape,  // 横屏显示
                showNav: true,
                compactNav: false,
                buttonSize: 'medium',
                gap: 6,
                controlBarHeight: 48
            },
            desktop: {
                showHeader: true,
                showChapterTitle: true,
                showNav: true,
                compactNav: false,
                buttonSize: 'normal',
                gap: 8,
                controlBarHeight: 52
            }
        };

        this._configCache = configs[device];
        return this._configCache;
    }

    /**
     * 清除缓存（设备变化时调用）
     */
    static clearCache() {
        this._deviceType = null;
        this._configCache = null;
    }
}

// ==================== HeightCalculator - 高度计算器 ====================
class HeightCalculator {
    constructor() {
        this._updateCallback = null;
        this._resizeTimeout = null;
        this._orientationTimeout = null;
    }

    /**
     * 计算翻页模式的可用高度
     * 精确计算，确保不出现滚动条
     * @param {string} mode - 阅读模式
     * @returns {number} 可用高度（像素）
     */
    calculateFlipModeHeight(mode) {
        const viewportHeight = window.innerHeight;
        const subtractHeight = this._getAllFixedElementHeights(mode);
        const availableHeight = viewportHeight - subtractHeight;
        return Math.max(availableHeight, 200);
    }

    /**
     * 计算所有固定元素的高度总和
     * @param {string} mode - 阅读模式
     * @returns {number} 总高度（像素）
     * @private
     */
    _getAllFixedElementHeights(mode) {
        let total = 0;

        // main-content的padding（所有模式都需要减去）
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const mainStyle = window.getComputedStyle(mainContent);
            const paddingTop = parseFloat(mainStyle.paddingTop) || 0;
            const paddingBottom = parseFloat(mainStyle.paddingBottom) || 0;
            total += paddingTop + paddingBottom;
            console.log(`[HeightCalculator] main-content padding: ${paddingTop}px + ${paddingBottom}px`);
        }

        // comic-viewer-content的padding-bottom（移动端为底部菜单留空间）
        const viewerContent = document.querySelector('.comic-viewer-content');
        if (viewerContent) {
            const viewerStyle = window.getComputedStyle(viewerContent);
            const paddingBottom = parseFloat(viewerStyle.paddingBottom) || 0;
            total += paddingBottom;
            console.log(`[HeightCalculator] viewer-content padding-bottom: ${paddingBottom}px`);
        }

        // Header (viewer-header)
        const header = document.querySelector('.viewer-header');
        if (header && this._isFixedVisible(header)) {
            total += header.offsetHeight;
        }

        // 章节标题 (comic-chapter-title)
        const chapterTitle = document.querySelector('.comic-chapter-title');
        if (chapterTitle && this._isFixedVisible(chapterTitle)) {
            total += chapterTitle.offsetHeight;
        }

        // 章节导航 (chapter-navigation)
        // 只有在非fixed时才需要减去章节导航高度
        const chapterNav = document.querySelector('.chapter-navigation');
        if (chapterNav) {
            const navStyle = window.getComputedStyle(chapterNav);
            const position = navStyle.position;
            // 只在非fixed时减去导航高度
            if (position !== 'fixed') {
                const marginTop = parseFloat(navStyle.marginTop) || 0;
                const marginBottom = parseFloat(navStyle.marginBottom) || 0;
                total += chapterNav.offsetHeight + marginTop + marginBottom;
                console.log(`[HeightCalculator] 章节导航(非fixed): ${chapterNav.offsetHeight}px + margin: ${marginTop + marginBottom}px`);
            } else {
                console.log(`[HeightCalculator] 章节导航是fixed，不扣除其高度`);
            }
        }

        // 控件区域间隙
        const config = DeviceDetector.getControlsConfig();
        total += config.gap * 2; // 上下各一个间隙

        console.log(`[HeightCalculator] 总减去高度: ${total}px`);

        return total;
    }

    /**
     * 检查元素是否固定可见
     * @param {HTMLElement} element - 要检查的元素
     * @returns {boolean}
     * @private
     */
    _isFixedVisible(element) {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               element.offsetHeight > 0;
    }

    /**
     * 应用高度到容器
     * @param {HTMLElement} container - 容器元素
     * @param {string} mode - 阅读模式
     * @param {Function} callback - 高度设置完成后的回调函数
     */
    applyHeight(container, mode, callback = null) {
        if (!container) return;

        const isFlipMode = mode === 'page-flip' || mode === 'page-flip-multi' || mode === 'page-flip-double';

        if (isFlipMode) {
            // 翻页模式：设置body和html为不可滚动
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            // 使用requestAnimationFrame确保DOM已完全渲染
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const height = this.calculateFlipModeHeight(mode);
                    container.style.height = `${height}px`;
                    container.style.maxHeight = `${height}px`;

                    // 同时更新viewport的高度
                    const viewport = container.querySelector('.comic-pager-viewport');
                    if (viewport) {
                        viewport.style.height = `${height}px`;
                        viewport.style.maxHeight = `${height}px`;
                    }

                    console.log(`[HeightCalculator] 模式: ${mode}, 计算高度: ${height}px, 视口: ${window.innerHeight}px`);

                    // 高度设置完成后执行回调
                    if (callback) {
                        callback();
                    }
                });
            });
        } else {
            // 滚动模式：恢复body和html的滚动
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            // 滚动模式不设置固定高度
            container.style.height = '';
            container.style.maxHeight = '';

            // 滚动模式立即执行回调
            if (callback) {
                callback();
            }
        }
    }

    /**
     * 检测是否有滚动条出现
     * @param {string} mode - 阅读模式
     * @private
     */
    _checkForOverflow(mode) {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        const hasVerticalOverflow = mainContent.scrollHeight > mainContent.clientHeight;
        const hasHorizontalOverflow = mainContent.scrollWidth > mainContent.clientWidth;

        if (hasVerticalOverflow) {
            console.warn(`[HeightCalculator] 检测到纵向滚动条! scrollHeight: ${mainContent.scrollHeight}, clientHeight: ${mainContent.clientHeight}`);
        }
        if (hasHorizontalOverflow) {
            console.warn(`[HeightCalculator] 检测到横向滚动条! scrollWidth: ${mainContent.scrollWidth}, clientWidth: ${mainContent.clientWidth}`);
        }

        // 如果有纵向滚动条，尝试修正
        if (hasVerticalOverflow) {
            const container = document.querySelector('.comic-pager-container');
            if (container) {
                const currentHeight = parseInt(container.style.height);
                const overflowAmount = mainContent.scrollHeight - mainContent.clientHeight;
                const newHeight = currentHeight - overflowAmount - 2; // 多减2px确保不会溢出
                container.style.height = `${newHeight}px`;
                container.style.maxHeight = `${newHeight}px`;

                const viewport = container.querySelector('.comic-pager-viewport');
                if (viewport) {
                    viewport.style.height = `${newHeight}px`;
                    viewport.style.maxHeight = `${newHeight}px`;
                }

                console.log(`[HeightCalculator] 修正高度: ${currentHeight}px -> ${newHeight}px`);
            }
        }
    }

    /**
     * 启动实时响应 - 监听窗口缩放和设备旋转
     * @param {Function} callback - 高度变化时的回调函数
     * @param {number} debounceMs - 防抖延迟（毫秒）
     */
    startRealtimeUpdate(callback, debounceMs = 100) {
        this._updateCallback = callback;

        // 窗口缩放事件
        window.addEventListener('resize', () => {
            clearTimeout(this._resizeTimeout);
            this._resizeTimeout = setTimeout(() => {
                DeviceDetector.clearCache();
                if (this._updateCallback) {
                    this._updateCallback();
                }
            }, debounceMs);
        });

        // 设备旋转事件（移动端）
        window.addEventListener('orientationchange', () => {
            clearTimeout(this._orientationTimeout);
            this._orientationTimeout = setTimeout(() => {
                DeviceDetector.clearCache();
                if (this._updateCallback) {
                    this._updateCallback();
                }
            }, 150); // 等待orientation切换完成
        });
    }

    /**
     * 停止实时响应
     */
    stopRealtimeUpdate() {
        this._updateCallback = null;
        clearTimeout(this._resizeTimeout);
        clearTimeout(this._orientationTimeout);
    }
}

// ==================== ScrollbarController - 滚动条控制器 ====================
class ScrollbarController {
    /**
     * 设置容器的滚动行为
     * 通过精确计算避免不需要的滚动条
     * @param {HTMLElement} container - 容器元素
     * @param {string} mode - 阅读模式
     */
    static configureContainer(container, mode) {
        if (!container) return;

        switch (mode) {
            case 'scroll':
            case 'scroll-seamless':
                // 纵向滚动，横向禁止
                container.style.overflowX = 'hidden';
                container.style.overflowY = '';
                // 不设置固定高度，让内容自然撑开
                container.style.height = 'auto';
                container.style.maxHeight = '';
                break;

            case 'page-flip':
            case 'page-flip-multi':
            case 'page-flip-double':
                // 翻页模式：只禁止横向滚动，纵向不设置overflow
                // 高度精确计算后不会出现纵向滚动条
                container.style.overflowX = 'hidden';
                container.style.overflowY = '';
                // 高度由HeightCalculator计算并设置
                break;
        }

        console.log(`[ScrollbarController] 模式: ${mode}, overflowX: ${container.style.overflowX}, overflowY: ${container.style.overflowY || 'auto'}`);
    }

    /**
     * 配置主内容区域的滚动行为
     * @param {HTMLElement} mainContent - 主内容区域元素
     * @param {string} mode - 阅读模式
     */
    static configureMainContent(mainContent, mode) {
        if (!mainContent) return;

        const isFlipMode = mode === 'page-flip' || mode === 'page-flip-multi' || mode === 'page-flip-double';

        if (isFlipMode) {
            // 翻页模式：主内容区域不滚动
            // 通过精确计算高度避免滚动条出现
            mainContent.style.overflowY = '';
            mainContent.style.overflowX = 'hidden';
        } else {
            // 滚动模式：允许纵向滚动
            mainContent.style.overflowY = '';
            mainContent.style.overflowX = 'hidden';
        }
    }

    /**
     * 确保横向无滚动条
     * @param {HTMLElement} container - 容器元素
     */
    static preventHorizontalScrollbar(container) {
        if (!container) return;

        const checkAndFix = () => {
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;

            if (scrollWidth > clientWidth) {
                console.warn(`[ScrollbarController] 检测到横向滚动条，scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`);
                const images = container.querySelectorAll('img');
                images.forEach(img => {
                    img.style.maxWidth = '100%';
                    img.style.width = 'auto';
                });
            }
        };

        // 立即检查
        checkAndFix();

        // 图片加载后再次检查
        container.querySelectorAll('img').forEach(img => {
            if (img.complete) {
                checkAndFix();
            } else {
                img.addEventListener('load', checkAndFix);
            }
        });
    }
}

// ==================== ImageLoader - 图片加载器 ====================
class ImageLoader {
    /**
     * @param {string} waitingImageUrl - 等待加载时的占位图片URL
     */
    constructor(waitingImageUrl = '/static/common/img/loading.svg') {
        this.waitingImageUrl = waitingImageUrl;
        this.pendingImages = new Map();
        this.downloadedImages = new Map();
    }

    /**
     * 创建图片元素
     * @param {Object} imageData - 图片数据 {url, page, index}
     * @param {number} globalIndex - 全局索引
     * @returns {HTMLImageElement}
     */
    createImageElement(imageData, globalIndex) {
        const img = document.createElement('img');
        img.alt = `第${imageData.page + 1}页`;
        img.className = 'comic-image';
        img.dataset.page = imageData.page;
        img.dataset.status = 'loading';
        // Note: data.index is NOT set here - it's only used by PageFlipDoubleMode
        img.loading = globalIndex < 2 ? 'eager' : 'lazy';

        // 先设置等待图片
        img.src = this.waitingImageUrl;

        // 如果有URL，记录为待下载
        if (imageData.url) {
            // 首先检查是否已经下载过（通过预下载）
            const downloadedUrl = this.downloadedImages.get(imageData.page);
            const actualUrl = downloadedUrl || imageData.url;

            this.pendingImages.set(imageData.page, {
                element: img,
                url: actualUrl,
                page: imageData.page
            });

            // 检查是否是已下载的本地URL
            // 使用 API 返回的 downloaded 字段判断，而不是 URL 格式
            const isDownloaded = imageData.downloaded === true || downloadedUrl;
            if (isDownloaded) {
                this.updateImage(imageData.page, actualUrl);
            }
        }

        return img;
    }

    /**
     * 更新图片
     * @param {number} page - 页码
     * @param {string} url - 图片URL
     */
    updateImage(page, url) {
        // 更新已下载图片记录
        this.downloadedImages.set(page, url);

        // 更新待下载的图片
        const pending = this.pendingImages.get(page);
        if (pending && pending.element) {
            pending.element.src = url;
            pending.element.dataset.status = 'loaded';
        }

        // 从待下载列表中移除
        this.pendingImages.delete(page);
    }

    /**
     * 获取待下载的图片数量
     */
    getPendingCount() {
        return this.pendingImages.size;
    }

    /**
     * 清除所有记录
     */
    clear() {
        this.pendingImages.clear();
        this.downloadedImages.clear();
    }
}

// ==================== ReadModeBase - 阅读模式基类 ====================
class ReadModeBase {
    /**
     * @param {HTMLElement} container - 图片容器元素
     * @param {ImageLoader} imageLoader - 图片加载器实例
     * @param {HeightCalculator} heightCalculator - 高度计算器实例
     */
    constructor(container, imageLoader, heightCalculator) {
        this.container = container;
        this.imageLoader = imageLoader;
        this.heightCalculator = heightCalculator;
        this.modeName = 'base';
        this.controls = [];
        this._cleanupFns = [];

        // 创建悬浮控件实例
        this.floatingControls = new FloatingControls();
    }

    /**
     * 渲染模式 - 子类必须实现
     * @param {Array} images - 图片数据数组
     */
    render(images) {
        throw new Error('子类必须实现 render() 方法');
    }

    /**
     * 销毁模式 - 清理事件监听和DOM
     */
    destroy() {
        // 执行所有清理函数
        this._cleanupFns.forEach(fn => fn());
        this._cleanupFns = [];

        // 清空容器
        if (this.container) {
            this.container.innerHTML = '';
        }

        // 停止高度计算器的实时更新
        if (this.heightCalculator) {
            this.heightCalculator.stopRealtimeUpdate();
        }

        // 销毁悬浮控件
        if (this.floatingControls) {
            this.floatingControls.destroy();
        }

        // 恢复body和html的overflow设置
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    }

    /**
     * 添加清理函数
     * @param {Function} fn - 清理函数
     * @protected
     */
    _addCleanup(fn) {
        this._cleanupFns.push(fn);
    }

    /**
     * 添加事件监听（自动清理）
     * @param {EventTarget} target - 事件目标
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     * @protected
     */
    _addEventListener(target, event, handler) {
        target.addEventListener(event, handler);
        this._addCleanup(() => target.removeEventListener(event, handler));
    }

    /**
     * 更新body的mode class
     * @protected
     */
    _updateBodyClass() {
        document.body.classList.remove('page-flip-mode', 'page-flip-multi-mode', 'scroll-mode', 'scroll-seamless-mode');
        document.body.classList.add(`${this.modeName}-mode`);
        console.log(`[ReadModeBase] 更新body class: ${this.modeName}-mode`);
    }

    /**
     * 初始化悬浮控件
     * @protected
     */
    _initFloatingControls() {
        if (this.floatingControls) {
            this.floatingControls.init();
        }
    }

    /**
     * 触发翻页操作时的回调（用于隐藏悬浮控件）
     * @protected
     */
    _onPageAction() {
        if (this.floatingControls) {
            this.floatingControls.onAction();
        }
    }
}

// ==================== FloatingControls - 悬浮控件管理器 ====================
class FloatingControls {
    constructor() {
        this.topBar = null;
        this.bottomBar = null;
        this.hideTimer = null;
        this.isVisible = false;
        this.HIDE_DELAY = 2000; // 2秒后自动隐藏
        this._cleanupFns = [];
    }

    /**
     * 初始化悬浮控件
     */
    init() {
        console.log('[FloatingControls] 初始化悬浮控件');
        this._createFloatingBars();
        this._bindEvents();
    }

    /**
     * 创建浮动栏
     * @private
     */
    _createFloatingBars() {
        // 获取原始元素内容
        const viewerHeader = document.querySelector('.viewer-header');
        const viewerTitle = document.getElementById('viewerTitle');
        const chapterTitle = document.querySelector('.comic-chapter-title');
        const chapterNav = document.querySelector('.chapter-navigation');
        const prevBtn = document.getElementById('prevChapterBtn');
        const nextBtn = document.getElementById('nextChapterBtn');
        const chapterInfo = document.getElementById('chapterInfo');
        const backBtn = document.getElementById('backBtn');

        // 创建顶部浮动栏
        this.topBar = document.createElement('div');
        this.topBar.className = 'floating-top-bar';

        // 顶部内容：返回按钮 + 标题
        let topContent = '';
        if (backBtn) {
            // 直接创建按钮，点击时触发原始按钮的点击事件
            topContent += `<button class="floating-btn-small" id="floatingBackBtn"><i class="fas fa-arrow-left"></i> 返回</button>`;
        }
        topContent += `<span class="comic-title">${viewerTitle?.textContent || chapterTitle?.textContent || ''}</span>`;

        // 右侧按钮（如果有强制更新按钮等）
        const forceUpdateBtn = document.getElementById('forceUpdateBtn');
        if (forceUpdateBtn) {
            topContent += `<button class="floating-btn-small" id="floatingForceUpdateBtn"><i class="fas fa-sync-alt"></i></button>`;
        }

        this.topBar.innerHTML = topContent;
        document.body.appendChild(this.topBar);

        // 绑定顶部浮动栏按钮事件
        const floatingBackBtn = document.getElementById('floatingBackBtn');
        if (floatingBackBtn && backBtn) {
            floatingBackBtn.addEventListener('click', () => backBtn.click());
        }
        const floatingForceUpdateBtn = document.getElementById('floatingForceUpdateBtn');
        if (floatingForceUpdateBtn && forceUpdateBtn) {
            floatingForceUpdateBtn.addEventListener('click', () => forceUpdateBtn.click());
        }

        // 创建底部浮动栏
        this.bottomBar = document.createElement('div');
        this.bottomBar.className = 'floating-bottom-bar';

        // 底部内容：章节信息 + 导航按钮
        let bottomContent = `<span class="chapter-info" id="floatingChapterInfo">${chapterInfo?.textContent || '1 / 1'}</span>`;
        bottomContent += '<div class="nav-buttons">';

        if (prevBtn) {
            bottomContent += `<button class="floating-btn-small" id="floatingPrevBtn" ${prevBtn.disabled ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> 上一章</button>`;
        }

        if (nextBtn) {
            bottomContent += `<button class="floating-btn-small" id="floatingNextBtn" ${nextBtn.disabled ? 'disabled' : ''}>下一章 <i class="fas fa-chevron-right"></i></button>`;
        }

        bottomContent += '</div>';
        this.bottomBar.innerHTML = bottomContent;
        document.body.appendChild(this.bottomBar);

        // 绑定底部浮动栏按钮事件
        const floatingPrevBtn = document.getElementById('floatingPrevBtn');
        if (floatingPrevBtn && prevBtn) {
            floatingPrevBtn.addEventListener('click', () => prevBtn.click());
        }
        const floatingNextBtn = document.getElementById('floatingNextBtn');
        if (floatingNextBtn && nextBtn) {
            floatingNextBtn.addEventListener('click', () => nextBtn.click());
        }

        // 添加body class以隐藏原有控件
        document.body.classList.add('reading-active');

        console.log('[FloatingControls] 浮动栏已创建');
    }

    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        // 图片点击事件 - 切换显示/隐藏
        this._addEventListener(document, 'click', (e) => {
            // 只响应图片区域的点击
            const imageArea = e.target.closest('.comic-images-container, .comic-pager-container, .comic-pager-viewport');
            if (imageArea && !e.target.closest('button, .floating-top-bar, .floating-bottom-bar')) {
                this.onImageClick();
            }
        });

        // 鼠标移入浮动栏时暂停自动隐藏
        this._addEventListener(this.topBar, 'mouseenter', () => {
            clearTimeout(this.hideTimer);
        });

        this._addEventListener(this.bottomBar, 'mouseenter', () => {
            clearTimeout(this.hideTimer);
        });

        // 鼠标移出浮动栏时重启自动隐藏计时器
        this._addEventListener(this.topBar, 'mouseleave', () => {
            this._resetHideTimer();
        });

        this._addEventListener(this.bottomBar, 'mouseleave', () => {
            this._resetHideTimer();
        });
    }

    /**
     * 添加事件监听（自动清理）
     */
    _addEventListener(target, event, handler) {
        target.addEventListener(event, handler);
        this._cleanupFns.push(() => target.removeEventListener(event, handler));
    }

    /**
     * 显示控件
     */
    show() {
        this.topBar?.classList.add('visible');
        this.bottomBar?.classList.add('visible');
        this.isVisible = true;
        this._resetHideTimer();
        console.log('[FloatingControls] 显示控件');
    }

    /**
     * 隐藏控件
     */
    hide() {
        this.topBar?.classList.remove('visible');
        this.bottomBar?.classList.remove('visible');
        this.isVisible = false;
        clearTimeout(this.hideTimer);
        console.log('[FloatingControls] 隐藏控件');
    }

    /**
     * 重置自动隐藏计时器
     * @private
     */
    _resetHideTimer() {
        clearTimeout(this.hideTimer);
        if (this.isVisible) {
            this.hideTimer = setTimeout(() => this.hide(), this.HIDE_DELAY);
        }
    }

    /**
     * 点击图片时切换显示/隐藏
     */
    onImageClick() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * 翻页/滚动时调用 - 隐藏控件
     */
    onAction() {
        this.hide();
    }

    /**
     * 更新底部信息
     */
    updateInfo(currentPage, totalPages) {
        const infoEl = this.bottomBar?.querySelector('.chapter-info');
        if (infoEl) {
            infoEl.textContent = `${currentPage} / ${totalPages}`;
        }
        // 同时更新浮动栏中的章节信息
        const floatingInfoEl = document.getElementById('floatingChapterInfo');
        if (floatingInfoEl) {
            floatingInfoEl.textContent = `${currentPage} / ${totalPages}`;
        }
    }

    /**
     * 同步导航按钮状态（从原始按钮同步到浮动按钮）
     */
    syncNavigationState() {
        const prevBtn = document.getElementById('prevChapterBtn');
        const nextBtn = document.getElementById('nextChapterBtn');
        const floatingPrevBtn = document.getElementById('floatingPrevBtn');
        const floatingNextBtn = document.getElementById('floatingNextBtn');
        const floatingChapterInfo = document.getElementById('floatingChapterInfo');
        const chapterInfo = document.getElementById('chapterInfo');

        if (floatingPrevBtn && prevBtn) {
            floatingPrevBtn.disabled = prevBtn.disabled;
        }
        if (floatingNextBtn && nextBtn) {
            floatingNextBtn.disabled = nextBtn.disabled;
        }
        if (floatingChapterInfo && chapterInfo) {
            floatingChapterInfo.textContent = chapterInfo.textContent;
        }
    }

    /**
     * 更新标题
     */
    updateTitle(title) {
        const titleEl = this.topBar?.querySelector('.comic-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    /**
     * 销毁控件
     */
    destroy() {
        this.topBar?.remove();
        this.bottomBar?.remove();
        document.body.classList.remove('reading-active');

        // 清理事件监听
        this._cleanupFns.forEach(fn => fn());
        this._cleanupFns = [];

        console.log('[FloatingControls] 销毁控件');
    }
}

// 导出到全局
window.DeviceDetector = DeviceDetector;
window.HeightCalculator = HeightCalculator;
window.ScrollbarController = ScrollbarController;
window.ImageLoader = ImageLoader;
window.ReadModeBase = ReadModeBase;
window.FloatingControls = FloatingControls;
