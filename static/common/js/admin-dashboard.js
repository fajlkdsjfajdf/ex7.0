/**
 * 后台仪表盘脚本
 * 负责资源监控、三桶状态显示、手动运行爬虫
 */

(function() {
    'use strict';

    // ========== 初始化 ==========
    function init() {
        bindEvents();
        loadSystemStatus();
        loadSiteSchedulerStatus();  // 加载站点调度器状态
        // 每5秒自动刷新状态
        setInterval(loadSystemStatus, 5000);
        // 每10秒自动刷新站点调度器状态
        setInterval(loadSiteSchedulerStatus, 10000);
    }

    // ========== 绑定事件 ==========
    function bindEvents() {
        // 刷新状态按钮
        const refreshStatusBtn = document.getElementById('refreshStatusBtn');
        if (refreshStatusBtn) {
            refreshStatusBtn.addEventListener('click', loadSystemStatus);
        }
    }

    // ========== 加载系统状态 ==========
    async function loadSystemStatus() {
        try {
            // 调用API获取系统状态
            const response = await fetch('/admin/api/system/status');
            const data = await response.json();

            if (data.success) {
                updateResourceMonitor(data.data.resources);
                updateBucketStatus(data.data.buckets);
            }
        } catch (error) {
            console.error('加载系统状态失败:', error);
            // 使用模拟数据用于演示
            updateResourceMonitor({
                cpu: 45.2,
                memory: {
                    percent: 68.5,
                    used: 5.2,
                    total: 8.0
                },
                disk: {
                    percent: 52.3,
                    used: 260.5,
                    total: 500.0
                }
            });
            updateBucketStatus({
                high_speed: { count: 23, max: 100 },
                low_speed: { count: 156, max: 1000 },
                result: { count: 842, max: 10000 }
            });
        }
    }

    // ========== 更新资源监控 ==========
    function updateResourceMonitor(resources) {
        // CPU
        const cpuValue = document.getElementById('cpuValue');
        if (cpuValue) {
            cpuValue.textContent = resources.cpu.toFixed(1);
            const cpuBar = document.querySelector('#cpuBar .progress-fill');
            if (cpuBar) {
                cpuBar.style.width = `${resources.cpu}%`;
            }
        }

        // 内存
        const memoryValue = document.getElementById('memoryValue');
        if (memoryValue) {
            memoryValue.textContent = resources.memory.percent.toFixed(1);
            const memoryBar = document.querySelector('#memoryBar .progress-fill');
            if (memoryBar) {
                memoryBar.style.width = `${resources.memory.percent}%`;
            }
        }

        const memoryUsed = document.getElementById('memoryUsed');
        const memoryTotal = document.getElementById('memoryTotal');
        if (memoryUsed && memoryTotal) {
            memoryUsed.textContent = resources.memory.used.toFixed(1);
            memoryTotal.textContent = resources.memory.total.toFixed(1);
        }

        // 磁盘
        const diskValue = document.getElementById('diskValue');
        if (diskValue) {
            diskValue.textContent = resources.disk.percent.toFixed(1);
            const diskBar = document.querySelector('#diskBar .progress-fill');
            if (diskBar) {
                diskBar.style.width = `${resources.disk.percent}%`;
            }
        }

        const diskUsed = document.getElementById('diskUsed');
        const diskTotal = document.getElementById('diskTotal');
        if (diskUsed && diskTotal) {
            diskUsed.textContent = resources.disk.used.toFixed(1);
            diskTotal.textContent = resources.disk.total.toFixed(1);
        }
    }

    // ========== 更新三桶状态 ==========
    function updateBucketStatus(buckets) {
        updateSingleBucket('highSpeed', buckets.high_speed);
        updateSingleBucket('lowSpeed', buckets.low_speed);
        updateSingleBucket('processing', buckets.processing);
        updateSingleBucket('result', buckets.result);
    }

    function updateSingleBucket(prefix, bucket) {
        const count = document.getElementById(`${prefix}Count`);
        const max = document.getElementById(`${prefix}Max`);
        const progress = document.getElementById(`${prefix}Progress`);
        const percent = document.getElementById(`${prefix}Percent`);

        if (count && max && progress && percent) {
            count.textContent = bucket.count;
            max.textContent = bucket.max;
            const percentage = (bucket.count / bucket.max * 100).toFixed(1);
            progress.style.width = `${percentage}%`;
            percent.textContent = `${percentage}%`;
        }
    }

    // ========== 加载站点调度器状态 ==========
    let siteSchedulerData = null;  // 存储站点调度器数据
    let countdownInterval = null;  // 倒计时定时器

    async function loadSiteSchedulerStatus() {
        try {
            const response = await fetch('/admin/api/site-scheduler/status');
            const data = await response.json();

            if (data.success) {
                siteSchedulerData = data.data;
                renderSiteSchedulerStatus(siteSchedulerData);
                startCountdown();  // 开始倒计时
            } else {
                renderSiteSchedulerError(data.message || '加载失败');
            }
        } catch (error) {
            console.error('加载站点调度器状态失败:', error);
            renderSiteSchedulerError('加载失败: ' + error.message);
        }
    }

    // ========== 开始倒计时 ==========
    function startCountdown() {
        // 清除旧的定时器
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }

        // 每秒更新一次倒计时
        countdownInterval = setInterval(() => {
            if (siteSchedulerData) {
                updateCountdown(siteSchedulerData);
            }
        }, 1000);
    }

    // ========== 更新倒计时显示 ==========
    function updateCountdown(sites) {
        sites.forEach(site => {
            site.tasks.forEach(task => {
                if (task.enabled && task.remaining_seconds !== null && task.remaining_seconds > 0) {
                    // 减少一秒
                    task.remaining_seconds--;

                    // 更新显示
                    const cell = document.querySelector(`[data-task="${site.site_id}-${task.task_type}"] .countdown-text`);
                    if (cell) {
                        cell.textContent = formatRemainingTime(task.remaining_seconds);
                    }
                }
            });
        });
    }

    // ========== 格式化剩余时间 ==========
    function formatRemainingTime(seconds) {
        if (seconds === 0) {
            return '<span class="pending-run">即将运行</span>';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `还有 ${hours}小时${minutes}分${secs}秒`;
        } else if (minutes > 0) {
            return `还有 ${minutes}分${secs}秒`;
        } else {
            return `还有 ${secs}秒`;
        }
    }

    // ========== 渲染站点调度器状态 ==========
    function renderSiteSchedulerStatus(sites) {
        const container = document.getElementById('siteSchedulerContent');
        if (!container) return;

        if (!sites || sites.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无站点数据</div>';
            return;
        }

        let html = '<div class="site-scheduler-table">';

        sites.forEach(site => {
            const statusClass = site.enabled ? 'status-enabled' : 'status-disabled';
            const statusText = site.enabled ? '已启用' : '已禁用';

            html += `
                <div class="site-scheduler-section">
                    <div class="site-header">
                        <h3><i class="fas fa-globe"></i> ${escapeHtml(site.site_name)} (${site.site_id})</h3>
                        <span class="site-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="tasks-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>任务类型</th>
                                    <th>状态</th>
                                    <th>间隔</th>
                                    <th>下次运行</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            site.tasks.forEach(task => {
                const taskEnabled = task.enabled;
                const taskStatusClass = taskEnabled ? 'task-enabled' : 'task-disabled';
                const taskStatusText = taskEnabled ? '启用' : '禁用';

                // 格式化剩余时间
                let remainingText = '-';
                if (taskEnabled && task.remaining_seconds !== null) {
                    remainingText = formatRemainingTime(task.remaining_seconds);
                }

                html += `
                    <tr data-task="${site.site_id}-${task.task_type}">
                        <td>${escapeHtml(task.task_name)}</td>
                        <td><span class="task-status ${taskStatusClass}">${taskStatusText}</span></td>
                        <td>${task.interval > 0 ? task.interval + ' 小时' : '-'}</td>
                        <td><span class="countdown-text">${remainingText}</span></td>
                        <td>
                            ${taskEnabled ? `
                                <button class="btn-run-task" onclick="runSiteTask('${site.site_id}', '${task.task_type}')">
                                    <i class="fas fa-play"></i> 立即执行
                                </button>
                            ` : '-'}
                        </td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // ========== 渲染站点调度器错误 ==========
    function renderSiteSchedulerError(message) {
        const container = document.getElementById('siteSchedulerContent');
        if (!container) return;

        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${escapeHtml(message)}</span>
            </div>
        `;
    }

    // ========== 运行站点任务 ==========
    async function runSiteTask(siteId, taskType) {
        const confirmed = await Utils.confirm(
            `确定要立即执行站点 ${siteId} 的任务 ${taskType} 吗？`,
            '确认执行'
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch('/admin/api/site-scheduler/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    site_id: siteId,
                    task_type: taskType
                })
            });

            const result = await response.json();

            if (result.success) {
                Utils.showToast('任务已触发执行！', 'success');
                loadSiteSchedulerStatus();  // 刷新状态
            } else {
                Utils.showToast('任务触发失败: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('运行站点任务失败:', error);
            Utils.showToast('运行失败: ' + error.message, 'error');
        }
    }

    // ========== 查看桶任务 ==========
    async function viewBucket(bucketType) {
        await viewBucketTasks(bucketType);
    }

    async function viewBucketTasks(bucketType) {
        const bucketNames = {
            'high_speed': '高速桶',
            'low_speed': '低速桶',
            'result': '结果桶'
        };

        try {
            const response = await fetch(`/admin/api/buckets/${bucketType}`);
            const data = await response.json();

            if (data.success) {
                showBucketTasksModal(bucketNames[bucketType], data.data.tasks, bucketType);
            } else {
                Utils.showToast('加载任务列表失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('加载任务列表失败:', error);
            Utils.showToast('加载任务列表失败: ' + error.message, 'error');
        }
    }

    // 当前显示的任务列表（用于查看详情）
    let currentBucketTasks = [];

    // ========== 显示桶任务弹窗 ==========
    function showBucketTasksModal(title, tasks, bucketType) {
        const modal = document.getElementById('bucketTasksModal');
        const titleEl = document.getElementById('bucketTasksModalTitle');
        const tbody = document.getElementById('bucketTasksTableBody');

        titleEl.textContent = title;

        // 保存当前任务列表到全局变量
        currentBucketTasks = tasks || [];

        const isResult = bucketType === 'result';
        const isProcessing = bucketType === 'processing';

        if (!tasks || tasks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>暂无任务</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = tasks.map((task, index) => {
                const taskId = (task.id || '').replace(/'/g, "\\'");

                let statusClass = task.status || 'pending';
                if (isResult) {
                    statusClass = task.status === 'completed' ? 'success' : 'error';
                } else if (isProcessing) {
                    statusClass = 'running';
                }

                // 操作列
                let actionCell = '';
                if (isResult) {
                    actionCell = `<td>
                        <button class="btn btn-sm btn-primary" onclick="window.showTaskDetailByIndex(${index})">
                            <i class="fas fa-eye"></i> 详情
                        </button>
                       </td>`;
                } else if (isProcessing) {
                    // 运行中桶只能查看，不能删除
                    actionCell = `<td>
                        <span class="text-muted">执行中...</span>
                       </td>`;
                } else {
                    actionCell = `<td>
                        <button class="btn btn-sm btn-danger" data-bucket-type="${bucketType}" data-task-id="${taskId}" onclick="window.deleteTaskFromModal('${bucketType}', '${taskId}')">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </td>`;
                }

                // 类型显示
                let typeDisplay = task.type || '--';
                if (isResult) {
                    typeDisplay = task.status === 'completed' ? '✓ 成功' : '✗ 失败';
                }

                // 时间显示
                let timeDisplay = formatTime(task.created_at) || '--';
                if (isProcessing && task.started_at) {
                    // 运行中桶显示已执行时间
                    const elapsed = calculateElapsedTime(task.started_at);
                    timeDisplay = `${formatTime(task.started_at)}<br><small class="elapsed-time">已执行: ${elapsed}</small>`;
                }

                // 状态显示
                let statusDisplay = getStatusText(task.status);
                if (isProcessing) {
                    statusDisplay = '<i class="fas fa-spinner fa-spin"></i> 执行中';
                }

                return `
                <tr>
                    <td>${task.id || '--'}</td>
                    <td>${typeDisplay}</td>
                    <td>${task.priority || '--'}</td>
                    <td>${task.site || '--'}</td>
                    <td>${timeDisplay}</td>
                    <td><span class="task-status ${statusClass}">${statusDisplay}</span></td>
                    ${actionCell}
                </tr>
                `;
            }).join('');
        }

        modal.style.display = 'flex';

        // 如果是运行中桶，启动定时器更新已执行时间
        if (isProcessing && tasks && tasks.length > 0) {
            startProcessingTimer(tasks);
        }
    }

    // ========== 计算已执行时间 ==========
    function calculateElapsedTime(startedAt) {
        if (!startedAt) return '--';

        const startTime = startedAt < 10000000000 ? startedAt * 1000 : startedAt;
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);

        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;

        if (hours > 0) {
            return `${hours}时${minutes}分${seconds}秒`;
        } else if (minutes > 0) {
            return `${minutes}分${seconds}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    // ========== 运行中桶定时器 ==========
    let processingTimer = null;

    function startProcessingTimer(tasks) {
        // 清除旧定时器
        if (processingTimer) {
            clearInterval(processingTimer);
        }

        // 每秒更新已执行时间
        processingTimer = setInterval(() => {
            const tbody = document.getElementById('bucketTasksTableBody');
            if (!tbody || tbody.style.display === 'none') {
                clearInterval(processingTimer);
                return;
            }

            tasks.forEach((task, index) => {
                if (task.started_at) {
                    const elapsedEl = tbody.querySelector(`tr:nth-child(${index + 1}) .elapsed-time`);
                    if (elapsedEl) {
                        elapsedEl.textContent = '已执行: ' + calculateElapsedTime(task.started_at);
                    }
                }
            });
        }, 1000);
    }

    // ========== 关闭桶任务弹窗 ==========
    function closeBucketTasksModal() {
        document.getElementById('bucketTasksModal').style.display = 'none';
        // 清除运行中桶定时器
        if (processingTimer) {
            clearInterval(processingTimer);
            processingTimer = null;
        }
    }

    // ========== 删除任务 ==========
    async function deleteTask(bucketType, taskId) {
        if (!(await Utils.confirm('确定要删除这个任务吗？'))) {
            return;
        }

        try {
            const response = await fetch(`/admin/api/buckets/${bucketType}/tasks/${taskId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                Utils.showToast('任务已删除', 'success');
                loadSystemStatus(); // 刷新状态
                // 关闭弹窗并重新打开以刷新列表
                closeBucketTasksModal();
                viewBucketTasks(bucketType);
            } else {
                Utils.showToast('删除失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('删除任务失败:', error);
            Utils.showToast('删除失败: ' + error.message, 'error');
        }
    }

    // ========== 全局删除任务函数 ==========
    window.deleteTaskFromModal = async function(bucketType, taskId) {
        await deleteTask(bucketType, taskId);
    };

    // ========== 通过索引查看任务详情 ==========
    window.showTaskDetailByIndex = function(index) {
        if (index >= 0 && index < currentBucketTasks.length) {
            window.showTaskDetail(currentBucketTasks[index]);
        }
    };

    // ========== 显示任务详情 ==========
    window.showTaskDetail = function(task) {
        console.log('[DEBUG] showTaskDetail 被调用');
        console.log('[DEBUG] task:', task);
        console.log('[DEBUG] task.data:', task.data);
        console.log('[DEBUG] task.metadata:', task.metadata);

        const modal = document.getElementById('taskDetailModal');
        const content = document.getElementById('taskDetailContent');

        const metadata = task.metadata || {};

        console.log('[DEBUG] task.data.file_id:', task.data?.file_id);
        console.log('[DEBUG] metadata.site:', metadata.site);

        let html = `
            <div class="detail-section">
                <h3>基本信息</h3>
                <table class="detail-table">
                    <tr>
                        <th>任务ID</th>
                        <td><code>${task.id || '--'}</code></td>
                    </tr>
                    <tr>
                        <th>任务类型</th>
                        <td>${metadata.task_type || task.type || '--'}</td>
                    </tr>
                    <tr>
                        <th>状态</th>
                        <td><span class="task-status ${task.status === 'completed' || task.status === 'success' ? 'success' : 'error'}">${getStatusText(task.status)}</span></td>
                    </tr>
                    <tr>
                        <th>添加时间</th>
                        <td>${formatTime(task.created_at) || '--'}</td>
                    </tr>
                </table>
            </div>
        `;

        if (metadata.task_params) {
            html += `
                <div class="detail-section">
                    <h3>任务参数</h3>
                    <pre class="json-preview">${JSON.stringify(metadata.task_params, null, 2)}</pre>
                </div>
            `;
        }

        if (task.success !== undefined || metadata.request_url || metadata.response_data) {
            html += `
                <div class="detail-section">
                    <h3>请求信息</h3>
                    <table class="detail-table">
            `;

            if (metadata.request_url) {
                html += `
                        <tr>
                            <th>请求URL</th>
                            <td><a href="${metadata.request_url}" target="_blank">${metadata.request_url}</a></td>
                        </tr>
                `;
            }

            if (metadata.cookies && Object.keys(metadata.cookies).length > 0) {
                html += `
                        <tr>
                            <th>Cookies</th>
                            <td><pre class="json-preview">${JSON.stringify(metadata.cookies, null, 2)}</pre></td>
                        </tr>
                `;
            }

            if (metadata.headers && Object.keys(metadata.headers).length > 0) {
                html += `
                        <tr>
                            <th>请求Headers</th>
                            <td><pre class="json-preview" style="max-height: 200px;">${JSON.stringify(metadata.headers, null, 2)}</pre></td>
                        </tr>
                `;
            }

            html += `
                    </table>
                </div>
            `;

            html += `
                <div class="detail-section">
                    <h3>响应信息</h3>
            `;

            if (metadata.response_data) {
                html += `
                    <h4 style="margin-top: 15px; color: var(--accent-color);">JSON响应数据</h4>
                    <pre class="json-preview" style="max-height: 400px;">${JSON.stringify(metadata.response_data, null, 2)}</pre>
                `;
            }

            if (metadata.response_html) {
                html += `
                    <h4 style="margin-top: 15px; color: var(--accent-color);">HTML响应（前5000字符）</h4>
                    <pre class="json-preview" style="max-height: 400px; white-space: pre-wrap; word-break: break-all;">${metadata.response_html.substring(0, 5000)}</pre>
                `;
            }

            if (task.data !== undefined && task.data !== null) {
                html += `
                    <h4 style="margin-top: 15px; color: var(--accent-color);">爬虫处理后数据</h4>
                    <pre class="json-preview" style="max-height: 400px;">${JSON.stringify(task.data, null, 2)}</pre>
                `;

                // 显示图片预览 - 支持新旧两种格式
                let imageUrl = null;
                let imageIdForCopy = null;

                // 格式1: 旧的 file_id 格式
                if (task.data.file_id) {
                    console.log('[DEBUG] 使用 file_id 显示图片预览');
                    const file_id = task.data.file_id;
                    const site_id = metadata.site || 'cm';
                    imageUrl = `/api/media/image?file_id=${encodeURIComponent(file_id)}&site_id=${encodeURIComponent(site_id)}`;
                    imageIdForCopy = file_id;
                }
                // 格式2: 新的 image_id + 业务参数格式
                else if (task.data.image_id) {
                    console.log('[DEBUG] 使用 image_id 显示图片预览');
                    const image_id = task.data.image_id;
                    const site_id = metadata.site || 'cm';

                    // 优先从 metadata 直接获取业务参数（worker 已添加便捷字段）
                    // 回退到 task_params 获取
                    const taskParams = metadata.task_params || {};
                    const aid = metadata.comic_id || taskParams.comic_id || taskParams.aid;
                    const pid = metadata.chapter_id || taskParams.chapter_id || taskParams.pid;
                    const page = metadata.page || taskParams.page || 1;
                    const imageType = metadata.image_type || taskParams.image_type || taskParams.type || 'content';

                    console.log('[DEBUG] 图片参数: site_id=', site_id, 'aid=', aid, 'pid=', pid, 'page=', page, 'type=', imageType);

                    // 使用业务参数构建 URL
                    if (aid) {
                        imageUrl = `/api/media/image?site=${encodeURIComponent(site_id)}&aid=${aid}&type=${imageType}`;
                        if (pid) {
                            imageUrl += `&pid=${pid}`;
                        }
                        if (page && imageType === 'content') {
                            imageUrl += `&page=${page}`;
                        }
                    } else {
                        // 如果没有业务参数，回退到 file_id 方式
                        imageUrl = `/api/media/image?file_id=${encodeURIComponent(image_id)}&site_id=${encodeURIComponent(site_id)}`;
                    }
                    imageIdForCopy = image_id;
                }

                // 显示图片预览
                if (imageUrl) {
                    html += `
                        <div style="margin-top: 15px;">
                            <h4 style="color: var(--accent-color);">图片预览</h4>
                            <div style="text-align: center; padding: 20px; background: var(--bg-secondary); border-radius: 8px;">
                                <img src="${imageUrl}"
                                     style="max-width: 100%; max-height: 600px; object-fit: contain; border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"
                                     alt="图片预览"
                                     onerror="window.handleImageLoadError(this)">
                                <div style="margin-top: 10px;">
                                    <button class="btn btn-sm btn-primary" onclick="window.open('${imageUrl}', '_blank')">
                                        <i class="fas fa-external-link-alt"></i> 在新窗口打开
                                    </button>
                                    ${imageIdForCopy ? `<button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText('${imageIdForCopy}').then(() => Utils.showToast('ID已复制', 'success'))">
                                        <i class="fas fa-copy"></i> 复制ID
                                    </button>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    console.log('[DEBUG] 无法生成图片URL');
                }
            } else {
                console.log('[DEBUG] task.data 是 undefined 或 null');
            }

            html += `
                </div>
            `;
        }

        if (task.file_path || task.error) {
            html += `
                <div class="detail-section">
                    <h3>其他信息</h3>
                    <table class="detail-table">
            `;

            if (task.file_path) {
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(task.file_path);
                html += `
                        <tr>
                            <th>文件路径</th>
                            <td>
                                <code>${task.file_path}</code>
                                ${isImage ? `<br><button class="btn btn-sm btn-primary" onclick="window.previewImage('${task.file_path}')" style="margin-top: 8px;">
                                    <i class="fas fa-image"></i> 预览图片
                                </button>` : ''}
                            </td>
                        </tr>
                `;
            }

            if (task.error) {
                html += `
                        <tr>
                            <th>错误信息</th>
                            <td class="text-error">${task.error}</td>
                        </tr>
                `;
            }

            html += `
                    </table>
                </div>
            `;
        }

        content.innerHTML = html;
        modal.style.display = 'flex';
    };

    // ========== 关闭任务详情弹窗 ==========
    window.closeTaskDetailModal = function() {
        document.getElementById('taskDetailModal').style.display = 'none';
    };

    // ========== 预览图片 ==========
    window.previewImage = function(imagePath) {
        const imageUrl = `/api/media/image?path=${encodeURIComponent(imagePath)}`;

        const previewModal = document.createElement('div');
        previewModal.className = 'modal';
        previewModal.style.zIndex = '10000';
        previewModal.innerHTML = `
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh; text-align: center;">
                <div class="modal-header">
                    <h2>图片预览</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="display: flex; align-items: center; justify-content: center;">
                    <img src="${imageUrl}" style="max-width: 100%; max-height: 80vh; object-fit: contain;" alt="预览图片">
                </div>
            </div>
        `;
        document.body.appendChild(previewModal);
    };

    // ========== 格式化时间 ==========
    function formatTime(timestamp) {
        if (!timestamp) return '--';

        const msTimestamp = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
        const date = new Date(msTimestamp);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    // ========== 获取状态文本 ==========
    function getStatusText(status) {
        const statusMap = {
            'pending': '等待中',
            'running': '执行中',
            'processing': '执行中',
            'completed': '成功',
            'failed': '失败',
            'cancelled': '已取消',
            'success': '成功',
            'error': '错误'
        };
        return statusMap[status] || status || '未知';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== 清空桶 ==========
    async function clearBucket(bucketType) {
        const bucketNames = {
            'high_speed': '高速桶',
            'low_speed': '低速桶',
            'result': '结果桶'
        };

        if (!(await Utils.confirm(`确定要清空${bucketNames[bucketType]}吗？此操作不可恢复！`))) {
            return;
        }

        try {
            const response = await fetch(`/admin/api/buckets/${bucketType}/clear`, {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                Utils.showToast(`${bucketNames[bucketType]}已清空，共删除 ${data.data.cleared_count} 个任务`, 'success');
                loadSystemStatus(); // 刷新状态
            } else {
                Utils.showToast('清空失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('清空桶失败:', error);
            Utils.showToast('清空失败: ' + error.message, 'error');
        }
    }

    // ========== 暴露给全局 ==========
    window.viewBucket = viewBucket;
    window.viewBucketTasks = viewBucketTasks;
    window.loadSiteSchedulerStatus = loadSiteSchedulerStatus;
    window.runSiteTask = runSiteTask;
    window.closeBucketTasksModal = closeBucketTasksModal;
    window.deleteTaskFromModal = deleteTaskFromModal;
    window.handleImageLoadError = handleImageLoadError;
    window.clearBucket = clearBucket;

    // ========== 图片加载错误处理 ==========
    function handleImageLoadError(img) {
        if (img.parentElement) {
            img.parentElement.innerHTML = '<p style="color: var(--error-color);">图片加载失败</p>';
        }
    }

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
