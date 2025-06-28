// ==========================================
// VELVRA DASHBOARD - ESSENTIAL JS
// ==========================================

// Global State
let VelvraState = {
    user: {
        name: '',
        email: ''
    },
    notifications: [],
    unreadCount: 0
};

// ==========================================
// DARK MODE IMPLEMENTATION
// ==========================================

function initDarkMode() {
    const darkModeBtn = document.getElementById('darkModeToggle');
    const html = document.documentElement;
    
    // Check saved preference
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        html.classList.add('dark');
    }
    
    darkModeBtn.addEventListener('click', () => {
        html.classList.toggle('dark');
        const isNowDark = html.classList.contains('dark');
        localStorage.setItem('darkMode', isNowDark);
        
        // Update icon
        const icon = darkModeBtn.querySelector('svg');
        if (isNowDark) {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>';
        } else {
            icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
        }
    });
}

// ==========================================
// GREETING UPDATE
// ==========================================

function updateGreeting() {
    const hour = new Date().getHours();
    const greetingEl = document.getElementById('greeting');
    let greeting = 'Good Morning';
    
    if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
    else if (hour >= 18) greeting = 'Good Evening';
    
    if (greetingEl) greetingEl.textContent = greeting;
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

function initNotifications() {
    const notifBtn = document.getElementById('notificationBtn');
    if (!notifBtn) return;
    
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNotificationModal();
    });
}

function showNotificationModal() {
    const notifications = VelvraState.notifications;
    const unreadCount = VelvraState.unreadCount;
    
    let content = `
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="font-playfair text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                <div class="flex items-center space-x-2">
                    ${unreadCount > 0 ? `<span class="px-2 py-1 bg-[#D4AF37] text-black text-xs font-bold rounded-full">${unreadCount} unread</span>` : ''}
                    <button onclick="closeModal()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
    `;
    
    if (notifications.length === 0) {
        content += `
            <div class="text-center py-8">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <p class="text-gray-500 dark:text-gray-400">No notifications yet</p>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">You'll see order updates here</p>
            </div>
        `;
    } else {
        content += `<div class="space-y-3 max-h-96 overflow-y-auto">`;
        
        notifications.forEach(notification => {
            const statusColor = getNotificationStatusColor(notification.orderStatus);
            const statusIcon = getNotificationStatusIcon(notification.orderStatus);
            
            content += `
                <div class="notification-item p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 ${statusColor} ${!notification.isRead ? 'border-l-[#D4AF37] bg-[#FEF7E0] dark:bg-gray-700' : 'border-l-gray-300'} transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" data-notification-id="${notification.id}">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0 mt-1">
                            ${statusIcon}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-700 dark:text-gray-300 ${!notification.isRead ? 'font-semibold' : ''}">${notification.message}</p>
                            <div class="flex items-center justify-between mt-2">
                                <p class="text-xs text-gray-500 dark:text-gray-400">${notification.daysAgo}</p>
                                ${!notification.isRead ? '<span class="w-2 h-2 bg-[#D4AF37] rounded-full"></span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        content += `</div>`;
    }
    
    content += `</div>`;
    
    createModal(content);
    
    // Add click handlers for notification items
    setTimeout(() => {
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const notificationId = item.dataset.notificationId;
                markNotificationAsRead(notificationId);
                item.classList.remove('border-l-[#D4AF37]', 'bg-[#FEF7E0]', 'dark:bg-gray-700');
                item.classList.add('border-l-gray-300');
                item.querySelector('p').classList.remove('font-semibold');
                const unreadDot = item.querySelector('.w-2.h-2');
                if (unreadDot) unreadDot.remove();
                
                // Update unread count
                VelvraState.unreadCount = Math.max(0, VelvraState.unreadCount - 1);
                updateNotificationBadge();
            });
        });
    }, 100);
}

function getNotificationStatusColor(status) {
    switch(status) {
        case 'pending': return 'border-l-amber-500';
        case 'confirmed': return 'border-l-blue-500';
        case 'processing': return 'border-l-amber-500';
        case 'shipped': return 'border-l-purple-500';
        case 'delivered': return 'border-l-emerald-500';
        case 'cancelled': return 'border-l-red-500';
        default: return 'border-l-gray-500';
    }
}

function getNotificationStatusIcon(status) {
    const baseClasses = 'w-5 h-5';
    let icon = '';
    
    switch(status) {
        case 'pending':
            icon = `<svg class="${baseClasses} text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
            break;
        case 'confirmed':
            icon = `<svg class="${baseClasses} text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`;
            break;
        case 'processing':
            icon = `<svg class="${baseClasses} text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>`;
            break;
        case 'shipped':
            icon = `<svg class="${baseClasses} text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>`;
            break;
        case 'delivered':
            icon = `<svg class="${baseClasses} text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>`;
            break;
        case 'cancelled':
            icon = `<svg class="${baseClasses} text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>`;
            break;
        default:
            icon = `<svg class="${baseClasses} text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>`;
    }
    
    return icon;
}

function markNotificationAsRead(notificationId) {
    // In a real app, you'd make an API call here
    // For now, we'll just update the local state
    const notification = VelvraState.notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.isRead = true;
    }
}

function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (VelvraState.unreadCount > 0) {
        if (badge) {
            badge.textContent = VelvraState.unreadCount;
        } else {
            const notifBtn = document.getElementById('notificationBtn');
            if (notifBtn) {
                const newBadge = document.createElement('span');
                newBadge.className = 'notification-badge';
                newBadge.textContent = VelvraState.unreadCount;
                notifBtn.appendChild(newBadge);
            }
        }
    } else {
        if (badge) {
            badge.remove();
        }
    }
}

