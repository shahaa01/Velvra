// Wishlist Management Class
class WishlistManager {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'recent';
        this.wishlistItems = [];
        this.isLoading = false;
        
        this.initializeElements();
        this.initializeEventListeners();
        this.loadWishlistData();
    }

    initializeElements() {
        this.wishlistGrid = document.getElementById('wishlistGrid');
        this.wishlistCount = document.getElementById('wishlistCount');
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        this.logoutModal = document.getElementById('logoutModal');
        
        // Mobile menu elements
        this.menuToggle = document.getElementById('menuToggle');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.closeSidebar = document.getElementById('closeSidebar');
    }

    initializeEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.filter;
                this.updateFilterButtons();
                this.loadWishlistData();
            });
        });

        // Sort select
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadWishlistData();
            });
        }

        // Mobile menu
        if (this.menuToggle && this.sidebar && this.sidebarOverlay) {
            this.menuToggle.addEventListener('click', () => {
                this.sidebar.classList.toggle('-translate-x-full');
                this.sidebarOverlay.classList.toggle('hidden');
            });

            this.sidebarOverlay.addEventListener('click', () => {
                this.sidebar.classList.add('-translate-x-full');
                this.sidebarOverlay.classList.add('hidden');
            });

            if (this.closeSidebar) {
                this.closeSidebar.addEventListener('click', () => {
                    this.sidebar.classList.add('-translate-x-full');
                    this.sidebarOverlay.classList.add('hidden');
        });
    }
}

        // Logout modal
        const logoutBtn = document.getElementById('logoutBtn');
        const cancelLogout = document.getElementById('cancelLogout');
        const confirmLogout = document.getElementById('confirmLogout');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logoutModal.classList.remove('hidden');
            });
        }

        if (cancelLogout) {
            cancelLogout.addEventListener('click', () => {
                this.logoutModal.classList.add('hidden');
            });
        }

        if (confirmLogout) {
            confirmLogout.addEventListener('click', () => {
                window.location.href = '/auth/logout';
            });
        }

        // Close modal on overlay click
        if (this.logoutModal) {
            this.logoutModal.addEventListener('click', (e) => {
                if (e.target === this.logoutModal) {
                    this.logoutModal.classList.add('hidden');
                }
            });
        }
    }

    updateFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.filter === this.currentFilter) {
            btn.classList.add('bg-gold', 'text-charcoal');
            btn.classList.remove('text-stone', 'bg-cream', 'border', 'border-beige');
        } else {
            btn.classList.remove('bg-gold', 'text-charcoal');
            btn.classList.add('text-stone', 'bg-cream', 'border', 'border-beige');
        }
    });
}

    async loadWishlistData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const response = await fetch(`/dashboard/wishlist/data?filter=${this.currentFilter}&sort=${this.currentSort}`);
            const data = await response.json();

            if (data.success) {
                this.wishlistItems = data.products;
                this.updateWishlistCount(data.count);
                this.renderWishlist();
            } else {
                console.error('Failed to load wishlist data');
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading wishlist data:', error);
            this.showEmptyState();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    showLoading() {
        if (this.loadingState) this.loadingState.classList.remove('hidden');
        if (this.wishlistGrid) this.wishlistGrid.classList.add('hidden');
        if (this.emptyState) this.emptyState.classList.add('hidden');
    }

    hideLoading() {
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.wishlistGrid) this.wishlistGrid.classList.remove('hidden');
    }

    showEmptyState() {
        if (this.emptyState) this.emptyState.classList.remove('hidden');
        if (this.wishlistGrid) this.wishlistGrid.innerHTML = '';
    }

    updateWishlistCount(count) {
        if (this.wishlistCount) {
            this.wishlistCount.textContent = count;
        }
    }

    renderWishlist() {
        if (!this.wishlistGrid) return;

        if (this.wishlistItems.length === 0) {
            this.showEmptyState();
        return;
    }

        this.emptyState?.classList.add('hidden');
        
        const wishlistHTML = this.wishlistItems.map(product => this.createProductCard(product)).join('');
        this.wishlistGrid.innerHTML = wishlistHTML;

        // Add event listeners to the new cards
        this.addCardEventListeners();
    }

    createProductCard(product) {
        const isInStock = this.checkProductStock(product);
        const priceInfo = this.getProductPriceInfo(product);
        const availableColors = this.getAvailableColors(product);

        return `
            <div class="wishlist-card bg-cream rounded-xl border border-beige overflow-hidden fade-in" data-product-id="${product._id}">
            <div class="relative">
                <div class="overflow-hidden h-64">
                        <img src="${product.images[0]}" alt="${product.name}" class="product-image w-full h-full object-cover">
                </div>
                    <button class="remove-wishlist-btn absolute top-2 right-2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors" data-product-id="${product._id}">
                    <i class="heart-icon fas fa-heart text-red-500"></i>
                </button>
                    ${priceInfo.hasSale ? `
                    <span class="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                            ${priceInfo.salePercentage}% OFF
                    </span>
                ` : ''}
                    ${!isInStock ? `
                    <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span class="text-white font-semibold">Out of Stock</span>
                    </div>
                ` : ''}
            </div>
            <div class="p-4">
                    <div class="mb-2">
                        <h3 class="font-semibold text-charcoal text-lg mb-1">${product.name}</h3>
                        <p class="text-stone text-sm">${product.brand}</p>
                    </div>
                    
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center space-x-2">
                            <span class="text-lg font-bold text-charcoal">₹${priceInfo.displayPrice.toLocaleString()}</span>
                            ${priceInfo.hasSale ? `
                                <span class="text-stone line-through">₹${priceInfo.originalPrice.toLocaleString()}</span>
                    ` : ''}
                        </div>
                        <span class="text-xs text-stone capitalize">${product.category}</span>
                    </div>

                    ${isInStock ? `
                        <div class="space-y-3">
                            <div class="flex space-x-2">
                                <select class="product-color-select flex-1 px-3 py-2 bg-white border border-beige rounded-lg text-sm focus:outline-none focus:border-gold" data-product-id="${product._id}">
                                    <option value="">Select Color</option>
                                    ${availableColors.map(color => `
                                        <option value="${color}">${color}</option>
                                    `).join('')}
                                </select>
                                <select class="product-size-select flex-1 px-3 py-2 bg-white border border-beige rounded-lg text-sm focus:outline-none focus:border-gold" data-product-id="${product._id}" disabled>
                                    <option value="">Select Size</option>
                                </select>
                            </div>
                            <div class="flex space-x-2">
                                <button class="add-to-cart-btn flex-1 px-4 py-2 bg-gold text-charcoal font-medium rounded-lg hover:bg-velvra-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-product-id="${product._id}" disabled>
                                    Add to Cart
                                </button>
                                <button class="move-to-cart-btn flex-1 px-4 py-2 bg-charcoal text-white font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" data-product-id="${product._id}" disabled>
                                    Move to Cart
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="text-center py-2">
                            <span class="text-stone text-sm">Currently unavailable</span>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    checkProductStock(product) {
        return product.variants && product.variants.some(variant => 
            variant.stock > 0 && variant.active
        );
    }

    getProductPriceInfo(product) {
        if (!product.variants || product.variants.length === 0) {
            return {
                displayPrice: 0,
                originalPrice: 0,
                hasSale: false,
                salePercentage: 0
            };
        }

        // Find variants with sale prices
        const variantsWithSale = product.variants.filter(v => 
            v.salePrice && v.salePrice < v.price
        );
        
        if (variantsWithSale.length > 0) {
            // Show lowest sale price
            const lowestSaleVariant = variantsWithSale.reduce((lowest, current) => 
                current.salePrice < lowest.salePrice ? current : lowest
            );
            
            // Show highest sale percentage
            const highestSalePercentageVariant = variantsWithSale.reduce((highest, current) => {
                const currentPercentage = Math.round(((current.price - current.salePrice) / current.price) * 100);
                const highestPercentage = Math.round(((highest.price - highest.salePrice) / highest.price) * 100);
                return currentPercentage > highestPercentage ? current : highest;
            });
            
            return {
                displayPrice: lowestSaleVariant.salePrice,
                originalPrice: lowestSaleVariant.price,
                hasSale: true,
                salePercentage: Math.round(((highestSalePercentageVariant.price - highestSalePercentageVariant.salePrice) / highestSalePercentageVariant.price) * 100)
            };
        } else {
            // No sale prices, show lowest regular price
            const lowestPriceVariant = product.variants.reduce((lowest, current) => 
                current.price < lowest.price ? current : lowest
            );
            
            return {
                displayPrice: lowestPriceVariant.price,
                originalPrice: lowestPriceVariant.price,
                hasSale: false,
                salePercentage: 0
            };
        }
    }

    getAvailableColors(product) {
        if (!product.variants) return [];
        
        // Get unique colors from variants that have stock
        const availableColors = new Set();
        product.variants.forEach(variant => {
            if (variant.stock > 0 && variant.active) {
                availableColors.add(variant.color);
            }
        });
        
        return Array.from(availableColors);
    }

    addCardEventListeners() {
        // Remove from wishlist buttons
        document.querySelectorAll('.remove-wishlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                this.removeFromWishlist(productId);
            });
        });

        // Color select change
        document.querySelectorAll('.product-color-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const productId = e.target.dataset.productId;
                this.handleColorChange(productId, e.target.value);
            });
        });

        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                this.addToCart(productId);
            });
        });

        // Move to cart buttons
        document.querySelectorAll('.move-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                this.moveToCart(productId);
            });
        });
    }

    handleColorChange(productId, colorName) {
        const product = this.wishlistItems.find(p => p._id === productId);
        if (!product || !product.variants) return;

        // Find variants for this color that have stock
        const colorVariants = product.variants.filter(v => 
            v.color === colorName && v.stock > 0 && v.active
        );

        const sizeSelect = document.querySelector(`.product-size-select[data-product-id="${productId}"]`);
        const addToCartBtn = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`);
        const moveToCartBtn = document.querySelector(`.move-to-cart-btn[data-product-id="${productId}"]`);

        // Populate size options
        sizeSelect.innerHTML = '<option value="">Select Size</option>';
        colorVariants.forEach(variant => {
            sizeSelect.innerHTML += `<option value="${variant.size}">${variant.size} (${variant.stock} available)</option>`;
        });

        // Enable size select
        sizeSelect.disabled = false;

        // Add event listener for size change
        sizeSelect.addEventListener('change', () => {
            const sizeValue = sizeSelect.value;
            const isSizeSelected = sizeValue !== '';
            
            addToCartBtn.disabled = !isSizeSelected;
            moveToCartBtn.disabled = !isSizeSelected;
        });
    }

    async removeFromWishlist(productId) {
        try {
            const response = await fetch('/dashboard/wishlist/remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId })
            });

            const data = await response.json();
            
            if (data.success) {
                // Remove from local array
                this.wishlistItems = this.wishlistItems.filter(item => item._id !== productId);
                
                // Update UI
                this.updateWishlistCount(data.wishlistCount);
                this.renderWishlist();
                
                this.showNotification('Product removed from wishlist', 'success');
            } else {
                this.showNotification(data.message || 'Failed to remove from wishlist', 'error');
            }
        } catch (error) {
            console.error('Remove from wishlist error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
        }
    }

    async addToCart(productId) {
        const colorSelect = document.querySelector(`.product-color-select[data-product-id="${productId}"]`);
        const sizeSelect = document.querySelector(`.product-size-select[data-product-id="${productId}"]`);
        
        const color = colorSelect?.value;
        const size = sizeSelect?.value;

        if (!color || !size) {
            this.showNotification('Please select color and size', 'error');
            return;
        }

        try {
            const response = await fetch('/dashboard/wishlist/add-to-cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId, color, size, quantity: 1 })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message, 'success');
            } else {
                this.showNotification(data.message || 'Failed to add to cart', 'error');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
        }
    }

    async moveToCart(productId) {
        const colorSelect = document.querySelector(`.product-color-select[data-product-id="${productId}"]`);
        const sizeSelect = document.querySelector(`.product-size-select[data-product-id="${productId}"]`);
        
        const color = colorSelect?.value;
        const size = sizeSelect?.value;

        if (!color || !size) {
            this.showNotification('Please select color and size', 'error');
            return;
        }

        try {
            const response = await fetch('/dashboard/wishlist/move-to-cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId, color, size, quantity: 1 })
            });

            const data = await response.json();
            
            if (data.success) {
                // Remove from local array
                this.wishlistItems = this.wishlistItems.filter(item => item._id !== productId);
                
                // Update UI
                this.updateWishlistCount(data.wishlistCount);
                this.renderWishlist();
                
                this.showNotification(data.message, 'success');
            } else {
                this.showNotification(data.message || 'Failed to move to cart', 'error');
            }
        } catch (error) {
            console.error('Move to cart error:', error);
            this.showNotification('An error occurred. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'success') {
        if (!this.notification || !this.notificationText) return;

        this.notificationText.textContent = message;
        
        // Update notification styling based on type
        this.notification.className = `fixed bottom-20 lg:bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform translate-y-full transition-transform duration-300 z-50 ${
            type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`;

        // Show notification
        this.notification.classList.remove('translate-y-full');
        
        // Hide after 3 seconds
    setTimeout(() => {
            this.notification.classList.add('translate-y-full');
        }, 3000);
    }
}

// Initialize wishlist manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WishlistManager();
}); 