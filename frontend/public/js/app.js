// ===================== LUXORAA OFFICIAL - CUSTOMER APP (API VERSION) =====================

// Auto-detect API URL based on environment
const API_URL = (() => {
    const hostname = window.location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '/api/public';
    }
    
    // Production - deployed frontend
    // Replace with your actual Render backend URL (NO trailing slash)
    return 'https://luxoraa-official.onrender.com/api/public';
})();

// API Helper
async function api(endpoint) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
        throw new Error('API Error: ' + response.status);
    }
    return response.json();
}

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon =
        type === "success"
            ? "fa-check-circle"
            : type === "error"
                ? "fa-exclamation-circle"
                : "fa-info-circle";
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ===================== RENDER SOCIAL =====================
async function renderSocial() {
    try {
        const social = await api('/social');
        const navIcons = document.getElementById("navIcons");
        const socialLinks = document.getElementById("socialLinks");
        const footerSocial = document.getElementById("footerSocialLinks");
        const mobileSocial = document.getElementById("mobileMenuSocial");
        const heroBtn = document.getElementById("heroSocialBtn");

        if (navIcons) {
            navIcons.innerHTML = social
                .map((s) => `<a href="${s.url}" target="_blank" title="${s.name}"><i class="${s.icon}"></i></a>`)
                .join("");
        }

        if (socialLinks) {
            socialLinks.innerHTML = social
                .map((s) => `<a href="${s.url}" target="_blank" class="social-link" title="${s.name}"><i class="${s.icon}"></i></a>`)
                .join("");
        }

        if (footerSocial) {
            footerSocial.innerHTML = social
                .map((s) => `<li><a href="${s.url}" target="_blank"><i class="${s.icon}"></i> ${s.name}</a></li>`)
                .join("");
        }

        if (mobileSocial) {
            mobileSocial.innerHTML = social
                .map((s) => `<a href="${s.url}" target="_blank"><i class="${s.icon}"></i></a>`)
                .join("");
        }

        if (heroBtn && social.length > 0) {
            heroBtn.href = social[0].url;
            heroBtn.target = "_blank";
            heroBtn.innerHTML = `<i class="${social[0].icon}"></i> Follow Us`;
        }
    } catch (err) {
        console.error('Social load error:', err);
    }
}

// ===================== RENDER CATEGORIES GRID (HOME PAGE - MAX 9) =====================
async function renderCategories() {
    const grid = document.getElementById("categoriesGrid");
    if (!grid) return;
    
    try {
        const categories = await api('/categories');
        const products = await api('/products');
        
        if (categories.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-tags"></i><h3>No Categories Yet</h3><p>Coming soon...</p></div>';
            return;
        }
        
        // Home page: max 9 categories (3x3 grid)
        const displayCategories = categories.slice(0, 9);
        
        grid.innerHTML = displayCategories
            .map((cat, i) => {
                const count = products.filter((p) => {
                    const prodCatId = p.categoryId?._id || p.categoryId;
                    return prodCatId === cat._id;
                }).length;
                return `
                    <a href="products.html?category=${cat._id}" class="category-card animate" style="animation-delay:${i * 0.1}s; text-decoration:none; display:block;">
                        <img src="${cat.image || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${cat.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                        <div class="category-overlay">
                            <div class="category-name">${cat.name}</div>
                            <div class="category-count">${count} Products</div>
                            ${cat.description ? `<div class="category-desc">${cat.description}</div>` : ''}
                            <div class="category-line"></div>
                        </div>
                    </a>
                `;
            })
            .join("");
            
        observeAnimations();
    } catch (err) {
        console.error('Categories load error:', err);
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-exclamation-triangle"></i><h3>Connection Error</h3><p>Cannot connect to backend.</p></div>';
    }
}

