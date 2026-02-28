/**
 * 后台基础脚本
 * 处理移动端菜单切换等通用功能
 */

(function() {
    'use strict';

    // ========== 移动端菜单切换 ==========
    function initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const adminSidebar = document.getElementById('adminSidebar');
        const adminMain = document.querySelector('.admin-main');

        // 根据屏幕宽度显示/隐藏菜单按钮
        function updateMobileMenu() {
            if (window.innerWidth <= 992) {
                mobileMenuBtn.style.display = 'block';
            } else {
                mobileMenuBtn.style.display = 'none';
                adminSidebar.classList.remove('show');
            }
        }

        // 初始化
        updateMobileMenu();

        // 菜单按钮点击事件
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                adminSidebar.classList.toggle('show');
            });
        }

        // 点击主内容区关闭侧边栏
        if (adminMain) {
            adminMain.addEventListener('click', () => {
                if (window.innerWidth <= 992) {
                    adminSidebar.classList.remove('show');
                }
            });
        }

        // 窗口大小改变时更新
        window.addEventListener('resize', updateMobileMenu);
    }

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }

})();
