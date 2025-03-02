document.addEventListener('DOMContentLoaded', function() {
    // 加载导航内容
    loadNavigation();
    
    // 获取访问者IP信息
    getVisitorInfo();
    
    // 搜索功能设置
    setupSearch();
    
    // 添加时间更新功能
    updateTime();
    setInterval(updateTime, 1000);
    
    // 设置当前年份
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // 添加返回顶部功能
    setupBackToTop();
    
    // 添加快捷方式初始化
    initShortcuts();
});

// 设置搜索功能
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search');
    const searchForm = document.getElementById('search-form');
    
    // 监听搜索框输入
    searchInput.addEventListener('input', function() {
        // 显示/隐藏清除按钮
        if (this.value.length > 0) {
            clearButton.style.display = 'flex';
        } else {
            clearButton.style.display = 'none';
        }
        
        // 实时搜索（带防抖动）
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (this.value.trim().length > 1) {
                searchWebsites();
            } else if (this.value.trim().length === 0) {
                clearSearch();
            }
        }, 300);
    });
    
    // 监听表单提交
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        searchWebsites();
    });
    
    // 清除按钮功能
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        clearButton.style.display = 'none';
        clearSearch();
        searchInput.focus();
    });
}

// 设置返回顶部按钮
function setupBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    
    // 监听滚动事件
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    // 点击事件
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 获取访问者IP信息
function getVisitorInfo() {
    fetch('/api/navigation/visitor-info')
        .then(response => response.json())
        .then(data => {
            document.getElementById('visitor-ip').textContent = data.ip || '未知';
        })
        .catch(error => {
            console.error('获取访问者信息失败:', error);
            document.getElementById('visitor-ip').textContent = '获取失败';
        });
}

// 加载导航内容
function loadNavigation() {
    showLoading('navigation-content');
    fetch('/api/navigation/navigation')
        .then(response => response.json())
        .then(data => displayNavigation(data))
        .catch(error => {
            console.error('加载导航数据失败:', error);
            showError('navigation-content', '加载失败', '无法获取导航数据，请稍后重试。');
        });
}

// 显示导航内容
function displayNavigation(data) {
    const container = document.getElementById('navigation-content');
    
    if (!data || data.length === 0) {
        showEmpty(container, '暂无导航数据', '请联系管理员添加网站资源。');
        return;
    }
    
    let html = '';
    
    // 过滤掉没有网站的分类
    const filteredData = data.filter(category => 
        category.websites && category.websites.length > 0
    );
    
    if (filteredData.length === 0) {
        showEmpty(container, '暂无网站资源', '所有分类下均无可用网站。');
        return;
    }
    
    // 为每个分类选择适当的图标
    function getCategoryIcon(categoryName) {
        const iconMap = {
            '临床系统': 'fa-stethoscope',
            '医院管理': 'fa-hospital',
            '工具应用': 'fa-tools',
            '外部资源': 'fa-globe',
            '学习资源': 'fa-graduation-cap',
            '内部服务': 'fa-users'
        };
        
        return iconMap[categoryName] || 'fa-folder';
    }
    
    filteredData.forEach(category => {
        html += `
        <section class="category-section">
            <div class="category-header">
                <div class="category-icon">
                    <i class="fas ${getCategoryIcon(category.name)}"></i>
                </div>
                <h2 class="category-title">${category.name}</h2>
            </div>
            <div class="websites-grid">
        `;
        
        category.websites.forEach(website => {
            html += `
            <div class="website-card">
                <div class="website-icon">
                    <i class="fas ${website.icon || 'fa-link'}"></i>
                </div>
                <div class="website-content">
                    <div class="website-name">
                        <a href="${website.url}" target="_blank" onclick="logClick(${website.id})" rel="noopener">
                            ${website.name}
                        </a>
                    </div>
                    ${website.description ? `<div class="website-description">${website.description}</div>` : ''}
                    <div class="website-meta" data-clicks="${website.clicks}">
                        <i class="fas fa-eye me-1"></i><span class="click-count">${website.clicks}</span> 次访问
                    </div>
                </div>
            </div>
            `;
        });
        
        html += `
            </div>
        </section>
        `;
    });
    
    container.innerHTML = html;
}

