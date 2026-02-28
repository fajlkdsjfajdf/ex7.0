/**
 * 翻页模式 - 单页翻页（带翻书页动画效果）
 * 使用CSS 3D变换实现真实的翻页效果
 */
class PageFlipMode extends ReadModeBase {
    constructor(container, imageLoader, heightCalculator) {
        super(container, imageLoader, heightCalculator);
        this.modeName = 'page-flip';
        this.pageSections = [];
        this.currentPage = 0;  // 0-based
        this.resizeTimeout = null;
        this.isAnimating = false;
        this.animationDuration = 600; // 翻页动画时长(ms)
    }

    /**
     * 渲染翻页模式
     * @param {Array} images - 图片数据数组
     */
    render(images) {
        console.log('[PageFlipMode] 渲染翻页模式', images.length, '张图片');

        // 清空容器
        this.container.innerHTML = '';
        this.container.className = 'comic-images-container page-flip-mode';

        // 更新body class
        this._updateBodyClass();

        // 配置容器滚动行为（禁止滚动）
        ScrollbarController.configureContainer(this.container, 'page-flip');

        // 配置主内容区域
        const mainContent = document.querySelector('.main-content');
        ScrollbarController.configureMainContent(mainContent, 'page-flip');

        // 存储页面信息
        this.pageSections = [];
        images.forEach((imageData, index) => {
            this.pageSections.push({
                imageData: imageData,
                index: index
            });
        });

        // 创建翻页结构
        const flipContainer = this._createFlipContainer(images);
        this.container.appendChild(flipContainer);

        // 计算并应用高度
        this.heightCalculator.applyHeight(flipContainer, 'page-flip');

        // 初始化悬浮控件
        this._initFloatingControls();

        // 初始化翻页控制
        this._initControls(flipContainer);

        // 加载页面
        this._loadPages();

        // 启动实时高度更新
        this.heightCalculator.startRealtimeUpdate(() => {
            this._onResize();
        });

        // 延迟确保渲染完成
        setTimeout(() => {
            this.heightCalculator.applyHeight(flipContainer, 'page-flip');
            this._resizeImages();
        }, 100);

        setTimeout(() => {
            this._resizeImages();
        }, 300);

        console.log('[PageFlipMode] 渲染完成，共', this.pageSections.length, '页');
    }

    /**
     * 创建翻页容器结构
     * @private
     */
    _createFlipContainer(images) {
        const flipContainer = document.createElement('div');
        flipContainer.className = 'comic-pager-container';
        flipContainer.id = 'flipContainer';

        const viewport = document.createElement('div');
        viewport.className = 'comic-pager-viewport flip-book-viewport';
        this._viewport = viewport;

        // 创建书本容器
        const book = document.createElement('div');
        book.className = 'flip-book';
        book.id = 'flipBook';

        viewport.appendChild(book);
        flipContainer.appendChild(viewport);

        return flipContainer;
    }

    /**
     * 加载当前页和前后页
     * @private
     */
    _loadPages() {
        const book = document.getElementById('flipBook');
        if (!book) return;

        book.innerHTML = '';

        // 创建页面结构
        // 当前页（正面）
        const currentPage = this._createPage('current', this.currentPage);
        book.appendChild(currentPage);

        // 下一页（用于翻页动画）
        if (this.currentPage < this.pageSections.length - 1) {
            const nextPage = this._createPage('next', this.currentPage + 1);
            book.appendChild(nextPage);
        }

        // 预加载前后页图片
        this._preloadAdjacentPages();

        this._resizeImages();
    }

    /**
     * 创建单个页面元素
     * @private
     */
    _createPage(type, pageIndex) {
        const page = document.createElement('div');
        page.className = `flip-page flip-page-${type}`;
        page.dataset.pageIndex = pageIndex;

        if (pageIndex >= 0 && pageIndex < this.pageSections.length) {
            const img = this.imageLoader.createImageElement(
                this.pageSections[pageIndex].imageData,
                pageIndex
            );
            img.className = 'flip-page-image';
            img.id = `flipImg_${type}`;
            img.addEventListener('load', () => this._resizeImages());
            page.appendChild(img);
        }

        return page;
    }

    /**
     * 预加载前后页
     * @private
     */
    _preloadAdjacentPages() {
        const prevIndex = this.currentPage - 1;
        const nextIndex = this.currentPage + 1;

        // 预加载前一页
        if (prevIndex >= 0 && prevIndex < this.pageSections.length) {
            const img = new Image();
            img.src = this.pageSections[prevIndex].imageData.url || '';
        }

        // 预加载后一页
        if (nextIndex >= 0 && nextIndex < this.pageSections.length) {
            const img = new Image();
            img.src = this.pageSections[nextIndex].imageData.url || '';
        }
    }

