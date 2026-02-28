/**
 * 无缝滚动模式 - 下拉式无缝阅读
 * 纵向滚动，横向禁止，图片之间无间隙
 */
class ScrollSeamlessMode extends ReadModeBase {
    constructor(container, imageLoader, heightCalculator) {
        super(container, imageLoader, heightCalculator);
        this.modeName = 'scroll-seamless';
    }

    /**
     * 渲染无缝滚动模式
     * @param {Array} images - 图片数据数组
     */
    render(images) {
        console.log('[ScrollSeamlessMode] 渲染无缝滚动模式', images.length, '张图片');

        // 清空容器
        this.container.innerHTML = '';
        this.container.className = 'comic-images-container scroll-seamless-mode';

        // 更新body class
        this._updateBodyClass();

        // 配置容器滚动行为
        ScrollbarController.configureContainer(this.container, 'scroll-seamless');

        // 配置主内容区域
        const mainContent = document.querySelector('.main-content');
        ScrollbarController.configureMainContent(mainContent, 'scroll-seamless');

        // 初始化悬浮控件
        this._initFloatingControls();

        // 渲染图片（使用 comic-image-container 包装）
        const fragment = document.createDocumentFragment();
        images.forEach((imgData, index) => {
            // 创建图片容器包装元素
            const imgContainer = document.createElement('div');
            imgContainer.className = 'comic-image-container seamless';
            imgContainer.dataset.page = imgData.page;

            // 创建图片元素
            const imgEl = this.imageLoader.createImageElement(imgData, index);
            imgContainer.appendChild(imgEl);

            // 添加页码指示器（半透明，不干扰阅读）
            const pageBadge = document.createElement('div');
            pageBadge.className = 'page-indicator-badge seamless';
            pageBadge.textContent = `${index + 1}`;
            pageBadge.dataset.page = imgData.page;
            imgContainer.appendChild(pageBadge);

            fragment.appendChild(imgContainer);
        });
        this.container.appendChild(fragment);

        // 确保横向无滚动条
        ScrollbarController.preventHorizontalScrollbar(this.container);

        // 绑定滚动事件，滚动时隐藏悬浮控件
        this._initScrollListener();

        console.log('[ScrollSeamlessMode] 渲染完成');
    }

    /**
     * 初始化滚动监听器
     * @private
     */
    _initScrollListener() {
        const scrollHandler = () => {
            this._onPageAction();
        };
        this._addEventListener(this.container, 'scroll', scrollHandler);
    }

    /**
     * 销毁模式
     */
    destroy() {
        console.log('[ScrollSeamlessMode] 销毁模式');
        super.destroy();
    }
}

// 导出到全局
window.ScrollSeamlessMode = ScrollSeamlessMode;
