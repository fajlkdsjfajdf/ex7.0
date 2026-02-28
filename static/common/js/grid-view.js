/**
 * 网格视图控制脚本
 * 支持横版/竖版切换和列数调节
 * 同时支持桌面端和移动端控件
 */

(function() {
    'use strict';

    // DOM元素 - 桌面端
    const portraitBtn = document.getElementById('portraitBtn');
    const landscapeBtn = document.getElementById('landscapeBtn');
    const columnSlider = document.getElementById('columnSlider');
    const sliderValue = document.getElementById('sliderValue');

    // DOM元素 - 移动端
    const portraitBtnMobile = document.getElementById('portraitBtnMobile');
    const landscapeBtnMobile = document.getElementById('landscapeBtnMobile');
    const columnSliderMobile = document.getElementById('columnSliderMobile');
    const sliderValueMobile = document.getElementById('sliderValueMobile');

    const comicGrid = document.getElementById('comicGrid');

    let currentView = 'portrait'; // portrait or landscape

    // 同步所有视图按钮状态
    function syncViewButtons(view) {
        const allPortraitBtns = [portraitBtn, portraitBtnMobile].filter(Boolean);
        const allLandscapeBtns = [landscapeBtn, landscapeBtnMobile].filter(Boolean);

        allPortraitBtns.forEach(btn => {
            if (view === 'portrait') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        allLandscapeBtns.forEach(btn => {
            if (view === 'landscape') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 同步所有滑块值
    function syncSliders(value) {
        const allSliders = [columnSlider, columnSliderMobile].filter(Boolean);
        const allValues = [sliderValue, sliderValueMobile].filter(Boolean);

        allSliders.forEach(slider => {
            if (slider) slider.value = value;
        });

        allValues.forEach(val => {
            if (val) val.textContent = value;
        });
    }

    // 切换到竖版
    function setPortrait() {
        if (comicGrid) {
            comicGrid.classList.remove('landscape');
            comicGrid.classList.add('portrait');
            currentView = 'portrait';
            syncViewButtons('portrait');
            updateMaxColumns();
        }
    }

    // 切换到横版
    function setLandscape() {
        if (comicGrid) {
            comicGrid.classList.remove('portrait');
            comicGrid.classList.add('landscape');
            currentView = 'landscape';
            syncViewButtons('landscape');
            updateMaxColumns();
        }
    }

    // 绑定视图切换事件
    [portraitBtn, portraitBtnMobile].filter(Boolean).forEach(btn => {
        btn.addEventListener('click', setPortrait);
    });

    [landscapeBtn, landscapeBtnMobile].filter(Boolean).forEach(btn => {
        btn.addEventListener('click', setLandscape);
    });

    // 动态计算最大列数
    function updateMaxColumns() {
        if (!comicGrid) return 0;

        const containerWidth = comicGrid.clientWidth;
        const minCardWidth = currentView === 'portrait' ? 200 : 300;
        let maxColumns = Math.floor(containerWidth / minCardWidth);
        maxColumns = Math.max(2, Math.min(maxColumns, 16));

        const allSliders = [columnSlider, columnSliderMobile].filter(Boolean);
        allSliders.forEach(slider => {
            slider.max = maxColumns;

            if (parseInt(slider.value) > maxColumns) {
                slider.value = maxColumns;
                syncSliders(maxColumns);
                updateColumns();
            }
        });

        return maxColumns;
    }

    // 更新列数
    function updateColumns() {
        const activeSlider = columnSlider || columnSliderMobile;
        if (activeSlider) {
            const columns = activeSlider.value;
            document.documentElement.style.setProperty('--columns', columns);
            syncSliders(columns);
        }
    }

    // 初始化滑块
    function initSlider() {
        const allSliders = [columnSlider, columnSliderMobile].filter(Boolean);
        if (allSliders.length === 0 || !comicGrid) return;

        allSliders.forEach(slider => {
            slider.min = 1;

            // 滑块事件
            slider.addEventListener('input', () => {
                syncSliders(slider.value);
                updateColumns();
            });
        });

        const maxColumns = updateMaxColumns();

        const initialColumns = Math.max(
            2,
            Math.min(
                Math.round(maxColumns * 0.66),
                maxColumns
            )
        );

        syncSliders(initialColumns);
        updateColumns();
    }

    // 窗口大小改变时重新计算
    window.addEventListener('resize', () => {
        updateMaxColumns();
    });

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSlider);
    } else {
        initSlider();
    }

    // 暴露给外部的接口
    window.GridView = {
        getCurrentView: () => currentView,
        getColumns: () => {
            const activeSlider = columnSlider || columnSliderMobile;
            return activeSlider ? activeSlider.value : 4;
        },
        setView: (view) => {
            if (view === 'portrait') {
                setPortrait();
            } else if (view === 'landscape') {
                setLandscape();
            }
        }
    };

})();
