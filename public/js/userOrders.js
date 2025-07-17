// User Orders JavaScript - Real Backend Integration

// Global state
let VelvraState = {
    orders: [],
    stats: {},
    currentFilter: 'all'
};

// DOM elements
const ordersList = document.getElementById('ordersList');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const notification = document.getElementById('notification');
const logoutModal = document.getElementById('logoutModal');
const trackingModal = document.getElementById('trackingModal');
const sellerSelectionModal = document.getElementById('sellerSelectionModal');

// Mobile menu functionality
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');

// Initialize mobile menu
function initMobileMenu() {
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            sidebarOverlay.classList.toggle('hidden');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });

        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.add('-translate-x-full');
                sidebarOverlay.classList.add('hidden');
            });
        }
    }
}

// Initialize filter functionality
function initFilters() {
    document.querySelectorAll('.filter-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            updateFilterUI(filter);
            filterOrders(filter);
        });
    });
}

// Update filter UI
function updateFilterUI(activeFilter) {
    document.querySelectorAll('.filter-tab').forEach(btn => {
        const filter = btn.dataset.filter;
        if (filter === activeFilter) {
            btn.classList.add('bg-gold', 'text-charcoal');
            btn.classList.remove('text-stone', 'bg-cream', 'border', 'border-beige');
        } else {
            btn.classList.remove('bg-gold', 'text-charcoal');
            btn.classList.add('text-stone', 'bg-cream', 'border', 'border-beige');
        }
    });
}

// Real backend filtering
function filterOrders(filter) {
    VelvraState.currentFilter = filter;
    
    if (filter === 'all') {
        showAllOrders();
    } else {
        showFilteredOrders(filter);
    }
}

// Show all orders
function showAllOrders() {
    const orderCards = document.querySelectorAll('.order-card');
    orderCards.forEach(card => {
        card.style.display = 'block';
    });
    
    if (orderCards.length === 0) {
        showEmptyState('all');
    } else {
        hideEmptyState();
    }
}

