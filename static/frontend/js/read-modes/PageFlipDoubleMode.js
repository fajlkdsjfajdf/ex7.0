/**
 * 翻页式双页模式 - 参考老代码gifplayer实现
 *
 * 核心设计原则（参考老代码）：
 * - 每个section只包含1张图片
 * - 双页时，当前section同时显示当前和下一张图片
 * - 用JS计算尺寸，两张图片使用相同的宽高
 * - 使用 display: inline-block 或 none 控制显示
 * - 简化居中逻辑
 *
 * 导航逻辑：
 * - currentSection: 当前加载的section索引（0-based）
 * - currentPage: 当前显示的起始页码（1-based，双页时是左边那页）
 * - 双页模式下一页跳2页，单页模式跳1页
 */
class PageFlipDoubleMode extends ReadModeBase {
    constructor(container, imageLoader, heightCalculator) {
        super(container, imageLoader, heightCalculator);
        this.modeName = 'page-flip';
        this.pageSections = [];
        this.currentSection = 0;
        this.currentPage = 1;  // 当前显示的起始页码（1-based）
        this.resizeTimeout = null;
        this.timeSkip = 200; // 防抖时间
        this.gifFlag = false; // 防止重复触发
        this.isAnimating = false; // 动画状态
        this.animationDuration = 600; // 翻页动画时长(ms)
    }

    /**
     * 渲染翻页式双页模式
     * @param {Array} images - 图片数据数组
     */
    render(images) {
        console.log('[PageFlipDoubleMode] 渲染翻页式双页模式', images.length, '张图片');

        // 清空容器
        this.container.innerHTML = '';
        this.container.className = 'comic-images-container page-flip-mode';

        // 更新body class
        this._updateBodyClass();

        // 配置容器滚动行为
        ScrollbarController.configureContainer(this.container, 'page-flip-double');

        // 配置主内容区域
        const mainContent = document.querySelector('.main-content');
        ScrollbarController.configureMainContent(mainContent, 'page-flip-double');

        // 创建翻页结构
        const flipContainer = this._createFlipContainer(images);
        this.container.appendChild(flipContainer);

        // 初始化悬浮控件
        this._initFloatingControls();

        // 初始化翻页控制
        this._initControls(flipContainer);

        // 启动实时高度更新和双页检测
        this.heightCalculator.startRealtimeUpdate(() => {
            this._onResize();
        });

        // 初始显示
        this._loadCurrentSection();

        // 计算并应用高度
        setTimeout(() => {
            this.heightCalculator.applyHeight(flipContainer, 'page-flip-double', () => {
                this._resizeImages();
            });
        }, 100);

        setTimeout(() => {
            this._resizeImages();
        }, 300);

        console.log('[PageFlipDoubleMode] 渲染完成，共', this.pageSections.length, '节');
    }

    /**
     * 创建翻页容器结构
     * @private
     */
    _createFlipContainer(images) {
        const flipContainer = document.createElement('div');
        flipContainer.className = 'comic-pager-container';

        const viewport = document.createElement('div');
        viewport.className = 'comic-pager-viewport';

        const slider = document.createElement('div');
        slider.className = 'comic-pager-slider';

        // 图片容器 - 类似老代码的 gifPlayerDiv
        const imgDiv = document.createElement('div');
        imgDiv.className = 'pager-div-horizontal';
        imgDiv.id = 'pageFlipDiv';

        const div1 = document.createElement('div');
        div1.className = 'pager-div1';
        div1.id = 'pageFlip-div1';

        const div2 = document.createElement('div');
        div2.className = 'pager-div2';
        div2.id = 'pageFlip-div2';

        imgDiv.appendChild(div1);
        imgDiv.appendChild(div2);
        slider.appendChild(imgDiv);

        viewport.appendChild(slider);
        flipContainer.appendChild(viewport);

        // 存储页面信息
        this.pageSections = [];
        images.forEach((imageData, index) => {
            this.pageSections.push({
                imageData: imageData,
                index: index
            });
        });

        return flipContainer;
    }

