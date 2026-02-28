/**
 * 阅读页 JavaScript 模块
 *
 * 支持多种阅读模式：
 * - scroll: 下拉式（带间隔）
 * - scroll-seamless: 下拉式无缝（无间隔）
 * - page-flip: 翻页式（左右翻页）
 * - page-flip-multi: 翻页式多页（待实现）
 *
 * 功能：
 * 1. 显示等待下载的图片占位符
 * 2. 提交图片下载任务到高速桶
 * 3. 监听下载进度并自动更新图片
 * 4. 章节导航
 */

(function(window) {
    'use strict';

    /**
     * 阅读页核心类
     */
    class ReadPage {
        constructor(siteId) {
            this.siteId = siteId;
            this.comicAid = null;
            this.chapterPid = null;

            // 数据状态
            this.comicData = null;
            this.chapterData = null;
            this.allChapters = [];
            this.currentPageIndex = -1;
            this.imagesData = null;

            // 图片下载状态
            this.pendingImages = new Map(); // {page: {element, url, page}}
            this.downloadedImages = new Set(); // 已下载的页码

            // DOM元素引用
            this.elements = {};

            // 配置
            this.config = {
                waitingImageUrl: '/static/common/images/waiting-image.svg',
                pollInterval: 5000, // 5秒轮询间隔
                pollTimeout: 300000, // 5分钟轮询超时
                batchSize: 10, // 批量提交图片下载任务
                // 预加载配置
                initialPages: 20,        // 初始加载页数
                preloadWindow: 20,       // 每次预加载窗口大小
                triggerThreshold: 10,    // 距离边界多少页时触发新预加载
                // 下一章节预加载配置
                chapterPreloadDelay: 3000,  // 延迟3秒开始检查下一章节
                nextChapterPages: 20        // 预加载下一章节前20页
            };

            // 预加载状态管理
            this.submittedPages = new Set();      // 已提交下载的页码
            this.preloadedUpToPage = 0;           // 已预加载到的页码
            this.nextChapterPreloaded = false;     // 下一章节是否已预加载
            this.nextChapterDataReady = false;     // 下一章节数据是否就绪

            // 读取设置中的阅读模式
            this.readMode = this._getReadMode();

            // 新架构：核心模块（在 init 中初始化，因为需要DOM）
            this.imageLoader = null;
            this.heightCalculator = null;
            this.currentMode = null;
        }

        /**
         * 初始化
         *
         * 【重要】阅读页必须参数：
         * - site: 站点ID（如 "cm"）
         * - aid: 漫画ID（整数）
         * - pid: 章节ID（整数）
         *
         * 禁止使用默认值，缺少任何参数时应报错
         */
        init() {
            // 获取URL参数
            const urlParams = new URLSearchParams(window.location.search);
            this.comicAid = urlParams.get('aid');
            this.chapterPid = urlParams.get('pid');

            // 从URL参数读取阅读模式（如果有）
            const urlMode = urlParams.get('mode');
            if (urlMode) {
                this.readMode = urlMode;
                console.log('[阅读页] 从URL参数读取阅读模式:', urlMode);
            }

            // 【严格参数校验】所有参数必须存在且非空，缺一不可
            const missingParams = [];
            if (!this.siteId) missingParams.push('site');
            if (!this.comicAid) missingParams.push('aid');
            if (!this.chapterPid) missingParams.push('pid');

            if (missingParams.length > 0) {
                this.showError(`缺少必要参数: ${missingParams.join(', ')}<br>请提供完整URL参数：?site=cm&aid=xxx&pid=xxx`);
                return;
            }

            // 缓存DOM元素
            this._cacheElements();

            // 初始化核心模块（需要DOM元素）
            this._initCoreModules();

            // 绑定事件
            this._bindEvents();

            // 开始加载
            this._loadComicAndChapter();
        }

        /**
         * 初始化核心模块
         * @private
         */
        _initCoreModules() {
            // 初始化图片加载器
            this.imageLoader = new ImageLoader(this.config.waitingImageUrl);

            // 初始化高度计算器
            this.heightCalculator = new HeightCalculator();

            console.log('[ReadPage] 核心模块已初始化');
        }

        /**
         * 缓存DOM元素
         */
        _cacheElements() {
            this.elements = {
                waitingState: document.getElementById('waitingState'),
                waitingText: document.getElementById('waitingText'),
                waitingSubtext: document.getElementById('waitingSubtext'),
                comicViewerContent: document.getElementById('comicViewerContent'),
                viewerTitle: document.getElementById('viewerTitle'),
                chapterTitle: document.getElementById('chapterTitle'),
                comicImagesContainer: document.getElementById('comicImagesContainer'),
                forceUpdateBtn: document.getElementById('forceUpdateBtn'),
                backBtn: document.getElementById('backBtn'),
                prevChapterBtn: document.getElementById('prevChapterBtn'),
                nextChapterBtn: document.getElementById('nextChapterBtn'),
                chapterInfo: document.getElementById('chapterInfo'),
                // 阅读模式切换器相关元素
                modeSwitcherBtn: document.getElementById('modeSwitcherBtn'),
                modeSwitcherModal: document.getElementById('modeSwitcherModal'),
                modeSwitcherOverlay: document.getElementById('modeSwitcherOverlay'),
                closeModalBtn: document.getElementById('closeModalBtn')
            };
        }

        /**
         * 绑定事件
         */
        _bindEvents() {
            // 返回按钮
            this.elements.backBtn.addEventListener('click', () => {
                window.location.href = `/info.html?site=${this.siteId}&aid=${this.comicAid}`;
            });

            // 强制更新按钮
            this.elements.forceUpdateBtn.addEventListener('click', () => {
                this._forceUpdate();
            });

            // 阅读模式切换器事件
            this._initModeSwitcher();

            // 窗口resize事件 - 调整翻页模式高度
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this._adjustPageFlipHeight();
                }, 100);
            });

            // 初始化body上的模式类，确保CSS样式正确应用
            this._updateBodyModeClass();
        }

        /**
         * 更新body上的模式类
         */
        _updateBodyModeClass() {
            document.body.classList.remove('page-flip-mode', 'page-flip-multi-mode', 'page-flip-double-mode', 'scroll-mode', 'scroll-seamless-mode');
            if (this.readMode === 'page-flip') {
                document.body.classList.add('page-flip-mode');
            } else if (this.readMode === 'page-flip-multi' || this.readMode === 'page-flip-double') {
                // page-flip-double 和 page-flip 共用 page-flip-mode 类
                document.body.classList.add('page-flip-mode');
            } else if (this.readMode === 'scroll') {
                document.body.classList.add('scroll-mode');
            } else if (this.readMode === 'scroll-seamless') {
                document.body.classList.add('scroll-seamless-mode');
            }
        }

        /**
         * 初始化阅读模式切换器
         */
        _initModeSwitcher() {
            if (!this.elements.modeSwitcherBtn) return;

            // 切换按钮点击
            this.elements.modeSwitcherBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._toggleModeSwitcherModal();
            });

            // 遮罩层点击关闭
            if (this.elements.modeSwitcherOverlay) {
                this.elements.modeSwitcherOverlay.addEventListener('click', () => {
                    this._closeModeSwitcherModal();
                });
            }

            // 关闭按钮
            if (this.elements.closeModalBtn) {
                this.elements.closeModalBtn.addEventListener('click', () => {
                    this._closeModeSwitcherModal();
                });
            }

            // 模式选项按钮
            const modeOptions = document.querySelectorAll('.mode-option-btn');
            modeOptions.forEach(btn => {
                btn.addEventListener('click', () => {
                    const newMode = btn.dataset.mode;
                    this._switchReadMode(newMode);
                });
            });

            // 初始化当前模式高亮
            this._updateModeSwitcherUI();
        }

        /**
         * 切换模式切换器弹窗显示/隐藏
         */
        _toggleModeSwitcherModal() {
            const modal = this.elements.modeSwitcherModal;
            const overlay = this.elements.modeSwitcherOverlay;

            if (modal && overlay) {
                const isActive = modal.classList.contains('active');
                if (isActive) {
                    this._closeModeSwitcherModal();
                } else {
                    modal.classList.add('active');
                    overlay.classList.add('active');
                }
            }
        }

        /**
         * 关闭模式切换器弹窗
         */
        _closeModeSwitcherModal() {
            const modal = this.elements.modeSwitcherModal;
            const overlay = this.elements.modeSwitcherOverlay;

            if (modal && overlay) {
                modal.classList.remove('active');
                overlay.classList.remove('active');
            }
        }

        /**
         * 切换阅读模式
         */
        _switchReadMode(newMode) {
            if (newMode === this.readMode) {
                this._closeModeSwitcherModal();
                return;
            }

            // 保存新模式到 localStorage
            try {
                const saved = localStorage.getItem('user_settings');
                const settings = saved ? JSON.parse(saved) : {};
                settings.readMode = newMode;
                localStorage.setItem('user_settings', JSON.stringify(settings));
            } catch (error) {
                console.error('[阅读页] 保存设置失败:', error);
            }

            // 更新当前模式
            this.readMode = newMode;

            // 更新body上的模式类，用于CSS样式控制
            this._updateBodyModeClass();

            // 【重要】清空已下载集合，让图片重新加载
            // 因为显示模式会改变DOM结构，需要重新更新图片元素
            this.downloadedImages.clear();

            // 更新UI高亮
            this._updateModeSwitcherUI();

            // 关闭弹窗
            this._closeModeSwitcherModal();

            // 重新显示内容（如果有图片数据）
            if (this.imagesData) {
                this._displayImagesWithPlaceholders(this.imagesData);
            }

            console.log('[阅读页] 已切换到阅读模式:', newMode);
        }

        /**
         * 更新模式切换器UI高亮
         */
        _updateModeSwitcherUI() {
            const modeOptions = document.querySelectorAll('.mode-option-btn');
            modeOptions.forEach(btn => {
                if (btn.dataset.mode === this.readMode) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        /**
         * 获取当前阅读模式
         */
        _getReadMode() {
            try {
                const saved = localStorage.getItem('user_settings');
                if (saved) {
                    const settings = JSON.parse(saved);
                    return settings.readMode || 'scroll';
                }
            } catch (error) {
                console.error('[阅读页] 读取设置失败:', error);
            }
            return 'scroll'; // 默认下拉式
        }

        /**
         * 加载漫画和章节
         */
        async _loadComicAndChapter() {
            try {
                await this._checkAndLoadChapter();
            } catch (error) {
                console.error('[阅读页] 加载失败:', error);
                this.showError('加载失败，请稍后重试');
            }
        }

        /**
         * 检查并加载章节
         */
        async _checkAndLoadChapter() {
            try {
                // 检查章节列表是否存在
                const infoResponse = await fetch(
                    `/api/${this.siteId}/resource/check?resource_type=comic_info&comic_id=${this.comicAid}`
                );
                const infoResult = await infoResponse.json();

                if (infoResult.success && infoResult.status === 'exists') {
                    this.comicData = infoResult.data;
                    this.allChapters = this.comicData.chapters || [];

                    // 检查 info_update 是否为空
                    if (!this.comicData.info_update || this.comicData.info_update === null) {
                        console.log('[阅读页] 检测到 info_update 为空，自动提交详情页爬取任务');
                        await this._submitCrawlTask('comic_info', this.comicAid, '正在获取漫画信息...');
                        return;
                    }

                    // 查找当前章节
                    const currentChapter = this.allChapters.find(
                        ch => String(ch.id) === String(this.chapterPid)
                    );
                    if (currentChapter) {
                        this.chapterData = currentChapter;
                    }

                    // 检查章节图片是否存在
                    await this._checkAndLoadImages();
                } else {
                    // 详情页数据不存在，先爬取详情页
                    await this._submitCrawlTask('comic_info', this.comicAid, '正在获取漫画信息...');
                }

            } catch (error) {
                console.error('[阅读页] 检查失败:', error);
                this._submitCrawlTask('comic_info', this.comicAid, '正在获取漫画信息...');
            }
        }

        /**
         * 检查并加载图片
         */
        async _checkAndLoadImages() {
            try {
                // 检查章节图片
                const imagesResponse = await fetch(
                    `/api/${this.siteId}/resource/check?resource_type=content_images&comic_id=${this.comicAid}&chapter_id=${this.chapterPid}`
                );
                const imagesResult = await imagesResponse.json();

                if (imagesResult.success && ['exists', 'pending', 'partial'].includes(imagesResult.status)) {
                    // 图片数据存在，显示内容
                    this._displayContent(imagesResult.data);
                } else {
                    // 图片不存在，爬取章节内容
                    await this._submitCrawlTask('content_page', this.comicAid, '正在获取章节内容...', {
                        chapter_id: this.chapterPid
                    });
                }

            } catch (error) {
                console.error('[阅读页] 检查图片失败:', error);
                this._submitCrawlTask('content_page', this.comicAid, '正在获取章节内容...', {
                    chapter_id: this.chapterPid
                });
            }
        }

        /**
         * 显示内容
         */
        _displayContent(imagesData) {
            this.imagesData = imagesData;
            this._hideWaitingState();

            // 设置标题（漫画名称 - 章节名称）
            if (this.comicData) {
                const comicTitle = this.comicData.title || '未知标题';
                const chapterTitle = this.chapterData ? (this.chapterData.title || `第${this.chapterPid}话`) : '';
                // 页面标题显示为：漫画名称 - 章节名称
                this.elements.viewerTitle.textContent = chapterTitle ? `${comicTitle} - ${chapterTitle}` : comicTitle;
                this._updateChapterNavigation();
            }

            if (this.chapterData) {
                this.elements.chapterTitle.textContent = this.chapterData.title || `第${this.chapterPid}话`;
            }

            // 显示图片（带占位符）
            this._displayImagesWithPlaceholders(imagesData);
        }

        /**
         * 显示图片（带占位符和自动下载）
         * 根据阅读模式路由到不同的显示方法
         */
        _displayImagesWithPlaceholders(imagesData) {
            const images = imagesData.images || [];

            if (images.length === 0) {
                this._showNoImagesMessage();
                return;
            }

            // 使用新的模式架构
            this._renderWithNewArchitecture(images);

            // 启动智能预加载系统
            this._startSmartPreload();

            // 延迟检查下一章节
            setTimeout(() => {
                this._preloadNextChapter();
            }, this.config.chapterPreloadDelay);
        }

        /**
         * 使用新架构渲染模式
         * @private
         */
        _renderWithNewArchitecture(images) {
            // 销毁当前模式
            if (this.currentMode) {
                this.currentMode.destroy();
                this.currentMode = null;
            }

            // 根据阅读模式创建对应的模式实例
            const container = this.elements.comicImagesContainer;

            switch (this.readMode) {
                case 'scroll':
                    this.currentMode = new ScrollMode(container, this.imageLoader, this.heightCalculator);
                    break;
                case 'scroll-seamless':
                    this.currentMode = new ScrollSeamlessMode(container, this.imageLoader, this.heightCalculator);
                    break;
                case 'page-flip':
                    this.currentMode = new PageFlipMode(container, this.imageLoader, this.heightCalculator);
                    break;
                case 'page-flip-multi':
                case 'page-flip-double':
                    this.currentMode = new PageFlipDoubleMode(container, this.imageLoader, this.heightCalculator);
                    break;
                default:
                    this.currentMode = new ScrollMode(container, this.imageLoader, this.heightCalculator);
                    break;
            }

            // 渲染模式
            this.currentMode.render(images);

            console.log('[ReadPage] 使用新架构渲染模式:', this.readMode);
        }

        /**
         * 显示无图片消息
         */
        _showNoImagesMessage() {
            const container = this.elements.comicImagesContainer;
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-image" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p>暂无图片</p>
                </div>
            `;
        }

        /**
         * 显示多页模式未支持消息
         */
        _showMultiPageNotSupported() {
            const container = this.elements.comicImagesContainer;
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-tools" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p>翻页式多页模式开发中...</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">请前往设置选择其他阅读模式</p>
                </div>
            `;
        }

        /**
         * 下拉式显示模式（带间隔）
         */
        _displayScrollMode(images) {
            const container = this.elements.comicImagesContainer;
            container.innerHTML = '';
            container.className = 'comic-images-container scroll-mode';

            images.forEach((image, index) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'comic-image-container';
                imgContainer.dataset.page = image.page;

                const img = document.createElement('img');
                img.alt = `第${index + 1}页`;
                img.className = 'comic-image';
                img.loading = 'lazy';
                img.dataset.page = image.page;
                img.dataset.status = 'loading';

                // 先设置等待图片
                img.src = this.config.waitingImageUrl;

                // 页码指示器
                const pageBadge = document.createElement('div');
                pageBadge.className = 'page-indicator-badge';
                pageBadge.textContent = `${index + 1}/${images.length}`;
                pageBadge.dataset.page = image.page;

                imgContainer.appendChild(img);
                imgContainer.appendChild(pageBadge);
                container.appendChild(imgContainer);

                // 记录待下载的图片
                if (image.url) {
                    const imageData = {
                        element: img,
                        url: image.url,
                        page: image.page
                    };
                    this.pendingImages.set(image.page, imageData);

                    // 检查是否是已下载的本地URL
                    const isLocalUrl = image.url.includes('/api/media/image?');
                    if (isLocalUrl) {
                        // 已下载，直接更新显示（由_updateImage负责添加到downloadedImages）
                        this._updateImage(image.page, image.url);
                    }
                }
            });
        }

        /**
         * 下拉式无缝显示模式（无间隔）
         */
        _displayScrollSeamlessMode(images) {
            const container = this.elements.comicImagesContainer;
            container.innerHTML = '';
            container.className = 'comic-images-container scroll-seamless-mode';

            images.forEach((image, index) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'comic-image-container seamless';
                imgContainer.dataset.page = image.page;

                const img = document.createElement('img');
                img.alt = `第${index + 1}页`;
                img.className = 'comic-image';
                img.loading = 'lazy';
                img.dataset.page = image.page;
                img.dataset.status = 'loading';

                // 先设置等待图片
                img.src = this.config.waitingImageUrl;

                // 页码指示器（半透明，不干扰阅读）
                const pageBadge = document.createElement('div');
                pageBadge.className = 'page-indicator-badge seamless';
                pageBadge.textContent = `${index + 1}`;
                pageBadge.dataset.page = image.page;

                imgContainer.appendChild(img);
                imgContainer.appendChild(pageBadge);
                container.appendChild(imgContainer);

                // 记录待下载的图片
                if (image.url) {
                    const imageData = {
                        element: img,
                        url: image.url,
                        page: image.page
                    };
                    this.pendingImages.set(image.page, imageData);

                    // 检查是否是已下载的本地URL
                    const isLocalUrl = image.url.includes('/api/media/image?');
                    if (isLocalUrl) {
                        // 已下载，直接更新显示（由_updateImage负责添加到downloadedImages）
                        this._updateImage(image.page, image.url);
                    }
                }
            });
        }

        /**
         * 翻页式显示模式
         */
        _displayPageFlipMode(images) {
            const container = this.elements.comicImagesContainer;
            container.innerHTML = '';
            container.className = 'comic-images-container page-flip-mode';

            // 创建翻页容器
            const flipContainer = document.createElement('div');
            flipContainer.className = 'comic-pager-container';

            // 创建视口
            const viewport = document.createElement('div');
            viewport.className = 'comic-pager-viewport';

            // 创建滑动器
            const slider = document.createElement('div');
            slider.className = 'comic-pager-slider';

            // 添加每个图片页
            images.forEach((image, index) => {
                const pageSection = document.createElement('div');
                pageSection.className = 'pager-section';
                pageSection.dataset.page = image.page;

                const img = document.createElement('img');
                img.alt = `第${index + 1}页`;
                img.className = 'comic-image';
                img.dataset.page = image.page;
                img.dataset.status = 'loading';
                img.loading = index < 2 ? 'eager' : 'lazy'; // 预加载前两页

                // 先设置等待图片
                img.src = this.config.waitingImageUrl;

                pageSection.appendChild(img);
                slider.appendChild(pageSection);

                // 记录待下载的图片
                if (image.url) {
                    const imageData = {
                        element: img,
                        url: image.url,
                        page: image.page
                    };
                    this.pendingImages.set(image.page, imageData);

                    // 检查是否是已下载的本地URL
                    const isLocalUrl = image.url.includes('/api/media/image?');
                    if (isLocalUrl) {
                        // 已下载，直接更新显示（由_updateImage负责添加到downloadedImages）
                        this._updateImage(image.page, image.url);
                    }
                }
            });

            viewport.appendChild(slider);
            flipContainer.appendChild(viewport);

            // 添加控制按钮
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pager-btn prev-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.disabled = true;

            const nextBtn = document.createElement('button');
            nextBtn.className = 'pager-btn next-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

            // 添加页码指示器
            const indicator = document.createElement('div');
            indicator.className = 'pager-indicator';
            indicator.innerHTML = '<span class="current-page">1</span> / <span class="total-pages">' + images.length + '</span>';

            flipContainer.appendChild(prevBtn);
            flipContainer.appendChild(nextBtn);
            flipContainer.appendChild(indicator);
            container.appendChild(flipContainer);

            // 调整翻页容器高度 - 多次调用确保在不同时机都能正确计算
            // 立即调用一次
            this._adjustPageFlipHeight();
            // DOM更新后调用
            requestAnimationFrame(() => this._adjustPageFlipHeight());
            // 延迟调用，确保布局完成
            setTimeout(() => this._adjustPageFlipHeight(), 50);
            setTimeout(() => this._adjustPageFlipHeight(), 200);

            // 初始化翻页功能
            this._initPageFlipControls(flipContainer, slider, images.length);
        }

        /**
         * 初始化翻页控制
         */
        _initPageFlipControls(container, slider, totalPages) {
            let currentPage = 0;
            const prevBtn = container.querySelector('.prev-btn');
            const nextBtn = container.querySelector('.next-btn');
            const currentPageEl = container.querySelector('.current-page');

            const updateSlider = () => {
                const viewportWidth = container.querySelector('.comic-pager-viewport').offsetWidth;
                slider.style.transform = `translateX(-${currentPage * viewportWidth}px)`;
                currentPageEl.textContent = currentPage + 1;
                prevBtn.disabled = currentPage === 0;
                nextBtn.disabled = currentPage === totalPages - 1;
            };

            prevBtn.addEventListener('click', () => {
                if (currentPage > 0) {
                    currentPage--;
                    updateSlider();
                }
            });

            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages - 1) {
                    currentPage++;
                    updateSlider();
                }
            });

            // 键盘导航
            const handleKeydown = (e) => {
                if (e.key === 'ArrowLeft' && currentPage > 0) {
                    currentPage--;
                    updateSlider();
                } else if (e.key === 'ArrowRight' && currentPage < totalPages - 1) {
                    currentPage++;
                    updateSlider();
                }
            };

            document.addEventListener('keydown', handleKeydown);

            // 触摸滑动支持
            let touchStartX = 0;
            let touchEndX = 0;

            container.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, false);

            container.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (diff > 50 && currentPage < totalPages - 1) {
                    currentPage++;
                    updateSlider();
                } else if (diff < -50 && currentPage > 0) {
                    currentPage--;
                    updateSlider();
                }
            }, false);

            // 窗口大小改变时更新滑块位置
            window.addEventListener('resize', updateSlider);

            // 初始化
            setTimeout(updateSlider, 100);

            // 保存清理函数
            this._cleanupPageFlip = () => {
                document.removeEventListener('keydown', handleKeydown);
            };
        }

        /**
         * 翻页式多页显示模式（自动双页）
         * 当满足条件时（横屏窗口 + 两张竖图），自动并排显示两张图片
         */
        _displayPageFlipMultiMode(images) {
            const container = this.elements.comicImagesContainer;
            container.innerHTML = '';
            container.className = 'comic-images-container page-flip-mode';

            // 创建翻页容器
            const flipContainer = document.createElement('div');
            flipContainer.className = 'comic-pager-container';

            // 创建视口
            const viewport = document.createElement('div');
            viewport.className = 'comic-pager-viewport';

            // 创建滑动器
            const slider = document.createElement('div');
            slider.className = 'comic-pager-slider';

            // 存储section信息用于后续动态调整
            this.pageSections = [];

            // 添加每个图片页（可能是单页或双页）
            let i = 0;
            while (i < images.length) {
                const currentImage = images[i];
                const nextImage = images[i + 1];

                const pageSection = document.createElement('div');
                pageSection.className = 'pager-section';
                pageSection.dataset.index = this.pageSections.length;

                // 当前图片
                const img1 = this._createPageImage(currentImage, i, 0);
                pageSection.appendChild(img1);

                // 检查是否可以双页显示（暂存信息，图片加载后判断）
                let canDoublePage = false;
                if (nextImage) {
                    const img2 = this._createPageImage(nextImage, i + 1, 1);
                    pageSection.appendChild(img2);
                    pageSection.dataset.pages = `${currentImage.page},${nextImage.page}`;

                    // 记录待下载的图片
                    if (nextImage.url) {
                        const imageData = {
                            element: img2,
                            url: nextImage.url,
                            page: nextImage.page
                        };
                        this.pendingImages.set(nextImage.page, imageData);

                        // 检查是否是已下载的本地URL
                        const isLocalUrl = nextImage.url.includes('/api/media/image?');
                        if (isLocalUrl) {
                            // 已下载，直接更新显示（由_updateImage负责添加到downloadedImages）
                            this._updateImage(nextImage.page, nextImage.url);
                        }
                    }
                } else {
                    pageSection.dataset.page = currentImage.page;
                }

                this.pageSections.push({
                    section: pageSection,
                    img1: img1,
                    img2: pageSection.querySelector('img[data-index="1"]'),
                    hasTwoImages: !!nextImage
                });

                slider.appendChild(pageSection);

                // 记录待下载的图片
                if (currentImage.url) {
                    const imageData = {
                        element: img1,
                        url: currentImage.url,
                        page: currentImage.page
                    };
                    this.pendingImages.set(currentImage.page, imageData);

                    // 检查是否是已下载的本地URL
                    const isLocalUrl = currentImage.url.includes('/api/media/image?');
                    if (isLocalUrl) {
                        // 已下载，直接更新显示（由_updateImage负责添加到downloadedImages）
                        this._updateImage(currentImage.page, currentImage.url);
                    }
                }

                i += nextImage ? 2 : 1;
            }

            viewport.appendChild(slider);
            flipContainer.appendChild(viewport);

            // 添加控制按钮
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pager-btn prev-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.disabled = true;

            const nextBtn = document.createElement('button');
            nextBtn.className = 'pager-btn next-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

            // 添加页码指示器
            const indicator = document.createElement('div');
            indicator.className = 'pager-indicator';
            indicator.innerHTML = '<span class="current-page">1</span> / <span class="total-sections">' + this.pageSections.length + '</span>';

            flipContainer.appendChild(prevBtn);
            flipContainer.appendChild(nextBtn);
            flipContainer.appendChild(indicator);
            container.appendChild(flipContainer);

            // 调整翻页容器高度 - 多次调用确保在不同时机都能正确计算
            // 立即调用一次
            this._adjustPageFlipHeight();
            // DOM更新后调用
            requestAnimationFrame(() => this._adjustPageFlipHeight());
            // 延迟调用，确保布局完成
            setTimeout(() => this._adjustPageFlipHeight(), 50);
            setTimeout(() => this._adjustPageFlipHeight(), 200);

            // 初始化翻页功能和双页检测
            this._initPageFlipMultiControls(flipContainer, slider, images.length);
        }

        /**
         * 创建翻页模式的图片元素
         */
        _createPageImage(image, index, imageIndex) {
            const img = document.createElement('img');
            img.alt = `第${index + 1}页`;
            img.className = 'comic-image';
            img.dataset.page = image.page;
            img.dataset.status = 'loading';
            img.dataset.index = imageIndex; // 0 表示第一张，1 表示第二张
            img.loading = index < 2 ? 'eager' : 'lazy';

            // 先设置等待图片
            img.src = this.config.waitingImageUrl;

            // 图片加载完成后检测双页显示
            img.addEventListener('load', () => {
                img.dataset.status = 'loaded';
                img.dataset.naturalWidth = img.naturalWidth;
                img.dataset.naturalHeight = img.naturalHeight;

                // 当section中的所有图片都加载完成时，检查是否可以双页显示
                this._checkAndUpdateDoublePageDisplay(img.closest('.pager-section'));
            });

            img.addEventListener('error', () => {
                img.dataset.status = 'error';
            });

            return img;
        }

        /**
         * 检查并更新双页显示
         * 判断条件：
         * 1. 窗口横屏（宽 > 高）
         * 2. 两张图片都是竖图（高 > 宽）
         * 3. 两张图并排能放入容器中
         */
        _checkAndUpdateDoublePageDisplay(section) {
            if (!section) return;

            const img1 = section.querySelector('img[data-index="0"]');
            const img2 = section.querySelector('img[data-index="1"]');

            // 没有第二张图，不能双页显示
            if (!img2) {
                section.classList.remove('double-page-active');
                return;
            }

            // 检查图片是否都已加载
            if (img1.dataset.status !== 'loaded' || img2.dataset.status !== 'loaded') {
                return; // 等待两张图都加载完成
            }

            // 获取图片原始尺寸
            const pic1_width = parseInt(img1.dataset.naturalWidth) || img1.naturalWidth;
            const pic1_height = parseInt(img1.dataset.naturalHeight) || img1.naturalHeight;
            const pic2_width = parseInt(img2.dataset.naturalWidth) || img2.naturalWidth;
            const pic2_height = parseInt(img2.dataset.naturalHeight) || img2.naturalHeight;

            // 获取容器尺寸
            const container = section.closest('.comic-pager-viewport');
            if (!container) return;

            const div_width = container.offsetWidth;
            const div_height = container.offsetHeight;

            // 间隙大小（与CSS中的gap一致）
            const gap = 10;

            // 判断条件：横屏且两张都是竖图
            const isLandscapeWindow = div_width > div_height;
            const bothPortrait = pic1_height > pic1_width && pic2_height > pic2_width;

            // 计算两张图片在保持比例、限制最大高度情况下的实际宽度
            // 使用容器的95%高度作为最大高度，留出一点边距
            const max_height = div_height * 0.95;

            // 计算第一张图的缩放后宽度
            let img1_scaled_width, img1_scaled_height;
            if (pic1_height > max_height) {
                // 需要缩放：按高度缩放
                img1_scaled_height = max_height;
                img1_scaled_width = pic1_width * (max_height / pic1_height);
            } else {
                // 不需要缩放
                img1_scaled_width = pic1_width;
                img1_scaled_height = pic1_height;
            }

            // 计算第二张图的缩放后宽度
            let img2_scaled_width, img2_scaled_height;
            if (pic2_height > max_height) {
                img2_scaled_height = max_height;
                img2_scaled_width = pic2_width * (max_height / pic2_height);
            } else {
                img2_scaled_width = pic2_width;
                img2_scaled_height = pic2_height;
            }

            // 检查两张图并排（含间隙）是否能放入容器宽度
            const total_width = img1_scaled_width + img2_scaled_width + gap;
            const canFitTwoImages = total_width <= div_width;

            // 只有在横屏、两张都是竖图、且能并排放下时才启用双页显示
            if (isLandscapeWindow && bothPortrait && canFitTwoImages) {
                section.classList.add('double-page-active');
            } else {
                section.classList.remove('double-page-active');
            }

            // 更新页码显示
            this._updatePageIndicatorForSection(section);
        }

        /**
         * 更新section的页码显示
         */
        _updatePageIndicatorForSection(section) {
            const indicator = section.closest('.comic-pager-container')?.querySelector('.pager-indicator');
            if (!indicator) return;

            const currentPageEl = indicator.querySelector('.current-page');
            const pages = section.dataset.pages;

            if (section.classList.contains('double-page-active') && pages) {
                // 双页显示，显示 "1-2"
                const [page1, page2] = pages.split(',');
                currentPageEl.textContent = `${page1}-${page2}`;
            } else {
                // 单页显示
                const page = section.dataset.page || (pages ? pages.split(',')[0] : '1');
                currentPageEl.textContent = page;
            }
        }

        /**
         * 初始化翻页式多页控制
         */
        _initPageFlipMultiControls(container, slider, totalImages) {
            let currentSection = 0;
            const totalSections = this.pageSections.length;

            const prevBtn = container.querySelector('.prev-btn');
            const nextBtn = container.querySelector('.next-btn');
            const currentPageEl = container.querySelector('.current-page');
            const totalSectionsEl = container.querySelector('.total-sections');

            // 更新总页数显示
            if (totalSectionsEl) {
                totalSectionsEl.textContent = totalSections;
            }

            const updateSlider = () => {
                const viewportWidth = container.querySelector('.comic-pager-viewport').offsetWidth;
                slider.style.transform = `translateX(-${currentSection * viewportWidth}px)`;

                // 更新当前页码
                const section = this.pageSections[currentSection];
                if (section) {
                    this._updatePageIndicatorForSection(section.section);
                }

                prevBtn.disabled = currentSection === 0;
                nextBtn.disabled = currentSection === totalSections - 1;
            };

            prevBtn.addEventListener('click', () => {
                if (currentSection > 0) {
                    currentSection--;
                    updateSlider();
                }
            });

            nextBtn.addEventListener('click', () => {
                if (currentSection < totalSections - 1) {
                    currentSection++;
                    updateSlider();
                }
            });

            // 键盘导航
            const handleKeydown = (e) => {
                if (e.key === 'ArrowLeft' && currentSection > 0) {
                    currentSection--;
                    updateSlider();
                } else if (e.key === 'ArrowRight' && currentSection < totalSections - 1) {
                    currentSection++;
                    updateSlider();
                }
            };

            document.addEventListener('keydown', handleKeydown);

            // 触摸滑动支持
            let touchStartX = 0;
            let touchEndX = 0;

            container.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, false);

            container.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const diff = touchStartX - touchEndX;
                if (diff > 50 && currentSection < totalSections - 1) {
                    currentSection++;
                    updateSlider();
                } else if (diff < -50 && currentSection > 0) {
                    currentSection--;
                    updateSlider();
                }
            }, false);

            // 窗口大小改变时重新计算双页显示
            const debouncedResize = this._debounce(() => {
                // 重新检查所有section的双页显示状态
                this.pageSections.forEach(sectionInfo => {
                    this._checkAndUpdateDoublePageDisplay(sectionInfo.section);
                });
                updateSlider();
            }, 300);

            window.addEventListener('resize', debouncedResize);

            // 初始化
            setTimeout(updateSlider, 100);

            // 保存清理函数
            this._cleanupPageFlip = () => {
                document.removeEventListener('keydown', handleKeydown);
                window.removeEventListener('resize', debouncedResize);
            };
        }

        /**
         * 防抖函数
         */
        _debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // ==================== 智能预加载系统 ====================

        /**
         * 启动智能预加载系统
         * 所有阅读模式使用统一的预加载逻辑
         */
        _startSmartPreload() {
            console.log('[阅读页] 启动智能预加载系统');

            // 预加载配置
            this.preloadConfig = {
                minPendingImages: 5,      // 待加载图片的最小阈值，低于此值时继续预加载
                preloadBatchSize: 10,     // 每次预加载的图片数量
                checkInterval: 2000,      // 检查间隔（毫秒）
                maxPreloadAhead: 50,      // 最大预加载提前量（提前多少页）
            };

            // 预加载状态
            this.preloadState = {
                nextPreloadPage: 1,       // 下一个要预加载的页码
                totalPages: this.imagesData?.images?.length || 0,
                isLoading: false,         // 是否正在加载
                allLoaded: false,         // 是否全部加载完成
            };

            // 订阅WebSocket通知
            this._subscribeImageDownloadNotifications();

            // 启动轮询备用方案
            this._startImageDownloadPolling();

            // 启动智能预加载管理器（统一的，不区分阅读模式）
            this._startPreloadManager();
        }

        /**
         * 启动智能预加载管理器
         * 基于待加载图片数量自动管理预加载，适用于所有阅读模式
         */
        _startPreloadManager() {
            console.log('[阅读页] 启动预加载管理器');

            // 立即开始第一批预加载
            this._preloadNextBatch();

            // 定时检查并预加载
            this.preloadManagerTimer = setInterval(() => {
                this._checkAndPreload();
            }, this.preloadConfig.checkInterval);
        }

        /**
         * 检查并预加载
         * 当待加载图片数量低于阈值时，继续预加载
         */
        _checkAndPreload() {
            if (this.preloadState.allLoaded || this.preloadState.isLoading) {
                return;
            }

            // 计算当前待加载的图片数量
            const pendingCount = this._getPendingImageCount();

            // 如果待加载数量低于阈值，继续预加载
            if (pendingCount < this.preloadConfig.minPendingImages) {
                console.log(`[阅读页] 待加载数量(${pendingCount})低于阈值(${this.preloadConfig.minPendingImages})，继续预加载`);
                this._preloadNextBatch();
            }
        }

        /**
         * 获取当前待加载的图片数量
         */
        _getPendingImageCount() {
            let pendingCount = 0;
            this.submittedPages.forEach(page => {
                if (!this.imageLoader.downloadedImages.has(page)) {
                    pendingCount++;
                }
            });
            return pendingCount;
        }

        /**
         * 预加载下一批图片
         * 统一的预加载逻辑，适用于所有阅读模式
         */
        async _preloadNextBatch() {
            if (this.preloadState.isLoading || this.preloadState.allLoaded) {
                return;
            }

            if (!this.imagesData || !this.imagesData.images) {
                return;
            }

            this.preloadState.isLoading = true;

            const images = this.imagesData.images;
            const totalPages = images.length;
            const batchSize = this.preloadConfig.preloadBatchSize;

            // 找到需要预加载的页面（从 nextPreloadPage 开始）
            const pagesToLoad = [];
            for (let page = this.preloadState.nextPreloadPage; page <= totalPages; page++) {
                if (pagesToLoad.length >= batchSize) break;
                if (this.submittedPages.has(page)) {
                    // 跳过已提交的页面，但更新 nextPreloadPage
                    this.preloadState.nextPreloadPage = page + 1;
                    continue;
                }

                const imageData = images.find(img => img.page === page);
                if (imageData) {
                    pagesToLoad.push({ page, imageData });
                    this.submittedPages.add(page);
                }
            }

            // 更新下一个预加载页码
            if (pagesToLoad.length > 0) {
                this.preloadState.nextPreloadPage = pagesToLoad[pagesToLoad.length - 1].page + 1;
            }

            if (pagesToLoad.length === 0) {
                if (this.preloadState.nextPreloadPage > totalPages) {
                    this.preloadState.allLoaded = true;
                    console.log('[阅读页] 所有图片已提交加载');
                }
                this.preloadState.isLoading = false;
                return;
            }

            console.log(`[阅读页] 预加载: 第${pagesToLoad[0].page}-${pagesToLoad[pagesToLoad.length-1].page}页`);

            // 处理每一页
            const pagesToDownload = [];
            for (const { page, imageData } of pagesToLoad) {
                const isServerReady = imageData.downloaded === true;
                const isBrowserLoaded = this.imageLoader.downloadedImages.has(page);

                if (isServerReady) {
                    // 服务器有图片，直接更新显示
                    if (!isBrowserLoaded) {
                        this._updateImage(page, imageData.url);
                    }
                } else if (!isBrowserLoaded) {
                    // 需要下载
                    pagesToDownload.push(page);

                    // 添加到 pendingImages
                    this.imageLoader.pendingImages.set(page, {
                        element: null,
                        url: imageData.url,
                        page: page
                    });

                    // 订阅 WebSocket 通知
                    if (window.WSClient) {
                        const imageResourceKey = `content:${this.comicAid}:${this.chapterPid}:${page}`;
                        window.WSClient.subscribeResource('content_image', imageResourceKey, (url) => {
                            console.log(`[阅读页] 第${page}页下载完成:`, url);
                            this.imageLoader.downloadedImages.set(page, url);
                            this.imageLoader.pendingImages.delete(page);
                            this._updateImage(page, url);
                        });
                    }
                }
            }

            // 批量提交下载任务
            if (pagesToDownload.length > 0) {
                await this._submitBatchImageDownloadTasks(pagesToDownload);
                console.log(`[阅读页] 已提交 ${pagesToDownload.length} 张图片下载任务`);
            }

            this.preloadState.isLoading = false;

            // 检查是否全部加载完成
            if (this.preloadState.nextPreloadPage > totalPages) {
                this.preloadState.allLoaded = true;
                console.log('[阅读页] 所有图片已提交加载');
            }
        }

        /**
         * 兼容旧方法：预加载指定范围的图片
         */
        async _preloadImageRange(startPage, count) {
            // 更新预加载状态并触发检查
            this.preloadState.nextPreloadPage = Math.max(
                this.preloadState.nextPreloadPage,
                startPage
            );
            this._checkAndPreload();
        }

        /**
         * 预加载下一章节
         */
        async _preloadNextChapter() {
            if (this.nextChapterPreloaded) {
                return;
            }

            // 检查是否有下一章节
            const currentIndex = this.allChapters.findIndex(ch => ch.id == this.chapterPid);
            if (currentIndex === -1 || currentIndex >= this.allChapters.length - 1) {
                console.log('[阅读页] 没有下一章节');
                return;
            }

            const nextChapter = this.allChapters[currentIndex + 1];
            console.log(`[阅读页] 检查下一章节: ${nextChapter.id} - ${nextChapter.title}`);

            // 检查下一章节数据是否存在
            try {
                const response = await fetch(`/api/${this.siteId}/resource/check?resource_type=content_images&comic_id=${this.comicAid}&chapter_id=${nextChapter.id}`);
                const result = await response.json();

                if (result.status === 'not_exists') {
                    // 章节数据不存在，提交爬取任务
                    console.log(`[阅读页] 下一章节数据不存在，提交爬取任务`);
                    await this._submitChapterCrawlTask(nextChapter.id);

                    // 等待一段时间后重新检查
                    setTimeout(() => {
                        this._checkAndPreloadNextChapterImages(nextChapter.id);
                    }, 5000);
                } else {
                    // 章节数据存在，预加载图片
                    this.nextChapterDataReady = true;
                    await this._preloadNextChapterImages(nextChapter.id);
                }

                this.nextChapterPreloaded = true;

            } catch (error) {
                console.error('[阅读页] 预加载下一章节失败:', error);
            }
        }

        /**
         * 提交章节爬取任务
         */
        async _submitChapterCrawlTask(chapterId) {
            try {
                const response = await fetch(`/api/${this.siteId}/crawler/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resource_type: 'content_page',
                        comic_id: this.comicAid,
                        chapter_id: chapterId,
                        priority: 'low'
                    })
                });
                const result = await response.json();
                console.log(`[阅读页] 提交章节爬取任务:`, result);
            } catch (error) {
                console.error('[阅读页] 提交章节爬取任务失败:', error);
            }
        }

        /**
         * 检查并预加载下一章节图片
         */
        async _checkAndPreloadNextChapterImages(chapterId) {
            try {
                const response = await fetch(`/api/${this.siteId}/resource/check?resource_type=content_images&comic_id=${this.comicAid}&chapter_id=${chapterId}`);
                const result = await response.json();

                if (result.status === 'exists') {
                    this.nextChapterDataReady = true;
                    await this._preloadNextChapterImages(chapterId);
                }
            } catch (error) {
                console.error('[阅读页] 检查下一章节图片失败:', error);
            }
        }

        /**
         * 预加载下一章节的图片
         */
        async _preloadNextChapterImages(chapterId) {
            console.log(`[阅读页] 预加载下一章节 ${chapterId} 的前 ${this.config.nextChapterPages} 页`);

            // 提交下一章节前N页的下载任务
            for (let page = 1; page <= this.config.nextChapterPages; page++) {
                try {
                    await fetch(`/api/${this.siteId}/crawler/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            resource_type: 'content_image',
                            comic_id: this.comicAid,
                            chapter_id: chapterId,
                            page: page,
                            priority: 'low'
                        })
                    });
                } catch (error) {
                    console.error(`[阅读页] 预加载下一章节第${page}页失败:`, error);
                }
            }

            console.log(`[阅读页] 下一章节预加载完成`);
        }

        /**
         * 开始图片下载队列处理（兼容旧调用）
         */
        _startImageDownloadQueue() {
            // 不再需要，已被智能预加载系统替代
            console.log('[阅读页] _startImageDownloadQueue 已被智能预加载系统替代');
        }

        /**
         * 批量提交图片下载任务
         */
        async _submitBatchImageDownloadTasks(pages) {
            const batchSize = this.config.batchSize;

            for (let i = 0; i < pages.length; i += batchSize) {
                const batch = pages.slice(i, i + batchSize);

                for (const page of batch) {
                    const imageData = this.imageLoader.pendingImages.get(page);
                    // 检查是否需要下载：图片不在已下载集合中
                    if (imageData && !this.imageLoader.downloadedImages.has(page)) {
                        await this._submitImageDownloadTask(page);
                    }
                }
            }
        }

        /**
         * 预下载图片
         * @param {number} startPage - 起始页码（1-based）
         * @param {number} count - 预下载数量
         */
        async _preloadImages(startPage, count) {
            if (!this.imagesData || !this.imagesData.images) {
                return;
            }

            const images = this.imagesData.images;
            const endPage = Math.min(startPage + count - 1, images.length);

            console.log(`[阅读页] 预下载: 第${startPage}-${endPage}页`);

            // 收集需要预下载的图片
            const pagesToDownload = [];
            for (let page = startPage; page <= endPage; page++) {
                // 查找对应页码的图片数据
                const imageData = images.find(img => img.page === page);
                if (!imageData) continue;

                // 检查是否需要下载（使用 downloaded 字段判断）
                const isDownloaded = imageData.downloaded === true || this.imageLoader.downloadedImages.has(page);
                const isInPending = this.imageLoader.pendingImages.has(page);

                if (!isDownloaded && !isInPending) {
                    pagesToDownload.push(page);
                }
            }

            if (pagesToDownload.length === 0) {
                console.log(`[阅读页] 预下载: 没有需要下载的图片`);
                return;
            }

            // 批量提交下载任务
            for (const page of pagesToDownload) {
                const imageData = images.find(img => img.page === page);
                if (!imageData) continue;

                // 添加到 pendingImages（不创建 DOM 元素）
                this.imageLoader.pendingImages.set(page, {
                    element: null, // 预下载不需要 DOM 元素
                    url: imageData.url,
                    page: page
                });

                // 订阅 WebSocket 通知
                if (window.WSClient) {
                    const imageResourceKey = `content:${this.comicAid}:${this.chapterPid}:${page}`;
                    window.WSClient.subscribeResource('content_image', imageResourceKey, (url) => {
                        console.log(`[阅读页] 第${page}页预下载完成:`, url);
                        this.imageLoader.downloadedImages.set(page, url);
                        this.imageLoader.pendingImages.delete(page);
                        // 【重要】更新 DOM 中的图片元素
                        this._updateImage(page, url);
                    });
                }
            }

            // 批量提交下载
            await this._submitBatchImageDownloadTasks(pagesToDownload);
            console.log(`[阅读页] 预下载: 已提交 ${pagesToDownload.length} 张图片`);
        }

        /**
         * 提交单张图片下载任务
         */
        async _submitImageDownloadTask(page) {
            try {
                const response = await fetch(`/api/${this.siteId}/crawler/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        resource_type: 'content_image',
                        comic_id: this.comicAid,
                        chapter_id: this.chapterPid,
                        page: page,
                        priority: 'high'
                    })
                });

                const result = await response.json();
                if (result.success) {
                    console.log(`[阅读页] 已提交下载任务: 第${page}页, task_id=${result.task_id}`);
                } else {
                    console.error(`[阅读页] 提交下载任务失败: 第${page}页`, result.message);
                }
            } catch (error) {
                console.error(`[阅读页] 提交下载任务异常: 第${page}页`, error);
            }
        }

        /**
         * 订阅图片下载完成通知
         */
        _subscribeImageDownloadNotifications() {
            // WebSocket 通知作为实时更新的补充
            // 主要依赖批量轮询来检查图片状态
            console.log('[阅读页] WebSocket 通知已启用');
        }

        /**
         * 启动图片下载轮询
         * 使用批量查询方式，只查询"待确认"的图片
         */
        _startImageDownloadPolling() {
            console.log(`[阅读页] 启动批量状态轮询`);

            const pollInterval = setInterval(async () => {
                try {
                    // 收集"待确认下载状态"的页码（已提交但未确认下载完成的）
                    const pagesToCheck = [];
                    this.submittedPages.forEach(page => {
                        if (!this.imageLoader.downloadedImages.has(page)) {
                            pagesToCheck.push(page);
                        }
                    });

                    // 如果没有待确认的图片，跳过
                    if (pagesToCheck.length === 0) {
                        return;
                    }

                    // 批量查询这些图片的下载状态
                    await this._batchCheckImageStatus(pagesToCheck);

                } catch (error) {
                    console.error('[阅读页] 轮询检查失败:', error);
                }
            }, this.config.pollInterval);

            // 超时后停止轮询
            setTimeout(() => {
                clearInterval(pollInterval);
                console.log('[阅读页] 下载轮询超时停止');
            }, this.config.pollTimeout);
        }

        /**
         * 批量查询图片下载状态
         * @param {number[]} pages - 要查询的页码数组
         */
        async _batchCheckImageStatus(pages) {
            if (!pages || pages.length === 0) return;

            try {
                // 调用后端 API 批量查询图片状态
                const response = await fetch(
                    `/api/${this.siteId}/resource/check_images_status`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            comic_id: this.comicAid,
                            chapter_id: this.chapterPid,
                            pages: pages
                        })
                    }
                );
                const result = await response.json();

                if (result.success && result.data) {
                    // result.data 格式: { "1": { downloaded: true, url: "..." }, "2": { downloaded: false }, ... }
                    let updatedCount = 0;

                    for (const [pageStr, status] of Object.entries(result.data)) {
                        const page = parseInt(pageStr);

                        if (status.downloaded === true && status.url) {
                            // 图片已下载完成，更新显示
                            if (!this.imageLoader.downloadedImages.has(page)) {
                                this.imageLoader.downloadedImages.set(page, status.url);
                                this.imageLoader.pendingImages.delete(page);
                                this._updateImage(page, status.url);
                                updatedCount++;
                            }
                        }
                    }

                    if (updatedCount > 0) {
                        console.log(`[阅读页] 批量查询: 更新了 ${updatedCount} 张图片`);
                    }
                }
            } catch (error) {
                console.error('[阅读页] 批量查询图片状态失败:', error);
                // 降级：使用原来的全量查询方式
                await this._checkAndUpdateImagesFallback();
            }
        }

        /**
         * 降级方案：全量查询图片状态
         */
        async _checkAndUpdateImagesFallback() {
            try {
                const response = await fetch(
                    `/api/${this.siteId}/resource/check?resource_type=content_images&comic_id=${this.comicAid}&chapter_id=${this.chapterPid}`
                );
                const result = await response.json();

                if (result.success && result.data) {
                    const images = result.data.images || [];
                    let updatedCount = 0;

                    images.forEach(image => {
                        if (image.downloaded === true && image.url) {
                            if (!this.imageLoader.downloadedImages.has(image.page)) {
                                this.imageLoader.downloadedImages.set(image.page, image.url);
                                this.imageLoader.pendingImages.delete(image.page);
                                this._updateImage(image.page, image.url);
                                updatedCount++;
                            }
                        }
                    });

                    if (updatedCount > 0) {
                        console.log(`[阅读页] 全量查询: 更新了 ${updatedCount} 张图片`);
                    }
                }
            } catch (error) {
                console.error('[阅读页] 全量查询失败:', error);
            }
        }

        /**
         * 更新单张图片
         */
        _updateImage(page, url) {
            if (this.imageLoader.downloadedImages.has(page)) {
                return; // 已经更新过了
            }

            // 尝试从 pendingImages 获取元素
            const imageData = this.imageLoader.pendingImages.get(page);
            let img = imageData ? imageData.element : null;

            // 如果 pendingImages 中没有元素引用，从 DOM 中查找
            if (!img) {
                const container = this.elements.comicImagesContainer;
                if (container) {
                    img = container.querySelector(`img[data-page="${page}"]`);
                }
            }

            // 如果还是没有找到图片元素，记录下载状态等待后续处理
            if (!img) {
                console.log(`[阅读页] 第${page}页未找到DOM元素，记录下载状态`);
                this.imageLoader.downloadedImages.set(page, url);
                return;
            }

            // 预加载图片
            const tempImg = new Image();
            tempImg.onload = () => {
                // 使用ImageLoader更新图片
                this.imageLoader.updateImage(page, url);

                // 添加淡入效果
                if (img) {
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.3s ease';
                    requestAnimationFrame(() => {
                        img.style.opacity = '1';
                    });
                }

                // 翻页模式下，图片加载后重新调整高度
                if (this.readMode === 'page-flip' || this.readMode === 'page-flip-multi' || this.readMode === 'page-flip-double') {
                    // 使用requestAnimationFrame确保DOM已更新
                    requestAnimationFrame(() => {
                        this._adjustPageFlipHeight();
                    });
                }
            };

            tempImg.onerror = () => {
                console.error(`[阅读页] 第${page}页加载失败:`, url);
                if (img) {
                    img.dataset.status = 'error';
                }
            };

            tempImg.src = url;
        }

        /**
         * 提交爬取任务
         */
        async _submitCrawlTask(resourceType, comicId, message = '正在更新...', extraParams = {}) {
            this._updateWaitingState(true, message);

            try {
                const taskResponse = await fetch(`/api/${this.siteId}/crawler/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        resource_type: resourceType,
                        comic_id: comicId,
                        priority: 'high',
                        ...extraParams
                    })
                });

                const taskResult = await taskResponse.json();

                if (taskResult.success) {
                    console.log('[阅读页] 任务已提交:', taskResult.task_id);

                    // 订阅WebSocket通知
                    if (window.WSClient) {
                        const resourceKey = resourceType === 'content_page'
                            ? `content:${this.comicAid}:${this.chapterPid}`
                            : `info:${comicId}`;

                        window.WSClient.subscribeResource(resourceType, resourceKey, (result) => {
                            console.log('[阅读页] 收到更新通知:', result);
                            this._loadComicAndChapter();
                        });
                    }

                    // 轮询备用方案
                    this._pollForResource(resourceType, comicId, extraParams);
                } else {
                    this.showError('提交任务失败: ' + taskResult.message);
                }

            } catch (error) {
                console.error('[阅读页] 提交任务失败:', error);
                this.showError('提交任务失败');
            }
        }

        /**
         * 轮询检查资源
         */
        _pollForResource(resourceType, comicId, extraParams = {}) {
            const params = new URLSearchParams({
                resource_type: resourceType,
                comic_id: comicId,
                ...extraParams
            });

            const pollInterval = setInterval(async () => {
                try {
                    const checkResponse = await fetch(`/api/${this.siteId}/resource/check?${params}`);
                    const checkResult = await checkResponse.json();

                    const isValidStatus = resourceType === 'comic_info'
                        ? checkResult.status === 'exists'
                        : ['exists', 'pending', 'partial'].includes(checkResult.status);

                    if (checkResult.success && isValidStatus) {
                        clearInterval(pollInterval);
                        if (resourceType === 'comic_info') {
                            this.comicData = checkResult.data;
                            this.allChapters = this.comicData.chapters || [];
                            this._checkAndLoadImages();
                        } else {
                            this._displayContent(checkResult.data);
                        }
                    }
                } catch (error) {
                    console.error('[阅读页] 轮询检查失败:', error);
                }
            }, this.config.pollInterval);

            setTimeout(() => {
                clearInterval(pollInterval);
            }, this.config.pollTimeout);
        }

        /**
         * 更新章节导航
         */
        _updateChapterNavigation() {
            if (!this.allChapters || this.allChapters.length === 0) {
                return;
            }

            // 确保按钮元素存在
            if (!this.elements.prevChapterBtn || !this.elements.nextChapterBtn) {
                console.warn('[阅读页] 章节导航按钮元素未找到');
                return;
            }

            const currentIndex = this.allChapters.findIndex(
                ch => String(ch.id) === String(this.chapterPid)
            );
            this.currentPageIndex = currentIndex;

            // 移除旧的事件监听器（通过克隆节点）
            const prevBtn = this.elements.prevChapterBtn;
            const nextBtn = this.elements.nextChapterBtn;

            // 上一章按钮
            if (currentIndex > 0) {
                prevBtn.disabled = false;
                // 使用 onclick 赋值方式（确保替换旧的处理函数）
                prevBtn.onclick = () => {
                    const prevChapter = this.allChapters[currentIndex - 1];
                    console.log('[阅读页] 跳转到上一章:', prevChapter.id);
                    window.location.href = `/read.html?site=${this.siteId}&aid=${this.comicAid}&pid=${prevChapter.id}`;
                };
            } else {
                prevBtn.disabled = true;
                prevBtn.onclick = null;
            }

            // 下一章按钮
            if (currentIndex < this.allChapters.length - 1) {
                nextBtn.disabled = false;
                // 使用 onclick 赋值方式（确保替换旧的处理函数）
                nextBtn.onclick = () => {
                    const nextChapter = this.allChapters[currentIndex + 1];
                    console.log('[阅读页] 跳转到下一章:', nextChapter.id);
                    window.location.href = `/read.html?site=${this.siteId}&aid=${this.comicAid}&pid=${nextChapter.id}`;
                };
            } else {
                nextBtn.disabled = true;
                nextBtn.onclick = null;
            }

            // 章节信息
            if (this.elements.chapterInfo) {
                this.elements.chapterInfo.textContent = `${currentIndex + 1} / ${this.allChapters.length}`;
            }

            // 同步浮动栏按钮状态
            if (window.readPage && window.readPage.floatingControls) {
                window.readPage.floatingControls.syncNavigationState();
            }
        }

        /**
         * 强制更新
         */
        async _forceUpdate() {
            if (!this.comicAid || !this.chapterPid) {
                return;
            }

            this.elements.forceUpdateBtn.disabled = true;

            try {
                await Promise.all([
                    fetch(`/api/${this.siteId}/crawler/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            resource_type: 'comic_info',
                            comic_id: this.comicAid,
                            priority: 'high'
                        })
                    }),
                    fetch(`/api/${this.siteId}/crawler/submit`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            resource_type: 'content_page',
                            comic_id: this.comicAid,
                            chapter_id: this.chapterPid,
                            priority: 'high'
                        })
                    })
                ]);

                this._updateWaitingState(true, '正在强制更新...');
                this._showWaitingState();

            } catch (error) {
                console.error('[阅读页] 强制更新失败:', error);
                this.elements.forceUpdateBtn.disabled = false;
                this.showError('强制更新失败');
            }
        }

        /**
         * 更新等待状态
         */
        _updateWaitingState(show, text = '', subtext = '') {
            if (show) {
                this.elements.waitingText.textContent = text || '正在更新...';
                this.elements.waitingSubtext.textContent = subtext;
            }
        }

        _showWaitingState() {
            this.elements.waitingState.style.display = 'flex';
            this.elements.comicViewerContent.classList.remove('loaded');
        }

        _hideWaitingState() {
            this.elements.waitingState.style.display = 'none';
            this.elements.comicViewerContent.classList.add('loaded');
            this.elements.forceUpdateBtn.disabled = false;
        }

        /**
         * 调整翻页模式高度
         * 计算可用空间并应用到翻页容器，确保没有滚动条
         */
        _adjustPageFlipHeight() {
            // 只在翻页模式下调整高度
            if (this.readMode !== 'page-flip' && this.readMode !== 'page-flip-multi' && this.readMode !== 'page-flip-double') {
                return;
            }

            const pageFlipContainer = document.querySelector('.comic-pager-container');
            const pageFlipViewport = document.querySelector('.comic-pager-viewport');
            if (!pageFlipContainer) {
                console.warn('[阅读页] 找不到翻页容器');
                return;
            }

            // 获取视口高度
            const viewportHeight = window.innerHeight;

            // 获取需要减去高度的元素
            const header = document.querySelector('.viewer-header');
            const chapterTitle = document.querySelector('.comic-chapter-title');
            const chapterNav = document.querySelector('.chapter-navigation');

            // 计算需要减去的高度
            let subtractHeight = 0;

            // Header 高度（如果可见）
            if (header && window.getComputedStyle(header).display !== 'none') {
                subtractHeight += header.offsetHeight;
            }

            // 章节标题高度（如果可见）
            if (chapterTitle && window.getComputedStyle(chapterTitle).display !== 'none') {
                subtractHeight += chapterTitle.offsetHeight;
            }

            // 章节导航高度（如果是固定定位，需要预留空间）
            if (chapterNav && window.getComputedStyle(chapterNav).position === 'fixed') {
                subtractHeight += chapterNav.offsetHeight;
            }

            // 获取 comic-viewer-container 的 padding
            const viewerContainer = document.querySelector('.comic-viewer-container');
            if (viewerContainer) {
                const styles = window.getComputedStyle(viewerContainer);
                subtractHeight += parseInt(styles.paddingTop) || 0;
                subtractHeight += parseInt(styles.paddingBottom) || 0;
            }

            // 获取 main-content 的 padding
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                const styles = window.getComputedStyle(mainContent);
                const paddingTop = parseInt(styles.paddingTop) || 0;
                // padding-top 包含了 header 高度，需要避免重复计算
                if (paddingTop > 20) {  // header-height 大约是 50-60px
                    // 如果 padding-top 已经很大（包含 header），就不额外减去 header
                } else {
                    subtractHeight += paddingTop;
                }
                subtractHeight += parseInt(styles.paddingBottom) || 0;
            }

            // 计算可用高度
            let availableHeight = viewportHeight - subtractHeight - 20; // 20px 额外边距

            // 确保最小高度
            availableHeight = Math.max(availableHeight, 250);

            // 应用高度
            pageFlipContainer.style.height = `${availableHeight}px`;

            // 设置 viewport 高度
            if (pageFlipViewport) {
                pageFlipViewport.style.height = `${availableHeight}px`;
            }

            console.log(`[阅读页] 翻页容器高度: ${availableHeight}px, 视口: ${viewportHeight}px, 减去: ${subtractHeight}px`);
        }

        /**
         * 显示错误
         */
        showError(message) {
            this._hideWaitingState();
            this.elements.comicImagesContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="nav-btn" style="margin-top: 20px;">
                        <i class="fas fa-redo"></i> 重新加载
                    </button>
                </div>
            `;
        }
    }

    // 导出
    window.ReadPage = ReadPage;

})(window);