// 搜索网站
function searchWebsites() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) {
        clearSearch();
        return;
    }
    
    const resultsContainer = document.getElementById('search-results');
    showLoading('search-results');
    
    fetch(`/api/navigation/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => displaySearchResults(data, query))
        .catch(error => {
            console.error('搜索失败:', error);
            showError('search-results', '搜索失败', '无法完成搜索，请稍后重试。');
        });
}

// 显示搜索结果
function displaySearchResults(results, query) {
    const container = document.getElementById('search-results');
    
    if (!results || results.length === 0) {
        showEmpty(container, '未找到结果', `没有与"${query}"相关的内容。`);
        return;
    }
    
    let html = `
    <div class="search-result-header">
        搜索"${query}"的结果 (${results.length})
    </div>
    <div class="search-results-list">
    `;
    
    results.forEach(result => {
        html += `
        <div class="search-result-item">
            <div class="website-icon">
                <i class="fas fa-link"></i>
            </div>
            <div class="search-result-info">
                <div class="search-result-name">
                    <a href="${result.url}" target="_blank" onclick="logClick(${result.id})" rel="noopener">
                        ${result.name}
                    </a>
                </div>
                <div class="search-result-category">
                    <i class="fas fa-folder me-1"></i>${result.category_name}
                </div>
                <div class="search-result-meta" data-clicks="${result.clicks || 0}">
                    <i class="fas fa-eye me-1"></i><span class="click-count">${result.clicks || 0}</span> 次访问
                </div>
            </div>
        </div>
        `;
    });
    
    html += `</div>`;
    
    container.innerHTML = html;
    
    // 平滑滚动到结果
    setTimeout(() => {
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// 清除搜索
function clearSearch() {
    document.getElementById('search-results').innerHTML = '';
}

// 记录点击
function logClick(websiteId) {
    const clickElement = event.target.closest('.website-card')?.querySelector('.website-meta') || 
                         event.target.closest('.search-result-item')?.querySelector('.search-result-meta');
    
    // 发送API请求前更新UI
    if (clickElement) {
        const currentCount = parseInt(clickElement.getAttribute('data-clicks') || '0');
        const newCount = currentCount + 1;
        clickElement.setAttribute('data-clicks', newCount);
        
        // 更新显示的文本
        const countText = clickElement.querySelector('.click-count');
        if (countText) {
            countText.textContent = newCount;
        }
    }
    
    // 发送API请求
    fetch(`/api/navigation/log-click/${websiteId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest' // 添加标头确保服务器知道这是AJAX请求
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        return response.json();
    })
    .then(data => {
        console.log('点击记录成功:', data);
    })
    .catch(error => {
        console.error('记录点击失败:', error);
    });
    
    // 不阻止默认行为，让链接正常打开
}

// 更新时间
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    document.getElementById('current-time').textContent = timeString;
}

// 显示加载状态
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
    <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载...</p>
    </div>`;
}

// 显示错误状态
function showError(elementId, title, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `
    <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-text">${message}</p>
    </div>`;
}

// 显示空状态
function showEmpty(element, title, message) {
    element.innerHTML = `
    <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-text">${message}</p>
    </div>`;
}

// 修改加载快捷方式函数
function loadShortcuts() {
    // 1. 从服务器加载点击量最高的应用
    fetch('/api/navigation/popular-websites?limit=5')
        .then(response => response.json())
        .then(data => {
            displayPopularApps(data);
        })
        .catch(error => {
            console.error('加载热门应用失败:', error);
            // 如果API失败，显示错误信息
            const container = document.getElementById('favorite-apps');
            if (container) {
                container.innerHTML = '<div class="shortcut-empty">加载热门应用失败</div>';
            }
        });
    
    // 2. 从localStorage加载个人最近访问记录
    const recentApps = JSON.parse(localStorage.getItem('recentApps') || '[]');
    displayRecentApps(recentApps);
}

// 显示热门应用
function displayPopularApps(apps) {
    const container = document.getElementById('favorite-apps');
    if (!container) return;
    
    if (apps.length === 0) {
        container.innerHTML = '<div class="shortcut-empty">暂无热门应用</div>';
        return;
    }
    
    let html = '';
    apps.forEach(app => {
        html += `
        <div class="shortcut-item popular-app">
            <div class="shortcut-icon">
                <i class="fas fa-fire"></i>
            </div>
            <a href="${app.url}" class="shortcut-name" onclick="logClick(${app.id})" target="_blank" rel="noopener">
                ${app.name}
            </a>
            <span class="click-badge">${app.clicks}</span>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

// 初始化快捷方式功能
function initShortcuts() {
    // 保留现有的事件监听器来更新访问记录
    document.addEventListener('click', function(event) {
        const websiteLink = event.target.closest('a[onclick*="logClick"]');
        if (websiteLink) {
            const onclickAttr = websiteLink.getAttribute('onclick');
            const idMatch = onclickAttr.match(/logClick\((\d+)\)/);
            
            if (idMatch && idMatch[1]) {
                const websiteId = parseInt(idMatch[1]);
                const websiteName = websiteLink.textContent.trim();
                const websiteUrl = websiteLink.getAttribute('href');
                
                // 仅更新最近访问记录
                updateRecentApps({
                    id: websiteId,
                    name: websiteName,
                    url: websiteUrl
                });
            }
        }
    });
    
    // 加载快捷方式
    loadShortcuts();
}

// 更新最近访问的应用
function updateRecentApps(app) {
    // 从localStorage获取最近访问的应用
    let recentApps = JSON.parse(localStorage.getItem('recentApps') || '[]');
    
    // 移除已存在的相同应用
    recentApps = recentApps.filter(item => item.id !== app.id);
    
    // 添加到数组开头
    recentApps.unshift(app);
    
    // 只保留最近5个
    recentApps = recentApps.slice(0, 5);
    
    // 保存到localStorage
    localStorage.setItem('recentApps', JSON.stringify(recentApps));
    
    // 更新UI
    displayRecentApps(recentApps);
}

// 显示最近访问的应用
function displayRecentApps(recentApps) {
    const container = document.getElementById('recent-apps');
    if (!container) return;
    
    // 如果没有最近访问的应用
    if (recentApps.length === 0) {
        container.innerHTML = '<div class="shortcut-empty">暂无记录</div>';
        return;
    }
    
    let html = '';
    recentApps.forEach(app => {
        html += `
        <div class="shortcut-item">
            <div class="shortcut-icon">
                <i class="fas fa-link"></i>
            </div>
            <a href="${app.url}" class="shortcut-name" onclick="logClick(${app.id})" target="_blank" rel="noopener">
                ${app.name}
            </a>
        </div>
        `;
    });
    
    container.innerHTML = html;
}