    /**
     * 加载当前section的图片（参考老代码的setGifImgSrc）
     * 日漫顺序：从右向左阅读，右边是第1页，左边是第2页
     * @private
     */
    _loadCurrentSection() {
        const div1 = document.getElementById('pageFlip-div1');
        if (!div1) return;

        // 淡入效果
        div1.style.display = 'none';
        div1.innerHTML = '';
        div1.style.display = 'block';

        const currentIndex = this.currentSection;

        console.log('[PageFlipDoubleMode] _loadCurrentSection:', {
            currentPage: this.currentPage,
            currentSection: this.currentSection,
            currentIndex: currentIndex,
            'will load pages': `${currentIndex + 1} and ${currentIndex + 2}`
        });

        // 先创建下一张图片（会放在左边 - 日漫第2页）
        const nextIndex = currentIndex + 1;
        if (nextIndex < this.pageSections.length) {
            const img2 = this.imageLoader.createImageElement(
                this.pageSections[nextIndex].imageData,
                nextIndex
            );
            img2.id = 'pageFlipNext';
            img2.style.cssText = '';
            img2.addEventListener('load', () => {
                this._resizeImages();
            });
            div1.appendChild(img2);
        } else {
            // 没有下一页，创建空的img2
            const img2 = document.createElement('img');
            img2.id = 'pageFlipNext';
            div1.appendChild(img2);
        }

        // 再创建当前图片（会放在右边 - 日漫第1页）
        const img1 = this.imageLoader.createImageElement(
            this.pageSections[currentIndex].imageData,
            currentIndex
        );
        img1.id = 'pageFlipCurrent';
        img1.style.cssText = '';
        img1.addEventListener('load', () => {
            this._resizeImages();
        });
        div1.appendChild(img1);

        console.log('[PageFlipDoubleMode] 加载第', currentIndex + 1, '页');
        console.log('[PageFlipDoubleMode] imageLoader.pendingImages.size:', this.imageLoader.pendingImages.size);
        console.log('[PageFlipDoubleMode] imageLoader.pendingImages pages:', Array.from(this.imageLoader.pendingImages.keys()));
    }

    /**
     * 调整图片尺寸（参考老代码的gifImgResize）
     * @private
     */
    _resizeImages() {
        const img = document.getElementById('pageFlipCurrent');
        const img2 = document.getElementById('pageFlipNext');
        const viewport = this.container.querySelector('.comic-pager-viewport');

        if (!img || !viewport) return;

        const picWidth = img.naturalWidth || 0;
        const picHeight = img.naturalHeight || 0;
        const pic2Width = img2?.naturalWidth || 0;
        const pic2Height = img2?.naturalHeight || 0;

        if (picWidth === 0 || picHeight === 0) return;

        // 移动端/平板使用更小的边距(6px)，PC端使用2%
        const isMobileOrTablet = window.innerWidth <= 1024;
        const margin = isMobileOrTablet ? 6 : 0.02;
        const divWidth = isMobileOrTablet
            ? viewport.offsetWidth - margin
            : viewport.offsetWidth * (1 - margin);
        const divHeight = isMobileOrTablet
            ? viewport.offsetHeight - margin
            : viewport.offsetHeight * (1 - margin);

        // 计算img元素的最终宽度和高度（完全参考老代码逻辑）
        let imgWidth, imgHeight;

        if (picWidth < divWidth && picHeight < divHeight) {
            // 能完全容纳 撑满宽
            imgWidth = divWidth;
            imgHeight = picHeight * (divWidth / picWidth);
            if (imgHeight > divHeight) {
                // 撑满高不够了，撑满高
                imgHeight = divHeight;
                imgWidth = picWidth * (divHeight / picHeight);
            }
        }
        else if (picWidth >= divWidth && picHeight < divHeight) {
            // 宽不够, 高够
            imgWidth = divWidth;
            imgHeight = picHeight * (divWidth / picWidth);
        }
        else if (picWidth < divWidth && picHeight >= divHeight) {
            // 宽够， 高不够
            imgHeight = divHeight;
            imgWidth = picWidth * (divHeight / picHeight);
        }
        else {
            // 首先已宽作为基准, 看高能否放下
            imgWidth = divWidth;
            imgHeight = picHeight * (divWidth / picWidth);
            if (imgHeight <= divHeight) {
                // 宽为基准, 高度等比例
            }
            else {
                // 高度为基准， 宽度等比例
                imgHeight = divHeight;
                imgWidth = picWidth * (divHeight / picHeight);
                console.log('[PageFlipDoubleMode] 高度超支');
            }
        }

        // 判断双页的img是否能融入到div中（完全参考老代码逻辑）
        let doubleShow = false;
        if (imgHeight > imgWidth && pic2Height > pic2Width && divHeight < divWidth) {
            // 只有纵向显示的img和横向屏幕有double的效果
            if (imgWidth * 2 <= divWidth) {
                doubleShow = true;
            }
        }

        // 应用尺寸（参考老代码的setgifImg）
        this._setImgStyles(imgWidth, imgHeight, doubleShow);

        console.log('[PageFlipDoubleMode] 调整图片', {
            imgSize: `${picWidth}x${picHeight}`,
            displaySize: `${Math.round(imgWidth)}x${Math.round(imgHeight)}`,
            viewportSize: `${Math.round(divWidth)}x${Math.round(divHeight)}`,
            doubleShow
        });
    }