    /**
     * 调整图片尺寸
     * @private
     */
    _resizeImages() {
        const viewport = this._viewport;
        const book = document.getElementById('flipBook');
        if (!viewport || !book) return;

        const pages = book.querySelectorAll('.flip-page');
        if (pages.length === 0) return;

        const firstImg = pages[0].querySelector('img');
        if (!firstImg || !firstImg.naturalWidth) return;

        const picWidth = firstImg.naturalWidth;
        const picHeight = firstImg.naturalHeight;

        if (picWidth === 0 || picHeight === 0) return;

        // 获取容器尺寸
        const divWidth = viewport.offsetWidth * 0.95;
        const divHeight = viewport.offsetHeight * 0.95;

        // 计算图片尺寸
        let imgWidth, imgHeight;
        if (picWidth < divWidth && picHeight < divHeight) {
            imgWidth = divWidth;
            imgHeight = picHeight * (divWidth / picWidth);
            if (imgHeight > divHeight) {
                imgHeight = divHeight;
                imgWidth = picWidth * (divHeight / picHeight);
            }
        } else if (picWidth >= divWidth && picHeight < divHeight) {
            imgWidth = divWidth;
            imgHeight = picHeight * (divWidth / picWidth);
        } else if (picWidth < divWidth && picHeight >= divHeight) {
            imgHeight = divHeight;
            imgWidth = picWidth * (divHeight / picHeight);
        } else {
            imgWidth = divWidth;
            imgHeight = picHeight * (divWidth / picWidth);
            if (imgHeight > divHeight) {
                imgHeight = divHeight;
                imgWidth = picWidth * (divHeight / picHeight);
            }
        }

        // 应用尺寸到所有页面
        pages.forEach(page => {
            page.style.width = imgWidth + 'px';
            page.style.height = imgHeight + 'px';

            const img = page.querySelector('img');
            if (img) {
                img.style.width = imgWidth + 'px';
                img.style.height = imgHeight + 'px';
                img.style.borderRadius = '12px';
            }
        });

        // 设置书本尺寸
        book.style.width = imgWidth + 'px';
        book.style.height = imgHeight + 'px';

        console.log('[PageFlipMode] 图片尺寸:', Math.round(imgWidth), 'x', Math.round(imgHeight));
    }

