/**
 * 站点管理器模块
 * 管理多站点切换功能
 */

class SiteManager {
    constructor() {
        this.currentSiteId = this.loadCurrentSiteId();
        this.sites = [];
        this.initialized = false;
    }

    /**
     * 从 localStorage 加载当前站点ID
     */
    loadCurrentSiteId() {
        return localStorage.getItem('current_site_id') || 'cm';
    }

    /**
     * 保存当前站点ID到 localStorage
     */
    saveCurrentSiteId(siteId) {
        localStorage.setItem('current_site_id', siteId);
    }

    /**
     * 获取当前站点ID
     */
    getCurrentSiteId() {
        return this.currentSiteId;
    }

    /**
     * 设置当前站点
     */
    setCurrentSiteId(siteId) {
        if (siteId === this.currentSiteId) {
            return false;
        }

        const oldSiteId = this.currentSiteId;
        this.currentSiteId = siteId;
        this.saveCurrentSiteId(siteId);

        // 更新全局 API 实例的站点ID
        if (window.api) {
            window.api.siteId = siteId;
        }

        // 触发站点变更事件
        document.dispatchEvent(new CustomEvent('siteChanged', {
            detail: {
                oldSiteId: oldSiteId,
                newSiteId: siteId,
                siteName: this.getSiteName(siteId)
            }
        }));

        return true;
    }

    /**
     * 获取站点名称
     */
    getSiteName(siteId) {
        const site = this.sites.find(s => s.site_id === siteId);
        return site ? site.site_name : siteId;
    }

    /**
     * 获取当前站点名称
     */
    getCurrentSiteName() {
        return this.getSiteName(this.currentSiteId);
    }

    /**
     * 从服务器获取可用站点列表
     */
    async fetchSites() {
        try {
            const response = await fetch('/api/sites');
            const data = await response.json();

            if (data.success && data.sites) {
                this.sites = data.sites.filter(s => s.enabled);
                return this.sites;
            }

            return [];
        } catch (error) {
            console.error('获取站点列表失败:', error);
            return [];
        }
    }

    /**
     * 初始化站点管理器
     */
    async init() {
        if (this.initialized) {
            return;
        }

        // 获取站点列表
        await this.fetchSites();

        // 验证当前站点是否在列表中
        const siteIds = this.sites.map(s => s.site_id);
        if (!siteIds.includes(this.currentSiteId)) {
            // 如果当前站点不在列表中，使用第一个可用站点
            if (this.sites.length > 0) {
                this.currentSiteId = this.sites[0].site_id;
                this.saveCurrentSiteId(this.currentSiteId);
            }
        }

        // 更新全局 API 实例
        if (window.api) {
            window.api.siteId = this.currentSiteId;
        }

        this.initialized = true;
        return this;
    }

    /**
     * 渲染站点选择器
     */
    renderSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('站点选择器容器不存在:', containerId);
            return;
        }

        // 构建选择器HTML
        const selectorHTML = `
            <div class="site-selector">
                <div class="site-selector-label">
                    <i class="fas fa-globe"></i>
                    <span>当前站点</span>
                </div>
                <select class="site-selector-dropdown" id="siteDropdown">
                    ${this.sites.map(site => `
                        <option value="${site.site_id}" ${site.site_id === this.currentSiteId ? 'selected' : ''}>
                            ${site.site_name}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;

        container.innerHTML = selectorHTML;

        // 绑定事件
        const dropdown = document.getElementById('siteDropdown');
        if (dropdown) {
            dropdown.addEventListener('change', (e) => {
                const newSiteId = e.target.value;
                if (this.setCurrentSiteId(newSiteId)) {
                    // 站点变更后刷新页面
                    this.reloadPage();
                }
            });
        }
    }

    /**
     * 切换站点后刷新页面
     */
    reloadPage() {
        // 获取当前URL
        const url = new URL(window.location.href);

        // 更新URL中的site参数
        url.searchParams.set('site', this.currentSiteId);

        // 刷新页面
        window.location.href = url.toString();
    }

    /**
     * 更新页面标题
     */
    updatePageTitle() {
        const siteName = this.getCurrentSiteName();
        document.title = `${siteName} - 漫画站`;
    }

    /**
     * 更新侧边栏标题
     */
    updateSidebarTitle() {
        const header = document.querySelector('.sidebar-header h1');
        if (header) {
            header.textContent = this.getCurrentSiteName();
        }
    }
}

// 创建全局站点管理器实例
window.siteManager = new SiteManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
    await window.siteManager.init();

    // 渲染站点选择器（如果容器存在）
    if (document.getElementById('siteSelectorContainer')) {
        window.siteManager.renderSelector('siteSelectorContainer');
    }

    // 更新页面标题
    window.siteManager.updatePageTitle();

    // 更新侧边栏标题
    window.siteManager.updateSidebarTitle();
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SiteManager;
}