    /**
     * 设置图片样式（参考老代码的setgifImg）
     * 日漫顺序：右边是当前页，左边是下一页
     * @private
     */
    _setImgStyles(imgWidth, imgHeight, doubleShow = false) {
        const img = document.getElementById('pageFlipCurrent');  // 右边（当前页）
        const img2 = document.getElementById('pageFlipNext');     // 左边（下一页）
        const r = '20px';

        if (!img) return;

        // 设置当前图片（右边）
        img.style.width = imgWidth + 'px';
        img.style.height = imgHeight + 'px';
        img.style.borderRadius = doubleShow ? `0px ${r} ${r} 0px` : r;  // 右边圆角
        img.style.display = 'inline-block';
        img.style.verticalAlign = 'top';

        this.currentDoubleShow = doubleShow;

        if (doubleShow && img2) {
            // 双页显示（左边图片）
            img2.style.width = imgWidth + 'px';
            img2.style.height = imgHeight + 'px';
            img2.style.borderRadius = `${r} 0px 0px ${r}`;  // 左边圆角
            img2.style.display = 'inline-block';
            img2.style.verticalAlign = 'top';
        } else {
            // 单页显示
            if (img2) {
                img2.style.display = 'none';
            }
        }

        // 设置容器居中 - 在父级容器上设置垂直居中
        const div1 = document.getElementById('pageFlip-div1');
        const imgDiv = document.getElementById('pageFlipDiv');
        if (div1 && imgDiv) {
            if (doubleShow) {
                const totalWidth = imgWidth * 2;
                div1.style.width = totalWidth + 'px';
                div1.style.height = imgHeight + 'px';
                div1.style.margin = '0 auto';
            } else {
                div1.style.width = imgWidth + 'px';
                div1.style.height = imgHeight + 'px';
                div1.style.margin = '0 auto';
            }
            // imgDiv (pager-div-horizontal) 设置垂直居中
            imgDiv.style.width = '100%';
            imgDiv.style.height = '100%';
            imgDiv.style.display = 'flex';
            imgDiv.style.justifyContent = 'center';
            imgDiv.style.alignItems = 'center';
        }

        // 更新页码指示器
        this._updatePageIndicator();
    }

    /**
     * 更新页码指示器
     * @private
     */
    _updatePageIndicator() {
        if (!this.controls || !this.controls.indicator) return;

        const currentPage = document.querySelector('.pager-indicator .current-page');
        if (!currentPage) return;

        if (this.currentDoubleShow && this.currentPage < this.pageSections.length) {
            // 双页显示，显示 "1-2" 格式
            currentPage.textContent = `${this.currentPage}-${this.currentPage + 1}`;
        } else {
            // 单页显示，显示 "1" 格式
            currentPage.textContent = `${this.currentPage}`;
        }
    }

    /**
     * 初始化翻页控制
     * @private
     */
    _initControls(flipContainer) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pager-btn prev-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = true;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pager-btn next-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

        const indicator = document.createElement('div');
        indicator.className = 'pager-indicator';
        indicator.innerHTML = '<span class="current-page">1</span> / <span class="total-sections">' + this.pageSections.length + '</span>';

        flipContainer.appendChild(prevBtn);
        flipContainer.appendChild(nextBtn);
        flipContainer.appendChild(indicator);

        this.controls = { prevBtn, nextBtn, indicator };

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
            if (this.gifFlag) return;

