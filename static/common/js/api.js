/**
 * API封装模块
 * 统一管理所有API请求
 */

class API {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.siteId = 'cm'; // 默认站点
    }

    /**
     * 设置当前站点
     */
    setSiteId(siteId) {
        this.siteId = siteId;
        localStorage.setItem('current_site_id', siteId);
    }

    /**
     * 获取当前站点
     */
    getSiteId() {
        return this.siteId;
    }

    /**
     * 获取可用站点列表
     */
    async getSites() {
        return this.request('/api/sites');
    }

    /**
     * 通用请求方法
     */
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(`${this.baseURL}${url}`, finalOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    /**
     * 用户认证
     */
    async login(username, password) {
        return this.request('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    }

    async logout() {
        return this.request('/api/logout', { method: 'POST' });
    }

    async getCurrentUser() {
        return this.request('/api/user/current');
    }

    /**
     * 漫画列表
     */
    async getComics(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/${this.siteId}/comics?${query}`);
    }

    async searchComics(keyword, tags = [], page = 1) {
        return this.request(`/api/${this.siteId}/comics/search`, {
            method: 'POST',
            body: JSON.stringify({ keyword, tags, page }),
        });
    }

    /**
     * 漫画详情
     */
    async getComic(aid) {
        return this.request(`/api/${this.siteId}/comic/${aid}`);
    }

    async getChapters(aid) {
        return this.request(`/api/${this.siteId}/comic/${aid}/chapters`);
    }

    /**
     * 图片API
     */
    async getCover(aid) {
        return `/api/${this.siteId}/cover/${aid}`;
    }

    async getImage(aid, pid, page) {
        return `/api/${this.siteId}/image/${aid}/${pid}/${page}`;
    }

    async getChapterImages(aid, pid) {
        return this.request(`/api/${this.siteId}/chapter/${aid}/${pid}/images`);
    }

    /**
     * 收藏
     */
    async getBookmarks(page = 1) {
        return this.request(`/api/user/bookmarks?page=${page}`);
    }

    async addBookmark(comicId) {
        return this.request('/api/user/bookmark/add', {
            method: 'POST',
            body: JSON.stringify({ comic_id: comicId }),
        });
    }

    async removeBookmark(comicId) {
        return this.request('/api/user/bookmark/remove', {
            method: 'POST',
            body: JSON.stringify({ comic_id: comicId }),
        });
    }

    async checkBookmark(comicId) {
        return this.request(`/api/user/bookmark/check?comic_id=${comicId}`);
    }

    /**
     * 阅读历史
     */
    async getHistory(page = 1) {
        return this.request(`/api/user/history?page=${page}`);
    }

    async getComicHistory(comicId) {
        return this.request(`/api/user/history/${comicId}`);
    }

    async recordHistory(comicId, chapterPid, page = 0) {
        return this.request('/api/user/history/record', {
            method: 'POST',
            body: JSON.stringify({
                comic_id: comicId,
                chapter_pid: chapterPid,
                page: page,
            }),
        });
    }

    async clearHistory() {
        return this.request('/api/user/history/clear', { method: 'POST' });
    }

    /**
     * 用户设置
     */
    async getSettings() {
        return this.request('/api/user/settings');
    }

    async saveSettings(settings) {
        return this.request('/api/user/settings', {
            method: 'POST',
            body: JSON.stringify(settings),
        });
    }

    /**
     * 示例数据（本地模式）
     */
    async getSampleComics() {
        // 开发阶段使用本地数据
        const response = await fetch('/data/sample_comics.json');
        return response.json();
    }
}

// 创建全局API实例
window.api = new API();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
