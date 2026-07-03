// ===================== LUXORAA ADMIN PANEL - API VERSION =====================

const API_URL = (() => {
    const hostname = window.location.hostname;

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '/api/admin';
    }

    // Production - deployed admin panel
    // Replace with your actual Render backend URL
    return 'https://luxoraa-official.onrender.com/api/admin';
})();

let authToken = localStorage.getItem('luxoraa_token') || '';

// API Helper
async function api(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        ...options
    };

    if (options.body && options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API Error');
    }

    return data;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 400); }, 3000);
}

// ===================== EDIT STATE =====================
let editMode = {
    active: false,
    type: null,
    id: null
};

// ===================== IMAGE RESIZE UTILS =====================

function resizeImage(file, targetWidth, targetHeight, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, targetWidth, targetHeight);

                const imgRatio = img.naturalWidth / img.naturalHeight;
                const targetRatio = targetWidth / targetHeight;

                let sx, sy, sWidth, sHeight;

                if (imgRatio > targetRatio) {
                    sHeight = img.naturalHeight;
                    sWidth = sHeight * targetRatio;
                    sx = (img.naturalWidth - sWidth) / 2;
                    sy = 0;
                } else {
                    sWidth = img.naturalWidth;
                    sHeight = sWidth / targetRatio;
                    sx = 0;
                    sy = (img.naturalHeight - sHeight) / 2;
                }

                ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// ===================== CATEGORY IMAGE UPLOAD =====================

let catImageBase64 = '';

function handleCatImageUpload(input) {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file!', 'error');
        input.value = '';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB!', 'error');
        input.value = '';
        return;
    }

    resizeImage(file, 800, 600, 0.9).then(base64 => {
        catImageBase64 = base64;
        document.getElementById('catImageBase64').value = base64;

        const previewBox = document.getElementById('catImagePreview');
        const uploadBox = previewBox.closest('.image-upload-box');
        uploadBox.classList.add('has-image');
        previewBox.innerHTML = `
            <img src="${base64}" alt="Category Preview" style="width:100%;max-height:300px;object-fit:contain;border-radius:4px;">
            <button type="button" class="image-upload-remove" onclick="removeCatImage(event)" title="Remove Image"><i class="fas fa-times"></i></button>
        `;
        showToast('Image uploaded successfully!', 'success');
    }).catch(err => {
        showToast('Error processing image: ' + err.message, 'error');
        input.value = '';
    });
}

function removeCatImage(e) {
    e.stopPropagation();
    catImageBase64 = '';
    document.getElementById('catImageBase64').value = '';
    const previewBox = document.getElementById('catImagePreview');
    const uploadBox = previewBox.closest('.image-upload-box');
    uploadBox.classList.remove('has-image');
    previewBox.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Click to upload image</p>
        <span>800 x 600 px recommended</span>
    `;
    document.getElementById('catImageInput').value = '';
}

// ===================== PRODUCT IMAGES UPLOAD =====================

let prodImagesArray = [];

function handleProdImagesUpload(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    const remainingSlots = 10 - prodImagesArray.length;
    if (remainingSlots <= 0) {
        showToast('Maximum 10 images allowed!', 'error');
        input.value = '';
        return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    let processed = 0;

    filesToProcess.forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
            showToast(`"${file.name}" is not a valid image!`, 'error');
            processed++;
            if (processed === filesToProcess.length) finalizeProdImages();
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast(`"${file.name}" exceeds 5MB limit!`, 'error');
            processed++;
            if (processed === filesToProcess.length) finalizeProdImages();
            return;
        }

        resizeImage(file, 600, 800, 0.85).then(base64 => {
            prodImagesArray.push(base64);
            processed++;
            if (processed === filesToProcess.length) finalizeProdImages();
        }).catch(err => {
            showToast(`Error processing "${file.name}": ${err.message}`, 'error');
            processed++;
            if (processed === filesToProcess.length) finalizeProdImages();
        });
    });

    input.value = '';
}

function finalizeProdImages() {
    document.getElementById('prodImagesBase64').value = JSON.stringify(prodImagesArray);
    updateProdImagesCarousel();

    const previewBox = document.getElementById('prodImagesPreview');
    const uploadBox = previewBox.closest('.image-upload-box');

    if (prodImagesArray.length > 0) {
        uploadBox.classList.add('has-image');
        previewBox.innerHTML = `
            <i class="fas fa-check-circle" style="font-size:2.5rem;color:var(--gold);"></i>
            <p>${prodImagesArray.length} image${prodImagesArray.length > 1 ? 's' : ''} selected</p>
            <span>Click to add more images (max 10)</span>
        `;
        showToast(`${prodImagesArray.length} image(s) uploaded!`, 'success');
    } else {
        uploadBox.classList.remove('has-image');
        previewBox.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to upload images</p>
            <span>Min 1 - Max 10 images | 600 x 800 px recommended</span>
        `;
    }
}

