// Mock product data
const mockProducts = [
    {
        id: 1,
        name: 'Premium Leather Jacket',
        category: 'clothing',
        price: 299.99,
        stock: 15,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
        sales: 45,
        views: 1250,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'Brown'],
        description: 'Premium quality leather jacket with classic design',
        tags: ['premium', 'leather', 'jacket'],
        createdAt: new Date('2024-11-15')
    },
    {
        id: 2,
        name: 'Silk Evening Dress',
        category: 'clothing',
        price: 189.99,
        stock: 8,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
        sales: 38,
        views: 980,
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Navy', 'Black', 'Burgundy'],
        description: 'Elegant silk evening dress perfect for special occasions',
        tags: ['silk', 'evening', 'dress', 'elegant'],
        createdAt: new Date('2024-11-20')
    },
    {
        id: 3,
        name: 'Designer Handbag',
        category: 'bags',
        price: 450.00,
        stock: 2,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&h=300&fit=crop',
        sales: 32,
        views: 856,
        sizes: ['One Size'],
        colors: ['Tan', 'Black', 'Cognac'],
        description: 'Luxury designer handbag crafted from finest materials',
        tags: ['designer', 'handbag', 'luxury'],
        createdAt: new Date('2024-11-10')
    },
    {
        id: 4,
        name: 'Cashmere Sweater',
        category: 'clothing',
        price: 125.00,
        stock: 0,
        status: 'out-of-stock',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop',
        sales: 28,
        views: 645,
        sizes: ['S', 'M', 'L'],
        colors: ['Cream', 'Gray', 'Navy'],
        description: 'Soft and luxurious cashmere sweater for ultimate comfort',
        tags: ['cashmere', 'sweater', 'luxury'],
        createdAt: new Date('2024-11-05')
    },
    {
        id: 5,
        name: 'Leather Boots',
        category: 'shoes',
        price: 225.00,
        stock: 12,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop',
        sales: 22,
        views: 543,
        sizes: ['6', '7', '8', '9', '10'],
        colors: ['Black', 'Brown'],
        description: 'Handcrafted leather boots with premium finish',
        tags: ['leather', 'boots', 'handcrafted'],
        createdAt: new Date('2024-11-25')
    },
    {
        id: 6,
        name: 'Vintage Sunglasses',
        category: 'accessories',
        price: 89.99,
        stock: 25,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&h=300&fit=crop',
        sales: 65,
        views: 1890,
        sizes: ['One Size'],
        colors: ['Gold', 'Silver', 'Black'],
        description: 'Classic vintage-inspired sunglasses with UV protection',
        tags: ['vintage', 'sunglasses', 'classic'],
        createdAt: new Date('2024-12-01')
    },
    {
        id: 7,
        name: 'Wool Scarf',
        category: 'accessories',
        price: 45.00,
        stock: 3,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=300&h=300&fit=crop',
        sales: 18,
        views: 324,
        sizes: ['One Size'],
        colors: ['Gray', 'Camel', 'Navy'],
        description: 'Soft wool scarf perfect for cold weather',
        tags: ['wool', 'scarf', 'winter'],
        createdAt: new Date('2024-11-18')
    },
    {
        id: 8,
        name: 'Denim Jeans',
        category: 'clothing',
        price: 79.99,
        stock: 0,
        status: 'draft',
        image: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=300&h=300&fit=crop',
        sales: 0,
        views: 123,
        sizes: ['28', '30', '32', '34', '36'],
        colors: ['Blue', 'Black'],
        description: 'Classic denim jeans with modern fit',
        tags: ['denim', 'jeans', 'classic'],
        createdAt: new Date('2024-12-10')
    }
];

let currentView = 'grid';
let selectedProducts = new Set();
let filteredProducts = [...mockProducts];
let currentEditingProduct = null;

// Initialize
function init() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        renderProducts();
        updateStats();
    }, 1000);
    setupEventListeners();
}

// Show loading state
function showLoading() {
    document.getElementById('productsGrid').classList.add('hidden');
    document.getElementById('productsList').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('loadingState').classList.remove('hidden');
}

// Hide loading state
function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

// Update stats
function updateStats() {
    const activeProducts = mockProducts.filter(p => p.status === 'active').length;
    const lowStockProducts = mockProducts.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStockProducts = mockProducts.filter(p => p.stock === 0).length;
    
    document.querySelector('.grid.grid-cols-2 .bg-cream:nth-child(1) .text-xl').textContent = mockProducts.length;
    document.querySelector('.grid.grid-cols-2 .bg-cream:nth-child(2) .text-xl').textContent = activeProducts;
    document.querySelector('.grid.grid-cols-2 .bg-cream:nth-child(3) .text-xl').textContent = lowStockProducts;
    document.querySelector('.grid.grid-cols-2 .bg-cream:nth-child(4) .text-xl').textContent = outOfStockProducts;
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('-translate-x-full');
        document.getElementById('mobileMenuOverlay').classList.toggle('hidden');
    });

    document.getElementById('mobileMenuOverlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('mobileMenuOverlay').classList.add('hidden');
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    
    // Filters
    document.getElementById('categoryFilter').addEventListener('change', handleFilters);
    document.getElementById('statusFilter').addEventListener('change', handleFilters);
    document.getElementById('sortBy').addEventListener('change', handleFilters);
    
    // View toggles
    document.getElementById('gridViewBtn').addEventListener('click', () => switchView('grid'));
    document.getElementById('listViewBtn').addEventListener('click', () => switchView('list'));
    
    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', handleSelectAll);
    
    // Product form
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    
    // Close modal on outside click
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('productModal')) {
            closeModal();
        }
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    applyFilters();
}

