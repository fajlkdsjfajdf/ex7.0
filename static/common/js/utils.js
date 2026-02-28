/**
 * 工具函数库
 */

const Utils = {
    /**
     * 格式化日期
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // 小于1分钟
        if (diff < 60000) {
            return '刚刚';
        }

        // 小于1小时
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}分钟前`;
        }

        // 小于1天
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}小时前`;
        }

        // 小于7天
        if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)}天前`;
        }

        // 格式化为具体日期
        return date.toLocaleDateString('zh-CN');
    },

    /**
     * 格式化数字
     */
    formatNumber(num) {
        if (num >= 10000) {
            return `${(num / 10000).toFixed(1)}万`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        return num.toString();
    },

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * LocalStorage封装
     */
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('LocalStorage保存失败:', e);
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('LocalStorage读取失败:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('LocalStorage删除失败:', e);
            }
        },

        clear() {
            try {
                localStorage.clear();
            } catch (e) {
                console.error('LocalStorage清空失败:', e);
            }
        }
    },

    /**
     * Cookie封装
     */
    cookie: {
        set(name, value, days = 7) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            const expires = `expires=${date.toUTCString()}`;
            document.cookie = `${name}=${value};${expires};path=/`;
        },

        get(name) {
            const nameEQ = `${name}=`;
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.indexOf(nameEQ) === 0) {
                    return cookie.substring(nameEQ.length);
                }
            }
            return null;
        },

        remove(name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
        }
    },

    /**
     * 检查登录状态
     */
    isLoggedIn() {
        return this.cookie.get('session_token') !== null;
    },

    /**
     * 获取当前用户
     */
    getCurrentUser() {
        return this.storage.get('current_user', null);
    },

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info', duration = 3000) {
        // 移除现有的toast
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建新的toast
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: var(--bg-light);
            color: var(--text-primary);
            border-radius: var(--border-radius);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        // 添加样式
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * 确认对话框
     */
    confirm(message, title = '确认') {
        return new Promise((resolve) => {
            // 创建模态框
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            `;

            // 创建对话框
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.style.cssText = `
                background: var(--bg-light);
                border-radius: 10px;
                padding: 25px;
                min-width: 400px;
                max-width: 500px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                animation: slideUp 0.2s ease;
            `;

            dialog.innerHTML = `
                <div class="confirm-header" style="
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 15px;
                ">${title}</div>
                <div class="confirm-message" style="
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 25px;
                ">${message}</div>
                <div class="confirm-buttons" style="
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                ">
                    <button class="btn-cancel" style="
                        padding: 10px 20px;
                        background: var(--bg-darker);
                        color: var(--text-primary);
                        border: 1px solid var(--border-color);
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: all 0.2s;
                    ">取消</button>
                    <button class="btn-confirm" style="
                        padding: 10px 20px;
                        background: var(--accent-color);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: all 0.2s;
                    ">确定</button>
                </div>
            `;

            // 添加动画样式
            if (!document.querySelector('#confirm-styles')) {
                const style = document.createElement('style');
                style.id = 'confirm-styles';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    @keyframes slideUp {
                        from {
                            transform: translateY(20px);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                    .confirm-dialog button:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    }
                    .confirm-dialog button:active {
                        transform: translateY(0);
                    }
                `;
                document.head.appendChild(style);
            }

            modal.appendChild(dialog);
            document.body.appendChild(modal);

            // 按钮事件
            const cancelBtn = dialog.querySelector('.btn-cancel');
            const confirmBtn = dialog.querySelector('.btn-confirm');

            cancelBtn.onclick = () => {
                modal.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => modal.remove(), 200);
                resolve(false);
            };

            confirmBtn.onclick = () => {
                modal.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => modal.remove(), 200);
                resolve(true);
            };

            // 点击背景关闭
            modal.onclick = (e) => {
                if (e.target === modal) {
                    cancelBtn.click();
                }
            };

            // ESC键关闭
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    cancelBtn.click();
                    document.removeEventListener('keydown', handleEsc);
                }
            };
            document.addEventListener('keydown', handleEsc);
        });
    },

    /**
     * 生成唯一ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * 复制到剪贴板
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('复制成功', 'success');
            return true;
        } catch (e) {
            console.error('复制失败:', e);
            this.showToast('复制失败', 'error');
            return false;
        }
    },

    /**
     * 滚动到顶部
     */
    scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    },

    /**
     * 获取URL参数
     */
    getUrlParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    },

    /**
     * 设置URL参数
     */
    setUrlParams(params) {
        const url = new URL(window.location.href);
        for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
        }
        window.history.pushState({}, '', url);
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
