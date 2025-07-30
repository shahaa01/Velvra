// Global variables
let promotions = [];
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let currentFilters = {
    search: '',
    status: '',
    type: '',
    sortBy: 'newest'
};

// Initialize
function init() {
    loadPromotions();
    setupEventListeners();
    setupModalDefaults();
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

    // Filters
    document.getElementById('searchInput').addEventListener('input', debounce(filterPromotions, 300));
    document.getElementById('statusFilter').addEventListener('change', filterPromotions);
    document.getElementById('typeFilter').addEventListener('change', filterPromotions);
    document.getElementById('sortBy').addEventListener('change', filterPromotions);

    // Form submission
    document.getElementById('couponForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveCoupon();
    });

    // Discount type radio buttons
    document.querySelectorAll('[name="type"]').forEach(input => {
        input.addEventListener('change', updateDiscountTypeUI);
    });

    // Modal close
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Setup modal defaults
function setupModalDefaults() {
    // Set default times for start and end dates
    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
    
    // Format dates for datetime-local input (Nepal time)
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Set default start time to 12:00 AM Nepal time
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    
    // Set default end time to 11:59 PM Nepal time
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 0, 0);

    // Store defaults for use when opening modal
    window.modalDefaults = {
        startDate: formatDateForInput(startDateTime),
        endDate: formatDateForInput(endDateTime)
    };
}

// Load promotions from API
async function loadPromotions(page = 1) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading(true);

    try {
        const queryParams = new URLSearchParams({
            page,
            limit: 10,
            ...currentFilters
        });

        const response = await fetch(`/api/promotions/seller/promotions?${queryParams}`);
        const result = await response.json();

        if (result.success) {
            promotions = result.data.promotions;
            currentPage = result.data.pagination.currentPage;
            totalPages = result.data.pagination.totalPages;
            
            updateStats(result.data.stats);
            renderPromotions();
        } else {
            showNotification('Failed to load promotions', 'error');
        }
    } catch (error) {
        console.error('Error loading promotions:', error);
        showNotification('Error loading promotions', 'error');
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

// Update statistics
function updateStats(stats) {
    const statsElements = {
        activeCoupons: document.querySelector('.stats-card:nth-child(1) p:nth-child(2)'),
        totalUses: document.querySelector('.stats-card:nth-child(2) p:nth-child(2)'),
        revenueImpact: document.querySelector('.stats-card:nth-child(3) p:nth-child(2)'),
        avgDiscount: document.querySelector('.stats-card:nth-child(4) p:nth-child(2)')
    };

    if (statsElements.activeCoupons) {
        statsElements.activeCoupons.textContent = stats.activeCoupons;
        const increaseElement = statsElements.activeCoupons.parentElement.querySelector('p:last-child');
        if (increaseElement) {
            increaseElement.textContent = `↑ ${stats.activeCouponsIncrease} this week`;
        }
    }

    if (statsElements.totalUses) {
        statsElements.totalUses.textContent = stats.totalUses.toLocaleString();
    }

    if (statsElements.revenueImpact) {
        statsElements.revenueImpact.textContent = `Rs. ${(stats.revenueImpact / 1000).toFixed(1)}k`;
    }

    if (statsElements.avgDiscount) {
        statsElements.avgDiscount.textContent = `${stats.avgDiscount}%`;
    }
}

// Render promotions
function renderPromotions() {
    const container = document.getElementById('promotionsGrid');
    container.innerHTML = '';

    if (promotions.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        return;
    }

    document.getElementById('emptyState').classList.add('hidden');

    promotions.forEach(promo => {
        const card = document.createElement('div');
        card.className = 'promo-card bg-cream rounded-xl border border-beige overflow-hidden';
        
        const isActive = promo.currentStatus === 'active';
        const isScheduled = promo.currentStatus === 'scheduled';
        const isExpired = promo.currentStatus === 'expired';
        const isPaused = promo.currentStatus === 'paused';
        
        const daysLeft = promo.daysRemaining || 0;
        const usagePercentage = promo.usagePercentage || 0;
        
        card.innerHTML = `
            <div class="bg-gradient-to-r from-gold to-velvra-gold-light p-6 text-charcoal">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="text-xl font-bold code-display">${promo.code}</h3>
                        <p class="text-sm opacity-80 mt-1">${promo.description}</p>
                    </div>
                    ${getStatusBadge(promo.currentStatus)}
                </div>
                
                <div class="flex items-center space-x-4">
                    <div class="bg-charcoal bg-opacity-10 px-4 py-2 rounded-lg">
                        <p class="text-2xl font-bold">
                            ${promo.type === 'percentage' ? promo.value + '%' : 
                                promo.type === 'fixed' ? promo.value : 
                                promo.type === 'bogo' ? 'BOGO' :
                                'FREE'}
                        </p>
                        <p class="text-xs opacity-80">
                            ${promo.type === 'percentage' ? 'OFF' : 
                              promo.type === 'fixed' ? 'OFF' : 
                              promo.type === 'bogo' ? promo.value + '% OFF' :
                              'SHIPPING'}
                        </p>
                    </div>
                    ${promo.minPurchase > 0 ? `
                        <div class="text-sm">
                            <p class="opacity-80">Min. Purchase</p>
                            <p class="font-semibold">Rs. ${promo.minPurchase.toLocaleString()}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="p-6">
                <div class="space-y-3 mb-4">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-700">Valid Period</span>
                        <span class="font-medium text-charcoal">${formatDate(promo.startDate)} - ${formatDate(promo.endDate)}</span>
                    </div>
                    
                    ${isActive ? `
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-700">Time Remaining</span>
                            <span class="font-medium countdown-timer text-orange-600">
                                <i class="fas fa-clock mr-1"></i>${daysLeft} days
                            </span>
                        </div>
                    ` : ''}
                    
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-700">Applies To</span>
                        <span class="font-medium text-charcoal">${getApplyToText(promo.applyTo, promo.categories, promo.products)}</span>
                    </div>
                </div>
                
                ${promo.totalLimit ? `
                    <div class="mb-4">
                        <div class="flex items-center justify-between text-sm mb-1">
                            <span class="text-gray-700">Usage</span>
                            <span class="font-medium text-charcoal">${promo.usageCount} / ${promo.totalLimit}</span>
                        </div>
                        <div class="bg-pearl rounded-full h-2 overflow-hidden">
                            <div class="usage-bar bg-gradient-to-r from-gold to-velvra-gold-light h-2 rounded-full" style="width: ${usagePercentage}%"></div>
                        </div>
                    </div>
                ` : `
                    <div class="flex items-center justify-between text-sm mb-4">
                        <span class="text-gray-700">Total Uses</span>
                        <span class="font-medium text-charcoal">${promo.usageCount}</span>
                    </div>
                `}
                
                <div class="flex items-center justify-between pt-4 border-t border-beige">
                    <div>
                        <p class="text-xs text-gray-700">Revenue Generated</p>
                        <p class="text-lg font-bold text-green-600">Rs. ${promo.revenue.toLocaleString()}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="editCoupon('${promo._id}')" class="p-2 text-gold hover:text-velvra-gold-dark">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${!isExpired ? `
                            <button onclick="toggleCoupon('${promo._id}')" class="p-2 ${isActive ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}">
                                <i class="fas fa-${isActive ? 'pause' : 'play'}"></i>
                            </button>
                        ` : ''}
                        <button onclick="deleteCoupon('${promo._id}')" class="p-2 text-red-500 hover:text-red-600">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'active': '<span class="status-badge bg-green-100 text-green-700"><i class="fas fa-check-circle mr-1"></i>Active</span>',
        'scheduled': '<span class="status-badge bg-blue-100 text-blue-700"><i class="fas fa-clock mr-1"></i>Scheduled</span>',
        'expired': '<span class="status-badge bg-gray-100 text-gray-700"><i class="fas fa-times-circle mr-1"></i>Expired</span>',
        'paused': '<span class="status-badge bg-yellow-100 text-yellow-700"><i class="fas fa-pause-circle mr-1"></i>Paused</span>'
    };
    return badges[status] || '';
}

// Get apply to text
function getApplyToText(applyTo, categories, products) {
    switch (applyTo) {
        case 'all':
            return 'All Products';
        case 'category':
            return categories && categories.length > 0 ? categories.join(', ') : 'Specific Categories';
        case 'products':
            return products && products.length > 0 ? `${products.length} Products` : 'Specific Products';
        default:
            return 'All Products';
    }
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
    });
}