    /**
     * 初始化翻页控制
     * @private
     */
    _initControls(flipContainer) {
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
        indicator.innerHTML = '<span class="current-page">1</span> / <span class="total-pages">' + this.pageSections.length + '</span>';

        flipContainer.appendChild(prevBtn);
        flipContainer.appendChild(nextBtn);
        flipContainer.appendChild(indicator);

        // 存储控件引用
        this.controls = { prevBtn, nextBtn, indicator };

        // 绑定事件
        this._addEventListener(prevBtn, 'click', () => this._prevPage());
        this._addEventListener(nextBtn, 'click', () => this._nextPage());

        // 键盘导航
        this._addEventListener(document, 'keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                this._prevPage();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                this._nextPage();
            }
        });

        // 滚轮翻页支持
        this._addEventListener(flipContainer, 'wheel', (e) => {
            e.preventDefault();
            if (this.isAnimating) return;

            if (e.deltaY > 0) {
                this._nextPage();
            } else if (e.deltaY < 0) {
                this._prevPage();
            }
        }, { passive: false });

        // 触摸滑动支持
        this._initTouchSupport(flipContainer);

        // 初始化页码
        this._updatePageIndicator();
    }

    /**
     * 初始化触摸滑动支持
     * @private
     */
    _initTouchSupport(container) {
        let startX = 0;
        let startY = 0;

        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const diffX = endX - startX;
            const diffY = endY - startY;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        this._prevPage();
                    } else {
                        this._nextPage();
                    }
                }
            } else {
                if (Math.abs(diffY) > 50) {
                    if (diffY > 0) {
                        this._prevPage();
                    } else {
                        this._nextPage();
                    }
                }
            }
        }, { passive: true });
    }

    /**
     * 上一页（带翻页动画）
     * @private
     */
    _prevPage() {
        if (this.isAnimating) return;
        if (this.currentPage <= 0) return;

        this.isAnimating = true;
        const book = document.getElementById('flipBook');
        if (!book) {
            this.isAnimating = false;
            return;
        }

        // 创建翻页动画
        this._animateFlip('prev', () => {
            this.currentPage--;
            this._loadPages();
            this._updatePageIndicator();
            this._onPageAction();
            this.isAnimating = false;
            console.log('[PageFlipMode] 翻到第', this.currentPage + 1, '页');
        });
    }

    /**
     * 下一页（带翻页动画）
     * @private
     */
    _nextPage() {
        if (this.isAnimating) return;
        if (this.currentPage >= this.pageSections.length - 1) return;

        this.isAnimating = true;
        const book = document.getElementById('flipBook');
        if (!book) {
            this.isAnimating = false;
            return;
        }

        // 创建翻页动画
        this._animateFlip('next', () => {
            this.currentPage++;
            this._loadPages();
            this._updatePageIndicator();
            this._onPageAction();
            this.isAnimating = false;
            console.log('[PageFlipMode] 翻到第', this.currentPage + 1, '页');
        });
    }

    /**
     * 执行翻页动画
     * @private
     */
    _animateFlip(direction, callback) {
        const book = document.getElementById('flipBook');
        if (!book) {
            callback();
            return;
        }

        const currentPage = book.querySelector('.flip-page-current');
        const nextPage = book.querySelector('.flip-page-next');

        if (!currentPage) {
            callback();
            return;
        }

        // 使用淡入淡出+滑动效果（更流畅）
        if (direction === 'next') {
            // 当前页向左滑出
            currentPage.classList.add('slide-left');
            // 下一页从右边滑入
            if (nextPage) {
                nextPage.classList.remove('flip-page-next');
                nextPage.classList.add('flip-page-current');
                nextPage.style.transform = 'translateX(100%)';
                nextPage.style.opacity = '0';

                // 触发重绘
                nextPage.offsetHeight;

                nextPage.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
                nextPage.style.transform = 'translateX(0)';
                nextPage.style.opacity = '1';
            }
        } else {
            // 向后翻页 - 当前页向右滑出
            currentPage.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
            currentPage.style.transform = 'translateX(100%)';
            currentPage.style.opacity = '0';
        }

        // 动画结束后回调
        setTimeout(() => {
            callback();
        }, this.animationDuration);
    }

    /**
     * 更新页码指示器
     * @private
     */
    _updatePageIndicator() {
        if (!this.controls || !this.controls.indicator) return;

        // 更新按钮状态
        this.controls.prevBtn.disabled = this.currentPage === 0;
        this.controls.nextBtn.disabled = this.currentPage >= this.pageSections.length - 1;

        // 更新页码
        const currentPageEl = this.controls.indicator.querySelector('.current-page');
        if (currentPageEl) {
            currentPageEl.textContent = this.currentPage + 1;
        }

        // 触发预下载
        this._triggerPreload();
    }

    /**
     * 触发预下载
     * @private
     */
    _triggerPreload() {
        if (!window.readPage || typeof window.readPage._preloadImages !== 'function') {
            return;
        }

        const preloadTrigger = window.readPage.config.preloadTrigger || 10;
        const preloadAhead = window.readPage.config.preloadAhead || 20;
        const currentPage = this.currentPage + 1;

        if (currentPage % preloadTrigger === 1 || currentPage === 1) {
            const startPage = currentPage;
            const endPage = Math.min(startPage + preloadAhead - 1, this.pageSections.length);
            console.log(`[PageFlipMode] 触发预下载: 第${startPage}-${endPage}页`);
            window.readPage._preloadImages(startPage, preloadAhead);
        }
    }

    /**
     * 窗口大小变化时重新计算
     * @private
     */
    _onResize() {
        const flipContainer = this.container.querySelector('.comic-pager-container');
        if (flipContainer) {
            this.heightCalculator.applyHeight(flipContainer, 'page-flip');
            this._resizeImages();
        }
    }

    /**
     * 更新body class
     * @private
     */
    _updateBodyClass() {
        document.body.classList.remove('scroll-mode', 'scroll-seamless-mode');
        document.body.classList.add('page-flip-mode');
    }

    /**
     * 销毁模式
     */
    destroy() {
        console.log('[PageFlipMode] 销毁模式');
        this.pageSections = [];
        this.currentPage = 0;
        this.isAnimating = false;
        clearTimeout(this.resizeTimeout);
        super.destroy();
    }
}

// 导出到全局
window.PageFlipMode = PageFlipMode;
