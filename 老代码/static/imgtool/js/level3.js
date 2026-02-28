// 从 HTML 元素获取变量
function getTemplateVars() {
    const varsElement = document.getElementById('template-vars');
    return {
        subdir: varsElement.dataset.subdir,
        prefix: varsElement.dataset.prefix
    };
}

function viewImage(cardElement) {
    const { subdir, prefix } = getTemplateVars();
    const imageId = cardElement.dataset.imageId;
    const page = cardElement.dataset.page || null;
    
    // 准备模态框元素
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    const modalImage = document.getElementById('modalImage');
    const loadingSpinner = document.getElementById('imageLoadingSpinner');
    const imageInfo = document.getElementById('imageInfo');
    const downloadLink = document.getElementById('downloadLink');
    
    // 重置模态框状态
    modalImage.classList.add('d-none');
    loadingSpinner.classList.remove('d-none');
    imageInfo.textContent = `正在加载: ${imageId}${page ? ' (页码: ' + page + ')' : ''}`;
    
    // 构建图片URL
    let imageUrl = `/imgtool/get_image/${encodeURIComponent(imageId)}`;
    const params = new URLSearchParams();
    if (subdir) params.append('subdir', subdir);
    if (page) params.append('page', page);
    imageUrl += `?${params.toString()}`;
    
    // 直接设置图片URL
    modalImage.src = imageUrl;
    modalImage.alt = `图片预览: ${imageId}`;
    
    // 图片加载完成处理
    modalImage.onload = () => {
        modalImage.classList.remove('d-none');
        loadingSpinner.classList.add('d-none');
        imageInfo.innerHTML = `
            <strong>${imageId}</strong>${page ? `<br>页码: ${page}` : ''}
        `;
        
        // 设置下载链接
        downloadLink.href = imageUrl;
        downloadLink.setAttribute('download', `${imageId}${page ? '_'+page : ''}.jpg`);
    };
    
    // 图片加载失败处理
    modalImage.onerror = () => {
        loadingSpinner.classList.add('d-none');
        imageInfo.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill text-danger"></i> 
            图片加载失败
        `;
        modalImage.alt = '图片加载失败';
    };
    
    // 显示模态框
    modal.show();
}