            // 滚轮向下（deltaY > 0）翻下一页，滚轮向上翻上一页
            if (e.deltaY > 0) {
                this._nextSection();
            } else if (e.deltaY < 0) {
                this._prevSection();
            }
        }, { passive: false });

        this._initTouchSupport(flipContainer);

        setTimeout(() => this._updateSection(), 100);
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
                        this._prevSection();
                    } else {
                        this._nextSection();
                    }
                }
            } else {
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
     * 上一页（带3D翻页动画）
     * @private
     */
    _prevSection() {
        if (this.gifFlag || this.isAnimating) return;

        this.gifFlag = true;
        setTimeout(() => {
            this.gifFlag = false;
        }, this.timeSkip);

        if (this.currentPage > 1) {
            // 根据当前是否双页决定退几页
            const newPage = this.currentPage - (this.currentDoubleShow ? 2 : 1);
            if (newPage < 1) {
                this.gifFlag = false;
                return;
            }

            // 执行3D翻页动画
            this._animateFlip('prev', () => {
                this.currentPage = newPage;
                this.currentSection = this.currentPage - 1;
                this._loadCurrentSection();
                this._updateSection();
                this._onPageAction();
            });
        }
    }

    /**
     * 下一页（带3D翻页动画）
     * @private
     */
    _nextSection() {
        if (this.gifFlag || this.isAnimating) return;

        this.gifFlag = true;
        setTimeout(() => {
            this.gifFlag = false;
        }, this.timeSkip);

        if (this.currentPage < this.pageSections.length) {
            // 根据当前是否双页决定进几页
            const newPage = this.currentPage + (this.currentDoubleShow ? 2 : 1);
            if (newPage > this.pageSections.length) {
                this.gifFlag = false;
                return;
            }

            // 执行3D翻页动画
            this._animateFlip('next', () => {
                this.currentPage = newPage;
                this.currentSection = this.currentPage - 1;
                this._loadCurrentSection();
                this._updateSection();
                this._onPageAction();
            });
        }
    }

    /**
     * 更新页面显示
     * @private
     */
    _updateSection() {
        // 更新按钮状态
        this.controls.prevBtn.disabled = this.currentPage === 1;
        this.controls.nextBtn.disabled = this.currentPage >= this.pageSections.length;

        // 更新页码指示器
        this._updatePageIndicator();

        console.log('[PageFlipDoubleMode] 翻到第', this.currentPage, '页');

        // 触发预下载（每翻页10页预下载一次）
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

        // 检查是否需要触发预下载（每10页触发一次）
        if (this.currentPage % preloadTrigger === 1 || this.currentPage === 1) {
            const startPage = this.currentPage;
            const endPage = Math.min(startPage + preloadAhead - 1, this.pageSections.length);
            console.log(`[PageFlipDoubleMode] 触发预下载: 第${startPage}-${endPage}页`);
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
            this.heightCalculator.applyHeight(flipContainer, 'page-flip-double', () => {
                this._resizeImages();
            });
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
     * 单页前翻（一次只翻一页，不受双页模式影响）
     */
    flipSinglePrev() {
        if (this.gifFlag || this.isAnimating) return;
        if (this.currentPage <= 1) return;

        this.gifFlag = true;
        setTimeout(() => { this.gifFlag = false; }, this.timeSkip);

        // 单页前翻
        this.currentPage -= 1;
        this.currentSection = this.currentPage - 1;

        // 添加翻页动画
        this._animateFlip('prev', () => {
            this._loadCurrentSection();
            this._updateSection();
            this._onPageAction();
        });
    }

    /**
     * 单页后翻（一次只翻一页，不受双页模式影响）
     */
    flipSingleNext() {
        if (this.gifFlag || this.isAnimating) return;
        if (this.currentPage >= this.pageSections.length) return;

        this.gifFlag = true;
        setTimeout(() => { this.gifFlag = false; }, this.timeSkip);

        // 单页后翻
        this.currentPage += 1;
        this.currentSection = this.currentPage - 1;

        // 添加翻页动画
        this._animateFlip('next', () => {
            this._loadCurrentSection();
            this._updateSection();
            this._onPageAction();
        });
    }

    /**
     * 跳转到指定页
     * @param {number} pageIndex - 页码索引（0-based）
     */
    goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.pageSections.length) return;
        const targetPage = pageIndex + 1; // 转为1-based
        if (targetPage === this.currentPage) return;

        this.currentPage = targetPage;
        this.currentSection = pageIndex;
        this._loadCurrentSection();
        this._updateSection();
        this._onPageAction();
        console.log('[PageFlipDoubleMode] 跳转到第', this.currentPage, '页');
    }

    /**
     * 执行3D翻页动画 - 真正的翻书效果
     * @private
     */
    _animateFlip(direction, callback) {
        const div1 = document.getElementById('pageFlip-div1');
        if (!div1) {
            callback();
            return;
        }

        this.isAnimating = true;

        // 设置3D环境
        const viewport = this.container.querySelector('.comic-pager-viewport');
        if (viewport) {
            viewport.style.perspective = '2000px';
            viewport.style.perspectiveOrigin = 'center center';
        }
        div1.style.transformStyle = 'preserve-3d';
        div1.style.backfaceVisibility = 'hidden';

        if (direction === 'next') {
            // 向后翻页（下一页）- 当前页从右向左翻转
            div1.style.transformOrigin = 'left center';
            div1.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.645, 0.045, 0.355, 1)`;
            div1.style.transform = 'rotateY(-180deg)';
        } else {
            // 向前翻页（上一页）- 当前页从左向右翻转
            div1.style.transformOrigin = 'right center';
            div1.style.transition = `transform ${this.animationDuration}ms cubic-bezier(0.645, 0.045, 0.355, 1)`;
            div1.style.transform = 'rotateY(180deg)';
        }

        // 动画结束后恢复并回调
        setTimeout(() => {
            div1.style.transition = 'none';
            div1.style.transform = 'rotateY(0deg)';
            this.isAnimating = false;
            callback();
        }, this.animationDuration);
    }

    /**
     * 销毁模式
     */
    destroy() {
        console.log('[PageFlipDoubleMode] 销毁模式');
        this.pageSections = [];
        this.currentSection = 0;
        this.gifFlag = false;
        clearTimeout(this.resizeTimeout);
        super.destroy();
    }
}

// 导出到全局
window.PageFlipDoubleMode = PageFlipDoubleMode;
