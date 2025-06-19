// ===== VELVRA DYNAMIC CART SYSTEM =====

class VelvraCart {
    constructor() {
        // Initialize with data from server
        this.cart = window.cart || { items: [], total: 0 };
        this.products = window.products || [];
        this.promoCode = null;
        this.discount = 0;
        this.isUpdating = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Quantity buttons
        document.addEventListener('click', async (e) => {
            // Increase quantity
            if (e.target.classList.contains('increase-btn')) {
                e.preventDefault();
                const cartId = e.target.dataset.cartId;
                await this.handleQuantityChange(cartId, 1);
                this.quickHaptic(e.target);
            }
            
            // Decrease quantity
            else if (e.target.classList.contains('decrease-btn')) {
                e.preventDefault();
                const cartId = e.target.dataset.cartId;
                await this.handleQuantityChange(cartId, -1);
                this.quickHaptic(e.target);
            }
            
            // Remove item
            else if (e.target.closest('.remove-btn-mobile')) {
                e.preventDefault();
                const btn = e.target.closest('.remove-btn-mobile');
                const cartId = btn.dataset.cartId;
                await this.handleRemoveItem(cartId);
                this.quickHaptic(btn);
            }
            
            // Color swatch
            else if (e.target.classList.contains('color-swatch-mobile')) {
                e.preventDefault();
                const cartId = e.target.dataset.cartId;
                const color = e.target.dataset.color;
                await this.handleColorChange(cartId, color);
                this.quickHaptic(e.target);
            }
            
            // Checkout buttons
            else if (e.target.id === 'mobileCheckoutBtn' || e.target.id === 'desktopCheckoutBtn') {
                e.preventDefault();
                this.handleCheckout();
            }
            
            // Mobile promo
            else if (e.target.closest('#mobilePromoToggle')) {
                e.preventDefault();
                this.showMobilePromoModal();
                this.quickHaptic(e.target);
            }
            
            // Desktop promo toggle
            else if (e.target.closest('#promoToggle')) {
                e.preventDefault();
                this.togglePromoForm();
            }
            
            // Apply promo
            else if (e.target.id === 'applyPromo') {
                e.preventDefault();
                this.applyPromoCode();
            }
        });

        // Quantity input change (for direct input)
        document.addEventListener('change', async (e) => {
            if (e.target.classList.contains('quantity-input-mobile')) {
                e.preventDefault();
                const cartId = e.target.dataset.cartId;
                const newQuantity = parseInt(e.target.value);
                
                if (newQuantity >= 1 && newQuantity <= 10) {
                    await this.handleQuantityChange(cartId, 0, newQuantity);
                } else {
                    // Reset to current quantity if invalid
                    const item = this.getCartItem(cartId);
                    if (item) {
                        e.target.value = item.quantity;
                    }
                }
            }
        });

        // Touch feedback
        document.addEventListener('touchstart', (e) => {
            const target = e.target;
            if (target.classList.contains('quantity-btn-mobile') || 
                target.classList.contains('remove-btn-mobile') ||
                target.classList.contains('color-swatch-mobile') ||
                target.classList.contains('btn-checkout-mobile')) {
                target.style.transform = 'scale(0.95)';
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const target = e.target;
            if (target.classList.contains('quantity-btn-mobile') || 
                target.classList.contains('remove-btn-mobile') ||
                target.classList.contains('color-swatch-mobile') ||
                target.classList.contains('btn-checkout-mobile')) {
                target.style.transform = '';
            }
        }, { passive: true });
    }

    async handleQuantityChange(cartItemId, delta, newQuantity = null) {
        if (this.isUpdating) return;

        const item = this.getCartItem(cartItemId);
        if (!item) return;

        const currentQuantity = item.quantity;
        const updatedQuantity = newQuantity || Math.min(Math.max(1, currentQuantity + delta), 10);

        if (updatedQuantity === currentQuantity) return;

        try {
            this.isUpdating = true;
            this.showLoading(cartItemId);

            // Update UI immediately for better user experience
            this.updateQuantityInDOM(cartItemId, updatedQuantity);

            const response = await fetch('/cart/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cartItemId,
                    change: delta
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update quantity');
            }

            const data = await response.json();
            this.updateCartData(data.cart, data.total);

            // Update cart count using the global cart manager
            if (window.cartManager) {
                window.cartManager.handleCartUpdate({
                    cartCount: data.cart.items.reduce((total, item) => total + item.quantity, 0)
                });
            }

        } catch (error) {
            console.error('Error updating quantity:', error);
            this.showErrorMessage(error.message || 'Failed to update quantity');
            // Revert the quantity change on error
            this.updateQuantityInDOM(cartItemId, currentQuantity);
        } finally {
            this.isUpdating = false;
            this.hideLoading(cartItemId);
        }
    }

    updateQuantityInDOM(cartItemId, newQuantity) {
        // Update all quantity inputs for this item (mobile and desktop)
        const inputs = document.querySelectorAll(`input[data-cart-id="${cartItemId}"]`);
        inputs.forEach(input => {
            input.value = newQuantity;
        });

        // Update the cart item data for immediate calculations
        const item = this.getCartItem(cartItemId);
        if (item) {
            item.quantity = newQuantity;
        }
    }

    async handleColorChange(cartItemId, newColor) {
        if (this.isUpdating) return;

        const item = this.getCartItem(cartItemId);
        if (!item || item.color === newColor) return;

        try {
            this.isUpdating = true;
            this.showLoading(cartItemId);

            // Update UI immediately for better user experience
            this.updateColorInDOM(cartItemId, newColor);

            const response = await fetch('/cart/update-color', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cartItemId,
                    color: newColor
                })
            });

