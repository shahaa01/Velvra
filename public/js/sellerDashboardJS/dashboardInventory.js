// Global variables
let currentView = 'cards';
let allProducts = [];
let filteredProducts = [];

// Initialize
async function init() {
    await loadInventoryData();
    setupEventListeners();
    updateStats();
    renderLowStockAlerts();
    renderInventory();
}

// Load inventory data from backend
async function loadInventoryData() {
    try {
        const response = await fetch('/seller-dashboard/api/inventory/filter');
        const data = await response.json();
        
        if (data.success) {
            allProducts = data.products;
            filteredProducts = [...allProducts];
        } else {
            console.error('Failed to load inventory data');
            showNotification('Failed to load inventory data', 'error');
        }
    } catch (error) {
        console.error('Error loading inventory data:', error);
        showNotification('Error loading inventory data', 'error');
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

    // View toggle
    document.getElementById('cardViewBtn').addEventListener('click', () => {
        currentView = 'cards';
        document.getElementById('cardViewBtn').classList.add('bg-gold', 'text-charcoal');
        document.getElementById('cardViewBtn').classList.remove('bg-cream', 'text-gray-700');
        document.getElementById('tableViewBtn').classList.add('bg-cream', 'text-gray-700');
        document.getElementById('tableViewBtn').classList.remove('bg-gold', 'text-charcoal');
        document.getElementById('inventoryCards').classList.remove('hidden');
        document.getElementById('inventoryTable').classList.add('hidden');
    });

    document.getElementById('tableViewBtn').addEventListener('click', () => {
        currentView = 'table';
        document.getElementById('tableViewBtn').classList.add('bg-gold', 'text-charcoal');
        document.getElementById('tableViewBtn').classList.remove('bg-cream', 'text-gray-700');
        document.getElementById('cardViewBtn').classList.add('bg-cream', 'text-gray-700');
        document.getElementById('cardViewBtn').classList.remove('bg-gold', 'text-charcoal');
        document.getElementById('inventoryCards').classList.add('hidden');
        document.getElementById('inventoryTable').classList.remove('hidden');
        renderInventoryTable();
    });

    // Filters
    document.getElementById('searchInput').addEventListener('input', filterInventory);
    document.getElementById('categoryFilter').addEventListener('change', filterInventory);
    document.getElementById('stockFilter').addEventListener('change', filterInventory);
}

// Update stats display
function updateStats() {
    const inStockCount = allProducts.filter(p => p.status === 'in-stock').length;
    const lowStockCount = allProducts.filter(p => p.status === 'low-stock').length;
    const outOfStockCount = allProducts.filter(p => p.status === 'out-of-stock').length;
    const totalValue = allProducts.reduce((sum, product) => sum + (product.productValue || 0), 0);

    document.getElementById('inStockCount').textContent = inStockCount;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    document.getElementById('outOfStockCount').textContent = outOfStockCount;
    document.getElementById('totalValue').textContent = totalValue.toLocaleString();
}

// Render low stock alerts
function renderLowStockAlerts() {
    const container = document.getElementById('lowStockAlerts');
    const lowStockItems = allProducts.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock');
    
    if (lowStockItems.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div class="flex items-start">
                <i class="fas fa-exclamation-triangle text-red-600 mt-0.5 mr-3"></i>
                <div class="flex-1">
                    <h3 class="font-semibold text-red-900 mb-1">Stock Alert!</h3>
                    <p class="text-sm text-red-700">${lowStockItems.length} products need immediate attention</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        ${lowStockItems.map(item => `
                            <button onclick="updateStock('${item._id}')" class="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">
                                ${item.name} (${item.totalStock} left)
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render inventory cards
function renderInventory() {
    const container = document.getElementById('inventoryCards');
    container.innerHTML = '';

    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600">No products found matching your criteria</p>
            </div>
        `;
        return;
    }

    filteredProducts.forEach(item => {
        const card = document.createElement('div');
        card.className = 'inventory-card bg-cream rounded-xl border border-beige overflow-hidden';
        
        const stockPercentage = item.totalStock > 0 ? Math.min((item.totalStock / 20) * 100, 100) : 0;
        const productValue = item.productValue || 0;
        
        card.innerHTML = `
            <div class="relative">
                <img src="${item.images[0] || '/images/placeholder.svg'}" alt="${item.name}" class="w-full h-48 object-cover">
                ${item.status === 'out-of-stock' ? '<div class="absolute inset-0 bg-charcoal bg-opacity-50 flex items-center justify-center"><span class="text-pearl font-semibold">Out of Stock</span></div>' : ''}
                ${item.status === 'low-stock' ? '<div class="absolute top-2 right-2 bg-yellow-500 text-charcoal px-2 py-1 rounded text-xs font-medium">Low Stock</div>' : ''}
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-charcoal mb-1">${item.name}</h3>
                <p class="text-sm text-gray-700 mb-3">${item.category}</p>
                
                <div class="mb-3">
                    <div class="flex items-center justify-between text-sm mb-1">
                        <span class="text-gray-700">Total Stock</span>
                        <span class="font-medium ${item.status === 'out-of-stock' ? 'text-red-600' : item.status === 'low-stock' ? 'text-yellow-600' : 'text-green-600'}">
                            ${item.totalStock} units
                        </span>
                    </div>
                    <div class="bg-pearl rounded-full h-2 overflow-hidden">
                        <div class="stock-bar h-full ${item.status === 'out-of-stock' ? 'bg-red-500' : item.status === 'low-stock' ? 'bg-yellow-500' : 'bg-green-500'}" 
                             style="width: ${stockPercentage}%"></div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <p class="text-xs text-gray-700 mb-1">Variants: ${item.variants ? item.variants.length : 0} combinations</p>
                    <p class="text-sm font-semibold text-charcoal">Value: Rs. ${productValue.toLocaleString()}</p>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="updateStock('${item._id}')" class="flex-1 px-3 py-2 bg-gold text-charcoal rounded-lg hover:bg-velvra-gold-dark text-sm">
                        <i class="fas fa-edit mr-1"></i>Update
                    </button>
                    ${item.status !== 'in-stock' ? `
                        <button onclick="restockItem('${item._id}')" class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                            <i class="fas fa-plus"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Render inventory table
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';

    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-600">
                    <i class="fas fa-box-open text-2xl mb-2"></i>
                    <p>No products found matching your criteria</p>
                </td>
            </tr>
        `;
        return;
    }

    filteredProducts.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'border-b border-beige hover:bg-beige/20';
        
        const productValue = item.productValue || 0;
        
        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <img src="${item.images[0] || '/images/placeholder.svg'}" alt="${item.name}" class="w-10 h-10 rounded-lg object-cover mr-3">
                    <div>
                        <p class="font-medium text-charcoal">${item.name}</p>
                        <p class="text-xs text-gray-700">ID: #${item._id.toString().slice(-6).toUpperCase()}</p>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-charcoal">${item.category}</td>
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <span class="text-sm font-medium ${item.status === 'out-of-stock' ? 'text-red-600' : item.status === 'low-stock' ? 'text-yellow-600' : 'text-green-600'}">
                        ${item.totalStock}
                    </span>
                    ${item.status === 'low-stock' ? '<i class="fas fa-exclamation-triangle text-yellow-500 ml-2 text-xs"></i>' : ''}
                    ${item.status === 'out-of-stock' ? '<i class="fas fa-times-circle text-red-500 ml-2 text-xs"></i>' : ''}
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-charcoal">${item.variants ? item.variants.length : 0} combinations</td>
            <td class="px-4 py-3">
                ${getStatusBadge(item.status)}
            </td>
            <td class="px-4 py-3 text-sm font-medium text-charcoal">Rs. ${productValue.toLocaleString()}</td>
            <td class="px-4 py-3">
                <div class="flex space-x-2">
                    <button onclick="updateStock('${item._id}')" class="text-gold hover:text-velvra-gold-dark">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${item.status !== 'in-stock' ? `
                        <button onclick="restockItem('${item._id}')" class="text-green-600 hover:text-green-700">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update stock modal
async function updateStock(productId) {
    try {
        const response = await fetch(`/seller-dashboard/api/inventory/product/${productId}`);
        const data = await response.json();
        
        if (!data.success) {
            showNotification('Failed to load product data', 'error');
            return;
        }

        const product = data.product;
        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = `
            <div class="mb-6">
                <div class="flex items-center mb-4">
                    <img src="${product.images[0] || '/images/placeholder.svg'}" alt="${product.name}" class="w-20 h-20 rounded-lg object-cover mr-4">
                    <div>
                        <h4 class="text-lg font-semibold text-charcoal">${product.name}</h4>
                        <p class="text-gray-700">${product.category} • Current Total: ${product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)} units</p>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <h5 class="font-semibold text-charcoal">Stock by Size & Color</h5>
                
                ${product.variants.map((variant, vIndex) => `
                    <div class="bg-cream rounded-lg p-4 border border-beige">
                        <h6 class="font-medium text-charcoal mb-3">Size: ${variant.size} | Color: ${variant.color}</h6>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <span class="w-4 h-4 rounded-full border border-stone" 
                                      style="background-color: ${getColorHex(variant.color)}"></span>
                                <span class="text-sm text-charcoal">${variant.color}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button onclick="decrementStock(${vIndex})" 
                                        class="w-8 h-8 bg-beige text-charcoal rounded hover:bg-stone hover:text-pearl">
                                    <i class="fas fa-minus text-xs"></i>
                                </button>
                                <input type="number" 
                                       id="stock-${vIndex}" 
                                       value="${variant.stock || 0}" 
                                       min="0"
                                       class="w-16 px-2 py-1 text-center border border-beige rounded bg-pearl focus:outline-none focus:border-gold">
                                <button onclick="incrementStock(${vIndex})" 
                                        class="w-8 h-8 bg-beige text-charcoal rounded hover:bg-stone hover:text-pearl">
                                    <i class="fas fa-plus text-xs"></i>
                                </button>
                            </div>
                        </div>
                        <div class="mt-2 text-xs text-gray-600">
                            <span>Price: Rs. ${variant.price}</span>
                            ${variant.salePrice ? `<span class="ml-2 text-green-600">Sale: Rs. ${variant.salePrice}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
                
                <div class="bg-pearl rounded-lg p-4 border border-gold/30">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-charcoal">Low Stock Alert Threshold</span>
                        <input type="number" 
                               id="lowStockThreshold"
                               value="5" 
                               min="1"
                               class="w-20 px-2 py-1 text-center border border-beige rounded bg-cream focus:outline-none focus:border-gold">
                    </div>
                </div>
            </div>

            <div class="mt-6 pt-6 border-t border-beige flex justify-end space-x-3">
                <button onclick="closeModal()" class="px-6 py-2 border border-beige text-charcoal rounded-lg hover:bg-cream">
                    Cancel
                </button>
                <button onclick="saveStockUpdate('${product._id}')" class="px-6 py-2 bg-gold text-charcoal rounded-lg hover:bg-velvra-gold-dark">
                    Save Changes
                </button>
            </div>
        `;

        document.getElementById('stockModal').classList.add('show');
    } catch (error) {
        console.error('Error loading product data:', error);
        showNotification('Error loading product data', 'error');
    }
}

// Increment/Decrement stock
function incrementStock(variantIndex) {
    const input = document.getElementById(`stock-${variantIndex}`);
    input.value = parseInt(input.value) + 1;
}

function decrementStock(variantIndex) {
    const input = document.getElementById(`stock-${variantIndex}`);
    const currentValue = parseInt(input.value);
    if (currentValue > 0) {
        input.value = currentValue - 1;
    }
}

// Save stock update
async function saveStockUpdate(productId) {
    // Show SweetAlert confirmation
    const result = await Swal.fire({
        title: 'Confirm Stock Update',
        text: 'Are you sure you want to update the stock for this product?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d4af37',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, update stock',
        cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        // Collect updated variants data
        const updatedVariants = [];
        const variantInputs = document.querySelectorAll('[id^="stock-"]');
        
        variantInputs.forEach((input, index) => {
            const stockValue = parseInt(input.value) || 0;
            const product = allProducts.find(p => p._id === productId);
            if (product && product.variants[index]) {
                updatedVariants.push({
                    ...product.variants[index],
                    stock: stockValue
                });
            }
        });

        const lowStockThreshold = parseInt(document.getElementById('lowStockThreshold').value) || 5;

        const response = await fetch(`/seller-dashboard/api/inventory/product/${productId}/stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                variants: updatedVariants,
                lowStockThreshold
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Stock updated successfully', 'success');
            closeModal();
            
            // Update local data
            await loadInventoryData();
            updateStats();
            renderLowStockAlerts();
            renderInventory();
        } else {
            showNotification('Failed to update stock', 'error');
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        showNotification('Error updating stock', 'error');
    }
}

// Restock item
function restockItem(productId) {
    Swal.fire({
        title: 'Restock Product',
        input: 'number',
        inputLabel: 'Enter restock quantity',
        inputPlaceholder: 'Quantity',
        showCancelButton: true,
        confirmButtonColor: '#d4af37',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Restock',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
            if (!value || value <= 0) {
                return 'Please enter a valid quantity';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            showNotification(`Restock order placed for ${result.value} units`, 'success');
        }
    });
}

// Filter inventory
async function filterInventory() {
    const searchTerm = document.getElementById('searchInput').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;

    try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (categoryFilter) params.append('category', categoryFilter);
        if (stockFilter) params.append('stockStatus', stockFilter);

        const response = await fetch(`/seller-dashboard/api/inventory/filter?${params}`);
        const data = await response.json();

        if (data.success) {
            filteredProducts = data.products;
            renderInventory();
            if (currentView === 'table') {
                renderInventoryTable();
            }
        } else {
            console.error('Failed to filter inventory');
        }
    } catch (error) {
        console.error('Error filtering inventory:', error);
    }
}

// Get color hex
function getColorHex(colorName) {
    const colors = {
        'Black': '#000000',
        'Brown': '#8B4513',
        'White': '#FFFFFF',
        'Red': '#DC143C',
        'Navy': '#000080',
        'Tan': '#D2691E',
        'Cream': '#FFFDD0',
        'Gray': '#808080',
        'Blue': '#0000FF',
        'Green': '#008000',
        'Yellow': '#FFFF00',
        'Pink': '#FFC0CB',
        'Purple': '#800080',
        'Orange': '#FFA500'
    };
    return colors[colorName] || '#CCCCCC';
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'in-stock': '<span class="status-badge bg-green-100 text-green-700">In Stock</span>',
        'low-stock': '<span class="status-badge bg-yellow-100 text-yellow-700">Low Stock</span>',
        'out-of-stock': '<span class="status-badge bg-red-100 text-red-700">Out of Stock</span>'
    };
    return badges[status] || '';
}

// Close modal
function closeModal() {
    document.getElementById('stockModal').classList.remove('show');
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'} mr-2"></i>
            ${message}
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
