// 状态管理
const appState = {
    currentPage: 'list',
    scrollPositions: {},
    currentComicId: null
};

// 页面模板 - 修改为使用ID作为容器
const templates = {
    list: `
        <div id="list">
            <div class="comic-list">
                <!-- 漫画列表将通过AJAX加载 -->
                <div class="loading">加载中...</div>
            </div>
        </div>
    `,
    detail: `
        <div id="detail">
            <a href="#list" class="back-btn">← 返回列表</a>
            <div class="comic-detail-content">
                <!-- 漫画详情将通过AJAX加载 -->
                <div class="loading">加载中...</div>
            </div>
        </div>
    `,
    search: `
        <div id="search">
            <h2>高级搜索</h2>
            <div class="search-content">
                <!-- 搜索内容将通过AJAX加载 -->
                <p>搜索功能开发中...</p>
            </div>
        </div>
    `
};

// 初始化应用
$(document).ready(function() {
    // 监听hash变化
    $(window).on('hashchange', handleRoute);

    // 初始路由处理
    handleRoute();

    // 阻止链接默认行为
    $(document).on('click', 'a[href^="#"]', function(e) {
        e.preventDefault();
        const route = $(this).attr('href').substring(1);
        navigateTo(route);
    });
});

// 路由处理
function handleRoute() {
    const hash = window.location.hash.substring(1) || 'list';
    const [page, ...params] = hash.split('/');

    // 保存当前滚动位置
    saveScrollPosition();

    // 更新导航栏活动状态
    updateNavActiveState(page);

    // 加载对应页面
    loadPage(page, params);

    // 恢复滚动位置
    setTimeout(restoreScrollPosition, 50);
}

// 加载页面内容
function loadPage(page, params) {
    appState.currentPage = page;

    // 设置页面内容
    $('#content-container').html(templates[page] || templates.list);

    // 加载具体数据
    switch(page) {
        case 'list':
            loadComicList();
            break;
        case 'detail':
            const comicId = params[0];
            if (comicId) {
                appState.currentComicId = comicId;
                loadComicDetail(comicId);
            }
            break;
        case 'search':
            loadSearchPage();
            break;
        default:
            loadComicList();
    }
}

// 加载漫画列表
function loadComicList(page = 1) {
    const requestData = {
        prefix: "cm",
        page: page,
        type: "list",
        search: null,
        history: null,
        mark: null,
        order: null,
        order_type: null,
        tags: "[]"
    };

    $.ajax({
        url: 'response',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
            if(response && response.data) {
                renderComicList(response.data, response.count);
            } else {
                $('#list .comic-list').html('<div class="error">数据加载失败</div>');
            }
        },
        error: function(xhr, status, error) {
            $('#list .comic-list').html(`<div class="error">加载失败: ${error}</div>`);
        }
    });
}

// 渲染漫画列表 - 更新选择器以匹配新的HTML结构
function renderComicList(comics, totalCount) {
    let html = '';

    // 添加分页控件
    html += `<div class="pagination">
        <span class="total-count">共 ${totalCount} 部漫画</span>
        <div class="page-controls">
            <button class="page-btn prev">上一页</button>
            <span class="current-page">第1页</span>
            <button class="page-btn next">下一页</button>
        </div>
    </div>`;

    // 添加漫画列表
    html += '<div class="comic-grid">';

    comics.forEach(comic => {
        html += `
            <div class="comic-item" data-id="${comic._id}">
                <div class="comic-cover">
                    <img src="${comic.pic}" alt="${comic.title}" loading="lazy">
                    ${comic.thumb_load === 1 ? '<div class="loading-badge">加载中</div>' : ''}
                </div>
                <div class="comic-info">
                    <h3 class="comic-title">${comic.title}</h3>
                    <p class="comic-meta">
                        <span class="author">${comic.author.join(' / ')}</span>
                        <span class="update-time">${formatDate(comic.update_time)}</span>
                    </p>
                    <div class="comic-stats">
                        <span class="likes">♥ ${comic.albim_likes}</span>
                        <span class="readers">👁 ${comic.readers}</span>
                    </div>
                    <div class="comic-tags">
                        ${comic.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';

    // 更新选择器以匹配新的HTML结构
    $('#list .comic-list').html(html);

    // 绑定点击事件
    $('#list .comic-item').on('click', function() {
        const comicId = $(this).data('id');
        navigateTo('detail', [comicId]);
    });

    // 绑定分页按钮事件
    $('#list .page-btn.prev').on('click', function() {
        // 上一页逻辑
    });

    $('#list .page-btn.next').on('click', function() {
        // 下一页逻辑
    });
}


// 日期格式化辅助函数
function formatDate(dateString) {
    if(!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}


// 阅读章节
function readChapter(chapterId) {
    // 标记为已读
    $(`tr[data-chapter-id="${chapterId}"] .read-date`).text(new Date().toLocaleString());
    $(`tr[data-chapter-id="${chapterId}"] .new-badge`).remove();
    
    // 这里可以添加实际阅读逻辑
    console.log('阅读章节:', chapterId);
}

// 加载搜索页
function loadSearchPage() {
    // 搜索页加载逻辑
    $('.search-content').html(`
        <div class="search-panel">
            <!-- 搜索表单和标签 -->
            <p>搜索功能开发中...</p>
        </div>
    `);
}

