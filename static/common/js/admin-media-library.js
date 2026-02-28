/**
 * 图片库管理脚本
 * 负责站点图片库的浏览和管理（基于DAT文件 + MongoDB）
 */

(function() {
    'use strict';

    // 站点图标和颜色映射（默认样式）
    const SITE_STYLES = {
        'default': { icon: 'fa-globe', color: '#74b9ff' }
    };

    // 图片浏览状态
    let currentSiteId = null;
    let currentPage = 1;
    let totalPages = 1;
    let currentImages = [];
    let filteredImages = [];
    let allSites = [];

    // ========== 初始化 ==========
    async function init() {
        await loadStoragePath();  // 先加载存储路径
        await loadSiteLibraries();  // 再加载站点列表（依赖存储路径）
        bindEvents();
    }

    // ========== 绑定事件 ==========
    function bindEvents() {
        // 存储路径设置按钮
        const setPathBtn = document.getElementById('setStoragePathBtn');
        if (setPathBtn) {
            setPathBtn.addEventListener('click', setStoragePath);
        }
    }

    // ========== 加载存储路径配置 ==========
    async function loadStoragePath() {
        try {
            const response = await fetch('/admin/api/media-library/storage-path');
            const data = await response.json();

            if (data.success) {
                const storagePath = data.data.storage_path;

                // 更新存储路径显示
                const pathDisplay = document.getElementById('storagePathDisplay');
                if (pathDisplay) {
                    pathDisplay.textContent = storagePath;
                }

                // 注意：不在这里设置 allSites，因为 loadSiteLibraries 会设置正确的数组格式
            }
        } catch (error) {
            console.error('加载存储路径配置失败:', error);
        }
    }

    // ========== 设置存储路径 ==========
    async function setStoragePath() {
        const pathDisplay = document.getElementById('storagePathDisplay');
        const currentPath = pathDisplay ? pathDisplay.textContent : 'local_files';
        const newPath = prompt('请输入图片库存储总路径:', currentPath);

        if (!newPath || newPath === currentPath) {
            return;
        }

        // 更新页面显示
        if (pathDisplay) {
            pathDisplay.textContent = newPath;
        }

        // 保存到服务器
        try {
            const response = await fetch('/admin/api/media-library/storage-path', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storage_path: newPath
                })
            });

            const data = await response.json();

            if (data.success) {
                Utils.showToast(data.message, 'success');
                // 重新加载配置
                await loadStoragePath();
                // 重新加载站点列表
                await loadSiteLibraries();
            } else {
                Utils.showToast('设置失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('设置存储路径失败:', error);
            Utils.showToast('设置失败: ' + error.message, 'error');
        }
    }

    // ========== 加载站点图片库列表 ==========
    async function loadSiteLibraries() {
        try {
            const container = document.getElementById('siteLibrariesList');
            if (!container) return;

            // 加载站点列表
            const sitesResponse = await fetch('/admin/api/media-library/sites');
            const sitesData = await sitesResponse.json();

            if (!sitesData.success) {
                showError('加载站点列表失败: ' + sitesData.message);
                return;
            }

            allSites = sitesData.data.sites;

            if (allSites.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 50px;">
                        <i class="fas fa-inbox" style="font-size: 48px; color: var(--text-secondary);"></i>
                        <p style="margin-top: 10px;">暂无站点，请先在配置管理中添加站点</p>
                    </div>
                `;
                return;
            }

            // 渲染站点卡片
            container.innerHTML = allSites.map(site => {
                const styles = SITE_STYLES[site.site_id] || SITE_STYLES['default'];
                const statusText = site.enabled ? '已启用' : '已禁用';
                const statusClass = site.enabled ? 'status-enabled' : 'status-disabled';

                return `
                <div class="library-card" style="border-left: 4px solid ${styles.color}">
                    <div class="library-header">
                        <div class="library-icon" style="background: ${styles.color}20;">
                            <i class="fas ${styles.icon}" style="color: ${styles.color}"></i>
                        </div>
                        <div class="library-title">
                            <h3>${site.site_name} (${site.site_id.toUpperCase()})</h3>
                            <p class="library-desc">图片存储库</p>
                        </div>
                    </div>
                    <div class="library-body">
                        <div class="library-info">
                            <div class="info-item">
                                <i class="fas fa-folder"></i>
                                <span class="info-label">状态:</span>
                                <span class="info-value"><span class="${statusClass}">${statusText}</span></span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-hdd"></i>
                                <span class="info-label">存储路径:</span>
                                <code class="info-value">${getStoragePathForSite(site.site_id)}</code>
                            </div>
                        </div>
                        <div class="library-stats" id="stats-${site.site_id}">
                            <div class="stat-loading">
                                <i class="fas fa-spinner fa-spin"></i> 正在加载统计...
                            </div>
                        </div>
                    </div>
                    <div class="library-footer">
                        <button class="btn btn-sm btn-primary" onclick="window.viewSiteImages('${site.site_id}')" ${!site.enabled ? 'disabled' : ''}>
                            <i class="fas fa-images"></i> 查看图片
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="window.refreshSiteStats('${site.site_id}')">
                            <i class="fas fa-sync-alt"></i> 刷新统计
                        </button>
                    </div>
                </div>
                `;
            }).join('');

            // 加载每个站点的统计信息
            for (const site of allSites) {
                if (site.enabled) {
                    await loadSiteStats(site.site_id);
                }
            }
        } catch (error) {
            console.error('加载站点图片库失败:', error);
            showError('加载站点图片库失败: ' + error.message);
        }
    }

    // ========== 获取站点存储路径 ==========
    function getStoragePathForSite(siteId) {
        const basePath = document.getElementById('storagePathDisplay')?.textContent || 'local_files';
        return `${basePath}/${siteId}/`;
    }

    // ========== 加载站点统计信息 ==========
    async function loadSiteStats(siteId) {
        try {
            const response = await fetch(`/admin/api/media-library/images/${siteId}?per_page=1`);
            const data = await response.json();

            const statsContainer = document.getElementById(`stats-${siteId}`);
            if (!statsContainer) return;

            if (data.success) {
                const total = data.data.total;
                statsContainer.innerHTML = `
                    <div class="stat-grid">
                        <div class="stat-item">
                            <i class="fas fa-image stat-icon"></i>
                            <div class="stat-content">
                                <span class="stat-value">${formatNumber(total)}</span>
                                <span class="stat-label">图片总数</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                statsContainer.innerHTML = `
                    <div class="stat-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>加载失败</span>
                    </div>
                `;
            }
        } catch (error) {
            console.error(`加载站点${siteId}统计失败:`, error);
            const statsContainer = document.getElementById(`stats-${siteId}`);
            if (statsContainer) {
                statsContainer.innerHTML = `
                    <div class="stat-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>加载失败</span>
                    </div>
                `;
            }
        }
    }

    // ========== 查看站点图片 ==========
    window.viewSiteImages = async function(siteId) {
        currentSiteId = siteId;
        currentPage = 1;

        const site = allSites.find(s => s.site_id === siteId);
        const siteName = site ? site.site_name : siteId.toUpperCase();

        document.getElementById('imageGalleryTitle').textContent = `${siteName} 图片库`;

        // 显示弹窗
        document.getElementById('imageGalleryModal').style.display = 'flex';

        // 加载图片
        await loadGalleryImages();
    };

    // ========== 加载图片列表 ==========
    window.loadGalleryImages = async function() {
        if (!currentSiteId) return;

        try {
            const imageGrid = document.getElementById('imageGrid');
            imageGrid.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <i class="fas fa-spinner fa-spin"></i> 加载中...
                </div>
            `;

            const filterType = document.getElementById('imageTypeFilter').value;

            const response = await fetch(
                `/admin/api/media-library/images/${currentSiteId}?page=${currentPage}&per_page=20`
            );
            const data = await response.json();

            if (data.success) {
                currentImages = data.data.images;
                totalPages = data.data.total_pages;

                // 应用筛选
                if (filterType) {
                    filteredImages = currentImages.filter(img => img.image_type === filterType);
                } else {
                    filteredImages = currentImages;
                }

                renderImages();
                updatePagination();
                updateCounter();
            } else {
                imageGrid.innerHTML = `
                    <div style="text-align: center; padding: 50px; color: var(--error-color);">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>${data.message}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载图片列表失败:', error);
            Utils.showToast('加载图片列表失败: ' + error.message, 'error');
        }
    };

    // ========== 渲染图片网格 ==========
    function renderImages() {
        const imageGrid = document.getElementById('imageGrid');

        if (filteredImages.length === 0) {
            imageGrid.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <i class="fas fa-inbox" style="font-size: 48px; color: var(--text-secondary);"></i>
                    <p style="margin-top: 10px;">暂无图片</p>
                </div>
            `;
            return;
        }

        imageGrid.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                ${filteredImages.map((img, index) => {
                    // 生成图片URL - 优先使用业务参数，回退到file_id
                    let imageUrl;
                    if (img.aid !== undefined) {
                        // 使用业务参数
                        imageUrl = `/api/media/image?site=${currentSiteId}&aid=${img.aid}&type=${img.image_type || 'content'}`;
                        if (img.pid !== undefined && img.pid !== null) {
                            imageUrl += `&pid=${img.pid}`;
                        }
                        if (img.page_num !== undefined && img.page_num !== null) {
                            imageUrl += `&page=${img.page_num}`;
                        }
                    } else {
                        // 回退到file_id
                        imageUrl = `/api/media/image?file_id=${img._id}&site_id=${currentSiteId}`;
                    }

                    return `
                    <div class="image-card" style="cursor: pointer; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; transition: transform 0.2s;"
                         onclick="window.showImageDetail(${index})">
                        <div style="aspect-ratio: 1; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center;">
                            <img src="${imageUrl}"
                                 style="max-width: 100%; max-height: 100%; object-fit: contain;"
                                 alt="图片"
                                 onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image\\' style=\\'font-size: 32px; color: var(--text-secondary);\\'></i>'">
                        </div>
                        <div style="padding: 10px; font-size: 12px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: var(--text-secondary);">类型:</span>
                                <span>${getTypeText(img.image_type)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="color: var(--text-secondary);">尺寸:</span>
                                <span>${img.width || 0}x${img.height || 0}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-secondary);">漫画:</span>
                                <span>${img.aid || '--'}</span>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `;
    }

    // ========== 显示图片详情 ==========
    window.showImageDetail = function(index) {
        const img = filteredImages[index];
        if (!img) return;

        const modal = document.getElementById('imageDetailModal');
        const detailImage = document.getElementById('detailImage');
        const detailInfo = document.getElementById('detailInfo');

        // 生成图片URL - 优先使用业务参数
        let imageUrl;
        if (img.aid !== undefined) {
            imageUrl = `/api/media/image?site=${currentSiteId}&aid=${img.aid}&type=${img.image_type || 'content'}`;
            if (img.pid !== undefined && img.pid !== null) {
                imageUrl += `&pid=${img.pid}`;
            }
            if (img.page_num !== undefined && img.page_num !== null) {
                imageUrl += `&page=${img.page_num}`;
            }
        } else {
            imageUrl = `/api/media/image?file_id=${img._id}&site_id=${currentSiteId}`;
        }

        // 设置图片
        detailImage.src = imageUrl;

        // 显示详细信息
        detailInfo.innerHTML = `
            <h3>基本信息</h3>
            <table class="detail-table">
                <tr>
                    <th>图片ID</th>
                    <td><code>${img._id}</code></td>
                </tr>
                <tr>
                    <th>MD5</th>
                    <td><code>${img.md5 || '--'}</code></td>
                </tr>
                <tr>
                    <th>尺寸</th>
                    <td>${img.width || 0} x ${img.height || 0}</td>
                </tr>
                <tr>
                    <th>文件大小</th>
                    <td>${formatFileSize(img.file_size || 0)}</td>
                </tr>
                <tr>
                    <th>图片类型</th>
                    <td>${getTypeText(img.image_type)}</td>
                </tr>
                <tr>
                    <th>MIME类型</th>
                    <td>${img.mime_type || '--'}</td>
                </tr>
                <tr>
                    <th>漫画ID (aid)</th>
                    <td>${img.aid || '--'}</td>
                </tr>
                <tr>
                    <th>章节ID (pid)</th>
                    <td>${img.pid !== undefined && img.pid !== null ? img.pid : '--'}</td>
                </tr>
                <tr>
                    <th>页码 (page_num)</th>
                    <td>${img.page_num !== undefined && img.page_num !== null ? img.page_num : '--'}</td>
                </tr>
                <tr>
                    <th>来源URL</th>
                    <td><code style="word-break: break-all;">${img.source_url || '--'}</code></td>
                </tr>
                <tr>
                    <th>创建时间</th>
                    <td>${formatTime(img.created_at)}</td>
                </tr>
                <tr>
                    <th>存储ID (storage_id)</th>
                    <td><code>${img.storage_id || '--'}</code></td>
                </tr>
            </table>
            <div style="margin-top: 15px;">
                <button class="btn btn-sm btn-primary" onclick="window.open('${imageUrl}', '_blank')">
                    <i class="fas fa-external-link-alt"></i> 在新窗口打开
                </button>
                <button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText('${img._id}').then(() => Utils.showToast('ID已复制', 'success'))">
                    <i class="fas fa-copy"></i> 复制ID
                </button>
            </div>
        `;

        modal.style.display = 'flex';
    };

    // ========== 筛选图片 ==========
    window.filterImages = async function() {
        await loadGalleryImages();
    };

    // ========== 更新分页 ==========
    function updatePagination() {
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('pageInfo');

        if (prevBtn) prevBtn.disabled = currentPage <= 1;
        if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
        if (pageInfo) pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;
    }

    // ========== 更新计数器 ==========
    function updateCounter() {
        const counter = document.getElementById('imageCounter');
        if (counter) counter.textContent = `${filteredImages.length} 张图片`;
    }

    // ========== 上一页 ==========
    window.prevPage = async function() {
        if (currentPage > 1) {
            currentPage--;
            await loadGalleryImages();
        }
    };

    // ========== 下一页 ==========
    window.nextPage = async function() {
        if (currentPage < totalPages) {
            currentPage++;
            await loadGalleryImages();
        }
    };

    // ========== 刷新站点统计 ==========
    window.refreshSiteStats = async function(siteId) {
        await loadSiteStats(siteId);
        Utils.showToast('统计已刷新', 'success');
    };

    // ========== 关闭图片浏览弹窗 ==========
    window.closeImageGallery = function() {
        document.getElementById('imageGalleryModal').style.display = 'none';
        currentSiteId = null;
        currentPage = 1;
        currentImages = [];
        filteredImages = [];
    };

    // ========== 关闭图片详情弹窗 ==========
    window.closeImageDetail = function() {
        document.getElementById('imageDetailModal').style.display = 'none';
    };

    // ========== 格式化数字 ==========
    function formatNumber(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toString();
    }

    // ========== 格式化文件大小 ==========
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }

    // ========== 格式化时间 ==========
    function formatTime(timestamp) {
        if (!timestamp) return '--';
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    // ========== 获取类型文本 ==========
    function getTypeText(type) {
        const typeMap = {
            'cover': '封面',
            'thumbnail': '缩略图',
            'content': '内容图'
        };
        return typeMap[type] || type || '--';
    }

    // ========== 显示错误信息 ==========
    function showError(message) {
        const container = document.getElementById('siteLibrariesList');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // ========== 暴露给全局 ==========
    window.setStoragePath = setStoragePath;

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
