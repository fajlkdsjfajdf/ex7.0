/**
 * 搜索弹窗交互脚本
 */

(function() {
    'use strict';

    // 全局变量
    let selectedTags = [];

    // 示例标签数据（后续从API获取）
    const tagCategories = [
        {
            id: 'genre',
            name: '题材',
            icon: 'fa-book',
            tags: ['冒险', '奇幻', '科幻', '恋爱', '校园', '悬疑', '恐怖', '搞笑', '历史', '战争', '运动', '美食', '音乐', '职场', '日常', '推理', '侦探', '超能力', '武侠', '黑暗']
        },
        {
            id: 'style',
            name: '风格',
            icon: 'fa-paint-brush',
            tags: ['热血', '治愈', '欢乐', '致郁', '硬核', '轻松', '严肃', '文艺', '猎奇', '搞笑', '讽刺', '现实主义']
        }
    ];

    // 所有标签的完整列表
    const allTags = [];
    tagCategories.forEach(category => {
        category.tags.forEach(tag => {
            allTags.push({
                name: tag,
                category: category.name
            });
        });
    });

    // DOM元素
    const sidebarSearchBtn = document.getElementById('sidebarSearchBtn');
    const searchModal = document.getElementById('searchModal');
    const closeSearch = document.getElementById('closeSearch');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const selectedTagsContainer = document.getElementById('selectedTags');
    const tagSearchInput = document.getElementById('tagSearchInput');
    const tagSuggestions = document.getElementById('tagSuggestions');
    const tagCategoriesContainer = document.getElementById('tagCategories');

    // 打开搜索弹窗
    if (sidebarSearchBtn) {
        sidebarSearchBtn.addEventListener('click', () => {
            searchModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    // 关闭搜索弹窗
    if (closeSearch) {
        closeSearch.addEventListener('click', () => {
            searchModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    // 点击弹窗外部关闭
    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                searchModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

    // 初始化标签分类
    function initTagCategories() {
        if (!tagCategoriesContainer) return;

        tagCategories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'tag-category';
            categoryElement.innerHTML = `
                <div class="category-header">
                    <div class="category-title">
                        <i class="fas ${category.icon}"></i> ${category.name}
                    </div>
                    <div class="category-toggle">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="category-content"></div>
            `;

            const categoryContent = categoryElement.querySelector('.category-content');

            // 添加标签
            category.tags.forEach(tag => {
                const tagElement = document.createElement('div');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.setAttribute('data-category', category.id);
                tagElement.setAttribute('data-tag', tag);

                tagElement.addEventListener('click', () => {
                    toggleTagSelection(tag, category.id);
                });

                categoryContent.appendChild(tagElement);
            });

            // 切换分类展开/折叠
            categoryElement.querySelector('.category-header').addEventListener('click', function() {
                const isExpanding = !categoryContent.classList.contains('active');
                const toggleIcon = this.querySelector('.category-toggle i');

                if (isExpanding) {
                    categoryContent.style.display = 'flex';
                    categoryContent.style.height = '0';
                    categoryContent.classList.add('active');

                    requestAnimationFrame(() => {
                        const contentHeight = categoryContent.scrollHeight;
                        requestAnimationFrame(() => {
                            categoryContent.style.height = `${contentHeight}px`;
                            toggleIcon.classList.replace('fa-chevron-down', 'fa-chevron-up');

                            setTimeout(() => {
                                categoryContent.style.height = '';
                            }, 300);
                        });
                    });
                } else {
                    const contentHeight = categoryContent.scrollHeight;
                    categoryContent.style.height = `${contentHeight}px`;

                    requestAnimationFrame(() => {
                        categoryContent.classList.remove('active');
                        categoryContent.style.height = '0';
                        toggleIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');

                        setTimeout(() => {
                            categoryContent.style.display = 'none';
                            categoryContent.style.height = '';
                        }, 300);
                    });
                }
            });

            tagCategoriesContainer.appendChild(categoryElement);
        });
    }

    // 切换标签选中状态
    function toggleTagSelection(tagText, categoryId) {
        const existingTag = selectedTags.find(tag => tag.text === tagText);

        if (!existingTag) {
            selectedTags.push({
                text: tagText,
                category: categoryId,
                isExcluded: false
            });
        } else {
            existingTag.isExcluded = !existingTag.isExcluded;
        }

        updateSelectedTagsDisplay();
        updateTagButtonState(tagText);
    }

    // 更新标签按钮状态
    function updateTagButtonState(tagText) {
        const tagButtons = document.querySelectorAll(`.tag[data-tag="${tagText}"]`);
        const tagState = selectedTags.find(tag => tag.text === tagText);

        tagButtons.forEach(button => {
            button.classList.remove('selected', 'excluded');

            if (tagState) {
                button.classList.add(tagState.isExcluded ? 'excluded' : 'selected');
            }
        });
    }

    // 移除标签
    function removeTag(tagText) {
        selectedTags = selectedTags.filter(tag => tag.text !== tagText);
        updateSelectedTagsDisplay();
        updateTagButtonState(tagText);
    }

    // 更新已选标签显示
    function updateSelectedTagsDisplay() {
        if (!selectedTagsContainer) return;

        selectedTagsContainer.innerHTML = '';

        selectedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = `selected-tag ${tag.isExcluded ? 'excluded' : ''}`;
            tagElement.innerHTML = `
                ${tag.text}
                <span class="remove-tag" data-tag="${tag.text}">×</span>
            `;
            selectedTagsContainer.appendChild(tagElement);

            tagElement.querySelector('.remove-tag').addEventListener('click', (e) => {
                e.stopPropagation();
                removeTag(tag.text);
            });
        });
    }

    // 标签搜索输入事件
    if (tagSearchInput) {
        tagSearchInput.addEventListener('input', () => {
            const searchText = tagSearchInput.value.trim().toLowerCase();

            if (searchText === '') {
                tagSuggestions.classList.remove('active');
                return;
            }

            const matchedTags = allTags.filter(tag =>
                tag.name.toLowerCase().includes(searchText) &&
                !selectedTags.find(t => t.text === tag.name)
            );

            if (matchedTags.length > 0) {
                tagSuggestions.innerHTML = '';

                matchedTags.forEach(tag => {
                    const suggestion = document.createElement('div');
                    suggestion.className = 'suggestion-item';
                    suggestion.innerHTML = `
                        ${tag.name} <span class="suggestion-category">${tag.category}</span>
                    `;
                    suggestion.addEventListener('click', () => {
                        toggleTagSelection(tag.name, '');
                        tagSearchInput.value = '';
                        tagSuggestions.classList.remove('active');
                        updateTagButtonState(tag.name);
                    });

                    tagSuggestions.appendChild(suggestion);
                });

                tagSuggestions.classList.add('active');
            } else {
                tagSuggestions.classList.remove('active');
            }
        });
    }

    // 点击页面其他地方关闭建议
    document.addEventListener('click', (e) => {
        if (tagSearchInput && !tagSearchInput.contains(e.target) &&
            tagSuggestions && !tagSuggestions.contains(e.target)) {
            tagSuggestions.classList.remove('active');
        }
    });

    // 搜索按钮点击事件
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const searchText = searchInput ? searchInput.value.trim() : '';

            // 触发自定义事件，让页面处理搜索逻辑
            const event = new CustomEvent('performSearch', {
                detail: {
                    keyword: searchText,
                    tags: selectedTags
                }
            });
            document.dispatchEvent(event);

            // 关闭弹窗
            searchModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    // 初始化
    initTagCategories();

    // 暴露给外部的接口
    window.SearchModal = {
        clearTags: () => {
            selectedTags = [];
            updateSelectedTagsDisplay();
            // 清除所有按钮状态
            document.querySelectorAll('.tag.selected, .tag.excluded').forEach(btn => {
                btn.classList.remove('selected', 'excluded');
            });
        },
        getSelectedTags: () => selectedTags
    };

})();
