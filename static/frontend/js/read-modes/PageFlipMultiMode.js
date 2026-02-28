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
        this.isAnimating = false; // 动画状态
        this.animationDuration = 600; // 翻页动画时长(ms)
        this.currentPageIndex = 0; // 当前页码索引（0-based，用于单页翻）
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
        viewport.className = 'comic-pager-viewport flip-book-viewport';
        this._viewport = viewport; // 保存引用

        // 创建容器（不再使用slider滑动方式）
        const slider = document.createElement('div');
        slider.className = 'comic-pager-slider';
        slider.style.display = 'block';
        slider.style.width = '100%';
        slider.style.height = '100%';

        // 存储section信息
        this.pageSections = [];
        this._imagesData = images; // 保存图片数据

        // 添加每个图片页（可能是单页或双页）
        let i = 0;
        let sectionIndex = 0;
        while (i < images.length) {
            const currentImage = images[i];
            const nextImage = images[i + 1];

            const pageSection = document.createElement('div');
            pageSection.className = 'pager-section flip-page';
            pageSection.dataset.index = sectionIndex;

            // 默认只显示第一个section
            if (sectionIndex === 0) {
                pageSection.style.display = '';
            } else {
                pageSection.style.display = 'none';
            }

            // 当前图片
            const img1 = this.imageLoader.createImageElement(currentImage, i);
            img1.style.borderRadius = '12px';
            img1.className = 'flip-page-image';
            pageSection.appendChild(img1);

            // 检查是否有下一张图片
            if (nextImage) {
                const img2 = this.imageLoader.createImageElement(nextImage, i + 1);
                img2.style.borderRadius = '12px';
                img2.className = 'flip-page-image';
                pageSection.appendChild(img2);
                pageSection.dataset.pages = `${currentImage.page},${nextImage.page}`;
            } else {
                pageSection.dataset.page = currentImage.page;
            }

            this.pageSections.push({
                section: pageSection,
                img1: img1,
                img2: pageSection.querySelector('img[data-index="' + (i + 1) + '"]'),
                hasTwoImages: !!nextImage,
                startPageIndex: i, // 起始页码索引
                endPageIndex: nextImage ? i + 1 : i // 结束页码索引
            });

            slider.appendChild(pageSection);

            i += nextImage ? 2 : 1;
            sectionIndex++;
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

        // 滚轮翻页支持
        this._addEventListener(flipContainer, 'wheel', (e) => {
            e.preventDefault();
            if (this.isAnimating) return;

            if (e.deltaY > 0) {
                this._nextSection();
            } else if (e.deltaY < 0) {
                this._prevSection();
            }
        }, { passive: false });

        // 触摸滑动支持
        this._initTouchSupport(flipContainer);

        // 初始化图片尺寸
        setTimeout(() => this._resizeImages(), 100);
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
     * 上一节（带3D翻页动画）
     * @private
     */
    _prevSection() {
        if (this.isAnimating) return;
        if (this.currentSection <= 0) return;

        this.isAnimating = true;

        // 先执行动画，再更新内容
        this._animateFlip('prev', () => {
            this.currentSection--;
            this._updateSection();
            this.isAnimating = false;
        });
    }

    /**
     * 下一节（带3D翻页动画）
     * @private
     */
    _nextSection() {
        if (this.isAnimating) return;
        if (this.currentSection >= this.pageSections.length - 1) return;

        this.isAnimating = true;

        // 先执行动画，再更新内容
        this._animateFlip('next', () => {
            this.currentSection++;
            this._updateSection();
            this.isAnimating = false;
        });
    }

    /**
     * 执行3D翻页动画 - 真正的翻书效果
     * @private
     */
    _animateFlip(direction, callback) {
        const currentSection = this.pageSections[this.currentSection];
        if (!currentSection || !currentSection.section) {
            callback();
            return;
        }

        const section = currentSection.section;

        // 设置3D环境
        const viewport = this._viewport;
        if (viewport) {
            viewport.style.perspective = '2000px';
            viewport.style.perspectiveOrigin = 'center center';
        }

        // 设置section的3D属性
        section.style.transformStyle = 'preserve-3d';
        section.style.backfaceVisibility = 'hidden';

        if (direction === 'next') {
            // 向后翻页（下一页）- 当前页从右向左翻转
            section.style.transformOrigin = 'left center';
            section.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.645, 0.045, 0.355, 1)`;
            section.style.transform = 'rotateY(-180deg)';
        } else {
            // 向前翻页（上一页）- 当前页从左向右翻转
            section.style.transformOrigin = 'right center';
            section.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.645, 0.045, 0.355, 1)`;
            section.style.transform = 'rotateY(180deg)';
        }

        // 动画结束后恢复并回调
        setTimeout(() => {
            section.style.transition = 'none';
            section.style.transform = 'rotateY(0deg)';
            callback();
        }, this.animationDuration);
    }

    /**
     * 单页前翻（一次只翻一页）
     */
    flipSinglePrev() {
        if (this.isAnimating) return;

        // 找到前一页所在的section
        const currentSection = this.pageSections[this.currentSection];
        if (!currentSection) return;

        const currentStartPage = currentSection.startPageIndex;
        if (currentStartPage <= 0) return;

        // 计算前一页所在的section索引
        for (let i = this.currentSection - 1; i >= 0; i--) {
            const section = this.pageSections[i];
            if (section.endPageIndex === currentStartPage - 1 ||
                section.startPageIndex === currentStartPage - 1) {
                // 找到前一页所在的section
                this.isAnimating = true;
                this._animateFlip('prev', () => {
                    this.currentSection = i;
                    this._updateSection();
                    this.isAnimating = false;
                });
                return;
            }
        }
    }

    /**
     * 单页后翻（一次只翻一页）
     */
    flipSingleNext() {
        if (this.isAnimating) return;

        // 找到后一页所在的section
        const currentSection = this.pageSections[this.currentSection];
        if (!currentSection) return;

        const currentEndPage = currentSection.endPageIndex;
        if (currentEndPage >= this._imagesData.length - 1) return;

        // 计算后一页所在的section索引
        for (let i = this.currentSection + 1; i < this.pageSections.length; i++) {
            const section = this.pageSections[i];
            if (section.startPageIndex === currentEndPage + 1) {
                // 找到后一页所在的section
                this.isAnimating = true;
                this._animateFlip('next', () => {
                    this.currentSection = i;
                    this._updateSection();
                    this.isAnimating = false;
                });
                return;
            }
        }
    }

    /**
     * 跳转到指定页
     * @param {number} pageIndex - 页码索引（0-based）
     */
    goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this._imagesData.length) return;

        // 找到包含该页的section
        for (let i = 0; i < this.pageSections.length; i++) {
            const section = this.pageSections[i];
            if (pageIndex >= section.startPageIndex && pageIndex <= section.endPageIndex) {
                if (i !== this.currentSection) {
                    this.currentSection = i;
                    this._updateSection();
                    this._onPageAction();
                }
                console.log('[PageFlipMultiMode] 跳转到第', pageIndex + 1, '页（section', i + 1, '）');
                return;
            }
        }
    }

    /**
     * 调整图片尺寸（移动端边距优化）
     * @private
     */
    _resizeImages() {
        const viewport = this._viewport;
        if (!viewport) return;

        // 移动端/平板使用更小的边距(6px)，PC端使用2%
        const isMobileOrTablet = window.innerWidth <= 1024;
        const margin = isMobileOrTablet ? 6 : 0.02;

        this.pageSections.forEach(sectionData => {
            const section = sectionData.section;
            const imgs = section.querySelectorAll('img');

            imgs.forEach(img => {
                if (img.naturalWidth && img.naturalHeight) {
                    // 计算可用尺寸
                    const availableWidth = isMobileOrTablet
                        ? viewport.offsetWidth - margin
                        : viewport.offsetWidth * (1 - margin);
                    const availableHeight = isMobileOrTablet
                        ? viewport.offsetHeight - margin
                        : viewport.offsetHeight * (1 - margin);

                    // 保持比例缩放
                    const scale = Math.min(
                        availableWidth / img.naturalWidth,
                        availableHeight / img.naturalHeight
                    );

                    if (imgs.length === 2) {
                        // 双页模式，每张图片占一半宽度
                        img.style.width = (availableWidth / 2 - 4) + 'px';
                        img.style.height = ((availableWidth / 2 - 4) * img.naturalHeight / img.naturalWidth) + 'px';
                        if (parseFloat(img.style.height) > availableHeight) {
                            img.style.height = availableHeight + 'px';
                            img.style.width = (availableHeight * img.naturalWidth / img.naturalHeight) + 'px';
                        }
                    } else {
                        // 单页模式
                        img.style.width = (img.naturalWidth * scale) + 'px';
                        img.style.height = (img.naturalHeight * scale) + 'px';
                    }
                }
            });
        });
    }

    /**
     * 更新页面显示
     * @private
     */
    _updateSection() {
        // 隐藏所有section，只显示当前section
        this.pageSections.forEach((sectionData, index) => {
            if (index === this.currentSection) {
                sectionData.section.style.display = '';
                sectionData.section.style.visibility = 'visible';
            } else {
                sectionData.section.style.display = 'none';
            }
        });

        // 更新按钮状态
        this.controls.prevBtn.disabled = this.currentSection === 0;
        this.controls.nextBtn.disabled = this.currentSection >= this.pageSections.length - 1;

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

            // 重新计算图片尺寸
            this._resizeImages();
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
