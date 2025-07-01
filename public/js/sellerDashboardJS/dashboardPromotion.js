        // Mock promotions data
        const mockPromotions = [
            {
                id: 1,
                code: 'SUMMER24',
                description: 'Summer Sale - 25% off all items',
                type: 'percentage',
                value: 25,
                status: 'active',
                startDate: '2024-03-15',
                endDate: '2024-04-15',
                totalLimit: 1000,
                customerLimit: 1,
                usageCount: 342,
                minPurchase: 50,
                revenue: 8550,
                applyTo: 'All Products'
            },
            {
                id: 2,
                code: 'WELCOME10',
                description: 'New Customer - 10% off first order',
                type: 'percentage',
                value: 10,
                status: 'active',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                totalLimit: null,
                customerLimit: 1,
                usageCount: 156,
                minPurchase: 0,
                revenue: 3450,
                applyTo: 'All Products'
            },
            {
                id: 3,
                code: 'FREESHIP50',
                description: 'Free shipping on orders over $50',
                type: 'free-shipping',
                value: 0,
                status: 'active',
                startDate: '2024-03-01',
                endDate: '2024-03-31',
                totalLimit: 500,
                customerLimit: 3,
                usageCount: 423,
                minPurchase: 50,
                revenue: 12300,
                applyTo: 'All Products'
            },
            {
                id: 4,
                code: 'BOGO2024',
                description: 'Buy One Get One 50% off',
                type: 'bogo',
                value: 50,
                status: 'scheduled',
                startDate: '2024-04-01',
                endDate: '2024-04-07',
                totalLimit: 200,
                customerLimit: 2,
                usageCount: 0,
                minPurchase: 0,
                revenue: 0,
                applyTo: 'Accessories'
            },
            {
                id: 5,
                code: 'WINTER20',
                description: 'Winter clearance - 20% off',
                type: 'percentage',
                value: 20,
                status: 'expired',
                startDate: '2024-01-15',
                endDate: '2024-02-28',
                totalLimit: 1500,
                customerLimit: null,
                usageCount: 1387,
                minPurchase: 30,
                revenue: 28940,
                applyTo: 'Winter Collection'
            }
        ];

        // Initialize
        function init() {
            renderPromotions();
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

            // Filters
            document.getElementById('searchInput').addEventListener('input', filterPromotions);
            document.getElementById('statusFilter').addEventListener('change', filterPromotions);
            document.getElementById('typeFilter').addEventListener('change', filterPromotions);
            document.getElementById('sortBy').addEventListener('change', filterPromotions);

            // Form submission
            document.getElementById('couponForm').addEventListener('submit', (e) => {
                e.preventDefault();
                saveCoupon();
            });
        }

        // Render promotions
        function renderPromotions() {
            const container = document.getElementById('promotionsGrid');
            container.innerHTML = '';

            if (mockPromotions.length === 0) {
                document.getElementById('emptyState').classList.remove('hidden');
                return;
            }

            mockPromotions.forEach(promo => {
                const card = document.createElement('div');
                card.className = 'promo-card bg-cream rounded-xl border border-beige overflow-hidden';
                
                const isActive = promo.status === 'active';
                const isScheduled = promo.status === 'scheduled';
                const isExpired = promo.status === 'expired';
                
                const daysLeft = isActive ? Math.ceil((new Date(promo.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                const usagePercentage = promo.totalLimit ? (promo.usageCount / promo.totalLimit) * 100 : 0;
                
                card.innerHTML = `
                    <div class="bg-gradient-to-r from-gold to-velvra-gold-light p-6 text-charcoal">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h3 class="text-xl font-bold code-display">${promo.code}</h3>
                                <p class="text-sm opacity-80 mt-1">${promo.description}</p>
                            </div>
                            ${getStatusBadge(promo.status)}
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
                                    <p class="font-semibold">${promo.minPurchase}</p>
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
                                <span class="font-medium text-charcoal">${promo.applyTo}</span>
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
                                <p class="text-lg font-bold text-green-600">${promo.revenue.toLocaleString()}</p>
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="editCoupon(${promo.id})" class="p-2 text-gold hover:text-velvra-gold-dark">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="duplicateCoupon(${promo.id})" class="p-2 text-gray-700 hover:text-charcoal">
                                    <i class="fas fa-copy"></i>
                                </button>
                                ${!isExpired ? `
                                    <button onclick="toggleCoupon(${promo.id})" class="p-2 ${isActive ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}">
                                        <i class="fas fa-${isActive ? 'pause' : 'play'}"></i>
                                    </button>
                                ` : ''}
                                <button onclick="deleteCoupon(${promo.id})" class="p-2 text-red-500 hover:text-red-600">
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
        }

        // Edit coupon
        function editCoupon(id) {
            const promo = mockPromotions.find(p => p.id === id);
            if (promo) {
                document.getElementById('couponModal').classList.add('show');
                document.querySelector('#couponModal h3').textContent = 'Edit Coupon';
                // Pre-fill form
                document.querySelector('[name="code"]').value = promo.code;
                document.querySelector('[name="description"]').value = promo.description;
                // ... fill other fields
            }
        }

        // Duplicate coupon
        function duplicateCoupon(id) {
            const promo = mockPromotions.find(p => p.id === id);
            if (promo) {
                const newPromo = { ...promo, id: Date.now(), code: promo.code + '_COPY', usageCount: 0, revenue: 0 };
                mockPromotions.push(newPromo);
                renderPromotions();
                showNotification('Coupon duplicated successfully', 'success');
            }
        }

        // Toggle coupon
        function toggleCoupon(id) {
            const promo = mockPromotions.find(p => p.id === id);
            if (promo) {
                promo.status = promo.status === 'active' ? 'paused' : 'active';
                renderPromotions();
                showNotification(`Coupon ${promo.status === 'active' ? 'activated' : 'paused'}`, 'success');
            }
        }

        // Delete coupon
        function deleteCoupon(id) {
            if (confirm('Are you sure you want to delete this coupon?')) {
                const index = mockPromotions.findIndex(p => p.id === id);
                if (index > -1) {
                    mockPromotions.splice(index, 1);
                    renderPromotions();
                    showNotification('Coupon deleted successfully', 'success');
                }
            }
        }

        // Save coupon
        function saveCoupon() {
            const formData = new FormData(document.getElementById('couponForm'));
            const newPromo = {
                id: Date.now(),
                code: formData.get('code').toUpperCase(),
                description: formData.get('description'),
                type: formData.get('type'),
                value: parseInt(formData.get('value')),
                status: 'active',
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                totalLimit: formData.get('totalLimit') ? parseInt(formData.get('totalLimit')) : null,
                customerLimit: formData.get('customerLimit') ? parseInt(formData.get('customerLimit')) : null,
                usageCount: 0,
                minPurchase: parseInt(formData.get('minPurchase')) || 0,
                revenue: 0,
                applyTo: formData.get('applyTo')
            };
            
            mockPromotions.unshift(newPromo);
            renderPromotions();
            closeModal();
            showNotification('Coupon created successfully', 'success');
        }

        // Filter promotions
        function filterPromotions() {
            // Implementation for filtering
            renderPromotions();
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

        // Initialize on load
        init();