// Handle filters
function handleFilters() {
    applyFilters();
}

// Apply all filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // Filter products
    filteredProducts = mockProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.description.toLowerCase().includes(searchTerm) ||
                            product.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesStatus = !statusFilter || product.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    // Sort products
    filteredProducts.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'price-high':
                return b.price - a.price;
            case 'price-low':
                return a.price - b.price;
            case 'stock-low':
                return a.stock - b.stock;
            default:
                return 0;
        }
    });
    
    renderProducts();
}

// Switch view
function switchView(view) {
    currentView = view;
    
    // Update button styles
    document.getElementById('gridViewBtn').className = view === 'grid' 
        ? 'p-2 bg-gold text-charcoal rounded-lg' 
        : 'p-2 bg-cream text-gray-700 rounded-lg hover:bg-beige';
    document.getElementById('listViewBtn').className = view === 'list' 
        ? 'p-2 bg-gold text-charcoal rounded-lg' 
        : 'p-2 bg-cream text-gray-700 rounded-lg hover:bg-beige';
    
    renderProducts();
}

// Render products
function renderProducts() {
    const gridContainer = document.getElementById('productsGrid');
    const listContainer = document.getElementById('productsList');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredProducts.length === 0) {
        gridContainer.classList.add('hidden');
        listContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    if (currentView === 'grid') {
        gridContainer.classList.remove('hidden');
        listContainer.classList.add('hidden');
        renderGridView();
    } else {
        gridContainer.classList.add('hidden');
        listContainer.classList.remove('hidden');
        renderListView();
    }
}

// Render grid view
function renderGridView() {
    const gridContainer = document.getElementById('productsGrid');
    
    gridContainer.innerHTML = filteredProducts.map(product => `
        <div class="product-card bg-cream rounded-xl border border-beige overflow-hidden">
            <div class="relative">
                <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="absolute top-2 left-2">
                    <input type="checkbox" class="product-checkbox rounded border-stone" 
                           data-id="${product.id}" ${selectedProducts.has(product.id) ? 'checked' : ''}>
                </div>
                <div class="absolute top-2 right-2">
                    ${getStatusBadge(product.status)}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-charcoal mb-1 truncate">${product.name}</h3>
                <p class="text-sm text-gray-700 mb-2 capitalize">${product.category}</p>
                <div class="flex items-center justify-between mb-3">
                    <span class="text-lg font-bold text-gold">$${product.price.toFixed(2)}</span>
                    <span class="text-sm text-gray-700">Stock: ${product.stock}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-700 mb-3">
                    <span><i class="fas fa-eye mr-1"></i>${product.views}</span>
                    <span><i class="fas fa-shopping-cart mr-1"></i>${product.sales}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="editProduct(${product.id})" 
                            class="flex-1 px-3 py-2 bg-gold text-charcoal rounded-lg hover:bg-velvra-gold-dark text-sm font-medium transition-colors">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="duplicateProduct(${product.id})" 
                            class="px-3 py-2 bg-beige text-charcoal rounded-lg hover:bg-stone/20 text-sm transition-colors">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" 
                            class="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleProductSelect);
    });
}

// Render list view
function renderListView() {
    const tableBody = document.getElementById('productsTableBody');
    
    tableBody.innerHTML = filteredProducts.map(product => `
        <tr class="border-b border-beige hover:bg-beige/30 transition-colors">
            <td class="px-4 py-3">
                <input type="checkbox" class="product-checkbox rounded border-stone" 
                       data-id="${product.id}" ${selectedProducts.has(product.id) ? 'checked' : ''}>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <img src="${product.image}" alt="${product.name}" class="w-12 h-12 object-cover rounded-lg mr-3">
                    <div>
                        <div class="font-medium text-charcoal">${product.name}</div>
                        <div class="text-sm text-gray-700">${product.description.substring(0, 50)}...</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 capitalize">${product.category}</td>
            <td class="px-4 py-3 text-sm font-medium text-gold">$${product.price.toFixed(2)}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${product.stock}</td>
            <td class="px-4 py-3">${getStatusBadge(product.status)}</td>
            <td class="px-4 py-3">
                <div class="flex items-center space-x-2">
                    <button onclick="editProduct(${product.id})" 
                            class="p-1 text-gold hover:text-velvra-gold-dark transition-colors">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="duplicateProduct(${product.id})" 
                            class="p-1 text-gray-700 hover:text-charcoal transition-colors">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" 
                            class="p-1 text-red-600 hover:text-red-700 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleProductSelect);
    });
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="status-badge bg-green-100 text-green-800">Active</span>',
        'draft': '<span class="status-badge bg-gray-100 text-gray-800">Draft</span>',
        'out-of-stock': '<span class="status-badge bg-red-100 text-red-800">Out of Stock</span>'
    };
    return badges[status] || badges['draft'];
}

