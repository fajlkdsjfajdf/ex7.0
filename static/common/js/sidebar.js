/**
 * 侧边栏交互脚本
 */

(function() {
    'use strict';

    // DOM元素
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const header = document.getElementById('global-header');
    const mainContent = document.getElementById('mainContent');
    const menuItems = document.querySelectorAll('.menu-item');

    // 站点选择器相关
    let siteDropdown = null;

    /**
     * 初始化站点选择器
     */
    async function initSiteSelector() {
        siteDropdown = document.getElementById('siteDropdown');
        if (!siteDropdown) return;

        try {
            // 获取可用站点
            const response = await window.api.getSites();
            const sites = response.sites || [];

            // 清空并填充选项
            siteDropdown.innerHTML = '';
            sites.forEach(site => {
                if (site.enabled) {
                    const option = document.createElement('option');
                    option.value = site.site_id;
                    option.textContent = site.site_name;
                    siteDropdown.appendChild(option);
                }
            });

            // 设置当前选中项
            const currentSiteId = localStorage.getItem('current_site_id') || 'cm';
            siteDropdown.value = currentSiteId;

            // 更新API实例的站点ID
            window.api.setSiteId(currentSiteId);

            // 监听切换事件
            siteDropdown.addEventListener('change', handleSiteChange);

            console.log('站点选择器初始化完成，当前站点:', currentSiteId);
        } catch (error) {
            console.error('初始化站点选择器失败:', error);
        }
    }

    /**
     * 处理站点切换
     */
    function handleSiteChange(event) {
        const newSiteId = event.target.value;
        const oldSiteId = localStorage.getItem('current_site_id') || 'cm';

        if (newSiteId === oldSiteId) return;

        console.log('切换站点:', oldSiteId, '->', newSiteId);

        // 保存新站点
        localStorage.setItem('current_site_id', newSiteId);

        // 更新API实例
        window.api.setSiteId(newSiteId);

        // 刷新页面以加载新站点数据
        const url = new URL(window.location.href);
        url.searchParams.set('site', newSiteId);
        window.location.href = url.toString();
    }

    // 更新Header位置
    function updateHeader() {
        if (window.innerWidth <= 992) {
            header.style.left = "0px";
        } else {
            if (sidebar.classList.contains('hide')) {
                header.style.left = "0px";
            } else {
                header.style.left = "var(--sidebar-width)";
            }
        }
    }

    // 移动端菜单切换
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            if (window.innerWidth <= 992) {
                // 移动设备：使用active类
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
            } else {
                // 桌面设备：使用hide类
                sidebar.classList.toggle('hide');
                mainContent.classList.toggle('expanded');
                header.classList.toggle('expanded');
                updateHeader();
            }
        });
    }

    // 遮罩层点击关闭
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // 菜单项点击
    menuItems.forEach(item => {
        item.addEventListener('click', async () => {
            const page = item.dataset.page;

            // 处理登出
            if (page === 'logout') {
                if (await Utils.confirm('确定要退出登录吗？')) {
                    try {
                        // 调用后端API清除session
                        await fetch('/api/logout', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                    } catch (e) {
                        console.error('登出API调用失败:', e);
                    }
                    // 清除本地存储
                    Utils.storage.remove('current_user');
                    Utils.cookie.remove('session_token');
                    window.location.href = '/login.html';
                }
                return;
            }

            // 更新激活状态
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // 移动端：关闭侧边栏
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }

            // 获取当前站点ID
            const currentSiteId = localStorage.getItem('current_site_id') || 'cm';

            // 页面跳转
            switch (page) {
                case 'home':
                    // 跳转到列表页（首页），带上站点参数
                    window.location.href = `/list.html?site=${currentSiteId}`;
                    break;
                case 'settings':
                    window.location.href = '/settings.html';
                    break;
                case 'history':
                case 'bookmarks':
                default:
                    Utils.showToast(`正在开发: ${item.querySelector('span').textContent}`, 'info');
            }
        });
    });

    // 窗口大小改变时重新计算
    window.addEventListener('resize', () => {
        updateHeader();
    });

    // 初始化
    updateHeader();

})();