// ==========================================
// ORDER ACTIONS
// ==========================================

function initOrderActions() {
    // Track order buttons
    document.querySelectorAll('[data-action="track-order"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const orderId = btn.dataset.orderId;
            showTrackOrderModal(orderId);
        });
    });

    // Rate product buttons
    document.querySelectorAll('[data-action="rate-product"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = btn.dataset.productId;
            const productName = btn.dataset.productName;
            showRatingModal(productId, productName);
        });
    });

    // Buy again buttons
    document.querySelectorAll('[data-action="buy-again"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = btn.dataset.productId;
            addToCart(productId);
        });
    });
}

function showTrackOrderModal(orderId) {
    // This would fetch order details and show tracking info
    const content = `
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="font-playfair text-2xl font-bold text-gray-900 dark:text-white">Track Order</h2>
                <button onclick="closeModal()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="text-center py-8">
                <p class="text-gray-600 dark:text-gray-400">Order tracking feature coming soon!</p>
            </div>
        </div>
    `;
    createModal(content);
}

function showRatingModal(productId, productName) {
    const content = `
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="font-playfair text-2xl font-bold text-gray-900 dark:text-white">Rate Product</h2>
                <button onclick="closeModal()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="text-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${productName}</h3>
                <div class="flex justify-center space-x-2 mb-6">
                    ${[1,2,3,4,5].map(i => `
                        <button onclick="this.parentElement.querySelectorAll('svg').forEach((s,idx) => s.classList.toggle('text-[#D4AF37]', idx < ${i}))" class="rating-star">
                            <svg class="w-8 h-8 text-gray-300 hover:text-[#D4AF37] transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                        </button>
                    `).join('')}
                </div>
                <button onclick="submitRating('${productId}')" class="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#B8941F] transition-colors">
                    Submit Rating
                </button>
            </div>
        </div>
    `;
    createModal(content);
}

function submitRating(productId) {
    // This would submit the rating to the backend
    showToast('Rating submitted successfully!', 'success');
    closeModal();
}

function addToCart(productId) {
    // This would add the product to cart
    showToast('Product added to cart!', 'success');
}

// ==========================================
// MODAL SYSTEM
// ==========================================

function createModal(content) {
    // Remove existing modal
    const existingModal = document.getElementById('modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            ${content}
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.remove();
    }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-semibold transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initDarkMode();
    updateGreeting();
    initOrderActions();
    initNotifications();
    
    // Update greeting every minute
    setInterval(updateGreeting, 60000);
    
    // Initialize floating action button
    const fabButton = document.getElementById('fabButton');
    if (fabButton) {
        fabButton.addEventListener('click', () => {
            showToast('Contact support feature coming soon!', 'info');
        });
    }
});

// ==========================================
// EXPORT FOR EJS INTEGRATION
// ==========================================

// Function to set notification data from EJS
function setNotificationData(notifications, unreadCount) {
    VelvraState.notifications = notifications || [];
    VelvraState.unreadCount = unreadCount || 0;
    updateNotificationBadge();
}

// Function to set user data from EJS
function setUserData(userName, userEmail) {
    VelvraState.user.name = userName || '';
    VelvraState.user.email = userEmail || '';
}

// Mobile menu toggle - updated to match userMessage.js pattern
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const closeSidebar = document.getElementById('closeSidebar');

// Only add mobile menu listeners if elements exist
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

// Logout modal
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const cancelLogout = document.getElementById('cancelLogout');
const confirmLogout = document.getElementById('confirmLogout');

logoutBtn.addEventListener('click', () => {
    logoutModal.classList.remove('hidden');
});

cancelLogout.addEventListener('click', () => {
    logoutModal.classList.add('hidden');
});

confirmLogout.addEventListener('click', () => {
    // Simulate logout
    window.location.href = '#logged-out';
});

// Order activity chart
const ctx = document.getElementById('orderChart').getContext('2d');
const orderChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Orders',
            data: [2, 3, 1, 4, 2, 3],
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#d4af37',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#1a1a1a',
                titleColor: '#d4af37',
                bodyColor: '#fff',
                borderColor: '#d4af37',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return context.parsed.y + ' orders';
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#a8a196',
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    color: '#a8a196',
                    font: {
                        size: 11
                    }
                },
                grid: {
                    color: '#e8dcc6',
                    drawBorder: false
                }
            }
        }
    }
});

// Add click handlers to quick cards
document.querySelectorAll('.quick-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
        if (!e.target.closest('span')) {
            // Navigate based on card content
            const text = card.querySelector('p').textContent;
            if (text.includes('Orders')) window.location.href = '/dashboard/orders';
            else if (text.includes('Wishlist')) window.location.href = '/dashboard/wishlist';
            else if (text.includes('Messages')) window.location.href = '/dashboard/messages';
        }
    });
}); 