function updateProdImagesCarousel() {
    const carousel = document.getElementById('prodImagesCarousel');
    const track = document.getElementById('carouselTrack');
    const countLabel = document.getElementById('carouselCount');

    if (prodImagesArray.length === 0) {
        carousel.style.display = 'none';
        return;
    }

    carousel.style.display = 'block';
    countLabel.textContent = `${prodImagesArray.length}/10 images`;

    track.innerHTML = prodImagesArray.map((img, i) => `
        <div class="carousel-item">
            <img src="${img}" alt="Product ${i + 1}">
            <button type="button" class="carousel-item-remove" onclick="removeProdImage(${i})" title="Remove"><i class="fas fa-times"></i></button>
            <div class="carousel-item-index">#${i + 1}</div>
        </div>
    `).join('');
}

function removeProdImage(index) {
    prodImagesArray.splice(index, 1);
    document.getElementById('prodImagesBase64').value = JSON.stringify(prodImagesArray);
    updateProdImagesCarousel();

    const previewBox = document.getElementById('prodImagesPreview');
    const uploadBox = previewBox.closest('.image-upload-box');

    if (prodImagesArray.length === 0) {
        uploadBox.classList.remove('has-image');
        previewBox.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to upload images</p>
            <span>Min 1 - Max 10 images | 600 x 800 px recommended</span>
        `;
    } else {
        previewBox.innerHTML = `
            <i class="fas fa-check-circle" style="font-size:2.5rem;color:var(--gold);"></i>
            <p>${prodImagesArray.length} image${prodImagesArray.length > 1 ? 's' : ''} selected</p>
            <span>Click to add more images (max 10)</span>
        `;
    }
}

function clearProdImages() {
    prodImagesArray = [];
    document.getElementById('prodImagesBase64').value = '';
    updateProdImagesCarousel();

    const previewBox = document.getElementById('prodImagesPreview');
    const uploadBox = previewBox.closest('.image-upload-box');
    uploadBox.classList.remove('has-image');
    previewBox.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Click to upload images</p>
        <span>Min 1 - Max 10 images | 600 x 800 px recommended</span>
    `;
    showToast('All images cleared', 'info');
}

// ===================== LOGIN =====================
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;

    try {
        const data = await api('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        authToken = data.token;
        localStorage.setItem('luxoraa_token', authToken);

        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        showToast('Welcome to Luxoraa Admin Panel!', 'success');
        updateDashboard();
    } catch (err) {
        showToast(err.message || 'Invalid username or password!', 'error');
    }
}

function logout() {
    authToken = '';
    localStorage.removeItem('luxoraa_token');
    location.reload();
}

// ===================== TABS =====================
function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-nav a').forEach(el => el.classList.remove('active'));
    const tabEl = document.getElementById('tab-' + tab);
    const navEl = document.getElementById('nav-' + tab);
    if (tabEl) tabEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    if (tab === 'dashboard') updateDashboard();
    if (tab === 'categories') renderCategories();
    if (tab === 'products') { renderProducts(); updateAdminCategoryFilter(); }
    if (tab === 'social') renderSocial();
    if (tab === 'addProduct') updateCategoryDropdown();

    if (tab === 'addCategory' && !editMode.active) {
        resetCategoryForm();
    }
    if (tab === 'addProduct' && !editMode.active) {
        resetProductForm();
    }
    if (tab === 'addSocial' && !editMode.active) {
        resetSocialForm();
    }
}

