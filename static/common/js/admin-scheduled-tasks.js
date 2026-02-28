/**
 * 后台定时任务管理脚本
 * 负责定时任务的配置和管理
 */

(function() {
    'use strict';

    // ========== 初始化 ==========
    function init() {
        loadTaskList();
        bindEvents();
    }

    // ========== 绑定事件 ==========
    function bindEvents() {
        // 任务配置表单提交
        const taskConfigForm = document.getElementById('taskConfigForm');
        if (taskConfigForm) {
            taskConfigForm.addEventListener('submit', saveTaskConfig);
        }
    }

    // ========== 加载任务列表 ==========
    async function loadTaskList() {
        try {
            const response = await fetch('/admin/api/scheduled-tasks');
            const data = await response.json();

            if (data.success) {
                renderTaskList(data.data.tasks || []);
            } else {
                console.error('加载任务列表失败:', data.message);
                showError('加载任务列表失败: ' + data.message);
            }
        } catch (error) {
            console.error('加载任务列表失败:', error);
            showError('加载任务列表失败: ' + error.message);
        }
    }

    // ========== 渲染任务列表 ==========
    function renderTaskList(tasks) {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>暂无定时任务</p>
                </div>
            `;
            return;
        }

        taskList.innerHTML = tasks.map(task => {
            const statusClass = task.enabled ? 'enabled' : 'disabled';
            const statusText = task.enabled ? '已启用' : '已禁用';
            const statusIcon = task.enabled ? 'check-circle' : 'times-circle';

            const lastRun = task.last_run ? formatDateTime(task.last_run) : '从未执行';
            const nextRun = task.next_run ? formatDateTime(task.next_run) : '未计划';
            const intervalText = formatInterval(task.interval_hours);

            return `
            <div class="task-card">
                <div class="task-card-header">
                    <h3>${task.name}</h3>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-primary" onclick="runTaskNow('${task.id}')" title="立即执行">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="openTaskConfig('${task.id}')" title="配置">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </div>
                <div class="task-card-body">
                    <p class="task-description">${task.description || '暂无描述'}</p>
                    <div class="task-info">
                        <div class="task-info-item">
                            <i class="fas fa-clock"></i>
                            <span>执行间隔: ${intervalText}</span>
                        </div>
                        <div class="task-info-item">
                            <i class="fas fa-history"></i>
                            <span>最后执行: ${lastRun}</span>
                        </div>
                        <div class="task-info-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>下次执行: ${nextRun}</span>
                        </div>
                    </div>
                </div>
                <div class="task-card-footer">
                    <span class="task-status ${statusClass}">
                        <i class="fas fa-${statusIcon}"></i>
                        ${statusText}
                    </span>
                    <span class="task-version">v${task.version}</span>
                </div>
            </div>
            `;
        }).join('');
    }

    // ========== 打开任务配置对话框 ==========
    async function openTaskConfig(taskId) {
        try {
            const response = await fetch(`/admin/api/scheduled-tasks/${taskId}`);
            const data = await response.json();

            if (data.success) {
                const task = data.data;

                document.getElementById('taskConfigDialogTitle').textContent = `配置任务: ${task.name}`;
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskName').value = task.name;
                document.getElementById('taskDescription').value = task.description;
                document.getElementById('taskEnabled').checked = task.enabled;
                document.getElementById('taskInterval').value = task.interval_hours;
                document.getElementById('taskLastRun').value = task.last_run ? formatDateTime(task.last_run) : '从未执行';
                document.getElementById('taskNextRun').value = task.next_run ? formatDateTime(task.next_run) : '未计划';

                // 渲染任务特定配置参数
                renderTaskConfigParams(task.config);

                document.getElementById('taskConfigDialog').style.display = 'flex';
            } else {
                Utils.showToast('加载任务配置失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('加载任务配置失败:', error);
            Utils.showToast('加载任务配置失败: ' + error.message, 'error');
        }
    }

    // ========== 渲染任务配置参数 ==========
    function renderTaskConfigParams(config) {
        const container = document.getElementById('taskConfigParams');
        if (!container) return;

        container.innerHTML = '';

        if (!config || Object.keys(config).length === 0) {
            return;
        }

        Object.keys(config).forEach(key => {
            const value = config[key];
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = key;

            let input;
            if (typeof value === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.className = 'form-input';
                input.value = value;
                input.dataset.configKey = key;
            } else if (typeof value === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value;
                input.dataset.configKey = key;
            } else {
                input = document.createElement('input');
                input.type = 'text';
                input.className = 'form-input';
                input.value = value;
                input.dataset.configKey = key;
            }

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            container.appendChild(formGroup);
        });
    }

    // ========== 关闭任务配置对话框 ==========
    function closeTaskConfigDialog() {
        document.getElementById('taskConfigDialog').style.display = 'none';
    }

    // ========== 保存任务配置 ==========
    async function saveTaskConfig(e) {
        e.preventDefault();

        const taskId = document.getElementById('taskId').value;
        const enabled = document.getElementById('taskEnabled').checked;
        const intervalHours = parseFloat(document.getElementById('taskInterval').value);

        // 收集任务特定配置参数
        const configParams = document.querySelectorAll('#taskConfigParams [data-config-key]');
        const config = {};
        configParams.forEach(param => {
            const key = param.dataset.configKey;
            if (param.type === 'checkbox') {
                config[key] = param.checked;
            } else if (param.type === 'number') {
                config[key] = parseInt(param.value) || 0;
            } else {
                config[key] = param.value;
            }
        });

        const data = {
            enabled: enabled,
            interval_hours: intervalHours,
            config: config
        };

        try {
            const response = await fetch(`/admin/api/scheduled-tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                Utils.showToast('任务配置已保存', 'success');
                closeTaskConfigDialog();
                loadTaskList();
            } else {
                Utils.showToast('保存失败: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('保存任务配置失败:', error);
            Utils.showToast('保存失败: ' + error.message, 'error');
        }
    }

    // ========== 立即执行任务 ==========
    async function runTaskNow(taskId) {
        if (!(await Utils.confirm('确定要立即执行此任务吗？'))) {
            return;
        }

        Utils.showToast('正在执行任务...', 'info');

        try {
            const response = await fetch(`/admin/api/scheduled-tasks/${taskId}/run`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                Utils.showToast('任务已触发执行', 'success');
                // 延迟刷新列表，以便看到更新的执行时间
                setTimeout(() => loadTaskList(), 1000);
            } else {
                Utils.showToast('执行失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('执行任务失败:', error);
            Utils.showToast('执行失败: ' + error.message, 'error');
        }
    }

    // ========== 刷新任务列表 ==========
    function refreshTaskList() {
        loadTaskList();
    }

    // ========== 格式化日期时间 ==========
    function formatDateTime(isoString) {
        if (!isoString) return '-';

        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // ========== 格式化时间间隔 ==========
    function formatInterval(hours) {
        if (hours >= 1) {
            // 大于等于1小时，显示小时
            const minutes = Math.round(hours * 60);
            if (minutes % 60 === 0) {
                return `${hours}小时`;
            } else {
                return `${hours}小时（${minutes}分钟）`;
            }
        } else {
            // 小于1小时，转换为分钟显示
            const minutes = Math.round(hours * 60);
            return `${minutes}分钟`;
        }
    }

    // ========== 显示错误信息 ==========
    function showError(message) {
        const taskList = document.getElementById('taskList');
        if (taskList) {
            taskList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // ========== 暴露给全局 ==========
    window.openTaskConfig = openTaskConfig;
    window.closeTaskConfigDialog = closeTaskConfigDialog;
    window.runTaskNow = runTaskNow;
    window.refreshTaskList = refreshTaskList;

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
