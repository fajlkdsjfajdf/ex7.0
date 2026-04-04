/**
 * 列表页逻辑
 * 处理漫画列表的加载、翻页、搜索等功能
 */
(function() {
    'use strict';

    // ========== 全局变量 ==========
    let allComics = [];
    let filteredComics = [];
    let currentPage = 1;
    let totalPages = 1;
    let totalComics = 0;
    let isLoading = false;
    let hasMore = true;
    let isSearchMode = false;
    let currentSearchKeyword = '';
    let currentSearchMode = 'all'; // 搜索模式：exact/vector/all

    // 移动端滚动翻页相关变量
    let lastScrollTop = 0;
    let scrollDirection = '';
    let scrollCount = 0;
    let scrollTimer = null;
    const SCROLL_THRESHOLD = 3; // 连续滚动次数阈值

    // 当前站点ID
    let currentSiteId = 'cm';

    // DOM元素
    const comicGrid = document.getElementById('comicGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');
    const searchStatusBar = document.getElementById('searchStatusBar');
    const searchKeywordDisplay = document.getElementById('searchKeywordDisplay');
    const searchPageDisplay = document.getElementById('searchPageDisplay');
    const searchTotalDisplay = document.getElementById('searchTotalDisplay');
    const searchModeDisplay = document.getElementById('searchModeDisplay');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    // ========== 初始化站点ID ==========
    function initSiteId() {
        // 优先从URL参数获取站点ID
        const urlParams = new URLSearchParams(window.location.search);
        const urlSiteId = urlParams.get('site');
        if (urlSiteId) {
            currentSiteId = urlSiteId;
            // 保存到localStorage以便下次使用
            localStorage.setItem('current_site_id', urlSiteId);
        } else {
            // 如果URL没有参数，从localStorage获取
            const savedSiteId = localStorage.getItem('current_site_id');
            if (savedSiteId) {
                currentSiteId = savedSiteId;
            }
        }

        // 初始化智能图片加载器
        if (window.SmartImageLoader) {
            window.SmartImageLoader.setSiteId(currentSiteId);
        }

        console.log(`[初始化] 当前站点: ${currentSiteId}`);
    }

    // ========== 搜索状态管理 ==========
    /**
     * 更新URL参数以反映当前搜索状态
     */
    function updateURLWithSearchState() {
        const urlParams = new URLSearchParams(window.location.search);

        if (isSearchMode && currentSearchKeyword) {
            // 在搜索模式，更新URL参数
            urlParams.set('search', currentSearchKeyword);
            urlParams.set('page', currentPage.toString());
            urlParams.set('mode', currentSearchMode);
            urlParams.set('site', currentSiteId);

            // 保存搜索状态到localStorage（用于跨页面恢复）
            localStorage.setItem('lastSearchState', JSON.stringify({
                search: currentSearchKeyword,
                page: currentPage.toString(),
                mode: currentSearchMode,
                site: currentSiteId,
                timestamp: Date.now()
            }));

            // 同时清除浏览状态（避免冲突）
            localStorage.removeItem(`lastBrowseState_${currentSiteId}`);
        } else {
            // 非搜索模式，移除搜索相关参数
            urlParams.delete('search');
            urlParams.delete('page');
            urlParams.delete('mode');
            urlParams.set('site', currentSiteId);

            // 清除localStorage中的搜索状态
            localStorage.removeItem('lastSearchState');

            // 保存普通浏览状态（页码）
            localStorage.setItem(`lastBrowseState_${currentSiteId}`, JSON.stringify({
                page: currentPage.toString(),
                site: currentSiteId,
                timestamp: Date.now()
            }));
        }

        // 使用replaceState避免创建过多历史记录
        const newURL = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({scrollPos: window.scrollY}, '', newURL);

        // 更新搜索状态提示条显示
        updateSearchStatusBar();
    }

    /**
     * 更新搜索状态提示条显示
     */
    function updateSearchStatusBar() {
        if (!searchStatusBar) return;

        if (isSearchMode && currentSearchKeyword) {
            searchStatusBar.style.display = 'flex';
            searchKeywordDisplay.textContent = currentSearchKeyword;
            searchPageDisplay.textContent = currentPage;
            searchTotalDisplay.textContent = totalComics;

            // 显示搜索模式
            const modeText = {
                'exact': '精准搜索',
                'vector': '向量搜索',
                'all': '混合搜索'
            };
            searchModeDisplay.textContent = modeText[currentSearchMode] || '混合搜索';
        } else {
            searchStatusBar.style.display = 'none';
        }
    }

    /**
     * 从URL参数恢复搜索状态
     */
    function restoreSearchStateFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const savedSearch = urlParams.get('search');
        const savedPage = urlParams.get('page');
        const savedMode = urlParams.get('mode');
        const savedSiteId = urlParams.get('site');

        // 恢复站点ID
        if (savedSiteId) {
            currentSiteId = savedSiteId;
            localStorage.setItem('current_site_id', savedSiteId);
        }

        // 如果有搜索参数，恢复搜索状态
        if (savedSearch && savedSearch.trim()) {
            console.log(`[搜索状态恢复] 关键词: ${savedSearch}, 页码: ${savedPage}, 模式: ${savedMode}`);

            // 设置搜索状态变量
            currentSearchKeyword = savedSearch;
            currentSearchMode = savedMode || 'all';
            isSearchMode = true;

            // 触发搜索（使用保存的页码）
            if (savedPage) {
                currentPage = parseInt(savedPage);
            }

            // 执行搜索（不等待结果，让它在后台执行）
            performRestoredSearch(savedSearch, savedPage || 1, currentSearchMode).catch(err => {
                console.error('恢复搜索失败:', err);
            });

            return true; // 表示已恢复搜索状态
        }

        return false; // 没有搜索状态需要恢复
    }

    /**
     * 执行恢复的搜索
     */
    async function performRestoredSearch(keyword, page, mode) {
        try {
            showLoading(); // 显示加载状态
            const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}&site=${currentSiteId}&page=${page}&per_page=50&mode=${mode}`);
            const data = await response.json();

            if (data.comics && data.comics.length > 0) {
                filteredComics = data.comics;
                totalComics = data.total;
                totalPages = data.pages;
                currentPage = parseInt(page);

                renderComics(filteredComics);
                updatePaginationUI();
                updateSearchStatusBar(); // 更新搜索状态提示条

                // 恢复滚动位置（从sessionStorage）
                setTimeout(() => {
                    const scrollPos = sessionStorage.getItem('scrollPos');
                    if (scrollPos) {
                        window.scrollTo(0, parseInt(scrollPos));
                        sessionStorage.removeItem('scrollPos'); // 清除已使用的滚动位置
                    }
                }, 300);

                // 隐藏加载状态
                hideLoading();

                Utils.showToast(`已恢复搜索: ${data.total} 部漫画 (精准:${data.sources.exact}, 向量:${data.sources.vector})`, 'info');
            } else {
                // 搜索无结果，退出搜索模式
                isSearchMode = false;
                currentSearchKeyword = '';
                filteredComics = [];
                totalComics = 0;
                totalPages = 1;
                currentPage = 1;

                renderComics([]);
                updatePaginationUI();

                // 隐藏加载状态
                hideLoading();

                Utils.showToast('搜索无结果', 'info');
            }
        } catch (error) {
            console.error('恢复搜索失败:', error);

            // 隐藏加载状态
            hideLoading();

            Utils.showToast('恢复搜索失败', 'error');
        }
    }

    /**
     * 清除搜索状态并返回全部数据视图
     */
    function clearSearchState() {
        // 重置搜索相关变量
        isSearchMode = false;
        currentSearchKeyword = '';
        currentSearchMode = 'all';

        // 重置分页状态
        currentPage = 1;
        totalPages = 1;

        // 重新加载全部数据
        loadComics(1, false);

        // 更新URL移除搜索参数
        updateURLWithSearchState();

        Utils.showToast('已清除搜索状态', 'info');
    }

    /**
     * 清空搜索（用户主动点击清空搜索按钮）
     */
    function clearSearch() {
        clearSearchState();
    }

    // ========== 检查登录状态 ==========
    async function checkLoginStatus() {
        try {
            // 调用后端 API 验证 session 状态
            const response = await fetch('/api/user/current');
            const data = await response.json();

            if (data.success && data.user) {
                // 后端 session 有效，同步更新 localStorage
                Utils.storage.set('current_user', data.user);
                console.log('[登录检查] 用户已登录:', data.user.username);
                return true;
            } else {
                // 后端 session 无效，清除 localStorage 并跳转登录页
                Utils.storage.remove('current_user');
                console.log('[登录检查] 用户未登录，跳转登录页');
                window.location.href = '/login.html';
                return false;
            }
        } catch (error) {
            console.error('[登录检查] 验证失败:', error);
            // 网络错误时，跳转登录页
            window.location.href = '/login.html';
            return false;
        }
    }

    // ========== 加载漫画数据 ==========
    async function loadComics(page = 1, append = false) {
        if (isLoading) return;

        isLoading = true;
        showLoading();

        try {
            let result;

            // 如果是搜索模式，使用搜索 API
            if (isSearchMode && currentSearchKeyword) {
                const response = await fetch(`/api/search?q=${encodeURIComponent(currentSearchKeyword)}&site=${currentSiteId}&page=${page}&per_page=50&mode=${currentSearchMode}`);
                result = await response.json();
                // 转换搜索结果格式以匹配 loadComics 的预期格式
                result = {
                    success: true,
                    comics: result.comics || [],
                    total: result.total || 0,
                    pages: result.pages || 1
                };
            } else {
                // 获取排序模式
                const sortMode = window.Settings ? Settings.get('sortMode') : 'latest';
                const response = await fetch(`/api/${currentSiteId}/comics?page=${page}&per_page=50&sort=${sortMode}`);
                result = await response.json();
            }

            if (result.success && result.comics) {
                const newComics = result.comics;

                if (append) {
                    allComics = allComics.concat(newComics);
                } else {
                    allComics = newComics;
                }

                filteredComics = [...allComics];
                hasMore = page < result.pages;
                currentPage = page;
                totalPages = result.pages || 1;
                totalComics = result.total || 0;

                renderComics(filteredComics);
                updatePaginationUI();

                // 更新URL以反映当前状态（搜索模式或翻页）
                updateURLWithSearchState();

                // 隐藏加载状态
                hideLoading();

                // 显示结果数量
                if (result.total > 0) {
                    console.log(`已加载 ${allComics.length}/${result.total} 部漫画`);
                }
            } else {
                console.error('加载漫画数据失败:', result.error);
                Utils.showToast('加载失败，请刷新页面重试', 'error');
                showEmptyState();
                hideLoading();
            }

        } catch (error) {
            console.error('加载漫画数据失败:', error);
            Utils.showToast('加载失败，请检查网络连接', 'error');
            showEmptyState();
            hideLoading();
        } finally {
            isLoading = false;
        }
    }

    // ========== 渲染漫画列表 ==========
    function renderComics(comics) {
        if (!comics || comics.length === 0) {
            showEmptyState();
            return;
        }

        hideEmptyState();
        comicGrid.innerHTML = '';

        const comicsToLoad = []; // 收集需要加载图片的漫画

        comics.forEach(comic => {
            const card = createComicCard(comic);
            comicGrid.appendChild(card);

            // 收集图片元素用于批量加载
            const imgElement = card.querySelector('.comic-cover-img');
            if (imgElement) {
                comicsToLoad.push({
                    aid: comic.aid,
                    imgElement: imgElement,
                    comic: comic
                });

                // 先设置等待图片
                imgElement.src = '/static/common/images/waiting-image.svg';
                imgElement.dataset.status = 'loading';
            }
        });

        // 批量检查并加载图片（只检查存在的，不存在的不触发任务）
        batchLoadImages(comicsToLoad);
    }

    // ========== 创建漫画卡片 ==========
    function createComicCard(comic) {
        const card = document.createElement('div');
        card.className = 'comic-card';
        card.dataset.aid = comic.aid;
        card.dataset.id = comic.id;

        // 处理状态徽章（左上角）
        const statusBadge = comic.is_end ?
            '<div class="comic-badge">完结</div>' :
            '<div class="comic-badge" style="background-color: var(--color-success);">更新</div>';

        // 处理类型徽章（右上角，去重）
        const types = comic.types || [];
        const uniqueTypes = [...new Set(types)];
        const typeBadges = uniqueTypes.slice(0, 3).map(type =>
            `<span class="comic-badge-type">${type}</span>`
        ).join('');
        const typeBadgesHtml = typeBadges ?
            `<div class="comic-badges-right">${typeBadges}</div>` : '';

        // 格式化阅读数和喜爱数
        const readersText = formatCount(comic.readers || 0);
        const likesText = formatCount(comic.likes || comic.favorites || 0);

        // 处理标签（原来的types位置，现在放其他标签）
        const tags = (comic.tags || []).slice(0, 3).map(tag =>
            `<span class="comic-tag">${tag}</span>`
        ).join('');

        // 格式化更新时间
        const updateTime = formatDate(comic.updated_at || comic.updated_at);
        const updateTimeHtml = updateTime ? `<span class="comic-update-time"><i class="far fa-clock"></i>${updateTime}</span>` : '';

        // 图片页数（如果有的话）
        const pageCount = comic.page_count || comic.pages || comic.filecount || 0;

        card.innerHTML = `
            <div class="comic-cover">
                <img data-comic-id="${comic.aid}" alt="${escapeHtml(comic.title)}" loading="lazy" class="comic-cover-img">
                ${statusBadge}
                ${typeBadgesHtml}
                <div class="comic-cover-stats">
                    <div class="comic-stat left">
                        <i class="fas fa-eye"></i>
                        <span>${readersText}</span>
                    </div>
                    <div class="comic-stat right">
                        <i class="fas fa-heart"></i>
                        <span>${likesText}</span>
                    </div>
                </div>
            </div>
            <div class="comic-info">
                <h3 class="comic-title" title="${escapeHtml(comic.title)}">${escapeHtml(comic.title)}</h3>
                <div class="comic-tags">${tags || '<span class="comic-tags-empty">无标签</span>'}</div>
                ${updateTimeHtml}
                <div class="comic-meta">
                    <span>${comic.list_count || 0}话</span>
                    <span>${pageCount}页</span>
                </div>
            </div>
        `;

        // 点击卡片跳转到详情页
        card.addEventListener('click', () => {
            // 保存当前滚动位置到sessionStorage
            sessionStorage.setItem('scrollPos', window.scrollY.toString());

            // 保存搜索状态信息
            if (isSearchMode) {
                sessionStorage.setItem('searchState', JSON.stringify({
                    search: currentSearchKeyword,
                    page: currentPage.toString(),
                    mode: currentSearchMode
                }));
            } else {
                sessionStorage.removeItem('searchState');
            }

            // 构建详情页URL，保持搜索状态参数
            let detailUrl = `/info.html?site=${currentSiteId}&aid=${comic.aid}`;

            // 如果是搜索模式，添加搜索参数到URL
            if (isSearchMode && currentSearchKeyword) {
                detailUrl += `&search=${encodeURIComponent(currentSearchKeyword)}`;
                detailUrl += `&page=${currentPage}`;
                detailUrl += `&mode=${currentSearchMode}`;
            }

            // 跳转到详情页
            window.location.href = detailUrl;
        });

        return card;
    }

    // ========== 批量加载图片 ==========
    function batchLoadImages(comicsToLoad) {
        if (!comicsToLoad.length) return;

        if (window.SmartImageLoader) {
            // 使用批量加载
            window.SmartImageLoader.batchLoadCoverImages(comicsToLoad);
        } else {
            // 回退：使用原有的直接加载逻辑
            comicsToLoad.forEach(item => {
                const comic = item.comic;
                const imgElement = item.imgElement;

                if (comic.cover_file_id) {
                    const coverUrl = `/api/media/image?file_id=${comic.cover_file_id}&site_id=${currentSiteId}`;
                    loadImageWithFallback(imgElement, coverUrl, comic.aid);
                } else if (comic.pic) {
                    loadImageWithFallback(imgElement, comic.pic, comic.aid);
                } else {
                    imgElement.src = '/static/common/images/default-cover.png';
                    imgElement.dataset.loaded = 'true';
                }
            });
        }
    }

    // ========== 图片加载与回退处理 ==========
    function loadImageWithFallback(imgElement, url, comicId) {
        // 设置初始src
        imgElement.src = url;
        imgElement.dataset.loaded = 'true';

        // 监听加载失败，使用智能加载器
        imgElement.addEventListener('error', function() {
            console.log(`[列表页] 图片加载失败，尝试智能加载: ${comicId}`);

            // 如果智能加载器可用，触发按需爬取
            if (window.SmartImageLoader) {
                window.SmartImageLoader.loadCoverImage(comicId, imgElement, '/static/common/images/default-cover.png');
            } else {
                // 回退到默认封面
                imgElement.src = '/static/common/images/default-cover.png';
                imgElement.dataset.loaded = 'true';
            }
        });

        // 标记加载成功
        imgElement.addEventListener('load', function() {
            imgElement.dataset.loaded = 'true';
        });
    }

    // ========== 格式化数字（阅读数、喜爱数等） ==========
    function formatCount(count) {
        if (count >= 10000) {
            return (count / 10000).toFixed(1) + '万+';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k+';
        }
        return count.toString();
    }

    // ========== HTML转义 ==========
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== 格式化日期 ==========
    function formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // 显示完整日期：YYYY-MM-DD
        return `${year}-${month}-${day}`;
    }

    // ========== 显示/隐藏加载状态 ==========
    function showLoading() {
        if (loadingSpinner) loadingSpinner.style.display = 'flex';
        if (comicGrid) comicGrid.style.display = 'none';
    }

    function hideLoading() {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (comicGrid) comicGrid.style.display = 'grid';
    }

    // ========== 显示/隐藏空状态 ==========
    function showEmptyState() {
        if (comicGrid) comicGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }

    function hideEmptyState() {
        if (comicGrid) comicGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
    }

    // ========== 翻页功能 ==========
    function updatePaginationUI() {
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('paginationInfo');
        const totalPagesDisplay = document.getElementById('totalPagesDisplay');

        // 更新页码显示
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
        if (totalPagesDisplay) {
            totalPagesDisplay.textContent = totalPages;
        }

        // 更新按钮状态
        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages || page === currentPage || isLoading) {
            return;
        }

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 加载指定页
        loadComics(page, false);
    }

    function goToPrevPage() {
        goToPage(currentPage - 1);
    }

    function goToNextPage() {
        goToPage(currentPage + 1);
    }

    // ========== 跳转弹窗功能 ==========
    function openJumpModal() {
        const overlay = document.getElementById('jumpModalOverlay');
        const input = document.getElementById('jumpPageInput');

        if (overlay && input) {
            input.value = currentPage;
            input.max = totalPages;
            overlay.classList.add('active');
            input.focus();
            input.select();
        }
    }

    function closeJumpModal() {
        const overlay = document.getElementById('jumpModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    function confirmJump() {
        const input = document.getElementById('jumpPageInput');
        if (input) {
            const page = parseInt(input.value);
            if (page >= 1 && page <= totalPages) {
                goToPage(page);
                closeJumpModal();
            } else {
                Utils.showToast(`请输入1-${totalPages}之间的页码`, 'warning');
            }
        }
    }

    // ========== 显示滚动提示 ==========
    function showScrollHint(message) {
        const hint = document.getElementById('scrollHint');
        if (hint) {
            hint.textContent = message;
            hint.classList.add('show');

            setTimeout(() => {
                hint.classList.remove('show');
            }, 1500);
        }
    }

    // ========== 移动端滚动翻页 ==========
    function handleScrollForPagination() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;

        // 检测滚动方向
        if (scrollTop > lastScrollTop) {
            scrollDirection = 'down';
        } else if (scrollTop < lastScrollTop) {
            scrollDirection = 'up';
        }

        lastScrollTop = scrollTop;

        // 清除之前的定时器
        if (scrollTimer) {
            clearTimeout(scrollTimer);
        }

        // 设置新的定时器来检测连续滚动
        scrollTimer = setTimeout(() => {
            if (scrollDirection === 'down' && scrollTop + clientHeight >= scrollHeight - 50) {
                // 滚动到底部，增加计数
                scrollCount++;

                if (scrollCount >= SCROLL_THRESHOLD && currentPage < totalPages) {
                    showScrollHint(`正在前往第 ${currentPage + 1} 页...`);
                    scrollCount = 0;
                    setTimeout(() => goToNextPage(), 300);
                } else if (scrollCount >= SCROLL_THRESHOLD) {
                    showScrollHint('已经是最后一页了');
                    scrollCount = 0;
                }
            } else if (scrollDirection === 'up' && scrollTop <= 50) {
                // 滚动到顶部，增加计数
                scrollCount++;

                if (scrollCount >= SCROLL_THRESHOLD && currentPage > 1) {
                    showScrollHint(`正在前往第 ${currentPage - 1} 页...`);
                    scrollCount = 0;
                    setTimeout(() => goToPrevPage(), 300);
                } else if (scrollCount >= SCROLL_THRESHOLD) {
                    showScrollHint('已经是第一页了');
                    scrollCount = 0;
                }
            } else {
                // 重置计数
                scrollCount = 0;
            }
        }, 150);
    }

    // ========== 初始化翻页事件 ==========
    function initPaginationEvents() {
        // 上一页按钮
        const prevBtn = document.getElementById('prevPageBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', goToPrevPage);
        }

        // 下一页按钮
        const nextBtn = document.getElementById('nextPageBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', goToNextPage);
        }

        // 跳转按钮
        const jumpBtn = document.getElementById('jumpPageBtn');
        if (jumpBtn) {
            jumpBtn.addEventListener('click', openJumpModal);
        }

        // 跳转弹窗事件
        const jumpModalCancel = document.getElementById('jumpModalCancel');
        const jumpModalConfirm = document.getElementById('jumpModalConfirm');
        const jumpModalOverlay = document.getElementById('jumpModalOverlay');
        const jumpPageInput = document.getElementById('jumpPageInput');

        if (jumpModalCancel) {
            jumpModalCancel.addEventListener('click', closeJumpModal);
        }
        if (jumpModalConfirm) {
            jumpModalConfirm.addEventListener('click', confirmJump);
        }
        if (jumpModalOverlay) {
            jumpModalOverlay.addEventListener('click', function(e) {
                if (e.target === jumpModalOverlay) {
                    closeJumpModal();
                }
            });
        }
        if (jumpPageInput) {
            jumpPageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    confirmJump();
                }
            });
        }

        // 移动端滚动翻页 (仅在移动设备上启用)
        if (window.innerWidth <= 992) {
            window.addEventListener('scroll', handleScrollForPagination);
        }
    }

    // ========== 监听搜索事件 ==========
    document.addEventListener('performSearch', async function(e) {
        const { keyword, tags, mode = 'all' } = e.detail;  // 添加mode参数，默认'all'

        // 保存搜索模式
        currentSearchMode = mode;

        // 服务端搜索（向量+文本混合搜索）
        if (keyword && keyword.trim()) {
            try {
                // 显示loading状态
                showLoading();

                const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}&site=${currentSiteId}&page=1&per_page=50&mode=${mode}`);
                const data = await response.json();

                if (data.comics && data.comics.length > 0) {
                    // 设置搜索模式
                    isSearchMode = true;
                    currentSearchKeyword = keyword;

                    filteredComics = data.comics;
                    // 更新分页信息
                    totalComics = data.total;
                    totalPages = data.pages;
                    currentPage = 1;
                    renderComics(filteredComics);
                    updatePaginationUI();

                    // 更新URL以反映搜索状态
                    updateURLWithSearchState();

                    // 隐藏loading状态
                    hideLoading();

                    Utils.showToast(`找到 ${data.total} 部漫画 (精准:${data.sources.exact}, 向量:${data.sources.vector})`, 'success');
                } else {
                    // 退出搜索模式
                    isSearchMode = false;
                    currentSearchKeyword = '';

                    filteredComics = [];
                    totalComics = 0;
                    totalPages = 1;
                    currentPage = 1;
                    renderComics([]);
                    updatePaginationUI();

                    // 更新URL移除搜索参数
                    updateURLWithSearchState();

                    // 隐藏loading状态
                    hideLoading();

                    Utils.showToast('未找到匹配的漫画', 'info');
                }
            } catch (error) {
                console.error('搜索失败:', error);
                // 退出搜索模式
                isSearchMode = false;
                currentSearchKeyword = '';

                // 隐藏loading状态
                hideLoading();

                Utils.showToast('搜索失败，请稍后重试', 'error');
            }
        } else {
            // 无关键词时退出搜索模式并显示全部
            isSearchMode = false;
            currentSearchKeyword = '';
            filteredComics = allComics;
            totalComics = allComics.length;
            totalPages = Math.ceil(allComics.length / 50);
            currentPage = 1;
            renderComics(filteredComics);
            updatePaginationUI();

            // 更新URL移除搜索参数
            updateURLWithSearchState();
        }
    });

    // ========== 监听视图切换事件 ==========
    document.addEventListener('viewModeChanged', function(e) {
        const { mode } = e.detail;
        if (comicGrid) {
            comicGrid.className = `comic-grid ${mode}`;
        }
    });

    // ========== 监听列数变化事件 ==========
    document.addEventListener('columnsChanged', function(e) {
        const { columns } = e.detail;
        if (comicGrid) {
            comicGrid.style.setProperty('--grid-columns', columns);
        }
    });

    // ========== 监听设置变更事件 ==========
    document.addEventListener('settingChanged', function(e) {
        const { key, value } = e.detail;
        if (key === 'sortMode') {
            // 排序模式变更，重新加载漫画
            console.log('[排序] 切换排序模式:', value);
            allComics = [];
            filteredComics = [];
            currentPage = 1;
            loadComics(1, false);
        }
    });

    // ========== 初始化 ==========
    async function init() {
        // 先检查登录状态（异步）
        const isLoggedIn = await checkLoginStatus();
        if (!isLoggedIn) return;

        initSiteId();
        initPaginationEvents();
        initClearSearchButton(); // 初始化清空搜索按钮

        // 尝试从URL恢复搜索状态
        const hasRestoredSearch = restoreSearchStateFromURL();

        // 如果URL没有搜索状态，尝试从localStorage自动恢复
        if (!hasRestoredSearch) {
            const savedSearch = localStorage.getItem('lastSearchState');
            if (savedSearch) {
                try {
                    const state = JSON.parse(savedSearch);
                    // 检查是否是同一个站点（可选）
                    if (state.site === currentSiteId) {
                        console.log(`[自动恢复搜索] 关键词: ${state.search}, 页码: ${state.page}, 模式: ${state.mode}`);
                        currentSearchKeyword = state.search;
                        currentSearchMode = state.mode || 'all';
                        isSearchMode = true;
                        currentPage = parseInt(state.page) || 1;

                        // 执行搜索
                        await performRestoredSearch(state.search, currentPage, currentSearchMode);
                    } else {
                        // 不同站点，清除搜索状态
                        localStorage.removeItem('lastSearchState');
                        loadComics();
                    }
                } catch (error) {
                    console.error('[自动恢复搜索] 解析失败:', error);
                    localStorage.removeItem('lastSearchState');
                    loadComics();
                }
            } else {
                // 没有搜索状态，检查是否有浏览状态（页码记忆）
                const browseStateKey = `lastBrowseState_${currentSiteId}`;
                const savedBrowseState = localStorage.getItem(browseStateKey);

                if (savedBrowseState) {
                    try {
                        const browseState = JSON.parse(savedBrowseState);
                        const savedPage = parseInt(browseState.page) || 1;

                        console.log(`[自动恢复浏览] 页码: ${savedPage}`);

                        // 恢复到之前浏览的页码
                        currentPage = savedPage;
                        loadComics(savedPage, false);

                        Utils.showToast(`已恢复到第 ${savedPage} 页`, 'info');
                    } catch (error) {
                        console.error('[自动恢复浏览] 解析失败:', error);
                        localStorage.removeItem(browseStateKey);
                        loadComics();
                    }
                } else {
                    // 没有任何保存的状态，从第1页开始
                    loadComics();
                }
            }
        }
    }

    /**
     * 初始化清空搜索按钮
     */
    function initClearSearchButton() {
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', clearSearch);
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