function resetCategoryForm() {
    catImageBase64 = '';
    document.getElementById('catImageBase64').value = '';
    document.getElementById('catName').value = '';
    document.getElementById('catDesc').value = '';
    const catPreview = document.getElementById('catImagePreview');
    const catBox = catPreview.closest('.image-upload-box');
    catBox.classList.remove('has-image');
    catPreview.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Click to upload image</p>
        <span>800 x 600 px recommended</span>
    `;
    document.getElementById('catImageInput').value = '';

    editMode = { active: false, type: null, id: null };
    document.getElementById('addCategoryTitle').textContent = 'Add New Category';
    const submitBtn = document.querySelector('#tab-addCategory button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Category';
    }
}

function resetProductForm() {
    prodImagesArray = [];
    document.getElementById('prodImagesBase64').value = '';
    document.getElementById('prodImagesCarousel').style.display = 'none';
    document.getElementById('prodTitle').value = '';
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodLink').value = '';
    document.getElementById('prodDesc').value = '';
    const prodPreview = document.getElementById('prodImagesPreview');
    const prodBox = prodPreview.closest('.image-upload-box');
    prodBox.classList.remove('has-image');
    prodPreview.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Click to upload images</p>
        <span>Min 1 - Max 10 images | 600 x 800 px recommended</span>
    `;
    document.getElementById('prodImageInput').value = '';

    editMode = { active: false, type: null, id: null };
    document.getElementById('addProductTitle').textContent = 'Add New Product';
    const submitBtn = document.querySelector('#tab-addProduct button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Product';
    }
}

function resetSocialForm() {
    document.getElementById('socialName').value = '';
    document.getElementById('socialUrl').value = '';
    document.getElementById('socialIcon').value = 'fab fa-';
    document.getElementById('iconPreview').className = 'fab fa-';

    editMode = { active: false, type: null, id: null };
    document.getElementById('addSocialTitle').textContent = 'Add Social Media';
    const submitBtn = document.querySelector('#tab-addSocial button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Social Link';
    }
}

// ===================== ADMIN CATEGORY FILTER =====================
let adminCurrentFilter = 'all';

async function updateAdminCategoryFilter() {
    try {
        const select = document.getElementById('adminProdCategoryFilter');
        if (!select) return;
        const categories = await api('/categories');
        select.innerHTML = '<option value="all">All Categories</option>' + categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
        select.value = adminCurrentFilter;
    } catch (err) {
        console.error('Admin filter load error:', err);
    }
}

function filterAdminProducts() {
    adminCurrentFilter = document.getElementById('adminProdCategoryFilter').value;
    renderProducts();
}

// ===================== DASHBOARD =====================
async function updateDashboard() {
    try {
        const stats = await api('/stats');
        document.getElementById('statCategories').textContent = stats.categories;
        document.getElementById('statProducts').textContent = stats.products;
        document.getElementById('statSocial').textContent = stats.social;

        const products = await api('/products');
        const recent = products.slice(0, 5);
        const container = document.getElementById('recentProducts');

        if (recent.length === 0) {
            container.innerHTML = '<p style="color:var(--text-light);text-align:center;">No products added yet.</p>';
        } else {
            container.innerHTML = `<table class="data-table"><thead><tr><th>Image</th><th>Title</th><th>Category</th></tr></thead><tbody>${recent.map(p => {
                const img = p.images && p.images[0] ? p.images[0] : '';
                const catName = p.categoryId?.name || '-';
                return `<tr><td><img src="${img}" class="table-img" onerror="this.src='https://via.placeholder.com/50'"></td><td>${p.title}</td><td>${catName}</td></tr>`;
            }).join('')}</tbody></table>`;
        }
    } catch (err) {
        showToast('Failed to load dashboard: ' + err.message, 'error');
    }
}

// ===================== CATEGORIES =====================
async function renderCategories() {
    try {
        const categories = await api('/categories');
        const container = document.getElementById('categoriesTable');

        if (categories.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-tags"></i><h3>No Categories</h3><p>Add your first category to get started</p></div>';
            return;
        }

        container.innerHTML = `<table class="data-table"><thead><tr><th>Image</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead><tbody>${categories.map(cat => `
            <tr>
                <td><img src="${cat.image || 'https://via.placeholder.com/50'}" class="table-img" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td><strong>${escapeHtml(cat.name)}</strong></td>
                <td>${cat.description ? escapeHtml(cat.description) : '-'}</td>
                <td><div class="table-actions">
                    <button class="table-btn edit" onclick="editCategory('${cat._id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteCategory('${cat._id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div></td>
            </tr>
        `).join('')}</tbody></table>`;
    } catch (err) {
        showToast('Failed to load categories: ' + err.message, 'error');
    }
}