// Handle product selection
function handleProductSelect(e) {
    const productId = parseInt(e.target.dataset.id);
    
    if (e.target.checked) {
        selectedProducts.add(productId);
    } else {
        selectedProducts.delete(productId);
    }
    
    updateBulkActions();
}

// Handle select all
function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        const productId = parseInt(checkbox.dataset.id);
        
        if (e.target.checked) {
            selectedProducts.add(productId);
        } else {
            selectedProducts.delete(productId);
        }
    });
    
    updateBulkActions();
}

// Update bulk actions
function updateBulkActions() {
    const deleteBtn = document.querySelector('button[disabled]');
    deleteBtn.disabled = selectedProducts.size === 0;
    
    if (selectedProducts.size > 0) {
        deleteBtn.classList.remove('opacity-50');
        deleteBtn.onclick = () => bulkDeleteProducts();
    } else {
        deleteBtn.classList.add('opacity-50');
        deleteBtn.onclick = null;
    }
}

// Bulk delete products
function bulkDeleteProducts() {
    if (confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)?`)) {
        // Remove products from mockProducts array
        selectedProducts.forEach(id => {
            const index = mockProducts.findIndex(p => p.id === id);
            if (index > -1) {
                mockProducts.splice(index, 1);
            }
        });
        
        selectedProducts.clear();
        document.getElementById('selectAll').checked = false;
        applyFilters();
        updateStats();
        
        showNotification('Products deleted successfully', 'success');
    }
}


// Edit product
function editProduct(id) {
    const product = mockProducts.find(p => p.id === id);
    if (!product) return;
    
    currentEditingProduct = product;
    document.querySelector('#productModal h3').textContent = 'Edit Product';
    
    // Fill form with product data
    const form = document.getElementById('productForm');
    form.name.value = product.name;
    form.category.value = product.category;
    form.price.value = product.price;
    form.stock.value = product.stock;
    form.description.value = product.description;
    form.tags.value = product.tags.join(', ');
    form.colors.value = product.colors.join(', ');
    
    // Set sizes
    const sizeCheckboxes = form.querySelectorAll('input[name="sizes"]');
    sizeCheckboxes.forEach(checkbox => {
        checkbox.checked = product.sizes.includes(checkbox.value);
    });
    
    // Set status toggle
    const toggle = document.querySelector('.toggle-switch');
    if (product.status === 'active') {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
    
    document.getElementById('productModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Duplicate product
function duplicateProduct(id) {
    const product = mockProducts.find(p => p.id === id);
    if (!product) return;
    
    const newProduct = {
        ...product,
        id: Math.max(...mockProducts.map(p => p.id)) + 1,
        name: product.name + ' (Copy)',
        status: 'draft',
        sales: 0,
        views: 0,
        createdAt: new Date()
    };
    
    mockProducts.unshift(newProduct);
    applyFilters();
    updateStats();
    
    showNotification('Product duplicated successfully', 'success');
}

// Delete product
function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const index = mockProducts.findIndex(p => p.id === id);
        if (index > -1) {
            mockProducts.splice(index, 1);
            applyFilters();
            updateStats();
            showNotification('Product deleted successfully', 'success');
        }
    }
}

// Handle product form submission
function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const sizes = Array.from(formData.getAll('sizes'));
    const isActive = document.querySelector('.toggle-switch').classList.contains('active');
    
    const productData = {
        name: formData.get('name'),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        stock: parseInt(formData.get('stock')),
        description: formData.get('description'),
        tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
        colors: formData.get('colors') ? formData.get('colors').split(',').map(color => color.trim()) : [],
        sizes: sizes,
        status: isActive ? 'active' : 'draft',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop'
    };
    
    if (currentEditingProduct) {
        // Update existing product
        Object.assign(currentEditingProduct, productData);
        showNotification('Product updated successfully', 'success');
    } else {
        // Add new product
        const newProduct = {
            ...productData,
            id: Math.max(...mockProducts.map(p => p.id)) + 1,
            sales: 0,
            views: 0,
            createdAt: new Date()
        };
        mockProducts.unshift(newProduct);
        showNotification('Product added successfully', 'success');
    }
    
    closeModal();
    applyFilters();
    updateStats();
}

// Close modal
function closeModal() {
    document.getElementById('productModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Toggle switch
function toggleSwitch(element) {
    element.classList.toggle('active');
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'} mr-2"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);