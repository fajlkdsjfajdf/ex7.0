/**
 * 后台代理管理脚本
 * 负责国内代理和国外代理的配置管理
 */

(function() {
    'use strict';

    // ========== 初始化 ==========
    function init() {
        loadProxyConfig();
        bindEvents();
    }

    // ========== 绑定事件 ==========
    function bindEvents() {
        // 国内代理表单提交
        const domesticForm = document.getElementById('domesticProxyForm');
        if (domesticForm) {
            domesticForm.addEventListener('submit', saveDomesticProxies);
        }

        // 国外代理表单提交
        const foreignForm = document.getElementById('foreignProxyForm');
        if (foreignForm) {
            foreignForm.addEventListener('submit', saveForeignProxies);
        }
    }

    // ========== 加载代理配置 ==========
    async function loadProxyConfig() {
        try {
            const response = await fetch('/admin/api/config/proxy');
            const data = await response.json();

            if (data.success) {
                renderProxyLists(data.data);
            } else {
                console.error('加载代理配置失败:', data.message);
            }
        } catch (error) {
            console.error('加载代理配置失败:', error);
        }
    }

    // ========== 渲染代理列表 ==========
    function renderProxyLists(config) {
        const domesticList = document.getElementById('domesticProxyList');
        const foreignList = document.getElementById('foreignProxyList');

        // 渲染国内代理
        if (domesticList) {
            domesticList.innerHTML = '';
            const domesticProxies = config.domestic || [];
            if (domesticProxies.length === 0) {
                domesticList.innerHTML = '<div class="empty-state"><p>暂无国内代理配置</p></div>';
            } else {
                domesticProxies.forEach(proxy => {
                    addProxyItem(domesticList, proxy);
                });
            }
        }

        // 渲染国外代理
        if (foreignList) {
            foreignList.innerHTML = '';
            const foreignProxies = config.foreign || [];
            if (foreignProxies.length === 0) {
                foreignList.innerHTML = '<div class="empty-state"><p>暂无国外代理配置</p></div>';
            } else {
                foreignProxies.forEach(proxy => {
                    addProxyItem(foreignList, proxy);
                });
            }
        }
    }

    // ========== 添加代理项 ==========
    function addProxyItem(container, proxyData = null) {
        const template = document.getElementById('proxyItemTemplate');
        const clone = template.content.cloneNode(true);
        const proxyItem = clone.querySelector('.proxy-item');

        if (proxyData) {
            proxyItem.querySelector('.proxy-type').value = proxyData.type || 'http';
            proxyItem.querySelector('.proxy-host').value = proxyData.host || '';
            proxyItem.querySelector('.proxy-port').value = proxyData.port || '';
            proxyItem.querySelector('.proxy-username').value = proxyData.username || '';
            proxyItem.querySelector('.proxy-password').value = proxyData.password || '';
            proxyItem.querySelector('.proxy-weight').value = proxyData.weight || 1;
            proxyItem.querySelector('.proxy-ipv6').value = proxyData.ipv6 || 'auto';
        }

        container.appendChild(proxyItem);
    }

    // ========== 添加国内代理 ==========
    function addDomesticProxy() {
        const container = document.getElementById('domesticProxyList');
        // 移除空状态提示
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        addProxyItem(container);
    }

    // ========== 添加国外代理 ==========
    function addForeignProxy() {
        const container = document.getElementById('foreignProxyList');
        // 移除空状态提示
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        addProxyItem(container);
    }

    // ========== 删除代理 ==========
    function removeProxy(button) {
        const proxyItem = button.closest('.proxy-item');
        proxyItem.remove();
    }

    // ========== 收集代理表单数据 ==========
    function collectProxyFormData(containerId) {
        const container = document.getElementById(containerId);
        const proxyItems = container.querySelectorAll('.proxy-item');
        const proxies = [];

        proxyItems.forEach(item => {
            const proxy = {
                type: item.querySelector('.proxy-type').value,
                host: item.querySelector('.proxy-host').value,
                port: parseInt(item.querySelector('.proxy-port').value) || 0,
                username: item.querySelector('.proxy-username').value || null,
                password: item.querySelector('.proxy-password').value || null,
                weight: parseInt(item.querySelector('.proxy-weight').value) || 1,
                ipv6: item.querySelector('.proxy-ipv6').value || 'auto'
            };
            proxies.push(proxy);
        });

        return proxies;
    }

    // ========== 测试代理 ==========
    async function testProxy(button) {
        const proxyItem = button.closest('.proxy-item');
        const testButton = proxyItem.querySelector('.btn-info, .btn-success');
        const originalText = testButton.innerHTML;
        const originalClass = testButton.className;

        // 禁用按钮，显示加载状态
        testButton.disabled = true;
        testButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试中...';

        try {
            const proxyData = {
                type: proxyItem.querySelector('.proxy-type').value,
                host: proxyItem.querySelector('.proxy-host').value,
                port: parseInt(proxyItem.querySelector('.proxy-port').value) || 0,
                username: proxyItem.querySelector('.proxy-username').value || null,
                password: proxyItem.querySelector('.proxy-password').value || null
            };

            console.log('测试代理:', proxyData);

            const response = await fetch('/admin/api/config/proxy/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(proxyData)
            });

            const data = await response.json();
            console.log('测试结果:', data);

            if (data.success && data.data && data.data.working) {
                const time = data.data.response_time ? ` (${data.data.response_time}ms)` : '';
                showToast(`代理可用${time}`, 'success');
                testButton.classList.remove('btn-info');
                testButton.classList.add('btn-success');
            } else {
                const error = data.data?.error || data.message || '测试失败';
                showToast(`代理不可用: ${error}`, 'error');
                testButton.classList.remove('btn-info', 'btn-success');
                testButton.classList.add('btn-info');
            }
        } catch (error) {
            console.error('测试代理失败:', error);
            showToast('测试失败: ' + error.message, 'error');
            testButton.classList.remove('btn-success');
            testButton.classList.add('btn-info');
        } finally {
            // 恢复按钮状态
            testButton.disabled = false;
            if (!testButton.classList.contains('btn-success')) {
                testButton.innerHTML = originalText;
            }
        }
    }

    // ========== 简单的Toast提示 ==========
    function showToast(message, type = 'info') {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.textContent = message;

        // 设置样式（使用固定颜色）
        let bgColor = '#333';
        let textColor = '#fff';
        if (type === 'success') {
            bgColor = '#28a745';
        } else if (type === 'error') {
            bgColor = '#dc3545';
        } else if (type === 'warning') {
            bgColor = '#ffc107';
            textColor = '#333';
        }

        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 20px;
            background: ${bgColor};
            color: ${textColor};
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-size: 14px;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;

        // 添加动画样式
        if (!document.querySelector('#toast-test-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-test-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // 3秒后自动移除
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========== 保存国内代理 ==========
    async function saveDomesticProxies(e) {
        e.preventDefault();

        const domesticProxies = collectProxyFormData('domesticProxyList');

        try {
            const response = await fetch('/admin/api/config/proxy/domestic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ proxies: domesticProxies })
            });

            const data = await response.json();

            if (data.success) {
                showToast('国内代理已保存', 'success');
            } else {
                showToast('保存失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('保存国内代理失败:', error);
            showToast('保存失败: ' + error.message, 'error');
        }
    }

    // ========== 保存国外代理 ==========
    async function saveForeignProxies(e) {
        e.preventDefault();

        const foreignProxies = collectProxyFormData('foreignProxyList');

        try {
            const response = await fetch('/admin/api/config/proxy/foreign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ proxies: foreignProxies })
            });

            const data = await response.json();

            if (data.success) {
                showToast('国外代理已保存', 'success');
            } else {
                showToast('保存失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('保存国外代理失败:', error);
            showToast('保存失败: ' + error.message, 'error');
        }
    }

    // ========== 暴露给全局 ==========
    window.addDomesticProxy = addDomesticProxy;
    window.addForeignProxy = addForeignProxy;
    window.removeProxy = removeProxy;
    window.testProxy = testProxy;

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