async function handleAddCategory(e) {
    e.preventDefault();
    const name = document.getElementById('catName').value.trim();
    const image = catImageBase64;
    const desc = document.getElementById('catDesc').value.trim();

    if (!name) { showToast('Category name is required!', 'error'); return; }
    if (!image) { showToast('Category image is required!', 'error'); return; }

    try {
        if (editMode.active && editMode.type === 'category') {
            await api(`/categories/${editMode.id}`, {
                method: 'PUT',
                body: JSON.stringify({ name, image, description: desc })
            });
            showToast('Category updated successfully!', 'success');
        } else {
            await api('/categories', {
                method: 'POST',
                body: JSON.stringify({ name, image, description: desc })
            });
            showToast('Category added successfully!', 'success');
        }

        resetCategoryForm();
        showTab('categories');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function editCategory(id) {
    try {
        const categories = await api('/categories');
        const cat = categories.find(c => c._id === id);
        if (!cat) return;

        editMode = { active: true, type: 'category', id: id };

        document.getElementById('catName').value = cat.name;
        document.getElementById('catDesc').value = cat.description || '';
        catImageBase64 = cat.image;
        document.getElementById('catImageBase64').value = cat.image;

        const previewBox = document.getElementById('catImagePreview');
        const uploadBox = previewBox.closest('.image-upload-box');
        uploadBox.classList.add('has-image');
        previewBox.innerHTML = `
            <img src="${cat.image}" alt="Category Preview" style="width:100%;max-height:300px;object-fit:contain;border-radius:4px;">
            <button type="button" class="image-upload-remove" onclick="removeCatImage(event)" title="Remove Image"><i class="fas fa-times"></i></button>
        `;

                document.getElementById('addCategoryTitle').textContent = 'Edit Category';
        const submitBtn = document.querySelector('#tab-addCategory button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Category';
        }

        showTab('addCategory');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return;
    try {
        await api(`/categories/${id}`, { method: 'DELETE' });
        renderCategories();
        showToast('Category deleted', 'info');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===================== PRODUCTS =====================
async function renderProducts() {
    try {
        let endpoint = '/products';
        if (adminCurrentFilter !== 'all') {
            endpoint = `/products?category=${adminCurrentFilter}`;
        }
        const products = await api(endpoint);
        const container = document.getElementById('productsTable');

        if (products.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><h3>No Products</h3><p>Add your first product to get started</p></div>';
            return;
        }

        container.innerHTML = `<table class="data-table"><thead><tr><th>Image</th><th>Title</th><th>Category</th><th>Actions</th></tr></thead><tbody>${products.map(prod => {
            const img = prod.images && prod.images[0] ? prod.images[0] : '';
            const catName = prod.categoryId?.name || '-';
            return `<tr><td><img src="${img}" class="table-img" onerror="this.src='https://via.placeholder.com/50'"></td><td><strong>${escapeHtml(prod.title)}</strong></td><td>${escapeHtml(catName)}</td><td><div class="table-actions">
                <button class="table-btn edit" onclick="editProduct('${prod._id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="table-btn delete" onclick="deleteProduct('${prod._id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div></td></tr>`;
        }).join('')}</tbody></table>`;
    } catch (err) {
        showToast('Failed to load products: ' + err.message, 'error');
    }
}

async function updateCategoryDropdown() {
    try {
        const select = document.getElementById('prodCategory');
        const categories = await api('/categories');
        select.innerHTML = '<option value="">Select Category</option>' + categories.map(c => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join('');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function handleAddProduct(e) {
    e.preventDefault();
    const title = document.getElementById('prodTitle').value.trim();
    const categoryId = document.getElementById('prodCategory').value;
    const link = document.getElementById('prodLink').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const images = prodImagesArray;

    if (!title || !categoryId || !link) { showToast('Please fill all required fields!', 'error'); return; }
    if (images.length === 0) { showToast('At least 1 product image is required!', 'error'); return; }
    if (images.length > 10) { showToast('Maximum 10 images allowed!', 'error'); return; }

    try {
        if (editMode.active && editMode.type === 'product') {
            await api(`/products/${editMode.id}`, {
                method: 'PUT',
                body: JSON.stringify({ title, categoryId, images, description: desc, link })
            });
            showToast('Product updated successfully!', 'success');
        } else {
            await api('/products', {
                method: 'POST',
                body: JSON.stringify({ title, categoryId, images, description: desc, link })
            });
            showToast('Product added successfully!', 'success');
        }

        resetProductForm();
        showTab('products');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function editProduct(id) {
    try {
        const products = await api('/products');
        const prod = products.find(p => p._id === id);
        if (!prod) return;

        editMode = { active: true, type: 'product', id: id };

        document.getElementById('prodTitle').value = prod.title;
        document.getElementById('prodLink').value = prod.link;
        document.getElementById('prodDesc').value = prod.description || '';

        await updateCategoryDropdown();
        document.getElementById('prodCategory').value = prod.categoryId?._id || prod.categoryId;

        prodImagesArray = prod.images || [];
        document.getElementById('prodImagesBase64').value = JSON.stringify(prodImagesArray);

        const previewBox = document.getElementById('prodImagesPreview');
        const uploadBox = previewBox.closest('.image-upload-box');

        if (prodImagesArray.length > 0) {
            uploadBox.classList.add('has-image');
            previewBox.innerHTML = `
                <i class="fas fa-check-circle" style="font-size:2.5rem;color:var(--gold);"></i>
                <p>${prodImagesArray.length} image${prodImagesArray.length > 1 ? 's' : ''} selected</p>
                <span>Click to add more images (max 10)</span>
            `;
            updateProdImagesCarousel();
        }

        document.getElementById('addProductTitle').textContent = 'Edit Product';
        const submitBtn = document.querySelector('#tab-addProduct button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Product';
        }

        showTab('addProduct');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
        await api(`/products/${id}`, { method: 'DELETE' });
        renderProducts();
        showToast('Product deleted', 'info');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===================== SOCIAL MEDIA =====================
async function renderSocial() {
    try {
        const social = await api('/social');
        const container = document.getElementById('socialTable');

        if (social.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-share-alt"></i><h3>No Social Links</h3><p>Add your social media links</p></div>';
            return;
        }

        container.innerHTML = `<table class="data-table"><thead><tr><th>Icon</th><th>Platform</th><th>URL</th><th>Actions</th></tr></thead><tbody>${social.map(s => `
            <tr>
                <td><i class="${escapeHtml(s.icon)}" style="font-size:1.3rem;color:var(--gold);"></i></td>
                <td><strong>${escapeHtml(s.name)}</strong></td>
                <td><a href="${escapeHtml(s.url)}" target="_blank" style="color:var(--gold);">${escapeHtml(s.url)}</a></td>
                <td><div class="table-actions">
                    <button class="table-btn edit" onclick="editSocial('${s._id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteSocial('${s._id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div></td>
            </tr>
        `).join('')}</tbody></table>`;
    } catch (err) {
        showToast('Failed to load social links: ' + err.message, 'error');
    }
}

async function handleAddSocial(e) {
    e.preventDefault();
    const name = document.getElementById('socialName').value.trim();
    const url = document.getElementById('socialUrl').value.trim();
    const icon = document.getElementById('socialIcon').value.trim();

    if (!name || !url || !icon) { showToast('All fields required!', 'error'); return; }

    try {
        if (editMode.active && editMode.type === 'social') {
            await api(`/social/${editMode.id}`, {
                method: 'PUT',
                body: JSON.stringify({ name, icon, url })
            });
            showToast('Social link updated!', 'success');
        } else {
            await api('/social', {
                method: 'POST',
                body: JSON.stringify({ name, icon, url })
            });
            showToast('Social link added!', 'success');
        }

        resetSocialForm();
        showTab('social');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function editSocial(id) {
    try {
        const social = await api('/social');
        const s = social.find(x => x._id === id);
        if (!s) return;

        editMode = { active: true, type: 'social', id: id };

        document.getElementById('socialName').value = s.name;
        document.getElementById('socialUrl').value = s.url;
        document.getElementById('socialIcon').value = s.icon;
        document.getElementById('iconPreview').className = s.icon;

        document.getElementById('addSocialTitle').textContent = 'Edit Social Media';
        const submitBtn = document.querySelector('#tab-addSocial button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Social Link';
        }

        showTab('addSocial');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteSocial(id) {
    if (!confirm('Delete this social link?')) return;
    try {
        await api(`/social/${id}`, { method: 'DELETE' });
        renderSocial();
        showToast('Social link deleted', 'info');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Icon preview
if (document.getElementById('socialIcon')) {
    document.getElementById('socialIcon').addEventListener('input', function() {
        document.getElementById('iconPreview').className = this.value;
    });
}

// ===================== ESCAPE HTML UTILITY =====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        updateDashboard();
    }
});