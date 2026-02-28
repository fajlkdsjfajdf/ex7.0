/**
 * 多页翻页模式 - 双页翻页
 * 一次显示两张图片，禁止滚动条
 */
class PageFlipMultiMode extends ReadModeBase {
    constructor(container, imageLoader, heightCalculator) {
        super(container, imageLoader, heightCalculator);
        this.modeName = 'page-flip-multi';
        this.pageSections = [];
        this.currentSection = 0;
    }

    /**
     * 渲染多页翻页模式
     * @param {Array} images - 图片数据数组
     */
    render(images) {
        console.log('[PageFlipMultiMode] 渲染多页翻页模式', images.length, '张图片');

        // 清空容器
        this.container.innerHTML = '';
        this.container.className = 'comic-images-container page-flip-multi-mode';

        // 更新body class
        this._updateBodyClass();

        // 配置容器滚动行为（禁止滚动）
        ScrollbarController.configureContainer(this.container, 'page-flip-multi');

        // 配置主内容区域
        const mainContent = document.querySelector('.main-content');
        ScrollbarController.configureMainContent(mainContent, 'page-flip-multi');

        // 创建翻页结构
        const flipContainer = this._createFlipContainer(images);
        this.container.appendChild(flipContainer);

        // 计算并应用高度
        this.heightCalculator.applyHeight(flipContainer, 'page-flip-multi');

        // 初始化翻页控制
        this._initControls(flipContainer);

        // 启动实时高度更新
        this.heightCalculator.startRealtimeUpdate(() => {
            this._onResize();
        });

        console.log('[PageFlipMultiMode] 渲染完成，共', this.pageSections.length, '节');
    }

    /**
     * 创建翻页容器结构
     * @private
     */
    _createFlipContainer(images) {
        // 创建翻页容器
        const flipContainer = document.createElement('div');
        flipContainer.className = 'comic-pager-container';

        // 创建视口
        const viewport = document.createElement('div');
        viewport.className = 'comic-pager-viewport';

        // 创建滑动器
        const slider = document.createElement('div');
        slider.className = 'comic-pager-slider';

        // 存储section信息
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
            const img1 = this.imageLoader.createImageElement(currentImage, i);
            pageSection.appendChild(img1);

            // 检查是否有下一张图片
            if (nextImage) {
                const img2 = this.imageLoader.createImageElement(nextImage, i + 1);
                pageSection.appendChild(img2);
                pageSection.dataset.pages = `${currentImage.page},${nextImage.page}`;
            } else {
                pageSection.dataset.page = currentImage.page;
            }

            this.pageSections.push({
                section: pageSection,
                img1: img1,
                img2: pageSection.querySelector('img[data-index="' + (i + 1) + '"]'),
                hasTwoImages: !!nextImage
            });

            slider.appendChild(pageSection);

            i += nextImage ? 2 : 1;
        }

        viewport.appendChild(slider);
        flipContainer.appendChild(viewport);

        return flipContainer;
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
        indicator.innerHTML = '<span class="current-page">1</span> / <span class="total-sections">' + this.pageSections.length + '</span>';

        flipContainer.appendChild(prevBtn);
        flipContainer.appendChild(nextBtn);
        flipContainer.appendChild(indicator);

        // 存储控件引用
        this.controls = { prevBtn, nextBtn, indicator, slider: flipContainer.querySelector('.comic-pager-slider') };

        // 绑定事件
        this._addEventListener(prevBtn, 'click', () => this._prevSection());
        this._addEventListener(nextBtn, 'click', () => this._nextSection());

        // 键盘导航
        this._addEventListener(document, 'keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                this._prevSection();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                this._nextSection();
            }
        });

        // 触摸滑动支持
        this._initTouchSupport(flipContainer);
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

            // 判断是横向滑动还是纵向滑动
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 横向滑动
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        this._prevSection();
                    } else {
                        this._nextSection();
                    }
                }
            } else {
                // 纵向滑动
                if (Math.abs(diffY) > 50) {
                    if (diffY > 0) {
                        this._prevSection();
                    } else {
                        this._nextSection();
                    }
                }
            }
        }, { passive: true });
    }

    /**
     * 上一节
     * @private
     */
    _prevSection() {
        if (this.currentSection > 0) {
            this.currentSection--;
            this._updateSection();
        }
    }

    /**
     * 下一节
     * @private
     */
    _nextSection() {
        if (this.currentSection < this.pageSections.length - 1) {
            this.currentSection++;
            this._updateSection();
        }
    }

    /**
     * 更新页面显示
     * @private
     */
    _updateSection() {
        const sectionWidth = this.controls.slider.offsetWidth;
        this.controls.slider.style.transform = `translateX(-${this.currentSection * sectionWidth}px)`;

        // 更新按钮状态
        this.controls.prevBtn.disabled = this.currentSection === 0;
        this.controls.nextBtn.disabled = this.currentSection === this.pageSections.length - 1;

        // 更新页码指示器
        const currentPageEl = this.controls.indicator.querySelector('.current-page');
        if (currentPageEl) {
            currentPageEl.textContent = this.currentSection + 1;
        }

        console.log('[PageFlipMultiMode] 翻到第', this.currentSection + 1, '节');

        // 触发预下载（每翻页10节预下载一次）
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
        const currentSection = this.currentSection + 1; // 转换为 1-based

        // 检查是否需要触发预下载（每10节触发一次）
        if (currentSection % preloadTrigger === 1 || currentSection === 1) {
            // 计算当前节大致对应的页码（每节约2页）
            const estimatedPage = currentSection * 2;
            const startPage = Math.max(1, estimatedPage);
            const endPage = Math.min(startPage + preloadAhead - 1, this.pageSections.length * 2);
            console.log(`[PageFlipMultiMode] 触发预下载: 第${startPage}-${endPage}页（基于第${currentSection}节）`);
            window.readPage._preloadImages(startPage, preloadAhead);
        }
    }

    /**
     * 窗口大小变化时重新计算高度
     * @private
     */
    _onResize() {
        const flipContainer = this.container.querySelector('.comic-pager-container');
        if (flipContainer) {
            this.heightCalculator.applyHeight(flipContainer, 'page-flip-multi');

            // 重新计算并更新滑动器位置
            const sectionWidth = this.controls.slider.offsetWidth;
            this.controls.slider.style.transform = `translateX(-${this.currentSection * sectionWidth}px)`;
        }
    }

    /**
     * 销毁模式
     */
    destroy() {
        console.log('[PageFlipMultiMode] 销毁模式');
        this.pageSections = [];
        this.currentSection = 0;
        super.destroy();
    }
}

// 导出到全局
window.PageFlipMultiMode = PageFlipMultiMode;
