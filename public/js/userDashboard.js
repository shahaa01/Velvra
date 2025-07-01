// ==========================================
// VELVRA DASHBOARD - ESSENTIAL JS
// ==========================================

// Global State
let VelvraState = {
    user: {
        name: '',
        email: ''
    },
    orderActivity: []
};

// ==========================================
// MOBILE MENU FUNCTIONALITY
// ==========================================

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }
}

// ==========================================
// ORDER CHART INITIALIZATION
// ==========================================

function initOrderChart() {
    const ctx = document.getElementById('orderChart');
    if (!ctx) {
        console.log('Chart canvas not found');
        return;
    }

    try {
        // Parse order activity data from EJS
        const orderActivityData = window.orderActivityData || [];
        
        console.log('Order activity data:', orderActivityData); // Debug log
        console.log('Data type:', typeof orderActivityData);
        console.log('Data length:', orderActivityData.length);
        
        if (orderActivityData.length === 0) {
            console.log('No order activity data available');
            // Show message when no data
            ctx.parentElement.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <i class="fas fa-chart-line text-4xl text-stone mb-4"></i>
                        <p class="text-stone mb-2">No order data yet</p>
                        <p class="text-sm text-stone">Start shopping to see your order activity</p>
                    </div>
                </div>
            `;
            return;
        }

        // Ensure we have valid data structure
        if (!Array.isArray(orderActivityData) || orderActivityData.length === 0) {
            console.log('Invalid order activity data structure');
            ctx.parentElement.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <p class="text-stone">Invalid chart data</p>
                </div>
            `;
            return;
        }

        // Validate and clean the data
        const validData = orderActivityData.filter(item => {
            if (!item || typeof item !== 'object') {
                console.log('Invalid item:', item);
                return false;
            }
            if (!item._id || !item._id.month || !item._id.year) {
                console.log('Invalid item structure:', item);
                return false;
            }
            return true;
        });

        if (validData.length === 0) {
            console.log('No valid data after filtering');
            ctx.parentElement.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <p class="text-stone">No valid chart data</p>
                </div>
            `;
            return;
        }

        const labels = validData.map(item => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[item._id.month - 1]} ${item._id.year}`;
        });

        const orderCounts = validData.map(item => {
            const count = item.count || 0;
            console.log(`Item count for ${item._id?.month}/${item._id?.year}:`, count);
            return count;
        });

        console.log('Chart labels:', labels); // Debug log
        console.log('Chart data:', orderCounts); // Debug log
        console.log('Raw order activity data:', orderActivityData); // Debug log
        console.log('First item count:', orderActivityData[0]?.count); // Debug log
        console.log('First item total:', orderActivityData[0]?.total); // Debug log

        // Ensure we have at least some visible data
        const maxCount = Math.max(...orderCounts);
        if (maxCount === 0) {
            console.log('All counts are 0, using fallback data');
            // Use a small value to make the chart visible
            orderCounts[0] = 1;
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Orders',
                    data: orderCounts,
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#D4AF37',
                    pointBorderColor: '#D4AF37',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6B7280',
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    }
                }
            }
        });
        
        console.log('Chart initialized successfully');
    } catch (error) {
        console.error('Error initializing chart:', error);
        // Show fallback message
        ctx.parentElement.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <p class="text-stone">Chart data unavailable</p>
            </div>
        `;
    }
}

// ==========================================
// LOGOUT FUNCTIONALITY
// ==========================================

function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('hidden');
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', () => {
            logoutModal.classList.add('hidden');
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener('click', () => {
            window.location.href = '/auth/logout';
        });
    }

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && logoutModal) {
            logoutModal.classList.add('hidden');
        }
    });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function setUserData(userName, userEmail) {
    VelvraState.user.name = userName || '';
    VelvraState.user.email = userEmail || '';
}

function setOrderActivityData(data) {
    VelvraState.orderActivity = data || [];
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initOrderChart();
    initLogout();
    
    // Set user data from EJS
    const userName = document.querySelector('h2')?.textContent?.replace('Welcome back, ', '').replace('!', '') || '';
    setUserData(userName, '');
    
    // Set order activity data from EJS
    if (window.orderActivityData) {
        setOrderActivityData(window.orderActivityData);
    }
}); 