// Show filtered orders
function showFilteredOrders(filter) {
    const orderCards = document.querySelectorAll('.order-card');
    let visibleCount = 0;
    
    orderCards.forEach(card => {
        const statusElement = card.querySelector('span');
        const orderStatus = statusElement.textContent.toLowerCase().trim();
        
        if (orderStatus === filter) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (visibleCount === 0) {
        showEmptyState(filter);
    } else {
        hideEmptyState();
    }
}

// Show empty state
function showEmptyState(filter) {
    const emptyState = document.getElementById('emptyState');
    const title = emptyState.querySelector('h3');
    const description = emptyState.querySelector('p');
    
    title.textContent = `No ${filter} orders found`;
    description.textContent = filter === 'all' ? 
        "Looks like you haven't placed any orders yet." : 
        `You don't have any ${filter} orders.`;
    
    emptyState.classList.remove('hidden');
}

// Hide empty state
function hideEmptyState() {
    const emptyState = document.getElementById('emptyState');
    emptyState.classList.add('hidden');
}

// Real tracking functionality
async function showTrackingModal(orderId) {
    try {
        showLoadingState();
        
        const response = await fetch(`/dashboard/orders/${orderId}/tracking`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch tracking data');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayTrackingData(data.tracking, data.order);
        } else {
            throw new Error(data.error || 'Failed to load tracking data');
        }
        
    } catch (error) {
        console.error('Tracking error:', error);
        showNotification('Failed to load tracking data', 'error');
    } finally {
        hideLoadingState();
    }
}

// Display tracking data
function displayTrackingData(trackingSteps, order) {
    const trackingContent = document.getElementById('trackingContent');
    
    let trackingHTML = `
        <div class="mb-4 p-3 bg-pearl rounded-lg">
            <h4 class="font-semibold text-charcoal">Order #${order.orderNumber}</h4>
            <p class="text-sm text-stone">Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
        </div>
        <div class="space-y-4">
    `;
    
    trackingSteps.forEach((step, index) => {
        const isLast = index === trackingSteps.length - 1;
        const statusColor = step.status === 'completed' ? 'bg-green-500' : 
                           step.status === 'current' ? 'bg-blue-500' : 
                           step.status === 'cancelled' ? 'bg-red-500' : 'bg-stone';
        
        const statusText = step.status === 'completed' ? 'Completed' : 
                          step.status === 'current' ? 'In Progress' : 
                          step.status === 'cancelled' ? 'Cancelled' : 'Pending';
        
        const timestamp = new Date(step.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        trackingHTML += `
            <div class="flex items-start space-x-3">
                <div class="w-3 h-3 ${statusColor} rounded-full mt-2"></div>
                <div class="flex-1">
                    <p class="font-medium text-charcoal">${step.step}</p>
                    <p class="text-sm text-stone">${step.description}</p>
                    <p class="text-xs text-stone mt-1">${timestamp}</p>
                    ${isLast ? `<p class="text-xs text-${step.status === 'cancelled' ? 'red' : 'green'}-600 font-medium mt-1">${statusText}</p>` : ''}
                </div>
            </div>
            ${!isLast ? '<div class="border-l-2 border-stone ml-1.5 h-6"></div>' : ''}
        `;
    });
    
    trackingHTML += '</div>';
    trackingContent.innerHTML = trackingHTML;
    trackingModal.classList.remove('hidden');
}

// Seller selection functionality
async function showSellerSelectionModal(orderId) {
    try {
        showLoadingState();
        
        // Fetch order details to get seller information
        const response = await fetch(`/dashboard/orders/${orderId}/sellers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch order sellers');
        }
        
        const data = await response.json();
        
        if (data.success) {
            const sellers = data.sellers;
            
            // Filter out sellers with null IDs
            const validSellers = sellers.filter(seller => seller.id && seller.id !== 'null' && seller.id !== null);
            
            if (validSellers.length === 0) {
                // No valid sellers found
                showNotification('No seller information available for this order. Please contact support.', 'error');
                return;
            }
            
            // Remove duplicates based on seller ID
            const uniqueSellers = validSellers.filter((seller, index, self) => 
                seller.id && seller.id !== 'null' && seller.id !== null &&
                index === self.findIndex(s => s.id === seller.id)
            );
            
            if (uniqueSellers.length === 1) {
                // Only one seller, redirect directly
                const seller = uniqueSellers[0];
                window.location.href = `/dashboard/messages?order=${orderId}&seller=${seller.id}`;
                return;
            }
            
            // Multiple sellers, show selection modal
            const sellerOptions = document.getElementById('sellerOptions');
            sellerOptions.innerHTML = uniqueSellers.map(seller => `
                <button onclick="contactSeller('${orderId}', '${seller.id}')" 
                        class="w-full p-4 bg-pearl border border-beige rounded-lg hover:bg-cream transition-colors text-left">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-medium text-charcoal">${seller.name}</h4>
                            <p class="text-sm text-stone">${seller.productName}</p>
                        </div>
                        <i class="fas fa-chevron-right text-stone"></i>
                    </div>
                </button>
            `).join('');
            
            sellerSelectionModal.classList.remove('hidden');
        } else {
            throw new Error(data.error || 'Failed to load sellers');
        }
        
    } catch (error) {
        console.error('Seller selection error:', error);
        showNotification('Failed to load seller information', 'error');
    } finally {
        hideLoadingState();
    }
}

// Contact specific seller
// This will redirect to the messages page where the backend will:
// 1. Check if a conversation already exists between user and seller
// 2. If exists, redirect to that conversation (may update order reference)
// 3. If not exists, create a new conversation
function contactSeller(orderId, sellerId) {
    window.location.href = `/dashboard/messages?order=${orderId}&seller=${sellerId}`;
}

// Modal management
function initModals() {
    // Close tracking modal
    document.getElementById('closeTracking')?.addEventListener('click', () => {
        trackingModal.classList.add('hidden');
    });
    
    // Close seller selection modal
    document.getElementById('closeSellerSelection')?.addEventListener('click', () => {
        sellerSelectionModal.classList.add('hidden');
    });
    
    // Logout modal
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
    });
    
    document.getElementById('cancelLogout')?.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
    });
    
    document.getElementById('confirmLogout')?.addEventListener('click', () => {
        window.location.href = '/logout';
    });
    
    // Close modals on overlay click
    trackingModal?.addEventListener('click', (e) => {
        if (e.target === trackingModal) {
            trackingModal.classList.add('hidden');
        }
    });
    
    sellerSelectionModal?.addEventListener('click', (e) => {
        if (e.target === sellerSelectionModal) {
            sellerSelectionModal.classList.add('hidden');
        }
    });
    
    logoutModal?.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.classList.add('hidden');
        }
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            trackingModal.classList.add('hidden');
            sellerSelectionModal.classList.add('hidden');
            logoutModal.classList.add('hidden');
        }
    });
}

// Loading state management
function showLoadingState() {
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
}

function hideLoadingState() {
    if (loadingState) {
        loadingState.classList.add('hidden');
    }
}

// Notification system
function showNotification(message, type = 'success') {
    // Create a toast notification dynamically
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white text-sm font-medium ${bgColor} shadow-lg transition-all duration-300 opacity-0 translate-x-full`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-x-full');
    });
    
    // Animate out and remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Initialize order action handlers
function initOrderActions() {
    // Track order buttons
    document.querySelectorAll('[href*="Track Order"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const orderId = btn.getAttribute('href').split('/').pop();
            showTrackingModal(orderId);
        });
    });
    
    // Note: Contact Seller buttons now directly link to messages page
    // No need to intercept them anymore
}

// Cancel Order functionality
async function cancelOrder(orderId) {
    try {
        // Show confirmation dialog using SweetAlert
        const result = await Swal.fire({
            title: 'Cancel Order?',
            text: 'Are you sure you want to cancel this order? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Cancel Order',
            cancelButtonText: 'Keep Order',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            reverseButtons: true
        });

        if (!result.isConfirmed) {
            return;
        }

        // Show loading state
        showLoadingState();
        const cancelBtn = document.getElementById(`cancelBtn-${orderId}`);
        if (cancelBtn) {
            cancelBtn.disabled = true;
            cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cancelling...';
        }

        // Send cancel request to backend
        const response = await fetch(`/dashboard/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to cancel order');
        }

        const data = await response.json();

        if (data.success) {
            // Update UI immediately
            updateOrderStatusInDOM(orderId, 'cancelled');
            
            // Show success message
            await Swal.fire({
                title: 'Order Cancelled!',
                text: 'Your order has been successfully cancelled. Thank You!',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#059669'
            });
            
            showNotification('Order cancelled successfully', 'success');
        } else {
            throw new Error(data.message || 'Failed to cancel order');
        }

    } catch (error) {
        console.error('Error cancelling order:', error);
        
        // Reset button state
        const cancelBtn = document.getElementById(`cancelBtn-${orderId}`);
        if (cancelBtn) {
            cancelBtn.disabled = false;
            cancelBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Cancel Order';
        }
        
        // Show error message
        await Swal.fire({
            title: 'Cancellation Failed',
            text: error.message || 'Unable to cancel the order. Please try again or contact support.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc2626'
        });
        
        showNotification('Failed to cancel order', 'error');
    } finally {
        hideLoadingState();
    }
}

// Update order status in DOM without page reload
function updateOrderStatusInDOM(orderId, newStatus) {
    try {
        // Find the order card
        const orderCards = document.querySelectorAll('.order-card');
        
        orderCards.forEach(card => {
            const detailsLink = card.querySelector(`a[href*="/dashboard/orders/${orderId}"]`);
            if (detailsLink) {
                // Update status badge - find it more specifically
                const statusBadges = card.querySelectorAll('span');
                let statusBadge = null;
                
                // Look for the status badge by checking for typical status text patterns
                statusBadges.forEach(span => {
                    const text = span.textContent.toLowerCase();
                    if (text.includes('pending') || text.includes('processing') || 
                        text.includes('shipped') || text.includes('delivered') || 
                        text.includes('cancelled') || text.includes('returned')) {
                        statusBadge = span;
                    }
                });
                
                if (statusBadge) {
                    statusBadge.className = 'mt-2 sm:mt-0 inline-block px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700';
                    statusBadge.textContent = 'Cancelled';
                }
                
                // Hide cancel button
                const cancelBtn = card.querySelector(`#cancelBtn-${orderId}`);
                if (cancelBtn) {
                    cancelBtn.style.display = 'none';
                }
                
                // Hide track order button if exists
                const trackBtn = card.querySelector(`button[onclick*="showTrackingModal('${orderId}')"]`);
                if (trackBtn) {
                    trackBtn.style.display = 'none';
                }
                
                // Add cancelled message
                const actionsDiv = card.querySelector('.flex.flex-wrap.gap-2');
                if (actionsDiv) {
                    const existingCancelledMsg = actionsDiv.querySelector('.cancelled-message');
                    if (!existingCancelledMsg) {
                        const cancelledMsg = document.createElement('span');
                        cancelledMsg.className = 'cancelled-message px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200';
                        cancelledMsg.innerHTML = '<i class="fas fa-times-circle mr-2"></i>Order Cancelled';
                        actionsDiv.appendChild(cancelledMsg);
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error updating DOM:', error);
        // Don't throw the error, just log it to prevent breaking the flow
    }
}


// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initFilters();
    initModals();
    initOrderActions();
    
    // Set initial filter
    updateFilterUI('all');
});
