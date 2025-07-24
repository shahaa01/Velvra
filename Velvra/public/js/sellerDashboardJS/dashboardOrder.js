// Global variables
let orders = [];
let stats = {};

// Initialize
function init() {
    // Load data from backend
    if (window.ordersData) {
        orders = window.ordersData;
        stats = window.statsData;
    }
    
    renderOrders();
    setupEventListeners();
    updateStats();
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            mobileMenuOverlay.classList.toggle('hidden');
        });
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            mobileMenuOverlay.classList.add('hidden');
        });
    }

    // Filters
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const sortBy = document.getElementById('sortBy');

    if (searchInput) searchInput.addEventListener('input', filterOrders);
    if (statusFilter) statusFilter.addEventListener('change', filterOrders);
    if (dateFilter) statusFilter.addEventListener('change', filterOrders);
    if (sortBy) sortBy.addEventListener('change', filterOrders);
}

// Update stats display
function updateStats() {
    // Stats are already updated from backend data
    console.log('Stats updated:', stats);
}

// Render orders
function renderOrders() {
    const container = document.getElementById('ordersList');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;

    container.innerHTML = '';

    if (orders.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    orders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card bg-cream rounded-xl border border-beige p-6 relative overflow-hidden cursor-pointer';
        card.onclick = () => viewOrder(order._id);
        
        card.innerHTML = `
            <div class="priority-indicator priority-${order.priority}"></div>
            
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                    <h3 class="text-lg font-semibold text-charcoal">${order.orderNumber}</h3>
                    <p class="text-sm text-gray-700">${formatDateTime(order.orderDate)}</p>
                </div>
                <div class="mt-2 sm:mt-0 sm:text-right">
                    ${getStatusBadge(order.status)}
                    <p class="text-lg font-bold text-charcoal mt-1">₹${order.total.toFixed(2)}</p>
                </div>
            </div>
            
            <div class="flex items-center mb-4">
                <img src="${order.customer.avatar}" alt="${order.customer.name}" class="w-10 h-10 rounded-full mr-3">
                <div>
                    <p class="font-medium text-charcoal">${order.customer.name}</p>
                    <p class="text-sm text-gray-700">${order.customer.email}</p>
                </div>
            </div>
            
            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-700 mb-4">
                <span><i class="fas fa-box mr-1"></i>${order.items.length} item${order.items.length > 1 ? 's' : ''}</span>
                <span><i class="fas fa-credit-card mr-1"></i>${order.paymentMethod}</span>
                ${order.trackingNumber ? `<span><i class="fas fa-shipping-fast mr-1"></i>${order.trackingNumber}</span>` : ''}
                ${order.notes ? '<span><i class="fas fa-sticky-note mr-1"></i>Has notes</span>' : ''}
            </div>
            
            <div class="flex items-center justify-between">
                <div class="flex -space-x-2">
                    ${order.items.slice(0, 3).map(item => `
                        <img src="${item.image}" alt="${item.name}" class="w-8 h-8 rounded-full border-2 border-cream">
                    `).join('')}
                    ${order.items.length > 3 ? `
                        <div class="w-8 h-8 rounded-full bg-beige border-2 border-cream flex items-center justify-center text-xs font-medium text-charcoal">
                            +${order.items.length - 3}
                        </div>
                    ` : ''}
                </div>
                <div class="flex space-x-2">
                    ${order.status === 'pending' ? `
                        <button onclick="event.stopPropagation(); updateOrderStatus('${order._id}', 'processing')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600">
                            Process
                        </button>
                    ` : ''}
                    ${order.status === 'processing' ? `
                        <button onclick="event.stopPropagation(); showShippingModal('${order._id}')" 
                                class="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs hover:bg-purple-600">
                            Ship
                        </button>
                    ` : ''}
                    ${['pending', 'processing'].includes(order.status) ? `
                        <button onclick="event.stopPropagation(); cancelOrder('${order._id}')" 
                                class="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// View order details
async function viewOrder(orderId) {
    try {
        const response = await fetch(`/seller-dashboard/api/orders/${orderId}`);
        const result = await response.json();
        
        if (result.success) {
            showOrderModal(result.order);
        } else {
            showNotification('Failed to load order details', 'error');
        }
    } catch (error) {
        console.error('Error fetching order details:', error);
        showNotification('Failed to load order details', 'error');
    }
}

// Show order modal
async function showOrderModal(order) {
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) return;

    // Compose shipping address string
    let shippingAddress = '';
    if (order.shippingAddress && typeof order.shippingAddress === 'object') {
        shippingAddress = `${order.shippingAddress.name}, ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`;
    } else {
        shippingAddress = order.shippingAddress || '';
    }

    // Timeline steps
    let timeline = `
        <div class="timeline-item">
            <p class="font-medium text-charcoal">Order Placed</p>
            <p class="text-sm text-stone">${formatDateTime(order.orderDate)}</p>
        </div>
    `;
    if (["processing", "shipped", "delivered"].includes(order.status)) {
        timeline += `
            <div class="timeline-item">
                <p class="font-medium text-charcoal">Processing Started</p>
                <p class="text-sm text-stone">Order is being prepared</p>
            </div>
        `;
    }
    if (["shipped", "delivered"].includes(order.status)) {
        timeline += `
            <div class="timeline-item">
                <p class="font-medium text-charcoal">Order Shipped</p>
                <p class="text-sm text-stone">Tracking: ${order.trackingNumber || 'N/A'}</p>
            </div>
        `;
    }
    if (order.status === "delivered") {
        timeline += `
            <div class="timeline-item">
                <p class="font-medium text-charcoal">Order Delivered</p>
                <p class="text-sm text-stone">${order.deliveryDate ? formatDate(order.deliveryDate) : ''}</p>
            </div>
        `;
    }
    if (order.status === "cancelled") {
        timeline += `
            <div class="timeline-item">
                <p class="font-medium text-red-600">Order Cancelled</p>
                <p class="text-sm text-stone">${order.cancellationReason ? 'Reason: ' + order.cancellationReason : ''}</p>
            </div>
        `;
    }

    // Action buttons (no inline onclicks, use data-action/data-id)
    let actions = '';
    if (order.status === 'pending') {
        actions += `<button data-action="processing" data-id="${order._id}" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"><i class="fas fa-box-open mr-2"></i>Start Processing</button>`;
    }
    if (order.status === 'processing') {
        actions += `<button data-action="shipped" data-id="${order._id}" class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"><i class="fas fa-truck mr-2"></i>Mark as Shipped</button>`;
    }
    if (order.status === 'shipped') {
        actions += `<button data-action="delivered" data-id="${order._id}" class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"><i class="fas fa-check-circle mr-2"></i>Mark as Delivered</button>`;
    }
    actions += `<button data-action="print" data-id="${order._id}" class="w-full bg-beige text-charcoal py-2 rounded-lg hover:bg-stone hover:text-pearl"><i class="fas fa-print mr-2"></i>Print Invoice</button>`;
    actions += `<button data-action="contact" data-id="${order._id}" class="w-full border border-beige text-charcoal py-2 rounded-lg hover:bg-cream"><i class="fas fa-envelope mr-2"></i>Contact Customer</button>`;
    if (order.status !== 'delivered' && order.status !== 'cancelled') {
        actions += `<button data-action="cancel" data-id="${order._id}" class="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"><i class="fas fa-times-circle mr-2"></i>Cancel Order</button>`;
    }

    modalContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Order Info -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Header -->
                <div class="bg-cream rounded-lg p-6 border border-beige">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h4 class="text-xl font-bold text-charcoal">${order.orderNumber}</h4>
                            <p class="text-stone">Placed on ${formatDateTime(order.orderDate)}</p>
                        </div>
                        ${getStatusBadge(order.status)}
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-stone">Payment Method</p>
                            <p class="font-medium text-charcoal">${order.paymentMethod}</p>
                        </div>
                        <div>
                            <p class="text-sm text-stone">Payment Status</p>
                            <p class="font-medium text-green-600">${order.paymentStatus}</p>
                        </div>
                        ${order.trackingNumber ? `
                            <div>
                                <p class="text-sm text-stone">Tracking Number</p>
                                <p class="font-medium text-charcoal">${order.trackingNumber}</p>
                            </div>
                        ` : ''}
                        ${order.deliveryDate ? `
                            <div>
                                <p class="text-sm text-stone">Delivered On</p>
                                <p class="font-medium text-charcoal">${formatDate(order.deliveryDate)}</p>
                            </div>
                        ` : ''}
                    </div>
                    ${order.notes ? `
                        <div class="mt-4 p-3 bg-pearl rounded-lg border border-gold/30">
                            <p class="text-sm font-medium text-charcoal mb-1">Customer Notes:</p>
                            <p class="text-sm text-stone">${order.notes}</p>
                        </div>
                    ` : ''}
                </div>
                <!-- Order Items -->
                <div class="bg-cream rounded-lg border border-beige overflow-hidden">
                    <div class="px-6 py-4 border-b border-beige">
                        <h5 class="font-semibold text-charcoal">Order Items</h5>
                    </div>
                    <div class="divide-y divide-beige">
                        ${order.items.map(item => `
                            <div class="p-4 flex items-center justify-between">
                                <div class="flex items-center">
                                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-lg object-cover mr-4">
                                    <div>
                                        <p class="font-medium text-charcoal">${item.name}</p>
                                        <p class="text-sm text-stone">Qty: ${item.quantity}</p>
                                    </div>
                                </div>
                                <p class="font-semibold text-charcoal">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="px-6 py-4 bg-beige/30 border-t border-beige">
                        <div class="flex items-center justify-between text-lg font-semibold">
                            <span>Total</span>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <!-- Order Timeline -->
                <div class="bg-cream rounded-lg border border-beige p-6">
                    <h5 class="font-semibold text-charcoal mb-4">Order Timeline</h5>
                    <div class="space-y-1">${timeline}</div>
                </div>
            </div>
            <!-- Customer & Actions -->
            <div class="space-y-6">
                <!-- Customer Info -->
                <div class="bg-cream rounded-lg border border-beige p-6">
                    <h5 class="font-semibold text-charcoal mb-4">Customer Information</h5>
                    <div class="flex items-center mb-4">
                        <img src="${order.customer.avatar}" alt="${order.customer.name}" class="w-12 h-12 rounded-full mr-3">
                        <div>
                            <p class="font-medium text-charcoal">${order.customer.name}</p>
                            <p class="text-sm text-stone">${order.customer.email}</p>
                        </div>
                    </div>
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center text-stone">
                            <i class="fas fa-phone w-4 mr-2"></i>
                            <span>${order.customer.phone}</span>
                        </div>
                        <div class="flex items-start text-stone">
                            <i class="fas fa-map-marker-alt w-4 mr-2 mt-0.5"></i>
                            <span>${shippingAddress}</span>
                        </div>
                    </div>
                </div>
                <!-- Actions -->
                <div class="bg-cream rounded-lg border border-beige p-6">
                    <h5 class="font-semibold text-charcoal mb-4">Actions</h5>
                    <div class="space-y-3">${actions}</div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('orderModal').classList.add('show');

    // Remove any previous click handler
    if (modalContent._modalHandler) {
        modalContent.removeEventListener('click', modalContent._modalHandler);
    }
    // Attach event delegation for modal actions
    modalContent._modalHandler = async function(e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        if (!action || !id) return;
        if (action === 'processing') {
            await updateOrderStatus(id, 'processing');
            // Fetch updated order and re-render modal
            const response = await fetch(`/seller-dashboard/api/orders/${id}`);
            const result = await response.json();
            if (result.success) showOrderModal(result.order);
        } else if (action === 'shipped') {
            // Mark as shipped: prompt for tracking, update backend shipping info and status, then refresh modal
            const { value: trackingNumber } = await Swal.fire({
                title: 'Enter Tracking Number',
                input: 'text',
                inputLabel: 'Tracking Number',
                inputPlaceholder: 'Enter tracking number',
                showCancelButton: true,
                confirmButtonText: 'Mark as Shipped',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Tracking number is required!';
                    }
                }
            });
            if (trackingNumber) {
                await updateShippingAndStatus(id, trackingNumber);
                // Fetch updated order and re-render modal
                const response = await fetch(`/seller-dashboard/api/orders/${id}`);
                const result = await response.json();
                if (result.success) showOrderModal(result.order);
            }
        } else if (action === 'delivered') {
            // Mark as delivered: update backend, then refresh modal with new order data
            await updateOrderStatus(id, 'delivered');
            // Update local orders array
            const orderIndex = orders.findIndex(o => o._id === id);
            if (orderIndex !== -1) {
                orders[orderIndex].status = 'delivered';
            }
            const response = await fetch(`/seller-dashboard/api/orders/${id}`);
            const result = await response.json();
            if (result.success) showOrderModal(result.order);
        } else if (action === 'cancel') {
            await cancelOrder(id);
        } else if (action === 'print') {
            printOrder(id);
        } else if (action === 'contact') {
            contactCustomer(id);
        }
    };
    modalContent.addEventListener('click', modalContent._modalHandler);
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/seller-dashboard/api/orders/${orderId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();
        
        if (result.success) {
            // Update local order data
            const orderIndex = orders.findIndex(o => o._id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex].status = newStatus;
                renderOrders();
            }
            showNotification('Order status updated successfully', 'success');
        } else {
            showNotification(result.error || 'Failed to update order status', 'error');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Failed to update order status', 'error');
    }
}

// Show shipping modal
function showShippingModal(orderId) {
    const trackingNumber = prompt('Enter tracking number:');
    if (trackingNumber) {
        updateShippingInfo(orderId, trackingNumber);
    }
}

// Update shipping information
async function updateShippingInfo(orderId, trackingNumber) {
    try {
        const response = await fetch(`/seller-dashboard/api/orders/${orderId}/shipping`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                trackingNumber: trackingNumber,
                deliveryDate: new Date().toISOString().split('T')[0]
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Update local order data
            const orderIndex = orders.findIndex(o => o._id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex].trackingNumber = trackingNumber;
                orders[orderIndex].status = 'shipped';
                renderOrders();
            }
            showNotification('Shipping information updated successfully', 'success');
        } else {
            showNotification(result.error || 'Failed to update shipping information', 'error');
        }
    } catch (error) {
        console.error('Error updating shipping info:', error);
        showNotification('Failed to update shipping information', 'error');
    }
}

// Mark as shipped with SweetAlert2 for tracking number
async function markAsShipped(orderId) {
    const { value: trackingNumber } = await Swal.fire({
        title: 'Enter Tracking Number',
        input: 'text',
        inputLabel: 'Tracking Number',
        inputPlaceholder: 'Enter tracking number',
        showCancelButton: true,
        confirmButtonText: 'Mark as Shipped',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
            if (!value) {
                return 'Tracking number is required!';
            }
        }
    });
    if (trackingNumber) {
        await updateShippingInfo(orderId, trackingNumber);
        // Refresh modal with updated order
        const response = await fetch(`/seller-dashboard/api/orders/${orderId}`);
        const result = await response.json();
        if (result.success) showOrderModal(result.order);
    }
}

// Override cancelOrder to use SweetAlert2 for confirmation and reason
async function cancelOrder(orderId) {
    const { value: reason } = await Swal.fire({
        title: 'Cancel Order',
        input: 'text',
        inputLabel: 'Reason for cancellation',
        inputPlaceholder: 'Enter reason',
        showCancelButton: true,
        confirmButtonText: 'Cancel Order',
        cancelButtonText: 'Back',
        inputValidator: (value) => {
            if (!value) {
                return 'Reason is required!';
            }
        }
    });
    if (!reason) return;
    try {
        const response = await fetch(`/seller-dashboard/api/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason: reason })
        });
        const result = await response.json();
        if (result.success) {
            showNotification('Order cancelled successfully', 'success');
            // Refresh modal with updated order
            const orderRes = await fetch(`/seller-dashboard/api/orders/${orderId}`);
            const orderResult = await orderRes.json();
            if (orderResult.success) showOrderModal(orderResult.order);
            // Optionally, refresh the main order list
            filterOrders();
        } else {
            showNotification(result.error || 'Failed to cancel order', 'error');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification('Failed to cancel order', 'error');
    }
}

