/**
 * 后台配置管理脚本
 * 负责站点配置和系统配置的管理
 */

(function() {
    'use strict';

    // ========== 初始化 ==========
    function init() {
        loadSiteList();
        loadSystemConfig();
        bindEvents();
    }

    // ========== 绑定事件 ==========
    function bindEvents() {
        // 系统配置表单提交
        const systemConfigForm = document.getElementById('systemConfigForm');
        if (systemConfigForm) {
            systemConfigForm.addEventListener('submit', saveSystemConfig);
        }

        // 站点配置表单提交
        const siteConfigForm = document.getElementById('siteConfigForm');
        if (siteConfigForm) {
            siteConfigForm.addEventListener('submit', saveSiteConfig);
        }
    }

    // ========== 加载站点列表 ==========
    async function loadSiteList() {
        try {
            const response = await fetch('/admin/api/config/sites');
            const data = await response.json();

            if (data.success) {
                renderSiteList(data.data.sites || []);
            } else {
                console.error('加载站点列表失败:', data.message);
            }
        } catch (error) {
            console.error('加载站点列表失败:', error);
            // 显示空状态
            renderSiteList([]);
        }
    }

    // ========== 渲染站点列表 ==========
    function renderSiteList(sites) {
        const siteList = document.getElementById('siteList');
        if (!siteList) return;

        if (sites.length === 0) {
            siteList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>暂无站点配置</p>
                    <button class="btn btn-primary" onclick="openAddSiteDialog()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> 添加第一个站点
                    </button>
                </div>
            `;
            return;
        }

        siteList.innerHTML = sites.map(site => {
            // 定时任务信息
            const scheduleInfo = [];
            if (site.schedule) {
                if (site.schedule.list_page > 0) {
                    scheduleInfo.push(`列表页: ${site.schedule.list_page}h`);
                }
                if (site.schedule.info_page > 0) {
                    scheduleInfo.push(`详情页: ${site.schedule.info_page}h`);
                }
                if (site.schedule.content_page > 0) {
                    scheduleInfo.push(`内容页: ${site.schedule.content_page}h`);
                }
                if (site.schedule.comment_page > 0) {
                    scheduleInfo.push(`评论页: ${site.schedule.comment_page}h`);
                }
                if (site.schedule.cover_image > 0) {
                    scheduleInfo.push(`封面图: ${site.schedule.cover_image}h`);
                }
                if (site.schedule.thumbnail_image > 0) {
                    scheduleInfo.push(`缩略图: ${site.schedule.thumbnail_image}h`);
                }
                if (site.schedule.content_image > 0) {
                    scheduleInfo.push(`内容图: ${site.schedule.content_image}h`);
                }
            }

            return `
            <div class="site-card">
                <div class="site-card-header">
                    <h3>${site.site_name} (${site.site_id})</h3>
                    <div class="site-actions">
                        <button class="btn btn-sm btn-secondary" onclick="editSite('${site.site_id}')" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="testSite('${site.site_id}')" title="测试连接">
                            <i class="fas fa-plug"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="deleteSite('${site.site_id}')" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="site-card-body">
                    <div class="site-info">
                        ${site.urls && site.urls.length > 0 ? `
                            <div class="site-info-item">
                                <i class="fas fa-link"></i>
                                <span>URL: ${site.urls.join(', ')}</span>
                            </div>
                        ` : ''}
                        ${site.cdn_urls && site.cdn_urls.length > 0 ? `
                            <div class="site-info-item">
                                <i class="fas fa-cloud"></i>
                                <span>CDN: ${site.cdn_urls.join(', ')}</span>
                            </div>
                        ` : ''}
                        ${scheduleInfo.length > 0 ? `
                            <div class="site-info-item">
                                <i class="fas fa-clock"></i>
                                <span>${scheduleInfo.join(' | ')}</span>
                            </div>
                        ` : ''}
                        ${site.ips && site.ips.length > 0 ? `
                            <div class="site-info-item">
                                <i class="fas fa-network-wired"></i>
                                <span>IP: ${site.ips.join(', ')}</span>
                            </div>
                        ` : ''}
                        ${site.proxy_mode ? `
                            <div class="site-info-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>代理: ${getProxyModeText(site.proxy_mode)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="site-card-footer">
                    <span class="site-status ${site.enabled ? 'enabled' : 'disabled'}">
                        <i class="fas fa-${site.enabled ? 'check-circle' : 'times-circle'}"></i>
                        ${site.enabled ? '已启用' : '已禁用'}
                    </span>
                </div>
            </div>
            `;
        }).join('');
    }

    // ========== 加载系统配置 ==========
    async function loadSystemConfig() {
        try {
            const response = await fetch('/admin/api/config/system');
            const data = await response.json();

            if (data.success) {
                populateSystemConfigForm(data.data);
            }
        } catch (error) {
            console.error('加载系统配置失败:', error);
        }
    }

    // ========== 填充系统配置表单 ==========
    function populateSystemConfigForm(config) {
        const form = document.getElementById('systemConfigForm');
        if (!form || !config) return;

        // 填充表单字段
        Object.keys(config).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = config[key];
                } else {
                    input.value = config[key];
                }
            }
        });
    }

    // ========== 保存系统配置 ==========
    async function saveSystemConfig(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const config = {};

        // 需要转换为数字的字段
        const numberFields = [
            'crawler_num_workers',
            'crawler_timeout',
            'crawler_max_retries',
            'log_max_size'
        ];

        formData.forEach((value, key) => {
            // 如果是数字字段，转换为整数
            if (numberFields.includes(key)) {
                config[key] = parseInt(value, 10);
            } else {
                config[key] = value;
            }
        });

        try {
            const response = await fetch('/admin/api/config/system', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            const data = await response.json();

            if (data.success) {
                Utils.showToast('系统配置已保存，重启后生效', 'success');
            } else {
                Utils.showToast('保存失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('保存系统配置失败:', error);
            Utils.showToast('保存失败: ' + error.message, 'error');
        }
    }

    // ========== 重置系统配置 ==========
    async function resetSystemConfig() {
        if (await Utils.confirm('确定要重置系统配置吗？')) {
            loadSystemConfig();
            Utils.showToast('配置已重置', 'info');
        }
    }

    // ========== 打开添加站点对话框 ==========
    function openAddSiteDialog() {
        const form = document.getElementById('siteConfigForm');
        document.getElementById('siteDialogTitle').textContent = '添加站点';
        form.reset();
        document.getElementById('isEditMode').value = 'false';  // 标记为添加模式

        const siteIdInput = document.getElementById('site_id');
        siteIdInput.readOnly = false;  // 添加模式：允许输入站点ID
        siteIdInput.value = '';

        // 重置URL列表和CDN URL列表
        const urlList = document.getElementById('urlList');
        urlList.innerHTML = '';
        addUrlField();  // 至少一个URL输入框

        const cdnUrlList = document.getElementById('cdnUrlList');
        cdnUrlList.innerHTML = '';
        addCdnUrlField();  // 至少一个CDN URL输入框

        // 重置IP列表
        const ipList = document.getElementById('ipList');
        ipList.innerHTML = '';
        addIpField();

        // 初始化Cookies
        document.getElementById('cookies-default-input').value = '{}';
        renderUrlCookies([''], {});

        document.getElementById('siteDialog').style.display = 'flex';
    }

    // ========== 关闭站点对话框 ==========
    function closeSiteDialog() {
        document.getElementById('siteDialog').style.display = 'none';
    }

    // ========== 编辑站点 ==========
    async function editSite(siteId) {
        try {
            const response = await fetch(`/admin/api/config/sites/${siteId}`);
            const data = await response.json();

            if (data.success) {
                const site = data.data;
                document.getElementById('siteDialogTitle').textContent = '编辑站点';
                document.getElementById('isEditMode').value = 'true';  // 标记为编辑模式

                const siteIdInput = document.getElementById('site_id');
                siteIdInput.value = site.site_id;
                siteIdInput.readOnly = true;  // 编辑模式：只读，但仍可提交

                const form = document.getElementById('siteConfigForm');
                form.querySelector('[name="site_name"]').value = site.site_name;

                // 填充URL列表
                const urlList = document.getElementById('urlList');
                urlList.innerHTML = '';
                if (site.urls && site.urls.length > 0) {
                    site.urls.forEach(url => {
                        addUrlField(url);
                    });
                } else {
                    addUrlField();
                }

                // 填充CDN URL列表
                const cdnUrlList = document.getElementById('cdnUrlList');
                cdnUrlList.innerHTML = '';
                if (site.cdn_urls && site.cdn_urls.length > 0) {
                    site.cdn_urls.forEach(url => {
                        addCdnUrlField(url);
                    });
                } else {
                    addCdnUrlField();
                }

                // 填充定时任务配置
                const schedule = site.schedule || {};
                form.querySelector('[name="schedule_list_page"]').value = schedule.list_page || 4;
                form.querySelector('[name="schedule_info_page"]').value = schedule.info_page || 6;
                form.querySelector('[name="schedule_content_page"]').value = schedule.content_page || 8;
                form.querySelector('[name="schedule_comment_page"]').value = schedule.comment_page || 0;
                form.querySelector('[name="schedule_cover_image"]').value = schedule.cover_image || 0;
                form.querySelector('[name="schedule_thumbnail_image"]').value = schedule.thumbnail_image || 0;
                form.querySelector('[name="schedule_content_image"]').value = schedule.content_image || 0;

                // 填充IP列表
                const ipList = document.getElementById('ipList');
                ipList.innerHTML = '';
                if (site.ips && site.ips.length > 0) {
                    site.ips.forEach(ip => {
                        addIpField(ip);
                    });
                } else {
                    addIpField();
                }

                // 填充代理模式
                form.querySelector('[name="proxy_mode"]').value = site.proxy_mode || 'none';

                // 填充细分代理配置
                const proxyOverrides = site.proxy_overrides || {};
                const proxyOverrideFields = [
                    'proxy_list_page', 'proxy_info_page', 'proxy_content_page', 'proxy_comment_page',
                    'proxy_cover_image', 'proxy_thumbnail_image', 'proxy_content_image'
                ];
                proxyOverrideFields.forEach(field => {
                    const select = form.querySelector(`[name="${field}"]`);
                    if (select) {
                        select.value = proxyOverrides[field.replace('proxy_', '')] || 'default';
                    }
                });

                // 填充爬取限制
                const crawlLimits = site.crawl_limits || {};
                form.querySelector('[name="crawl_limit_list_page_max"]').value = crawlLimits.list_page_max || 100;
                form.querySelector('[name="crawl_limit_info_page_max"]').value = crawlLimits.info_page_max || 500;
                form.querySelector('[name="crawl_limit_content_page_max"]').value = crawlLimits.content_page_max || 1000;
                form.querySelector('[name="crawl_limit_comment_page_max"]').value = crawlLimits.comment_page_max || 50;
                form.querySelector('[name="crawl_limit_cover_image_max"]').value = crawlLimits.cover_image_max || 500;
                form.querySelector('[name="crawl_limit_thumbnail_image_max"]').value = crawlLimits.thumbnail_image_max || 1000;
                form.querySelector('[name="crawl_limit_content_image_max"]').value = crawlLimits.content_image_max || 5000;

                // 填充Cookies
                if (site.cookies) {
                    // 填充默认cookies
                    const defaultCookies = site.cookies.default || {};
                    document.getElementById('cookies-default-input').value = JSON.stringify(defaultCookies, null, 2);

                    // 渲染URL特定的cookies
                    renderUrlCookies(site.urls, site.cookies.by_url || {});
                } else {
                    // 如果没有cookies配置，初始化为空
                    document.getElementById('cookies-default-input').value = '{}';
                    renderUrlCookies(site.urls, {});
                }

                // 展开所有cookies部分
                setTimeout(() => expandAllCookies(), 100);

                document.getElementById('siteDialog').style.display = 'flex';
            }
        } catch (error) {
            console.error('加载站点配置失败:', error);
            Utils.showToast('加载站点配置失败', 'error');
        }
    }

    // ========== 保存站点配置 ==========
    async function saveSiteConfig(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const isEditMode = document.getElementById('isEditMode').value === 'true';
        const siteId = document.getElementById('site_id').value.trim();

        // 验证站点ID
        if (!siteId) {
            Utils.showToast('请输入站点ID', 'error');
            document.getElementById('site_id').focus();
            return;
        }

        // 验证站点名称
        const siteName = formData.get('site_name').trim();
        if (!siteName) {
            Utils.showToast('请输入站点名称', 'error');
            form.querySelector('[name="site_name"]').focus();
            return;
        }

        // 收集URL列表
        const urlInputs = form.querySelectorAll('.url-input');
        const urls = Array.from(urlInputs)
            .map(input => input.value.trim())
            .filter(url => url);

        // 验证URL
        if (urls.length === 0) {
            Utils.showToast('请至少输入一个域名URL', 'error');
            return;
        }

        // 收集CDN URL列表
        const cdnUrlInputs = form.querySelectorAll('.cdn-url-input');
        const cdn_urls = Array.from(cdnUrlInputs)
            .map(input => input.value.trim())
            .filter(url => url);

        // 收集IP列表
        const ipInputs = form.querySelectorAll('.ip-input');
        const ips = Array.from(ipInputs)
            .map(input => input.value.trim())
            .filter(ip => ip);

        const config = {
            site_id: siteId,
            site_name: siteName,
            urls: urls,
            cdn_urls: cdn_urls,
            schedule: {
                list_page: parseInt(formData.get('schedule_list_page')) || 0,
                info_page: parseInt(formData.get('schedule_info_page')) || 0,
                content_page: parseInt(formData.get('schedule_content_page')) || 0,
                comment_page: parseInt(formData.get('schedule_comment_page')) || 0,
                cover_image: parseInt(formData.get('schedule_cover_image')) || 0,
                thumbnail_image: parseInt(formData.get('schedule_thumbnail_image')) || 0,
                content_image: parseInt(formData.get('schedule_content_image')) || 0
            },
            crawl_limits: {
                list_page_max: parseInt(formData.get('crawl_limit_list_page_max')) || 100,
                info_page_max: parseInt(formData.get('crawl_limit_info_page_max')) || 500,
                content_page_max: parseInt(formData.get('crawl_limit_content_page_max')) || 1000,
                comment_page_max: parseInt(formData.get('crawl_limit_comment_page_max')) || 50,
                cover_image_max: parseInt(formData.get('crawl_limit_cover_image_max')) || 500,
                thumbnail_image_max: parseInt(formData.get('crawl_limit_thumbnail_image_max')) || 1000,
                content_image_max: parseInt(formData.get('crawl_limit_content_image_max')) || 5000
            },
            ips: ips,
            proxy_mode: formData.get('proxy_mode'),
            proxy_overrides: {
                list_page: formData.get('proxy_list_page') || 'default',
                info_page: formData.get('proxy_info_page') || 'default',
                content_page: formData.get('proxy_content_page') || 'default',
                comment_page: formData.get('proxy_comment_page') || 'default',
                cover_image: formData.get('proxy_cover_image') || 'default',
                thumbnail_image: formData.get('proxy_thumbnail_image') || 'default',
                content_image: formData.get('proxy_content_image') || 'default'
            },
            cookies: {
                default: {},
                by_url: {}
            }
        };

        // 解析默认Cookies
        const defaultCookiesStr = document.getElementById('cookies-default-input').value;
        if (defaultCookiesStr) {
            try {
                config.cookies.default = JSON.parse(defaultCookiesStr);
            } catch (e) {
                Utils.showToast('默认Cookies格式错误，请使用JSON格式', 'error');
                return;
            }
        }

        // 收集URL特定的Cookies
        const urlCookiesInputs = document.querySelectorAll('.url-cookies-input');
        urlCookiesInputs.forEach(input => {
            const url = input.dataset.url;
            const cookiesStr = input.value;
            if (cookiesStr && url) {
                try {
                    const cookies = JSON.parse(cookiesStr);
                    if (Object.keys(cookies).length > 0) {
                        config.cookies.by_url[url] = cookies;
                    }
                } catch (e) {
                    Utils.showToast(`URL ${url} 的Cookies格式错误，请使用JSON格式`, 'error');
                    return;
                }
            }
        });

        try {
            const url = isEditMode ? `/admin/api/config/sites/${siteId}` : '/admin/api/config/sites';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            const data = await response.json();

            if (data.success) {
                Utils.showToast(isEditMode ? '站点已更新' : '站点已添加', 'success');
                closeSiteDialog();
                loadSiteList();
            } else {
                Utils.showToast('保存失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('保存站点配置失败:', error);
            Utils.showToast('保存失败: ' + error.message, 'error');
        }
    }

    // ========== 删除站点 ==========
    async function deleteSite(siteId) {
        if (!(await Utils.confirm(`确定要删除站点 ${siteId} 吗？`))) {
            return;
        }

        try {
            const response = await fetch(`/admin/api/config/sites/${siteId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                Utils.showToast('站点已删除', 'success');
                loadSiteList();
            } else {
                Utils.showToast('删除失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('删除站点失败:', error);
            Utils.showToast('删除失败: ' + error.message, 'error');
        }
    }

    // ========== 测试站点 ==========
    async function testSite(siteId) {
        Utils.showToast('正在测试站点连接...', 'info');

        try {
            const response = await fetch(`/admin/api/config/sites/${siteId}/test`);
            const data = await response.json();

            if (data.success) {
                Utils.showToast('站点连接正常', 'success');
            } else {
                Utils.showToast('连接失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('测试站点失败:', error);
            Utils.showToast('测试失败: ' + error.message, 'error');
        }
    }

    // ========== 刷新站点列表 ==========
    function refreshSiteList() {
        loadSiteList();
    }

    // ========== 添加IP输入框 ==========
    function addIpField(value = '') {
        const ipList = document.getElementById('ipList');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input ip-input';
        input.placeholder = '192.168.1.1';
        input.value = value;
        ipList.appendChild(input);
    }

    // ========== 添加URL输入框 ==========
    function addUrlField(value = '') {
        const urlList = document.getElementById('urlList');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input url-input';
        input.placeholder = 'https://example.com';
        input.value = value;
        urlList.appendChild(input);
    }

    // ========== 添加CDN URL输入框 ==========
    function addCdnUrlField(value = '') {
        const cdnUrlList = document.getElementById('cdnUrlList');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input cdn-url-input';
        input.placeholder = 'https://cdn.example.com';
        input.value = value;
        cdnUrlList.appendChild(input);
    }

    // ========== 获取代理模式文本 ==========
    function getProxyModeText(mode) {
        const modeMap = {
            'none': '不使用代理',
            'domestic': '国内代理',
            'foreign': '国外代理',
            'both': '两种代理都用'
        };
        return modeMap[mode] || '不使用代理';
    }

    // ========== 渲染URL特定的Cookies ==========
    function renderUrlCookies(urls, byUrlCookies) {
        const urlCookiesList = document.getElementById('url-cookies-list');
        if (!urlCookiesList) return;

        urlCookiesList.innerHTML = '';

        urls.forEach(url => {
            const cookies = byUrlCookies[url] || {};
            const section = document.createElement('div');
            section.className = 'url-cookies-section';
            section.innerHTML = `
                <div class="url-cookies-section-header">
                    <h5>${url}</h5>
                    <button type="button" class="btn btn-sm btn-secondary" onclick="toggleUrlCookies('${url}')">
                        <i class="fas fa-chevron-down"></i> 展开/折叠
                    </button>
                </div>
                <div id="url-cookies-${encodeURIComponent(url).replace(/'/g, "\\'")}" class="url-cookies-section-content" style="display: none;">
                    <textarea class="form-textarea url-cookies-input" data-url="${url}" rows="3" placeholder='{"key": "value"}'>${JSON.stringify(cookies, null, 2)}</textarea>
                    <span class="form-hint">此URL的特定Cookies（留空则使用默认Cookies）</span>
                </div>
            `;
            urlCookiesList.appendChild(section);
        });
    }

    // ========== 切换Cookies部分展开/折叠 ==========
    function toggleCookiesSection(section) {
        const content = document.getElementById(`cookies-${section}`);
        if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
    }

    // ========== 切换URL Cookies展开/折叠 ==========
    function toggleUrlCookies(url) {
        const content = document.getElementById(`url-cookies-${encodeURIComponent(url).replace(/'/g, "\\'")}`);
        if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
    }

    // ========== 展开所有Cookies部分 ==========
    function expandAllCookies() {
        const contents = document.querySelectorAll('.cookies-section-content, .url-cookies-section-content');
        contents.forEach(content => {
            content.style.display = 'block';
        });
    }

    // ========== 暴露给全局 ==========
    window.openAddSiteDialog = openAddSiteDialog;
    window.closeSiteDialog = closeSiteDialog;
    window.editSite = editSite;
    window.deleteSite = deleteSite;
    window.testSite = testSite;
    window.refreshSiteList = refreshSiteList;
    window.addIpField = addIpField;
    window.addUrlField = addUrlField;
    window.addCdnUrlField = addCdnUrlField;
    window.resetSystemConfig = resetSystemConfig;
    window.toggleCookiesSection = toggleCookiesSection;
    window.toggleUrlCookies = toggleUrlCookies;
    window.expandAllCookies = expandAllCookies;

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