// ===================== RENDER PRODUCTS =====================
async function renderProducts() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    
    try {
        const products = await api('/products');
        const categories = await api('/categories');
        
        if (products.length === 0) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-box-open"></i><h3>No Products Yet</h3><p>Coming soon...</p></div>';
            return;
        }
        
        grid.innerHTML = products
            .slice(-10)
            .reverse()
            .map((prod, i) => {
                const cat = categories.find((c) => c._id === (prod.categoryId?._id || prod.categoryId));
                const img = prod.images && prod.images[0] ? prod.images[0] : 'https://via.placeholder.com/400x400?text=No+Image';
                return `
                    <div class="product-card animate" style="animation-delay:${i * 0.1}s" onclick="openProductDetail('${prod._id}')">
                        <div class="product-img-wrap">
                            <img src="${img}" alt="${prod.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'">
                            <span class="product-badge">New</span>
                            <div class="product-actions">
                                <button class="product-action-btn" onclick="event.stopPropagation();openProductDetail('${prod._id}')" title="View"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                        <div class="product-info">
                            <div class="product-category-tag">${cat ? cat.name : 'Uncategorized'}</div>
                            <h3 class="product-title">${prod.title}</h3>
                            <div class="product-price-row">
                                <a href="${prod.link}" target="_blank" class="btn-buy" onclick="event.stopPropagation()">Buy Now</a>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join("");
        observeAnimations();
    } catch (err) {
        console.error('Products load error:', err);
        const grid = document.getElementById("productsGrid");
        if (grid) {
            grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-exclamation-triangle"></i><h3>Connection Error</h3><p>Cannot connect to backend.</p></div>';
        }
    }
}

// ===================== PRODUCT DETAIL =====================
async function openProductDetail(prodId) {
    try {
        const products = await api('/products');
        const categories = await api('/categories');
        const prod = products.find((p) => p._id === prodId);
        if (!prod) return;
        
        const cat = categories.find((c) => c._id === (prod.categoryId?._id || prod.categoryId));
        const images = prod.images && prod.images.length > 0 ? prod.images : ['https://via.placeholder.com/600x600?text=No+Image'];
        
        const modal = document.getElementById("productDetailModal");
        const content = document.getElementById("productDetailContent");
        
        if (!modal || !content) {
            window.location.href = 'products.html';
            return;
        }
        
        // Format description with proper line breaks and bullet points
        let formattedDesc = prod.description || 'No description available.';
        
        content.innerHTML = `
            <div class="product-detail-images">
                <img src="${images[0]}" alt="${prod.title}" class="product-detail-main-img" id="detailMainImg" onerror="this.src='https://via.placeholder.com/600x600?text=No+Image'">
                <div class="product-detail-thumbs">
                    ${images.map((img, i) => `<img src="${img}" class="${i === 0 ? 'active' : ''}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'" onclick="document.getElementById('detailMainImg').src='${img}';this.parentElement.querySelectorAll('img').forEach(el=>el.classList.remove('active'));this.classList.add('active')">`).join('')}
                </div>
            </div>
            <div class="product-detail-info">
                <div class="product-detail-category">${cat ? cat.name : 'Uncategorized'}</div>
                <h2>${prod.title}</h2>
                <div class="product-detail-desc" style="white-space: pre-line; line-height: 1.8; color: var(--text-light);">${escapeHtml(formattedDesc)}</div>
                <a href="${prod.link}" target="_blank" class="btn btn-primary" style="padding:14px 40px;"><i class="fas fa-shopping-bag"></i> Buy Now</a>
            </div>
        `;
        modal.classList.add("active");
        document.body.style.overflow = 'hidden';
    } catch (err) {
        console.error('Product detail error:', err);
    }
}

function closeProductDetail() {
    const modal = document.getElementById("productDetailModal");
    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = '';
    }
}

// Helper: Escape HTML to prevent XSS but preserve formatting
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================== ANIMATIONS =====================
function observeAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add("visible");
            });
        },
        { threshold: 0.1 }
    );
    document.querySelectorAll(".animate").forEach((el) => observer.observe(el));
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
    renderSocial();
    renderCategories();
    renderProducts();
    observeAnimations();
});

// Close modals on overlay click
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.classList.remove("active");
            document.body.style.overflow = '';
        }
    });
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById("productDetailModal");
        if (modal && modal.classList.contains('active')) {
            modal.classList.remove("active");
            document.body.style.overflow = '';
        }
    }
});