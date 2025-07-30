// Global variables
let currentView = 'grid';
let filteredProducts = [];
let currentEditingProduct = null;

// Utility function to strip HTML tags
function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Populate variant table in edit modal
function populateVariantTable(variants) {
    const tbody = document.getElementById('variantTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = variants.map((variant, index) => `
        <tr class="hover:bg-gray-50 border-b border-beige">
            <td class="px-4 py-3 text-sm text-charcoal font-medium">${variant.size || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-charcoal">${variant.color || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-charcoal font-medium">Rs. ${variant.price || 0}</td>
            <td class="px-4 py-3">
                <input type="number" 
                       name="variant_sale_${index}" 
                       value="${variant.salePrice || ''}" 
                       step="0.01" 
                       min="0"
                       placeholder="Enter sale price"
                       class="w-full px-3 py-2 border border-beige rounded-lg bg-cream focus:outline-none focus:border-gold text-sm"
                       data-variant-index="${index}">
            </td>
            <td class="px-4 py-3 text-sm text-charcoal">
                <span class="px-2 py-1 rounded-full text-xs ${variant.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${variant.stock || 0}
                </span>
            </td>
        </tr>
    `).join('');
}

// Initialize
async function init() {
    showLoading();
    try {
        await loadProducts();
        updateStats();
        setupEventListeners();
        // Track view counts for all products
        await trackViewCounts();
    } catch (error) {
        console.error('Error initializing:', error);
        showNotification('Error loading products', 'error');
    } finally {
        hideLoading();
    }
}

// Track view counts for all products (only once per page load)
async function trackViewCounts() {
    try {
        // Only track if we haven't already tracked for this session
        if (sessionStorage.getItem('viewCountsTracked')) {
            console.log('View counts already tracked for this session');
            return;
        }
        
        console.log('Tracking view counts for', filteredProducts.length, 'products');
        
        for (const product of filteredProducts) {
            const response = await fetch(`/seller-dashboard/api/products/${product._id}/view`, {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log(`View count incremented for product: ${product.name}`);
            } else {
                console.error(`Failed to increment view count for product: ${product.name}`);
            }
        }
        
        // Mark as tracked for this session
        sessionStorage.setItem('viewCountsTracked', 'true');
        console.log('View count tracking completed');
        
        // Refresh the products to show updated view counts
        await loadProducts();
    } catch (error) {
        console.error('Error tracking view counts:', error);
    }
}

// Load products from backend
async function loadProducts() {
    try {
        // First try to use data from window object (server-side rendered)
        if (window.productsData && window.productsData.length > 0) {
            filteredProducts = window.productsData;
            renderProducts();
            return;
        }
        
        // Fallback to API call
        const response = await fetch('/seller-dashboard/api/products');
        const data = await response.json();
        
        if (data.success) {
            filteredProducts = data.products;
            renderProducts();
        } else {
            throw new Error('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        throw error;
    }
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

// Update stats from backend data
function updateStats() {
    // Use server-side rendered stats if available
    if (window.statsData) {
        const statElements = document.querySelectorAll('.grid.grid-cols-2.lg\\:grid-cols-4 .bg-cream .text-xl');
        if (statElements.length >= 4) {
            statElements[0].textContent = window.statsData.totalProducts || 0;
            statElements[1].textContent = window.statsData.activeProducts || 0;
            statElements[2].textContent = window.statsData.lowStock || 0;
            statElements[3].textContent = window.statsData.outOfStock || 0;
        }
        return;
    }
    
    // Fallback to client-side calculation
    const totalProducts = filteredProducts.length;
    const activeProducts = filteredProducts.filter(p => {
        return p.variants && p.variants.some(v => v.stock > 0 && v.active);
    }).length;
    const lowStockProducts = filteredProducts.filter(p => {
        return p.variants && p.variants.some(v => v.stock > 0 && v.stock <= 3 && v.active);
    }).length;
    const outOfStockProducts = filteredProducts.filter(p => {
        return !p.variants || p.variants.every(v => v.stock === 0 || !v.active);
    }).length;
    
    // Update stats display
    const statElements = document.querySelectorAll('.grid.grid-cols-2.lg\\:grid-cols-4 .bg-cream .text-xl');
    if (statElements.length >= 4) {
        statElements[0].textContent = totalProducts;
        statElements[1].textContent = activeProducts;
        statElements[2].textContent = lowStockProducts;
        statElements[3].textContent = outOfStockProducts;
    }
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

// Handle search and filters
async function handleSearch(e) {
    await applyFilters();
}

async function handleFilters() {
    await applyFilters();
}

// Apply all filters
async function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter) params.append('category', categoryFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (sortBy) params.append('sortBy', sortBy);
        
        const response = await fetch(`/seller-dashboard/api/products?${params}`);
        const data = await response.json();
        
        if (data.success) {
            filteredProducts = data.products;
            renderProducts();
            updateStats();
        } else {
            throw new Error('Failed to filter products');
        }
    } catch (error) {
        console.error('Error applying filters:', error);
        showNotification('Error filtering products', 'error');
    }
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

// Get product status
function getProductStatus(product) {
    if (!product.variants || product.variants.length === 0) {
        return 'out-of-stock';
    }
    
    const hasActiveStock = product.variants.some(v => v.stock > 0 && v.active);
    return hasActiveStock ? 'active' : 'out-of-stock';
}

// Get best price info
function getBestPriceInfo(product) {
    if (!product.variants || product.variants.length === 0) {
        return { displayPrice: 0, hasSale: false };
    }
    
    const variantsWithSale = product.variants.filter(v => v.salePrice && v.salePrice < v.price);
    
    if (variantsWithSale.length > 0) {
        const lowestSaleVariant = variantsWithSale.reduce((lowest, current) => 
            current.salePrice < lowest.salePrice ? current : lowest
        );
        return {
            displayPrice: lowestSaleVariant.salePrice,
            originalPrice: lowestSaleVariant.price,
            hasSale: true
        };
    } else {
        const lowestPriceVariant = product.variants.reduce((lowest, current) => 
            current.price < lowest.price ? current : lowest
        );
        return {
            displayPrice: lowestPriceVariant.price,
            originalPrice: lowestPriceVariant.price,
            hasSale: false
        };
    }
}

// Get total stock
function getTotalStock(product) {
    if (!product.variants) return 0;
    return product.variants.reduce((total, variant) => total + variant.stock, 0);
}

// Get stock status with color coding
function getStockStatus(product) {
    const totalStock = getTotalStock(product);
    if (totalStock === 0) return { status: 'Out of Stock', class: 'bg-red-100 text-red-800' };
    if (totalStock <= 5) return { status: 'Low Stock', class: 'bg-yellow-100 text-yellow-800' };
    return { status: 'In Stock', class: 'bg-green-100 text-green-800' };
}

// Render grid view
function renderGridView() {
    const gridContainer = document.getElementById('productsGrid');
    
    gridContainer.innerHTML = filteredProducts.map(product => {
        const status = getProductStatus(product);
        const priceInfo = getBestPriceInfo(product);
        const totalStock = getTotalStock(product);
        const stockStatus = getStockStatus(product);
        
        return `
            <div class="product-card bg-cream rounded-xl border border-beige overflow-hidden">
                <div class="relative">
                    <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x300/e8dcc6/1a1a1a?text=No+Image'}" 
                         alt="${product.name}" class="w-full h-48 object-cover">
                    <div class="absolute top-2 right-2">
                        ${getStatusBadge(status)}
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-charcoal mb-1 truncate">${product.name}</h3>
                    <p class="text-sm text-gray-700 mb-2 capitalize">${product.category}</p>
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex flex-col">
                            ${priceInfo.hasSale ? 
                                `<span class="line-through text-gray-500 text-sm mb-1">Rs. ${priceInfo.originalPrice}</span>` : 
                                ''
                            }
                            <span class="text-lg font-bold text-gold">Rs. ${priceInfo.displayPrice}</span>
                        </div>
                        <span class="text-sm px-2 py-1 rounded-full ${stockStatus.class}">${stockStatus.status} (${totalStock})</span>
                    </div>
                    <div class="flex items-center justify-between text-xs text-gray-700 mb-3">
                        <span><i class="fas fa-eye mr-1"></i>${product.viewCount || 0}</span>
                        <span><i class="fas fa-shopping-cart mr-1"></i>${product.cartCount || 0}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="editProduct('${product._id}')" 
                                class="flex-1 px-3 py-2 bg-gold text-charcoal rounded-lg hover:bg-velvra-gold-dark text-sm font-medium transition-colors">
                            <i class="fas fa-edit mr-1"></i>Edit
                        </button>
                        <button onclick="deleteProduct('${product._id}')" 
                                class="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render list view
function renderListView() {
    const tableBody = document.getElementById('productsTableBody');
    
    tableBody.innerHTML = filteredProducts.map(product => {
        const status = getProductStatus(product);
        const priceInfo = getBestPriceInfo(product);
        const totalStock = getTotalStock(product);
        const stockStatus = getStockStatus(product);
        
        return `
            <tr class="border-b border-beige hover:bg-beige/30 transition-colors">
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <img src="${product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x300/e8dcc6/1a1a1a?text=No+Image'}" 
                             alt="${product.name}" class="w-12 h-12 object-cover rounded-lg mr-3">
                        <div>
                            <div class="font-medium text-charcoal">${product.name}</div>
                            <div class="text-sm text-gray-700">${product.description ? stripHtml(product.description).substring(0, 50) + '...' : 'No description'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700 capitalize">${product.category}</td>
                <td class="px-4 py-3">
                    <div class="flex flex-col">
                        ${priceInfo.hasSale ? 
                            `<span class="line-through text-gray-500 text-xs mb-1">Rs. ${priceInfo.originalPrice}</span>` : 
                            ''
                        }
                        <span class="text-sm font-medium text-gold">Rs. ${priceInfo.displayPrice}</span>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-sm px-2 py-1 rounded-full ${stockStatus.class}">${stockStatus.status} (${totalStock})</span>
                </td>
                <td class="px-4 py-3">${getStatusBadge(status)}</td>
                <td class="px-4 py-3">
                    <div class="flex items-center space-x-2">
                        <button onclick="editProduct('${product._id}')" 
                                class="p-1 text-gold hover:text-velvra-gold-dark transition-colors">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteProduct('${product._id}')" 
                                class="p-1 text-red-600 hover:text-red-700 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
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

// Edit product
async function editProduct(id) {
    try {
        const response = await fetch(`/seller-dashboard/api/products/${id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentEditingProduct = data.product;
            document.querySelector('#productModal h3').textContent = 'Edit Product';
            
            // Fill form with product data
            const form = document.getElementById('productForm');
            if (!form) {
                throw new Error('Product form not found');
            }
            
            form.name.value = data.product.name || '';
            form.description.value = stripHtml(data.product.description || '');
            
            // Fill highlights
            if (data.product.highlights && data.product.highlights.length > 0) {
                form.highlights.value = data.product.highlights.join(', ');
            } else {
                form.highlights.value = '';
            }
            
            // Populate variant table
            if (data.product.variants && data.product.variants.length > 0) {
                populateVariantTable(data.product.variants);
            } else {
                document.getElementById('variantTableBody').innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No variants found</td></tr>';
            }
            
            // Fill more details
            if (data.product.moreDetails) {
                Object.keys(data.product.moreDetails).forEach(key => {
                    const field = form[key];
                    if (field) {
                        field.value = data.product.moreDetails[key] || '';
                    }
                });
            }
            
            document.getElementById('productModal').classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            throw new Error(data.message || 'Failed to load product');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification(`Error loading product details: ${error.message}`, 'error');
    }
}

// Delete product with SweetAlert confirmation
async function deleteProduct(id) {
    try {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            const response = await fetch(`/seller-dashboard/api/products/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (data.success) {
                await loadProducts();
                updateStats();
                Swal.fire(
                    'Deleted!',
                    'Product has been deleted.',
                    'success'
                );
            } else {
                throw new Error('Failed to delete product');
            }
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product', 'error');
    }
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    
    if (!currentEditingProduct) {
        showNotification('No product selected for editing', 'error');
        return;
    }
    
    // Validate variant sale prices
    const variantInputs = document.querySelectorAll('input[name^="variant_sale_"]');
    for (let input of variantInputs) {
        const value = input.value;
        if (value && parseFloat(value) <= 0) {
            showNotification('All sale prices must be greater than 0', 'error');
            return;
        }
    }
    
    try {
        const formData = new FormData(e.target);
        // Collect variant sale prices
        const variantSalePrices = {};
        const variantInputs = document.querySelectorAll('input[name^="variant_sale_"]');
        variantInputs.forEach(input => {
            const index = input.getAttribute('data-variant-index');
            const value = input.value;
            variantSalePrices[index] = value ? parseFloat(value) : null;
        });

        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            highlights: formData.get('highlights') ? formData.get('highlights').split(',').map(h => h.trim()) : [],
            variantSalePrices: variantSalePrices,
            moreDetails: {
                fabric: formData.get('fabric') || '',
                fashionTrend: formData.get('fashionTrend') || '',
                fit: formData.get('fit') || '',
                length: formData.get('length') || '',
                multipack: formData.get('multipack') || '',
                neckType: formData.get('neckType') || '',
                numItems: formData.get('numItems') || '',
                occasion: formData.get('occasion') || '',
                packageContains: formData.get('packageContains') || '',
                pattern: formData.get('pattern') || '',
                printPatternType: formData.get('printPatternType') || '',
                sleeveLength: formData.get('sleeveLength') || '',
                sleeveStyling: formData.get('sleeveStyling') || '',
                washCare: formData.get('washCare') || '',
                weaveType: formData.get('weaveType') || '',
                transparency: formData.get('transparency') || '',
                surfaceStyling: formData.get('surfaceStyling') || '',
                closureType: formData.get('closureType') || '',
                lining: formData.get('lining') || ''
            }
        };
        
        const response = await fetch(`/seller-dashboard/api/products/${currentEditingProduct._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadProducts();
            updateStats();
            closeModal();
            showNotification('Product updated successfully', 'success');
        } else {
            throw new Error('Failed to update product');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('Error updating product', 'error');
    }
}

// Close modal
function closeModal() {
    document.getElementById('productModal').classList.remove('show');
    document.body.style.overflow = 'auto';
    currentEditingProduct = null;
    
    // Reset form
    const form = document.getElementById('productForm');
    form.reset();
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

// Refresh products function
async function refreshProducts() {
    try {
        showLoading();
        await loadProducts();
        updateStats();
        showNotification('Products refreshed successfully', 'success');
    } catch (error) {
        console.error('Error refreshing products:', error);
        showNotification('Error refreshing products', 'error');
    } finally {
        hideLoading();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);