/**
 * 智能图片加载器 - 按需加载和自动更新
 *
 * 功能：
 * 1. 检查图片资源是否存在
 * 2. 不存在时提交爬取任务到高速桶
 * 3. 通过WebSocket接收完成通知并自动更新图片
 */
(function(window) {
    'use strict';

    /**
     * 智能图片加载器类
     */
    class SmartImageLoader {
        constructor() {
            this.loadingImages = new Map(); // {url: imgElement}
            this.pendingResources = new Map(); // {resource_key: imgElement}
            this.siteId = 'cm'; // 默认站点ID

            // 等待图片URL
            this.waitingImagesUrl = '/static/common/images/waiting-image.svg';
        }

        /**
         * 设置当前站点ID
         */
        setSiteId(siteId) {
            this.siteId = siteId;
        }

        /**
         * 加载封面图片
         * @param {string} comicId - 漫画ID
         * @param {HTMLElement} imgElement - 图片元素
         * @param {string} fallbackUrl - 备用URL
         */
        loadCoverImage(comicId, imgElement, fallbackUrl = null) {
            const resourceKey = `cover:${comicId}`;

            // 先设置等待图片
            this._setWaitingImage(imgElement);

            // 检查资源是否存在
            this._checkResource('cover_image', comicId)
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        if (result.status === 'exists') {
                            // 资源存在，直接加载
                            const url = result.data.url;
                            this._loadImage(url, imgElement);
                        } else if (result.status === 'not_exists') {
                            // 资源不存在，提交爬取任务
                            this._submitCrawlTask('cover_image', comicId);
                            // 订阅资源就绪通知
                            this._subscribeResource('cover_image', comicId, imgElement);
                        } else if (result.status === 'crawling') {
                            // 正在爬取，订阅通知
                            this._subscribeResource('cover_image', comicId, imgElement);
                        }
                    }
                })
                .catch(error => {
                    console.error('[SmartImageLoader] 检查资源失败:', error);
                    if (fallbackUrl) {
                        this._loadImage(fallbackUrl, imgElement);
                    }
                });
        }

        /**
         * 批量检查封面图片
         * @param {Array} comicIds - 漫画ID数组
         * @returns {Promise<Object>} - 返回检查结果 {comicId: {status, url}}
         */
        batchCheckCoverImages(comicIds) {
            return new Promise((resolve, reject) => {
                fetch(`/api/${this.siteId}/resource/check_batch`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        resource_type: 'cover_image',
                        comic_ids: comicIds
                    })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        resolve(result.results || {});
                    } else {
                        console.error('[SmartImageLoader] 批量检查失败:', result.message);
                        reject(result);
                    }
                })
                .catch(error => {
                    console.error('[SmartImageLoader] 批量检查失败:', error);
                    reject(error);
                });
            });
        }

        /**
         * 批量加载封面图片
         * @param {Array} comics - 漫画数组，每个元素包含 {aid, imgElement}
         */
        async batchLoadCoverImages(comics) {
            const comicIds = comics.map(c => c.aid);

            try {
                // 批量检查所有图片
                const results = await this.batchCheckCoverImages(comicIds);

                // 处理每个漫画的结果
                for (const comic of comics) {
                    const result = results[String(comic.aid)];
                    const imgElement = comic.imgElement;

                    if (!imgElement) continue;

                    if (result && result.status === 'exists' && result.url) {
                        // 图片存在，直接加载
                        this._loadImage(result.url, imgElement);
                    } else {
                        // 图片不存在，设置等待图片并订阅通知
                        this._setWaitingImage(imgElement);
                        this._submitCrawlTask('cover_image', comic.aid);
                        this._subscribeResource('cover_image', comic.aid, imgElement);
                    }
                }
            } catch (error) {
                console.error('[SmartImageLoader] 批量加载失败:', error);
                // 失败时回退到单个加载
                for (const comic of comics) {
                    if (comic.imgElement) {
                        this.loadCoverImage(comic.aid, comic.imgElement);
                    }
                }
            }
        }

        /**
         * 加载内容图片
         * @param {string} comicId - 漫画ID
         * @param {string} chapterId - 章节ID
         * @param {number} page - 页码
         * @param {HTMLElement} imgElement - 图片元素
         */
        loadContentImage(comicId, chapterId, page, imgElement) {
            const resourceKey = `content:${comicId}:${chapterId}:${page}`;

            // 先设置等待图片
            this._setWaitingImage(imgElement);

            // 检查资源是否存在
            this._checkResource('content_image', comicId, { chapter_id: chapterId, page: page })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        if (result.status === 'exists') {
                            const url = result.data.url;
                            this._loadImage(url, imgElement);
                        } else {
                            this._submitCrawlTask('content_image', comicId, {
                                chapter_id: chapterId,
                                page: page
                            });
                            this._subscribeResource('content_image', resourceKey, imgElement);
                        }
                    }
                })
                .catch(error => {
                    console.error('[SmartImageLoader] 检查资源失败:', error);
                });
        }

        /**
         * 检查资源是否存在
         */
        _checkResource(resourceType, comicId, extraParams = {}) {
            const params = new URLSearchParams({
                resource_type: resourceType,
                comic_id: comicId,
                ...extraParams
            });

            return fetch(`/api/${this.siteId}/resource/check?${params}`);
        }

        /**
         * 提交爬取任务
         */
        _submitCrawlTask(resourceType, comicId, extraParams = {}) {
            const taskData = {
                resource_type: resourceType,
                comic_id: comicId,
                priority: 'high',
                ...extraParams
            };

            fetch(`/api/${this.siteId}/crawler/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    console.log('[SmartImageLoader] 任务已提交:', result.task_id);
                } else {
                    console.error('[SmartImageLoader] 任务提交失败:', result.message);
                }
            })
            .catch(error => {
                console.error('[SmartImageLoader] 任务提交失败:', error);
            });
        }

        /**
         * 订阅资源就绪通知
         */
        _subscribeResource(resourceType, resourceKey, imgElement) {
            // 确保resourceKey是字符串
            resourceKey = String(resourceKey);

            if (window.WSClient) {
                window.WSClient.subscribeResource(resourceType, resourceKey, (url) => {
                    this._loadImage(url, imgElement);
                });
            }

            // 设置轮询备用方案（每5秒检查一次）
            const pollInterval = setInterval(() => {
                // 如果已经加载完成，停止轮询
                if (imgElement.dataset.loaded === 'true') {
                    clearInterval(pollInterval);
                    return;
                }

                // 重新检查资源
                if (resourceKey.includes(':')) {
                    const parts = resourceKey.split(':');
                    if (parts[0] === 'content') {
                        this._checkResource('content_image', parts[1], {
                            chapter_id: parts[2],
                            page: parts[3]
                        }).then(response => response.json()).then(result => {
                            if (result.success && result.status === 'exists') {
                                this._loadImage(result.data.url, imgElement);
                                clearInterval(pollInterval);
                            }
                        });
                    }
                } else {
                    this._checkResource(resourceType, resourceKey)
                        .then(response => response.json())
                        .then(result => {
                            if (result.success && result.status === 'exists') {
                                this._loadImage(result.data.url, imgElement);
                                clearInterval(pollInterval);
                            }
                        });
                }
            }, 5000);

            // 5分钟后停止轮询
            setTimeout(() => {
                clearInterval(pollInterval);
            }, 300000);
        }

        /**
         * 设置等待图片
         */
        _setWaitingImage(imgElement) {
            imgElement.src = this.waitingImagesUrl;
            imgElement.dataset.loading = 'true';
            imgElement.dataset.loaded = 'false';
        }

        /**
         * 加载图片
         */
        _loadImage(url, imgElement) {
            // 创建临时图片对象预加载
            const tempImg = new Image();

            tempImg.onload = () => {
                imgElement.src = url;
                imgElement.dataset.loading = 'false';
                imgElement.dataset.loaded = 'true';

                // 添加淡入效果
                imgElement.style.opacity = '0';
                imgElement.style.transition = 'opacity 0.3s ease';

                requestAnimationFrame(() => {
                    imgElement.style.opacity = '1';
                });
            };

            tempImg.onerror = () => {
                console.error('[SmartImageLoader] 图片加载失败:', url);
                imgElement.src = '/static/common/images/default-cover.png';
                imgElement.dataset.loading = 'false';
                imgElement.dataset.error = 'true';
            };

            tempImg.src = url;
        }
    }

    // 创建全局单例
    const smartImageLoader = new SmartImageLoader();

    // 导出全局
    window.SmartImageLoader = smartImageLoader;

})(window);