// Open create modal
function openCreateModal() {
    document.getElementById('couponModal').classList.add('show');
    document.querySelector('#couponModal h3').textContent = 'Create New Coupon';
    document.getElementById('couponForm').reset();
    
    // Set default dates
    const startDateInput = document.querySelector('[name="startDate"]');
    const endDateInput = document.querySelector('[name="endDate"]');
    
    if (startDateInput && window.modalDefaults) {
        startDateInput.value = window.modalDefaults.startDate;
    }
    if (endDateInput && window.modalDefaults) {
        endDateInput.value = window.modalDefaults.endDate;
    }
    
    // Reset form mode
    document.getElementById('couponForm').dataset.mode = 'create';
    document.getElementById('couponForm').dataset.promotionId = '';
}

// Edit coupon
async function editCoupon(id) {
    try {
        const response = await fetch(`/api/promotions/seller/promotions/${id}`);
        const result = await response.json();

        if (result.success) {
            const promo = result.data;
            
            document.getElementById('couponModal').classList.add('show');
            document.querySelector('#couponModal h3').textContent = 'Edit Coupon';
            
            // Fill form with promotion data
            const form = document.getElementById('couponForm');
            form.dataset.mode = 'edit';
            form.dataset.promotionId = id;
            
            // Fill basic fields
            form.querySelector('[name="code"]').value = promo.code;
            form.querySelector('[name="description"]').value = promo.description;
            form.querySelector('[name="value"]').value = promo.value;
            form.querySelector('[name="minPurchase"]').value = promo.minPurchase;
            form.querySelector('[name="totalLimit"]').value = promo.totalLimit || '';
            form.querySelector('[name="customerLimit"]').value = promo.customerLimit;
            form.querySelector('[name="applyTo"]').value = promo.applyTo;
            
            // Set dates
            const formatDateForInput = (date) => {
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}`;
            };
            
            form.querySelector('[name="startDate"]').value = formatDateForInput(promo.startDate);
            form.querySelector('[name="endDate"]').value = formatDateForInput(promo.endDate);
            
            // Set discount type
            form.querySelector(`[name="type"][value="${promo.type}"]`).checked = true;
            
            // Update discount type UI
            updateDiscountTypeUI();
            
        } else {
            showNotification('Failed to load promotion details', 'error');
        }
    } catch (error) {
        console.error('Error loading promotion:', error);
        showNotification('Error loading promotion details', 'error');
    }
}

// Toggle coupon
async function toggleCoupon(id) {
    const promotion = promotions.find(p => p._id === id);
    if (!promotion) return;

    const action = promotion.currentStatus === 'active' ? 'pause' : 'activate';
    
    const result = await Swal.fire({
        title: `Are you sure?`,
        text: `Do you want to ${action} this promotion?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d4af37',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${action} it!`
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/promotions/seller/promotions/${id}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                showNotification(result.message, 'success');
                loadPromotions(currentPage);
            } else {
                showNotification(result.message || 'Failed to toggle promotion', 'error');
            }
        } catch (error) {
            console.error('Error toggling promotion:', error);
            showNotification('Error toggling promotion', 'error');
        }
    }
}

