// Mock inventory data
const mockInventory = [
    {
        id: 1,
        name: 'Premium Leather Jacket',
        category: 'Clothing',
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
        totalStock: 45,
        variants: [
            { size: 'S', colors: [{ color: 'Black', stock: 5 }, { color: 'Brown', stock: 3 }] },
            { size: 'M', colors: [{ color: 'Black', stock: 8 }, { color: 'Brown', stock: 6 }] },
            { size: 'L', colors: [{ color: 'Black', stock: 10 }, { color: 'Brown', stock: 7 }] },
            { size: 'XL', colors: [{ color: 'Black', stock: 4 }, { color: 'Brown', stock: 2 }] }
        ],
        lowStockThreshold: 10,
        status: 'in-stock'
    },
    {
        id: 2,
        name: 'Silk Evening Dress',
        category: 'Clothing',
        price: 189.99,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
        totalStock: 3,
        variants: [
            { size: 'XS', colors: [{ color: 'Red', stock: 0 }, { color: 'Navy', stock: 1 }] },
            { size: 'S', colors: [{ color: 'Red', stock: 1 }, { color: 'Navy', stock: 0 }] },
            { size: 'M', colors: [{ color: 'Red', stock: 0 }, { color: 'Navy', stock: 1 }] },
            { size: 'L', colors: [{ color: 'Red', stock: 0 }, { color: 'Navy', stock: 0 }] }
        ],
        lowStockThreshold: 5,
        status: 'low-stock'
    },
    {
        id: 3,
        name: 'Designer Handbag',
        category: 'Accessories',
        price: 450.00,
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&h=300&fit=crop',
        totalStock: 0,
        variants: [
            { size: 'One Size', colors: [{ color: 'Black', stock: 0 }, { color: 'Tan', stock: 0 }, { color: 'White', stock: 0 }] }
        ],
        lowStockThreshold: 3,
        status: 'out-of-stock'
    },
    {
        id: 4,
        name: 'Cashmere Sweater',
        category: 'Clothing',
        price: 125.00,
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop',
        totalStock: 62,
        variants: [
            { size: 'S', colors: [{ color: 'Cream', stock: 10 }, { color: 'Gray', stock: 8 }, { color: 'Navy', stock: 7 }] },
            { size: 'M', colors: [{ color: 'Cream', stock: 12 }, { color: 'Gray', stock: 10 }, { color: 'Navy', stock: 8 }] },
            { size: 'L', colors: [{ color: 'Cream', stock: 5 }, { color: 'Gray', stock: 4 }, { color: 'Navy', stock: 3 }] }
        ],
        lowStockThreshold: 15,
        status: 'in-stock'
    }
];

let currentView = 'cards';

// Initialize
function init() {
    renderLowStockAlerts();
    renderInventory();
    setupEventListeners();
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

    // Bulk update form
    document.getElementById('bulkUpdateForm').addEventListener('submit', (e) => {
        e.preventDefault();
        processBulkUpdate();
    });
}

