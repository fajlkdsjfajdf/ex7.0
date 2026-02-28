// 工具提示初始化
document.addEventListener('DOMContentLoaded', function() {
    // 启用所有工具提示
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // 返回顶部按钮
    var backToTop = document.createElement('button');
    backToTop.className = 'btn btn-primary btn-lg back-to-top rounded-circle';
    backToTop.innerHTML = '<i class="bi bi-arrow-up"></i>';
    backToTop.style.position = 'fixed';
    backToTop.style.bottom = '20px';
    backToTop.style.right = '20px';
    backToTop.style.display = 'none';
    backToTop.style.zIndex = '99';
    document.body.appendChild(backToTop);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });
    
    backToTop.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
    
    // 卡片点击效果
    document.querySelectorAll('.clickable-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            const link = this.querySelector('a.stretched-link');
            if (link) {
                window.location.href = link.href;
            }
        });
    });
    
    // 加载动画
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.style.position = 'fixed';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.backgroundColor = 'rgba(255,255,255,0.8)';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.zIndex = '9999';
    loadingOverlay.innerHTML = `
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
    
    // 在页面加载时显示加载动画
    window.addEventListener('load', function() {
        setTimeout(function() {
            loadingOverlay.style.display = 'none';
        }, 500);
    });
    
    document.body.appendChild(loadingOverlay);
});