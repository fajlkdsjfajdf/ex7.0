/**
 * 后台桶管理脚本
 * 负责三桶系统的配置和任务管理（不包括状态监控，状态监控在仪表盘）
 */

(function() {
    'use strict';

    // ========== 初始化 ==========
    function init() {
        loadBucketConfig();
        bindEvents();
    }

    // ========== 绑定事件 ==========
    function bindEvents() {
        // 桶配置表单提交
        const configForm = document.getElementById('bucketConfigForm');
        if (configForm) {
            configForm.addEventListener('submit', saveBucketConfig);
        }
    }

    // ========== 加载桶配置 ==========
    async function loadBucketConfig() {
        try {
            const response = await fetch('/admin/api/buckets/config');
            const data = await response.json();

            if (data.success) {
                populateConfigForm(data.data);
            } else {
                console.error('加载桶配置失败:', data.message);
            }
        } catch (error) {
            console.error('加载桶配置失败:', error);
        }
    }

    // ========== 填充配置表单 ==========
    function populateConfigForm(config) {
        const form = document.getElementById('bucketConfigForm');
        if (!form || !config) return;

        form.querySelector('[name="high_speed_max"]').value = config.high_speed_max || 100;
        form.querySelector('[name="low_speed_max"]').value = config.low_speed_max || 1000;
        form.querySelector('[name="result_max"]').value = config.result_max || 10000;
    }

    // ========== 保存桶配置 ==========
    async function saveBucketConfig(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const config = {
            high_speed_max: parseInt(formData.get('high_speed_max')),
            low_speed_max: parseInt(formData.get('low_speed_max')),
            result_max: parseInt(formData.get('result_max'))
        };

        try {
            const response = await fetch('/admin/api/buckets/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            const data = await response.json();

            if (data.success) {
                Utils.showToast('桶配置已保存', 'success');
            } else {
                Utils.showToast('保存失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('保存桶配置失败:', error);
            Utils.showToast('保存失败: ' + error.message, 'error');
        }
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
            } else {
                Utils.showToast('清空失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('清空桶失败:', error);
            Utils.showToast('清空失败: ' + error.message, 'error');
        }
    }

    // ========== 查看桶任务列表 ==========
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

    // 当前查看的桶类型
    let currentBucketType = null;

    // 当前显示的任务列表（用于查看详情）
    let currentBucketTasks = [];

    // ========== 显示任务列表弹窗 ==========
    function showBucketTasksModal(title, tasks, bucketType) {
        const modal = document.getElementById('bucketTasksModal');
        const titleEl = document.getElementById('bucketTasksModalTitle');
        const tbody = document.getElementById('bucketTasksTableBody');

        titleEl.textContent = title;
        currentBucketType = bucketType; // 保存当前桶类型

        // 保存当前任务列表到全局变量
        currentBucketTasks = tasks || [];

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
                const taskId = (task.id || '').replace(/'/g, "\\'"); // 转义单引号
                const isResult = bucketType === 'result';  // 结果桶

                // 结果桶显示特殊样式
                let statusClass = task.status || 'pending';
                if (isResult) {
                    statusClass = task.status === 'completed' ? 'success' : 'error';
                }

                // 操作列：结果桶显示查看详情，其他桶显示删除按钮
                const actionCell = isResult
                    ? `<td>
                        <button class="btn btn-sm btn-primary" onclick="window.showTaskDetailByIndex(${index})">
                            <i class="fas fa-eye"></i> 详情
                        </button>
                       </td>`
                    : `<td>
                        <button class="btn btn-sm btn-danger" data-bucket-type="${bucketType}" data-task-id="${taskId}" onclick="window.deleteTaskFromModal('${bucketType}', '${taskId}')">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </td>`;

                // 结果桶显示成功/失败，而不是任务类型
                const typeDisplay = isResult
                    ? (task.status === 'completed' ? '✓ 成功' : '✗ 失败')
                    : (task.type || '--');

                return `
                <tr>
                    <td>${task.id || '--'}</td>
                    <td>${typeDisplay}</td>
                    <td>${task.priority || '--'}</td>
                    <td>${task.site || '--'}</td>
                    <td>${formatTime(task.created_at) || '--'}</td>
                    <td><span class="task-status ${statusClass}">${getStatusText(task.status)}</span></td>
                    ${actionCell}
                </tr>
                `;
            }).join('');
        }

        modal.style.display = 'flex';
    }

    // ========== 关闭任务列表弹窗 ==========
    function closeBucketTasksModal() {
        document.getElementById('bucketTasksModal').style.display = 'none';
    }

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

        // 获取metadata中的详细信息
        const metadata = task.metadata || {};

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

        // 显示任务参数
        if (metadata.task_params) {
            html += `
                <div class="detail-section">
                    <h3>任务参数</h3>
                    <pre class="json-preview">${JSON.stringify(metadata.task_params, null, 2)}</pre>
                </div>
            `;
        }

        // 如果是结果桶的任务，显示详细信息
        if (task.success !== undefined || metadata.request_url || metadata.response_data) {
            html += `
                <div class="detail-section">
                    <h3>请求信息</h3>
                    <table class="detail-table">
            `;

            // 请求URL
            if (metadata.request_url) {
                html += `
                        <tr>
                            <th>请求URL</th>
                            <td><a href="${metadata.request_url}" target="_blank">${metadata.request_url}</a></td>
                        </tr>
                `;
            }

            // Cookies
            if (metadata.cookies && Object.keys(metadata.cookies).length > 0) {
                html += `
                        <tr>
                            <th>Cookies</th>
                            <td><pre class="json-preview">${JSON.stringify(metadata.cookies, null, 2)}</pre></td>
                        </tr>
                `;
            }

            // Headers
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

            // 响应信息
            html += `
                <div class="detail-section">
                    <h3>响应信息</h3>
            `;

            // 响应数据（JSON）
            if (metadata.response_data) {
                html += `
                    <h4 style="margin-top: 15px; color: var(--accent-color);">JSON响应数据</h4>
                    <pre class="json-preview" style="max-height: 400px;">${JSON.stringify(metadata.response_data, null, 2)}</pre>
                `;
            }

            // HTML响应
            if (metadata.response_html) {
                html += `
                    <h4 style="margin-top: 15px; color: var(--accent-color);">HTML响应（前5000字符）</h4>
                    <pre class="json-preview" style="max-height: 400px; white-space: pre-wrap; word-break: break-all;">${metadata.response_html.substring(0, 5000)}</pre>
                `;
            }

            // 返回数据（爬虫处理后的数据）
            console.log('[DEBUG] task.data:', task.data);
            console.log('[DEBUG] task.data.file_id:', task.data?.file_id);
            console.log('[DEBUG] metadata.site:', metadata.site);

            if (task.data !== undefined && task.data !== null) {
                html += `
                    <h4 style="margin-top: 15px; color: var(--accent-color);">爬虫处理后数据</h4>
                    <pre class="json-preview" style="max-height: 400px;">${JSON.stringify(task.data, null, 2)}</pre>
                `;

                // 如果数据中包含file_id，显示图片预览
                if (task.data.file_id) {
                    console.log('[DEBUG] 显示图片预览');
                    const file_id = task.data.file_id;
                    const site_id = metadata.site || 'cm';
                    const imageUrl = `/api/media/image?file_id=${encodeURIComponent(file_id)}&site_id=${encodeURIComponent(site_id)}`;

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
                                    <button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText('${file_id}').then(() => Utils.showToast('file_id已复制', 'success'))">
                                        <i class="fas fa-copy"></i> 复制file_id
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    console.log('[DEBUG] task.data.file_id 不存在或为空');
                }
            } else {
                console.log('[DEBUG] task.data 是 undefined 或 null');
            }

            html += `
                </div>
            `;
        }

        // 文件路径和错误信息
        if (task.file_path || task.error) {
            html += `
                <div class="detail-section">
                    <h3>其他信息</h3>
                    <table class="detail-table">
            `;

            // 文件路径
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

            // 错误信息
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
        // 构建图片URL
        const imageUrl = `/api/media/image?path=${encodeURIComponent(imagePath)}`;

        // 创建图片预览弹窗
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
                closeBucketTasksModal();
            } else {
                Utils.showToast('删除失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('删除任务失败:', error);
            Utils.showToast('删除失败: ' + error.message, 'error');
        }
    }

    // ========== 全局删除任务函数（供HTML按钮调用） ==========
    window.deleteTaskFromModal = async function(bucketType, taskId) {
        await deleteTask(bucketType, taskId);
    };

    // ========== 格式化时间 ==========
    function formatTime(timestamp) {
        if (!timestamp) return '--';

        // 如果是秒级时间戳（小于10000000000），转换为毫秒级
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

    // ========== 暴露给全局 ==========
    window.viewBucketTasks = viewBucketTasks;
    window.clearBucket = clearBucket;
    window.closeBucketTasksModal = closeBucketTasksModal;
    window.loadBucketConfig = loadBucketConfig;
    window.deleteTask = deleteTask;
    window.closeTaskDetailModal = closeTaskDetailModal;
    window.previewImage = previewImage;
    // 注意：showTaskDetail 和 showTaskDetailByIndex 已经在定义时直接赋值给 window 了

    // ========== 图片加载错误处理 ==========
    window.handleImageLoadError = function(img) {
        if (img.parentElement) {
            img.parentElement.innerHTML = '<p style="color: var(--error-color);">图片加载失败</p>';
        }
    };

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