// Render low stock alerts
function renderLowStockAlerts() {
    const container = document.getElementById('lowStockAlerts');
    const lowStockItems = mockInventory.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock');
    
    if (lowStockItems.length === 0) return;

    container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div class="flex items-start">
                <i class="fas fa-exclamation-triangle text-red-600 mt-0.5 mr-3"></i>
                <div class="flex-1">
                    <h3 class="font-semibold text-red-900 mb-1">Stock Alert!</h3>
                    <p class="text-sm text-red-700">${lowStockItems.length} products need immediate attention</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        ${lowStockItems.map(item => `
                            <button onclick="updateStock(${item.id})" class="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200">
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

    mockInventory.forEach(item => {
        const card = document.createElement('div');
        card.className = 'inventory-card bg-cream rounded-xl border border-beige overflow-hidden';
        
        const stockPercentage = (item.totalStock / (item.lowStockThreshold * 3)) * 100;
        
        card.innerHTML = `
            <div class="relative">
                <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-cover">
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
                             style="width: ${Math.min(stockPercentage, 100)}%"></div>
                    </div>
                </div>
                
                <div class="mb-3">
                    <p class="text-xs text-gray-700 mb-1">Variants: ${item.variants.length} sizes</p>
                    <p class="text-sm font-semibold text-charcoal">Value: ${(item.totalStock * item.price).toFixed(2)}</p>
                </div>
                
                <div class="flex space-x-2">
                    <button onclick="updateStock(${item.id})" class="flex-1 px-3 py-2 bg-gold text-charcoal rounded-lg hover:bg-velvra-gold-dark text-sm">
                        <i class="fas fa-edit mr-1"></i>Update
                    </button>
                    ${item.status !== 'in-stock' ? `
                        <button onclick="restockItem(${item.id})" class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
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

    mockInventory.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'border-b border-beige hover:bg-beige/20';
        
        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <img src="${item.image}" alt="${item.name}" class="w-10 h-10 rounded-lg object-cover mr-3">
                    <div>
                        <p class="font-medium text-charcoal">${item.name}</p>
                        <p class="text-xs text-gray-700">ID: #${item.id.toString().padStart(5, '0')}</p>
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
            <td class="px-4 py-3 text-sm text-charcoal">${item.variants.length} sizes</td>
            <td class="px-4 py-3">
                ${getStatusBadge(item.status)}
            </td>
            <td class="px-4 py-3 text-sm font-medium text-charcoal">${(item.totalStock * item.price).toFixed(2)}</td>
            <td class="px-4 py-3">
                <div class="flex space-x-2">
                    <button onclick="updateStock(${item.id})" class="text-gold hover:text-velvra-gold-dark">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${item.status !== 'in-stock' ? `
                        <button onclick="restockItem(${item.id})" class="text-green-600 hover:text-green-700">
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
function updateStock(itemId) {
    const item = mockInventory.find(i => i.id === itemId);
    if (!item) return;

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="mb-6">
            <div class="flex items-center mb-4">
                <img src="${item.image}" alt="${item.name}" class="w-20 h-20 rounded-lg object-cover mr-4">
                <div>
                    <h4 class="text-lg font-semibold text-charcoal">${item.name}</h4>
                    <p class="text-gray-700">${item.category} • Current Total: ${item.totalStock} units</p>
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <h5 class="font-semibold text-charcoal">Stock by Size & Color</h5>
            
            ${item.variants.map((variant, vIndex) => `
                <div class="bg-cream rounded-lg p-4 border border-beige">
                    <h6 class="font-medium text-charcoal mb-3">Size: ${variant.size}</h6>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        ${variant.colors.map((color, cIndex) => `
                            <div class="flex items-center justify-between">
                                <label class="text-sm text-charcoal flex items-center">
                                    <span class="w-4 h-4 rounded-full mr-2 border border-stone" 
                                          style="background-color: ${getColorHex(color.color)}"></span>
                                    ${color.color}
                                </label>
                                <div class="flex items-center space-x-2">
                                    <button onclick="decrementStock(${itemId}, ${vIndex}, ${cIndex})" 
                                            class="w-8 h-8 bg-beige text-charcoal rounded hover:bg-stone hover:text-pearl">
                                        <i class="fas fa-minus text-xs"></i>
                                    </button>
                                    <input type="number" 
                                           id="stock-${vIndex}-${cIndex}" 
                                           value="${color.stock}" 
                                           min="0"
                                           class="w-16 px-2 py-1 text-center border border-beige rounded bg-pearl focus:outline-none focus:border-gold">
                                    <button onclick="incrementStock(${itemId}, ${vIndex}, ${cIndex})" 
                                            class="w-8 h-8 bg-beige text-charcoal rounded hover:bg-stone hover:text-pearl">
                                        <i class="fas fa-plus text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            
            <div class="bg-pearl rounded-lg p-4 border border-gold/30">
                <div class="flex items-center justify-between">
                    <span class="font-medium text-charcoal">Low Stock Alert Threshold</span>
                    <input type="number" 
                           value="${item.lowStockThreshold}" 
                           min="1"
                           class="w-20 px-2 py-1 text-center border border-beige rounded bg-cream focus:outline-none focus:border-gold">
                </div>
            </div>
        </div>

        <div class="mt-6 pt-6 border-t border-beige flex justify-end space-x-3">
            <button onclick="closeModal()" class="px-6 py-2 border border-beige text-charcoal rounded-lg hover:bg-cream">
                Cancel
            </button>
            <button onclick="saveStockUpdate(${item.id})" class="px-6 py-2 bg-gold text-charcoal rounded-lg hover:bg-velvra-gold-dark">
                Save Changes
            </button>
        </div>
    `;

    document.getElementById('stockModal').classList.add('show');
}

// Increment/Decrement stock
function incrementStock(itemId, variantIndex, colorIndex) {
    const input = document.getElementById(`stock-${variantIndex}-${colorIndex}`);
    input.value = parseInt(input.value) + 1;
}

function decrementStock(itemId, variantIndex, colorIndex) {
    const input = document.getElementById(`stock-${variantIndex}-${colorIndex}`);
    const currentValue = parseInt(input.value);
    if (currentValue > 0) {
        input.value = currentValue - 1;
    }
}

// Save stock update
function saveStockUpdate(itemId) {
    // Simulate saving
    showNotification('Stock updated successfully', 'success');
    closeModal();
    
    // Recalculate and update display
    const item = mockInventory.find(i => i.id === itemId);
    if (item) {
        // Update total stock
        item.totalStock = item.variants.reduce((total, variant) => {
            return total + variant.colors.reduce((sum, color) => sum + color.stock, 0);
        }, 0);
        
        // Update status
        if (item.totalStock === 0) {
            item.status = 'out-of-stock';
        } else if (item.totalStock <= item.lowStockThreshold) {
            item.status = 'low-stock';
        } else {
            item.status = 'in-stock';
        }
    }
    
    renderLowStockAlerts();
    renderInventory();
}

// Restock item
function restockItem(itemId) {
    const quantity = prompt('Enter restock quantity:');
    if (quantity && !isNaN(quantity)) {
        showNotification(`Restock order placed for ${quantity} units`, 'success');
    }
}

// Bulk update modal
function openBulkUpdateModal() {
    document.getElementById('bulkUpdateModal').classList.add('show');
}

function closeBulkModal() {
    document.getElementById('bulkUpdateModal').classList.remove('show');
}

function processBulkUpdate() {
    closeBulkModal();
    showNotification('Bulk update applied successfully', 'success');
}

// Filter inventory
function filterInventory() {
    // Implementation for filtering
    renderInventory();
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
        'Gray': '#808080'
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
init();