// Delete coupon
async function deleteCoupon(id) {
    const promotion = promotions.find(p => p._id === id);
    if (!promotion) return;

    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d4af37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch(`/api/promotions/seller/promotions/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                showNotification('Promotion deleted successfully', 'success');
                loadPromotions(currentPage);
            } else {
                showNotification(result.message || 'Failed to delete promotion', 'error');
            }
        } catch (error) {
            console.error('Error deleting promotion:', error);
            showNotification('Error deleting promotion', 'error');
        }
    }
}

// Save coupon
async function saveCoupon() {
    const form = document.getElementById('couponForm');
    const formData = new FormData(form);
    const mode = form.dataset.mode;
    const promotionId = form.dataset.promotionId;

    // Validate form
    if (!validateForm(formData)) {
        return;
    }

    const promotionData = {
        code: formData.get('code').toUpperCase(),
        description: formData.get('description'),
        type: formData.get('type'),
        value: parseFloat(formData.get('value')),
        minPurchase: parseFloat(formData.get('minPurchase')) || 0,
        totalLimit: formData.get('totalLimit') ? parseInt(formData.get('totalLimit')) : null,
        customerLimit: parseInt(formData.get('customerLimit')) || 1,
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        applyTo: formData.get('applyTo'),
        categories: [],
        products: []
    };

    try {
        const url = mode === 'edit' 
            ? `/api/promotions/seller/promotions/${promotionId}`
            : '/api/promotions/seller/promotions';
        
        const method = mode === 'edit' ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(promotionData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            closeModal();
            loadPromotions(currentPage);
        } else {
            showNotification(result.message || 'Failed to save promotion', 'error');
        }
    } catch (error) {
        console.error('Error saving promotion:', error);
        showNotification('Error saving promotion', 'error');
    }
}

// Validate form
function validateForm(formData) {
    const code = formData.get('code');
    const description = formData.get('description');
    const value = formData.get('value');
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');

    if (!code || !description || !value || !startDate || !endDate) {
        showNotification('Please fill in all required fields', 'error');
        return false;
    }

    if (code.length < 3) {
        showNotification('Coupon code must be at least 3 characters', 'error');
        return false;
    }

    if (parseFloat(value) <= 0) {
        showNotification('Discount value must be greater than 0', 'error');
        return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
        showNotification('End date must be after start date', 'error');
        return false;
    }

    return true;
}

// Filter promotions
function filterPromotions() {
    currentFilters.search = document.getElementById('searchInput').value;
    currentFilters.status = document.getElementById('statusFilter').value;
    currentFilters.type = document.getElementById('typeFilter').value;
    currentFilters.sortBy = document.getElementById('sortBy').value;
    
    currentPage = 1; // Reset to first page
    loadPromotions(currentPage);
}

// Update discount type UI
function updateDiscountTypeUI() {
    const typeInputs = document.querySelectorAll('[name="type"]');
    typeInputs.forEach(input => {
        const card = input.closest('label').querySelector('div');
        if (input.checked) {
            card.classList.add('peer-checked:border-gold', 'peer-checked:bg-gold/10');
        } else {
            card.classList.remove('peer-checked:border-gold', 'peer-checked:bg-gold/10');
        }
    });
}

// Close modal
function closeModal() {
    document.getElementById('couponModal').classList.remove('show');
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

// Show loading
function showLoading(show) {
    const container = document.getElementById('promotionsGrid');
    if (show) {
        container.innerHTML = `
            <div class="col-span-full flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
            </div>
        `;
    }
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

// Initialize on load
document.addEventListener('DOMContentLoaded', init);