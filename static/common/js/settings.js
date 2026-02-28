/**
 * 用户设置管理
 * 负责设置页面的交互、保存和加载
 */

(function() {
    'use strict';

    // 默认设置
    const DEFAULT_SETTINGS = {
        sortMode: 'latest',        // 最新/最热/喜欢
        columns: 4,                // 每行列数
        imageMode: 'full',         // 完整/切半
        readMode: 'scroll',        // scroll/scroll-seamless/page-flip/page-flip-multi
        readSize: 'medium',        // 大/中/小
        bgColor: 'black',          // 白/黑/护眼
        proxy: 'disabled'          // 停用/国内/国外
    };

    // 当前设置
    let currentSettings = { ...DEFAULT_SETTINGS };

    // DOM元素
    const sortModeGroup = document.getElementById('sortModeGroup');
    const columnsGroup = document.getElementById('columnsGroup');
    const imageModeGroup = document.getElementById('imageModeGroup');
    const readModeGroup = document.getElementById('readModeGroup');
    const readSizeGroup = document.getElementById('readSizeGroup');
    const bgColorGroup = document.getElementById('bgColorGroup');
    const proxyGroup = document.getElementById('proxyGroup');
    const gotoAdminBtn = document.getElementById('gotoAdminBtn');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');

    // ========== 初始化 ==========
    function init() {
        loadSettings();
        bindEvents();
        applySettings();
    }

    // ========== 加载设置 ==========
    function loadSettings() {
        try {
            const saved = localStorage.getItem('user_settings');
            if (saved) {
                currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
            currentSettings = { ...DEFAULT_SETTINGS };
        }

        // 更新UI
        updateUI();
    }

    // ========== 保存设置 ==========
    function saveSettings() {
        try {
            localStorage.setItem('user_settings', JSON.stringify(currentSettings));
            applySettings();
            Utils.showToast('设置已保存', 'success');
        } catch (error) {
            console.error('保存设置失败:', error);
            Utils.showToast('保存失败，请重试', 'error');
        }
    }

    // ========== 更新UI ==========
    function updateUI() {
        updateButtonGroup(sortModeGroup, currentSettings.sortMode);
        updateButtonGroup(columnsGroup, currentSettings.columns.toString());
        updateButtonGroup(imageModeGroup, currentSettings.imageMode);
        updateButtonGroup(readModeGroup, currentSettings.readMode);
        updateButtonGroup(readSizeGroup, currentSettings.readSize);
        updateButtonGroup(bgColorGroup, currentSettings.bgColor);
        updateButtonGroup(proxyGroup, currentSettings.proxy);
    }

    function updateButtonGroup(group, value) {
        if (!group) return;

        const buttons = group.querySelectorAll('.btn-group-item');
        buttons.forEach(btn => {
            const btnValue = btn.dataset.value;
            if (btnValue === value) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // ========== 绑定事件 ==========
    function bindEvents() {
        // 排序模式
        if (sortModeGroup) {
            bindButtonGroup(sortModeGroup, 'sortMode');
        }

        // 列数
        if (columnsGroup) {
            bindButtonGroup(columnsGroup, 'columns', (value) => parseInt(value));
        }

        // 图片模式
        if (imageModeGroup) {
            bindButtonGroup(imageModeGroup, 'imageMode');
        }

        // 阅读模式
        if (readModeGroup) {
            bindButtonGroup(readModeGroup, 'readMode');
        }

        // 阅读尺寸
        if (readSizeGroup) {
            bindButtonGroup(readSizeGroup, 'readSize');
        }

        // 背景颜色
        if (bgColorGroup) {
            bindButtonGroup(bgColorGroup, 'bgColor');
        }

        // 缓存代理
        if (proxyGroup) {
            bindButtonGroup(proxyGroup, 'proxy');
        }

        // 前往后台
        if (gotoAdminBtn) {
            gotoAdminBtn.addEventListener('click', () => {
                window.location.href = '/admin';
            });
        }

        // 保存按钮
        if (saveBtn) {
            saveBtn.addEventListener('click', saveSettings);
        }

        // 恢复默认按钮
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                if (await Utils.confirm('确定要恢复默认设置吗？')) {
                    currentSettings = { ...DEFAULT_SETTINGS };
                    updateUI();
                    saveSettings();
                }
            });
        }
    }

    function bindButtonGroup(group, settingKey, transform = (v) => v) {
        const buttons = group.querySelectorAll('.btn-group-item');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = transform(btn.dataset.value);
                currentSettings[settingKey] = value;
                updateButtonGroup(group, value);
            });
        });
    }

    // ========== 应用设置 ==========
    function applySettings() {
        applyBgColor();
        applyColumns();
        applyImageMode();
        // 其他设置的应用可以在这里添加
    }

    // 应用背景颜色
    function applyBgColor() {
        const bgColor = currentSettings.bgColor;

        const root = document.documentElement;

        // 移除旧的主题
        root.classList.remove('theme-light', 'theme-dark', 'theme-eye-care');

        // 应用新主题
        switch (bgColor) {
            case 'white':
                root.classList.add('theme-light');
                break;
            case 'black':
                root.classList.add('theme-dark');
                break;
            case 'eye-care':
                root.classList.add('theme-eye-care');
                break;
        }
    }

    // 应用列数
    function applyColumns() {
        const columns = currentSettings.columns;
        document.documentElement.style.setProperty('--columns', columns);

        // 同步到网格视图的滑块
        const slider = document.getElementById('columnSlider');
        const sliderMobile = document.getElementById('columnSliderMobile');
        const sliderValue = document.getElementById('sliderValue');
        const sliderValueMobile = document.getElementById('sliderValueMobile');

        if (slider) slider.value = columns;
        if (sliderMobile) sliderMobile.value = columns;
        if (sliderValue) sliderValue.textContent = columns;
        if (sliderValueMobile) sliderValueMobile.textContent = columns;
    }

    // 应用图片模式
    function applyImageMode() {
        const imageMode = currentSettings.imageMode;
        const comicGrid = document.getElementById('comicGrid');

        if (comicGrid) {
            if (imageMode === 'full') {
                comicGrid.classList.remove('landscape');
                comicGrid.classList.add('portrait');
            } else if (imageMode === 'half') {
                comicGrid.classList.remove('portrait');
                comicGrid.classList.add('landscape');
            }
        }
    }

    // ========== 暴露给外部的接口 ==========
    window.Settings = {
        get: (key) => currentSettings[key],
        set: (key, value) => {
            if (key in currentSettings) {
                currentSettings[key] = value;
                saveSettings();
            }
        },
        getAll: () => ({ ...currentSettings }),
        apply: applySettings
    };

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