// Filter orders
async function filterOrders() {
    const searchTerm = document.getElementById('searchInput')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const dateFilter = document.getElementById('dateFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || '';

    try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        if (dateFilter) params.append('dateFilter', dateFilter);
        if (sortBy) params.append('sortBy', sortBy);

        const response = await fetch(`/seller-dashboard/api/orders?${params.toString()}`);
        const result = await response.json();
        
        if (result.success) {
            orders = result.orders;
            renderOrders();
        } else {
            showNotification('Failed to filter orders', 'error');
        }
    } catch (error) {
        console.error('Error filtering orders:', error);
        showNotification('Failed to filter orders', 'error');
    }
}

// Utility functions
function formatDateTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusBadge(status) {
    const statusConfig = {
        'pending': { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
        'processing': { class: 'bg-blue-100 text-blue-800', text: 'Processing' },
        'shipped': { class: 'bg-purple-100 text-purple-800', text: 'Shipped' },
        'delivered': { class: 'bg-green-100 text-green-800', text: 'Delivered' },
        'cancelled': { class: 'bg-red-100 text-red-800', text: 'Cancelled' },
        'returned': { class: 'bg-gray-100 text-gray-800', text: 'Returned' }
    };

    const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', text: status };
    
    return `<span class="text-xs px-2 py-1 rounded-full ${config.class}">${config.text}</span>`;
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showNotification(message, type = 'info') {
    // Simple notification - you can enhance this with a proper notification system
    alert(`${type.toUpperCase()}: ${message}`);
}

function printOrder(orderId) {
    // Implement print functionality
    window.open(`/seller-dashboard/api/orders/${orderId}/print`, '_blank');
}

function contactCustomer(orderId) {
    // Implement contact functionality - could open email or messaging system
    const order = orders.find(o => o._id === orderId);
    if (order) {
        window.open(`mailto:${order.customer.email}?subject=Order ${order.orderNumber}`, '_blank');
    }
}

// Add this helper function after updateOrderStatus
async function updateShippingAndStatus(orderId, trackingNumber) {
    try {
        // 1. Update shipping info (tracking number)
        const shippingRes = await fetch(`/seller-dashboard/api/orders/${orderId}/shipping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackingNumber })
        });
        const shippingResult = await shippingRes.json();
        if (!shippingResult.success) {
            showNotification(shippingResult.error || 'Failed to update shipping info', 'error');
            return;
        }
        // 2. Update status to 'shipped'
        await updateOrderStatus(orderId, 'shipped');
        // 3. Update local orders array
        const orderIndex = orders.findIndex(o => o._id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].trackingNumber = trackingNumber;
            orders[orderIndex].status = 'shipped';
        }
        showNotification('Order marked as shipped', 'success');
    } catch (error) {
        showNotification('Failed to mark as shipped', 'error');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);