            if (!response.ok) throw new Error('Failed to update color');

            const data = await response.json();
            this.updateCartData(data.cart, data.total);

        } catch (error) {
            console.error('Error updating color:', error);
            this.showErrorMessage('Failed to update color');
            // Revert the color change on error
            this.updateColorInDOM(cartItemId, item.color);
        } finally {
            this.isUpdating = false;
            this.hideLoading(cartItemId);
        }
    }

    updateColorInDOM(cartItemId, newColor) {
        // Update color swatches
        const swatches = document.querySelectorAll(`.color-swatch-mobile[data-cart-id="${cartItemId}"]`);
        swatches.forEach(swatch => {
            if (swatch.dataset.color === newColor) {
                swatch.classList.add('selected');
            } else {
                swatch.classList.remove('selected');
            }
        });

        // Update color display text
        const colorDisplays = document.querySelectorAll(`[data-cart-id="${cartItemId}"] .color-display`);
        colorDisplays.forEach(display => {
            display.textContent = newColor;
        });
    }

    async handleRemoveItem(cartItemId) {
        if (this.isUpdating) return;

        try {
            const result = await Swal.fire({
                title: 'Remove Item?',
                text: 'Are you sure you want to remove this item from your cart?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, remove it',
                cancelButtonText: 'No, keep it'
            });

            if (!result.isConfirmed) return;

            this.isUpdating = true;
            this.showLoading(cartItemId);

            // Find all elements with this cart item ID (mobile and desktop versions)
            const mobileItem = document.querySelector(`.cart-item-mobile[data-cart-id="${cartItemId}"]`);
            const desktopItem = document.querySelector(`.desktop-cart-item[data-cart-id="${cartItemId}"]`);

            // Animate removal
            if (mobileItem) {
                mobileItem.style.transition = 'all 0.3s ease-out';
                mobileItem.style.transform = 'translateX(-100%)';
                mobileItem.style.opacity = '0';
            }
            
            if (desktopItem) {
                desktopItem.style.transition = 'all 0.3s ease-out';
                desktopItem.style.transform = 'translateX(-100%)';
                desktopItem.style.opacity = '0';
            }

            const response = await fetch('/cart/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cartItemId })
            });

            if (!response.ok) throw new Error('Failed to remove item');

            const data = await response.json();
            this.updateCartData(data.cart, data.total);

            // Update cart count using the global cart manager
            if (window.cartManager) {
                window.cartManager.handleCartUpdate({
                    cartCount: data.cart.items.reduce((total, item) => total + item.quantity, 0)
                });
            }

            // Remove from DOM after animation completes
            setTimeout(() => {
                if (mobileItem) mobileItem.remove();
                if (desktopItem) desktopItem.remove();
                
                // Update UI
                this.updateUI();
                
                // Show empty cart if no items left
                if (this.cart.items.length === 0) {
                    this.showEmptyCart();
                }
                
                this.showSuccessMessage('Item removed successfully');
            }, 300);

        } catch (error) {
            console.error('Error removing item:', error);
            this.showErrorMessage('Failed to remove item');
            
            // Revert animation on error
            const mobileItem = document.querySelector(`.cart-item-mobile[data-cart-id="${cartItemId}"]`);
            const desktopItem = document.querySelector(`.desktop-cart-item[data-cart-id="${cartItemId}"]`);
            
            if (mobileItem) {
                mobileItem.style.transform = '';
                mobileItem.style.opacity = '';
            }
            if (desktopItem) {
                desktopItem.style.transform = '';
                desktopItem.style.opacity = '';
            }
        } finally {
            this.isUpdating = false;
            this.hideLoading(cartItemId);
        }
    }

    async handleCheckout() {
        if (this.cart.items.length === 0) {
            this.showErrorMessage('Your cart is empty');
            return;
        }

        try {
            this.showLoading('checkout');
            
            // Redirect to payment summary page
            window.location.href = '/payment/paymentSummary';

        } catch (error) {
            console.error('Error proceeding to checkout:', error);
            this.showErrorMessage('Failed to proceed to checkout');
        } finally {
            this.hideLoading('checkout');
        }
    }

    togglePromoForm() {
        const form = document.getElementById('promoForm');
        const icon = document.getElementById('promoIcon');
        
        if (form.classList.contains('hidden')) {
            form.classList.remove('hidden');
            icon.style.transform = 'rotate(180deg)';
        } else {
            form.classList.add('hidden');
            icon.style.transform = 'rotate(0deg)';
        }
    }

    async applyPromoCode() {
        const input = document.getElementById('promoInput');
        const code = input.value.trim().toUpperCase();
        
        if (!code) {
            this.showErrorMessage('Please enter a promo code');
            return;
        }

        // Define valid promo codes
        const validCodes = {
            'FIRST10': { type: 'percentage', value: 10 },
            'SAVE20': { type: 'fixed', value: 2000, minOrder: 10000 }
        };

        const promo = validCodes[code];

        if (!promo) {
            this.showErrorMessage('Invalid promo code');
            return;
        }

        if (promo.minOrder && this.cart.total < promo.minOrder) {
            this.showErrorMessage(`Minimum order of ₹${promo.minOrder.toLocaleString()} required`);
            return;
        }

        let discount = 0;
        if (promo.type === 'percentage') {
            discount = Math.floor(this.cart.total * (promo.value / 100));
        } else {
            discount = promo.value;
        }

        // Update UI to show discount
        this.showDiscount(discount);
        this.showSuccessMessage(`Promo code ${code} applied!`);
        input.value = '';
    }

    showDiscount(discount) {
        const discountRow = document.getElementById('discountRow');
        const discountAmount = document.getElementById('discount');
        
        if (discountRow && discountAmount) {
            discountRow.classList.remove('hidden');
            discountAmount.textContent = `-₹${discount.toLocaleString()}`;
            
            // Update totals
            const finalTotal = this.cart.total - discount;
            document.getElementById('subtotal').textContent = `₹${this.cart.total.toLocaleString()}`;
            document.getElementById('desktopTotal').textContent = `₹${finalTotal.toLocaleString()}`;
            document.getElementById('mobileTotal').textContent = `₹${finalTotal.toLocaleString()}`;
        }
    }

    updateCartData(newCartData, newTotal) {
        this.cart = newCartData;
        if (newTotal !== undefined) {
            this.cart.total = newTotal;
        }
        window.cart = this.cart;
        this.updateUI();
    }

    updateUI() {
        // Update item count
        const itemCountEl = document.getElementById('itemCount');
        if (itemCountEl) {
            const totalItems = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
            itemCountEl.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
        }

        // Update totals
        const total = this.cart.total || 0;
        document.getElementById('subtotal').textContent = `₹${total.toLocaleString()}`;
        document.getElementById('desktopTotal').textContent = `₹${total.toLocaleString()}`;
        document.getElementById('mobileTotal').textContent = `₹${total.toLocaleString()}`;

        // Hide summary bar if cart is empty
        const summaryBar = document.querySelector('.mobile-summary-bar');
        if (summaryBar) {
            summaryBar.style.display = this.cart.items.length === 0 ? 'none' : 'block';
        }

        // Update cart count in header if it exists
        const cartCountEl = document.querySelector('.cart-count');
        if (cartCountEl) {
            const totalItems = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCountEl.textContent = totalItems;
        }
    }

    showEmptyCart() {
        // Show empty cart state for mobile
        const mobileContainer = document.getElementById('mobileCartContainer');
        if (mobileContainer) {
            mobileContainer.innerHTML = `
                <div class="text-center py-20">
                    <svg class="mx-auto w-20 h-20 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"></path>
                    </svg>
                    <h3 class="text-xl font-playfair font-light text-gray-900 mb-2">Your cart is empty</h3>
                    <p class="text-sm text-gray-600 mb-6">Discover our luxury collection</p>
                    <button class="btn-checkout-mobile" onclick="window.location.href='/shop'">
                        Continue Shopping
                    </button>
                </div>
            `;
        }

        // Show empty cart state for desktop
        const desktopContainer = document.getElementById('desktopCartItems');
        if (desktopContainer) {
            desktopContainer.innerHTML = `
                <div class="text-center py-20">
                    <svg class="mx-auto w-20 h-20 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"></path>
                    </svg>
                    <h3 class="text-xl font-playfair font-light text-gray-900 mb-2">Your cart is empty</h3>
                    <p class="text-sm text-gray-600 mb-6">Discover our luxury collection</p>
                    <button class="btn-checkout-mobile" onclick="window.location.href='/shop'">
                        Continue Shopping
                    </button>
                </div>
            `;
        }

        // Hide summary bar
        const summaryBar = document.querySelector('.mobile-summary-bar');
        if (summaryBar) {
            summaryBar.style.display = 'none';
        }
    }

    showMobilePromoModal() {
        // For now, just show coming soon message
        // You can implement a full modal later
        this.showToast('Enter promo code on desktop view', 'info');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-gray-800';
        
        toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full text-white text-sm font-medium ${bgColor} shadow-lg transition-all duration-300 opacity-0 translate-y-2`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.remove('opacity-0', 'translate-y-2');
        });
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    quickHaptic(element) {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }

    getCartItem(cartItemId) {
        return this.cart.items.find(item => item._id === cartItemId);
    }

    showLoading(cartItemId) {
        const elements = document.querySelectorAll(`[data-cart-id="${cartItemId}"]`);
        elements.forEach(el => {
            el.classList.add('loading');
            el.disabled = true;
        });
    }

    hideLoading(cartItemId) {
        const elements = document.querySelectorAll(`[data-cart-id="${cartItemId}"]`);
        elements.forEach(el => {
            el.classList.remove('loading');
            el.disabled = false;
        });
    }

    showSuccessMessage(message) {
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: message,
            timer: 1500,
            showConfirmButton: false
        });
    }

    showErrorMessage(message) {
        Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: message,
            confirmButtonText: 'OK'
        });
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create cart instance
    const velvraCart = new VelvraCart();
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Optimize viewport height for mobile browsers
    const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
});