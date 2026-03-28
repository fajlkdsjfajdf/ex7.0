/**
 * 历史记录页面 JavaScript
 */
(function() {
    'use strict';

    class HistoryPage {
        constructor() {
            this.currentSite = 'cm';
            this.currentPage = 1;
            this.perPage = 20;
            this.pageCount = 0;
            this.sites = [];

            this.init();
        }

        async init() {
            // 加载站点配置
            await this.loadSites();

            // 绑定事件
            this.bindEvents();

            // 加载历史记录
            await this.loadHistory();
        }

        async loadSites() {
            try {
                const response = await fetch('/api/sites');
                const result = await response.json();

                if (result.success && result.sites) {
                    this.sites = result.sites.filter(s => s.enabled);

                    // 渲染站点选择器
                    this.renderSiteSelector();
                }
            } catch (error) {
                console.error('[历史记录] 加载站点失败:', error);
            }
        }

        renderSiteSelector() {
            const container = document.querySelector('.site-selector');
            if (!container || this.sites.length === 0) return;

            container.innerHTML = this.sites.map(site => `
                <button class="site-btn ${site.site_id === this.currentSite ? 'active' : ''}"
                        data-site="${site.site_id}"
                        style="padding: 8px 16px; border-radius: 5px; border: 1px solid var(--border-color); background-color: ${site.site_id === this.currentSite ? 'var(--accent-color)' : 'var(--bg-light)'}; color: ${site.site_id === this.currentSite ? 'white' : 'var(--text-primary)'}; cursor: pointer; transition: all 0.2s;">
                    ${site.site_name || site.site_id}
                </button>
            `).join('');
        }

        bindEvents() {
            // 站点切换
            document.querySelector('.site-selector')?.addEventListener('click', async (e) => {
                if (e.target.classList.contains('site-btn')) {
                    const newSite = e.target.dataset.site;
                    if (newSite !== this.currentSite) {
                        this.currentSite = newSite;
                        this.currentPage = 1;
                        this.renderSiteSelector();
                        await this.loadHistory();
                    }
                }
            });

            // 分页按钮
            document.getElementById('prevBtn')?.addEventListener('click', async () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    await this.loadHistory();
                }
            });

            document.getElementById('nextBtn')?.addEventListener('click', async () => {
                if (this.currentPage < this.pageCount) {
                    this.currentPage++;
                    await this.loadHistory();
                }
            });
        }

        async loadHistory() {
            const listContainer = document.getElementById('historyList');
            const paginationContainer = document.getElementById('paginationContainer');

            try {
                const response = await fetch(`/api/${this.currentSite}/history?page=${this.currentPage}&per_page=${this.perPage}`);
                const result = await response.json();

                if (result.success) {
                    this.pageCount = result.page_count;

                    if (result.data && result.data.length > 0) {
                        // 需要获取漫画详情
                        await this.renderHistoryList(result.data);
                        this.updatePagination();
                        paginationContainer.style.display = 'flex';
                    } else {
                        this.renderEmptyState();
                        paginationContainer.style.display = 'none';
                    }
                } else {
                    this.renderError(result.message);
                }
            } catch (error) {
                console.error('[历史记录] 加载失败:', error);
                this.renderError('加载失败，请稍后重试');
            }
        }

        async renderHistoryList(historyData) {
            const listContainer = document.getElementById('historyList');

            // 收集所有 aid
            const aids = historyData.map(h => h.aid);
            const aidSet = new Set(aids);

            // 批量获取漫画信息
            const comicInfoMap = new Map();

            // 由于没有批量API，这里并行获取
            const fetchPromises = Array.from(aidSet).map(async aid => {
                try {
                    const response = await fetch(`/api/${this.currentSite}/comic/${aid}`);
                    const result = await response.json();
                    if (result.success && result.comic) {
                        comicInfoMap.set(aid, result.comic);
                    }
                } catch (e) {
                    console.debug(`[历史记录] 获取漫画 ${aid} 信息失败`);
                }
            });

            await Promise.all(fetchPromises);

            // 渲染列表
            listContainer.innerHTML = historyData.map(item => {
                const comic = comicInfoMap.get(item.aid) || {};
                const title = comic.title || `漫画 ${item.aid}`;
                const cover = comic.cover || '/static/common/images/default-cover.jpg';
                const lastChapter = item.pid ? `第${item.pid}话` : '未知章节';
                const readTime = this.formatTime(item.read_time);

                return `
                    <div class="history-item">
                        <div class="history-cover">
                            <img src="${cover}" alt="${title}" onerror="this.src='/static/common/images/default-cover.jpg'">
                        </div>
                        <div class="history-info">
                            <div class="history-title">${title}</div>
                            <div class="history-meta">
                                <span><i class="fas fa-book"></i> 阅读至: ${lastChapter}</span>
                                <span><i class="fas fa-clock"></i> ${readTime}</span>
                            </div>
                        </div>
                        <div class="history-actions">
                            <a href="/read.html?site=${this.currentSite}&aid=${item.aid}&pid=${item.pid}" class="btn-read">
                                <i class="fas fa-book-open"></i> 继续阅读
                            </a>
                            <button class="btn-delete" data-aid="${item.aid}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // 绑定删除按钮
            listContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const aid = parseInt(btn.dataset.aid);
                    if (confirm('确定要删除这条阅读记录吗？')) {
                        await this.deleteHistory(aid);
                    }
                });
            });
        }

        async deleteHistory(aid) {
            try {
                const response = await fetch(`/api/${this.currentSite}/history/${aid}`, {
                    method: 'DELETE'
                });
                const result = await response.json();

                if (result.success) {
                    // 重新加载列表
                    await this.loadHistory();
                } else {
                    alert(result.message || '删除失败');
                }
            } catch (error) {
                console.error('[历史记录] 删除失败:', error);
                alert('删除失败，请稍后重试');
            }
        }

        updatePagination() {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const pageInfo = document.getElementById('pageInfo');

            if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
            if (nextBtn) nextBtn.disabled = this.currentPage >= this.pageCount;
            if (pageInfo) pageInfo.textContent = `第 ${this.currentPage} / ${this.pageCount} 页`;
        }

        renderEmptyState() {
            const listContainer = document.getElementById('historyList');
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>暂无阅读记录</h3>
                    <p>快去阅读一些漫画吧！阅读记录会自动保存在这里</p>
                    <a href="/list.html?site=${this.currentSite}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: var(--accent-color); color: white; text-decoration: none; border-radius: 5px;">
                        去看看漫画
                    </a>
                </div>
            `;
        }

        renderError(message) {
            const listContainer = document.getElementById('historyList');
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>${message}</h3>
                    <p>请<a href="/login.html">登录</a>后查看阅读历史</p>
                </div>
            `;
        }

        formatTime(timestamp) {
            if (!timestamp) return '未知时间';

            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;

            // 1小时内
            if (diff < 3600000) {
                const minutes = Math.floor(diff / 60000);
                return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
            }
            // 今天
            if (date.toDateString() === now.toDateString()) {
                return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
            // 昨天
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
            // 其他
            return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
    }

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new HistoryPage());
    } else {
        new HistoryPage();
    }
})();
