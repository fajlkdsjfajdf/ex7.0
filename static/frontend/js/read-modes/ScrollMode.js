/**
 * 滚动模式 - 下拉式阅读
 * 纵向滚动，横向禁止
 */
class ScrollMode extends ReadModeBase {
    constructor(container, imageLoader, heightCalculator) {
        super(container, imageLoader, heightCalculator);
        this.modeName = 'scroll';
    }

    /**
     * 渲染滚动模式
     * @param {Array} images - 图片数据数组
     */
    render(images) {
        console.log('[ScrollMode] 渲染滚动模式', images.length, '张图片');

        // 清空容器
        this.container.innerHTML = '';
        this.container.className = 'comic-images-container scroll-mode';

        // 更新body class
        this._updateBodyClass();

        // 配置容器滚动行为
        ScrollbarController.configureContainer(this.container, 'scroll');

        // 配置主内容区域
        const mainContent = document.querySelector('.main-content');
        ScrollbarController.configureMainContent(mainContent, 'scroll');

        // 初始化悬浮控件
        this._initFloatingControls();

        // 渲染图片（使用 comic-image-container 包装）
        const fragment = document.createDocumentFragment();
        images.forEach((imgData, index) => {
            // 创建图片容器包装元素
            const imgContainer = document.createElement('div');
            imgContainer.className = 'comic-image-container';
            imgContainer.dataset.page = imgData.page;

            // 创建图片元素
            const imgEl = this.imageLoader.createImageElement(imgData, index);
            imgContainer.appendChild(imgEl);

            // 添加页码指示器
            const pageBadge = document.createElement('div');
            pageBadge.className = 'page-indicator-badge';
            pageBadge.textContent = `${index + 1}/${images.length}`;
            pageBadge.dataset.page = imgData.page;
            imgContainer.appendChild(pageBadge);

            fragment.appendChild(imgContainer);
        });
        this.container.appendChild(fragment);

        // 确保横向无滚动条
        ScrollbarController.preventHorizontalScrollbar(this.container);

        // 绑定滚动事件，滚动时隐藏悬浮控件
        this._initScrollListener();

        console.log('[ScrollMode] 渲染完成');
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
        console.log('[ScrollMode] 销毁模式');
        super.destroy();
    }
}

// 导出到全局
window.ScrollMode = ScrollMode;
