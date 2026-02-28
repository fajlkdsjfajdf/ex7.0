/**
 * 后台日志管理脚本
 * 负责日志的查看、过滤、下载等功能
 */

(function() {
    'use strict';

    // ========== 状态管理 ==========
    let currentLogType = null;  // 当前查看的日志类型
    let currentOffset = 0;      // 当前偏移量
    let currentTotalLines = 0;  // 总行数
    let currentLinesPerPage = 100;  // 每页显示行数
    let currentLogLevel = '';   // 当前日志级别过滤

    // ========== 初始化 ==========
    function init() {
        loadLogFilesList();
        bindEvents();
    }

    // ========== 绑定事件 ==========
    function bindEvents() {
        // 可以在这里添加额外的事件监听
    }

    // ========== 加载日志文件列表 ==========
    async function loadLogFilesList() {
        try {
            const response = await fetch('/admin/api/logs');
            const data = await response.json();

            if (data.success) {
                renderLogFilesList(data.data.logs || []);
            } else {
                showError('加载日志列表失败: ' + data.message);
            }
        } catch (error) {
            console.error('加载日志列表失败:', error);
            showError('加载日志列表失败: ' + error.message);
        }
    }

    // ========== 渲染日志文件列表 ==========
    function renderLogFilesList(logs) {
        const container = document.getElementById('logFilesList');
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>暂无日志文件</p>
                </div>
            `;
            return;
        }

        container.innerHTML = logs.map(log => {
            const sizeText = formatFileSize(log.size);
            const modifiedText = formatDateTime(log.modified * 1000);
            const iconClass = log.type === 'error' ? 'fa-exclamation-triangle text-danger' : 'fa-file-alt text-info';

            return `
            <div class="log-file-item" onclick="viewLog('${log.type}', '${log.name}')">
                <div class="log-file-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="log-file-info">
                    <div class="log-file-name">${log.filename}</div>
                    <div class="log-file-meta">
                        <span class="log-file-type">${log.name}</span>
                        <span class="log-file-size">${sizeText}</span>
                        <span class="log-file-modified">${modifiedText}</span>
                    </div>
                </div>
                <div class="log-file-actions">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); downloadLog('${log.type}')">
                        <i class="fas fa-download"></i> 下载
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    // ========== 查看日志内容 ==========
    async function viewLog(logType, logName) {
        currentLogType = logType;
        currentOffset = 0;

        // 更新标题
        document.getElementById('logContentTitle').innerHTML = `<i class="fas fa-eye"></i> ${logName}`;
        document.getElementById('logContentSection').style.display = 'block';

        // 滚动到日志内容区域
        document.getElementById('logContentSection').scrollIntoView({ behavior: 'smooth' });

        await loadLogContent();
    }

    // ========== 加载日志内容 ==========
    async function loadLogContent() {
        if (!currentLogType) return;

        const lines = parseInt(document.getElementById('logLinesLimit').value) || 100;
        const level = document.getElementById('logLevelFilter').value;

        try {
            const url = `/admin/api/logs/${currentLogType}/content?lines=${lines}&offset=${currentOffset}&level=${level}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                currentTotalLines = data.data.total_lines;
                currentLinesPerPage = data.data.count;
                currentLogLevel = level;

                // 显示日志内容
                displayLogContent(data.data.lines);

                // 更新信息
                updatePaginationInfo();

                // 更新过滤信息
                document.getElementById('logInfoText').textContent =
                    `共 ${currentTotalLines} 条日志，当前显示第 ${currentOffset + 1}-${currentOffset + currentLinesPerPage} 条`;
            } else {
                showError('加载日志内容失败: ' + data.message);
            }
        } catch (error) {
            console.error('加载日志内容失败:', error);
            showError('加载日志内容失败: ' + error.message);
        }
    }

    // ========== 显示日志内容 ==========
    function displayLogContent(lines) {
        const container = document.getElementById('logContent');
        if (!container) return;

        if (lines.length === 0) {
            container.innerHTML = '<div class="empty-state">暂无日志内容</div>';
            return;
        }

        container.innerHTML = lines.map(line => {
            const levelClass = getLogLevelClass(line.level);
            return `<div class="log-line ${levelClass}">
                <span class="log-timestamp">${line.timestamp}</span>
                <span class="log-level">[${line.level}]</span>
                <span class="log-module">${line.module}</span>
                <span class="log-message">${escapeHtml(line.message)}</span>
            </div>`;
        }).join('\n');

        // 滚动到顶部
        container.scrollTop = 0;
    }

    // ========== 获取日志级别样式 ==========
    function getLogLevelClass(level) {
        const levelMap = {
            'DEBUG': 'log-debug',
            'INFO': 'log-info',
            'WARNING': 'log-warning',
            'ERROR': 'log-error',
            'CRITICAL': 'log-critical'
        };
        return levelMap[level] || '';
    }

    // ========== 转义HTML ==========
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== 更新分页信息 ==========
    function updatePaginationInfo() {
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('pageInfo');

        // 更新按钮状态
        prevBtn.disabled = currentOffset <= 0;
        nextBtn.disabled = currentOffset + currentLinesPerPage >= currentTotalLines;

        // 更新页码信息
        if (currentTotalLines > 0) {
            const currentPage = Math.floor(currentOffset / currentLinesPerPage) + 1;
            const totalPages = Math.ceil(currentTotalLines / currentLinesPerPage);
            pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;
        } else {
            pageInfo.textContent = '';
        }
    }

    // ========== 上一页 ==========
    async function loadPrevPage() {
        const newOffset = Math.max(0, currentOffset - currentLinesPerPage);
        if (newOffset !== currentOffset) {
            currentOffset = newOffset;
            await loadLogContent();
        }
    }

    // ========== 下一页 ==========
    async function loadNextPage() {
        const newOffset = currentOffset + currentLinesPerPage;
        if (newOffset < currentTotalLines) {
            currentOffset = newOffset;
            await loadLogContent();
        }
    }

    // ========== 刷新日志内容 ==========
    async function refreshLogContent() {
        currentOffset = 0;
        await loadLogContent();
        Utils.showToast('日志内容已刷新', 'success');
    }

    // ========== 过滤日志 ==========
    async function filterLogs() {
        currentOffset = 0;
        await loadLogContent();
    }

    // ========== 关闭日志内容 ==========
    function closeLogContent() {
        document.getElementById('logContentSection').style.display = 'none';
        currentLogType = null;
        currentOffset = 0;
    }

    // ========== 刷新日志列表 ==========
    function refreshLogList() {
        loadLogFilesList();
        Utils.showToast('日志列表已刷新', 'success');
    }

    // ========== 下载日志 ==========
    function downloadLog(logType) {
        window.location.href = `/admin/api/logs/${logType}/download`;
        Utils.showToast('开始下载日志文件', 'success');
    }

    // ========== 下载当前日志 ==========
    function downloadCurrentLog() {
        if (currentLogType) {
            downloadLog(currentLogType);
        }
    }

    // ========== 清空所有日志 ==========
    async function clearAllLogs() {
        if (!(await Utils.confirm('确定要清空所有日志文件吗？此操作不可恢复！'))) {
            return;
        }

        try {
            const response = await fetch('/admin/api/logs/clear', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                Utils.showToast(`已清空 ${data.data.cleared_count} 个日志文件`, 'success');
                closeLogContent();
                loadLogFilesList();
            } else {
                Utils.showToast('清空日志失败: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('清空日志失败:', error);
            Utils.showToast('清空日志失败: ' + error.message, 'error');
        }
    }

    // ========== 格式化文件大小 ==========
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // ========== 格式化日期时间 ==========
    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    // ========== 显示错误信息 ==========
    function showError(message) {
        const container = document.getElementById('logFilesList');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // ========== 暴露给全局 ==========
    window.viewLog = viewLog;
    window.refreshLogList = refreshLogList;
    window.refreshLogContent = refreshLogContent;
    window.filterLogs = filterLogs;
    window.closeLogContent = closeLogContent;
    window.downloadLog = downloadLog;
    window.downloadCurrentLog = downloadCurrentLog;
    window.clearAllLogs = clearAllLogs;
    window.loadPrevPage = loadPrevPage;
    window.loadNextPage = loadNextPage;

    // ========== 启动 ==========
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
