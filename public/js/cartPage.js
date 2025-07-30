// ===== VELVRA DYNAMIC CART SYSTEM =====

class VelvraCart {
    constructor() {
        // Initialize with data from server
        this.cart = window.cart || { items: [], total: 0 };
        this.products = window.products || [];
        this.promoCode = null;
        this.discount = 0;
        this.isUpdating = false;
        this.appliedPromoCode = null; // Store the applied promo code details
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.updateStockValidation();
        // Initialize stock status display for all items
        this.cart.items.forEach(item => {
            this.updateStockStatusDisplay(item._id);
        });
    }

    setupEventListeners() {
        // Quantity buttons
        document.addEventListener('click', async (e) => {
            // Increase quantity
            if (e.target.classList.contains('increase-btn')) {
                e.preventDefault();
                const cartId = e.target.dataset.cartId;
                
                // Check if button is disabled
                if (e.target.disabled) return;
                
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
            
            // Remove promo
            else if (e.target.id === 'removePromoBtn' || e.target.closest('#removePromoBtn')) {
                e.preventDefault();
                this.removePromoCodeManually();
            }
            
            // Mobile remove promo
            else if (e.target.id === 'mobileRemovePromoBtn' || e.target.closest('#mobileRemovePromoBtn')) {
                e.preventDefault();
                this.removePromoCodeManually();
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
                    // Reset to valid value
                    e.target.value = Math.min(Math.max(1, newQuantity), 10);
                }
            }
        });
    }

    // Helper function to get stock for specific color and size
    getStockForColorSize(product, colorName, sizeName) {
        if (!product.variants || !Array.isArray(product.variants)) return 0;
        const variant = product.variants.find(v => v.color === colorName && v.size === sizeName);
        return variant ? variant.stock : 0;
    }

    canIncreaseQuantity(cartItemId) {
        const item = this.getCartItem(cartItemId);
        if (!item) return false;
        
        const currentStock = this.getStockForColorSize(item.product, item.color, item.size);
        return item.quantity < currentStock;
    }

    updateStockValidation() {
        this.cart.items.forEach(item => {
            this.updateItemStockValidation(item._id);
        });
    }

    updateItemStockValidation(cartItemId) {
        const item = this.getCartItem(cartItemId);
        if (!item) return;

        const currentStock = this.getStockForColorSize(item.product, item.color, item.size);
        const increaseBtn = document.querySelector(`.increase-btn[data-cart-id="${cartItemId}"]`);
        
        if (increaseBtn) {
            if (item.quantity >= currentStock) {
                increaseBtn.disabled = true;
                increaseBtn.classList.add('opacity-50', 'cursor-not-allowed');
                increaseBtn.style.pointerEvents = 'none';
            } else {
                increaseBtn.disabled = false;
                increaseBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                increaseBtn.style.pointerEvents = 'auto';
            }
        }
    }

    showStockError(cartItemId, message) {
        // Remove any existing error messages
        this.removeStockError(cartItemId);
        
        // Create error message element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'stock-error-message text-red-500 text-sm mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg animate-fade-in';
        errorDiv.textContent = message;
        errorDiv.style.animation = 'fadeIn 0.3s ease-out';
        
        // Find the quantity controls container and insert error message
        const quantityContainer = document.querySelector(`[data-cart-id="${cartItemId}"] .quantity-controls-mobile`);
        if (quantityContainer) {
            quantityContainer.appendChild(errorDiv);
        }
        
        // Auto-remove error message after 3 seconds
        setTimeout(() => {
            this.removeStockError(cartItemId);
        }, 3000);
    }

    removeStockError(cartItemId) {
        const existingError = document.querySelector(`[data-cart-id="${cartItemId}"] .stock-error-message`);
        if (existingError) {
            existingError.remove();
        }
    }

    async handleQuantityChange(cartItemId, delta, newQuantity = null) {
        if (this.isUpdating) return;

        const item = this.getCartItem(cartItemId);
        if (!item) return;

        const currentQuantity = item.quantity;
        let updatedQuantity;

        if (newQuantity !== null) {
            updatedQuantity = Math.min(Math.max(1, newQuantity), 10);
        } else {
            // Check stock limit for increase operations
            if (delta > 0) {
                const currentStock = this.getStockForColorSize(item.product, item.color, item.size);
                if (currentQuantity >= currentStock) {
                    this.showStockError(cartItemId, `Sorry, we only have ${currentStock} of this item in stock.`);
                    return;
                }
            }
            // Check minimum quantity for decrease operations
            if (delta < 0 && currentQuantity <= 1) {
                return; // Don't allow decreasing below 1
            }
            updatedQuantity = Math.min(Math.max(1, currentQuantity + delta), 10);
        }

        if (updatedQuantity === currentQuantity) return;

        try {
            this.isUpdating = true;
            this.showLoading(cartItemId);

            // Update UI immediately for better user experience
            this.updateQuantityInDOM(cartItemId, updatedQuantity);
            this.updateItemStockValidation(cartItemId);

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

            // Validate promo code after cart update
            await this.validateAppliedPromoCode();

        } catch (error) {
            console.error('Error updating quantity:', error);
            this.showErrorMessage(error.message || 'Failed to update quantity');
            // Revert the quantity change on error
            this.updateQuantityInDOM(cartItemId, currentQuantity);
            this.updateItemStockValidation(cartItemId);
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

        // Check if new color has stock
        const newColorStock = this.getStockForColorSize(item.product, newColor, item.size);
        if (newColorStock === 0) {
            this.showStockError(cartItemId, 'This color is currently out of stock.');
            return;
        }

        // Check if new color has enough stock for current quantity
        if (item.quantity > newColorStock) {
            this.showStockError(cartItemId, `Only ${newColorStock} available in this color.`);
            return;
        }

        try {
            this.isUpdating = true;
            this.showLoading(cartItemId);

            // Update UI immediately
            this.updateColorInDOM(cartItemId, newColor);

            const response = await fetch('/cart/updateColor', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cartItemId,
                    newColor
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update color');
            }

            const data = await response.json();
            this.updateCartData(data.cart, data.total);

            // Validate promo code after cart update
            await this.validateAppliedPromoCode();

        } catch (error) {
            console.error('Error updating color:', error);
            this.showErrorMessage(error.message || 'Failed to update color');
            // Revert the color change on error
            this.updateColorInDOM(cartItemId, item.color);
        } finally {
            this.isUpdating = false;
            this.hideLoading(cartItemId);
        }
    }

    updateColorInDOM(cartItemId, newColor) {
        // Update color display
        const colorDisplays = document.querySelectorAll(`.color-display[data-cart-id="${cartItemId}"]`);
        colorDisplays.forEach(display => {
            display.textContent = newColor;
        });

        // Update color swatches
        const swatches = document.querySelectorAll(`[data-cart-id="${cartItemId}"] .color-swatch-mobile`);
        swatches.forEach(swatch => {
            if (swatch.dataset.color === newColor) {
                swatch.classList.add('selected');
            } else {
                swatch.classList.remove('selected');
            }
        });

        // Update the cart item data
        const item = this.getCartItem(cartItemId);
        if (item) {
            item.color = newColor;
        }
    }

    updatePriceDisplay(cartItemId) {
        const item = this.getCartItem(cartItemId);
        if (!item) return;

        // Calculate item price
        const variant = item.product.variants.find(v => v.color === item.color && v.size === item.size);
        if (!variant) return;

        const itemPrice = variant.salePrice || variant.price;
        const totalPrice = itemPrice * item.quantity;

        // Update mobile price display
        const mobilePrice = document.querySelector(`.price-mobile[data-cart-id="${cartItemId}"]`);
        if (mobilePrice) {
            mobilePrice.textContent = `₹${itemPrice.toLocaleString()}`;
        }

        // Update desktop price display
        const desktopPrice = document.querySelector(`.desktop-price[data-cart-id="${cartItemId}"]`);
        if (desktopPrice) {
            desktopPrice.textContent = `₹${itemPrice.toLocaleString()}`;
        }

        // Update original price if there's a sale
        if (variant.salePrice && variant.salePrice < variant.price) {
            const mobileOriginalPrice = document.querySelector(`.price-original-mobile[data-cart-id="${cartItemId}"]`);
            const desktopOriginalPrice = document.querySelector(`.desktop-original-price[data-cart-id="${cartItemId}"]`);
            
            if (mobileOriginalPrice) {
                mobileOriginalPrice.textContent = `₹${variant.price.toLocaleString()}`;
            }
            if (desktopOriginalPrice) {
                desktopOriginalPrice.textContent = `₹${variant.price.toLocaleString()}`;
            }

            // Update sale badge
            const salePercentage = Math.round(((variant.price - variant.salePrice) / variant.price) * 100);
            const badges = document.querySelectorAll(`.badge-mobile[data-cart-id="${cartItemId}"]`);
            badges.forEach(badge => {
                badge.textContent = `${salePercentage}% OFF`;
            });
        }
    }

    updateStockStatusDisplay(cartItemId) {
        const item = this.getCartItem(cartItemId);
        if (!item) return;

        const currentStock = this.getStockForColorSize(item.product, item.color, item.size);
        const isOutOfStock = currentStock === 0;

        // Update mobile stock status
        const mobileStockStatus = document.getElementById(`stock-mobile-${cartItemId}`);
        if (mobileStockStatus) {
            if (isOutOfStock) {
                mobileStockStatus.textContent = 'Out of Stock';
                mobileStockStatus.classList.add('text-red-500');
            } else {
                mobileStockStatus.textContent = `${currentStock} in stock`;
                mobileStockStatus.classList.remove('text-red-500');
            }
        }

        // Update desktop stock status
        const desktopStockStatus = document.getElementById(`stock-desktop-${cartItemId}`);
        if (desktopStockStatus) {
            if (isOutOfStock) {
                desktopStockStatus.textContent = 'Out of Stock';
                desktopStockStatus.classList.add('text-red-500');
            } else {
                desktopStockStatus.textContent = `${currentStock} in stock`;
                desktopStockStatus.classList.remove('text-red-500');
            }
        }

        // Update quantity controls visibility
        const quantityControls = document.querySelectorAll(`[data-cart-id="${cartItemId}"] .quantity-controls-mobile`);
        quantityControls.forEach(control => {
            if (isOutOfStock) {
                control.style.display = 'none';
            } else {
                control.style.display = 'flex';
            }
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

            // Validate promo code after cart update
            await this.validateAppliedPromoCode();

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
            // Validate promo code before checkout
            if (this.appliedPromoCode) {
                const isValid = await this.validatePromoCode(this.appliedPromoCode.code);
                if (!isValid) {
                    this.showErrorMessage('Promo code is no longer valid. Please remove it before checkout.');
                    return;
                }
                
                // Store promo code state for payment summary page
                localStorage.setItem('appliedPromoCode', JSON.stringify(this.appliedPromoCode));
                localStorage.setItem('promoDiscount', this.discount.toString());
            } else {
                // Clear any existing promo code state
                localStorage.removeItem('appliedPromoCode');
                localStorage.removeItem('promoDiscount');
            }

            window.location.href = '/payment/paymentSummary';
        } catch (error) {
            console.error('Error during checkout:', error);
            this.showErrorMessage('Error during checkout');
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

        // Check if promo code is already applied
        if (this.appliedPromoCode && this.appliedPromoCode.code === code) {
            this.showErrorMessage('This promo code is already applied');
            return;
        }

        try {
            const response = await fetch('/api/promotions/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    cartTotal: this.cart.total
                })
            });

            const result = await response.json();

            if (result.success) {
                // Store the applied promo code details
                this.appliedPromoCode = {
                    code: code,
                    promotion: result.data.promotion,
                    discount: result.data.discount,
                    minPurchase: result.data.promotion.minPurchase || 0
                };
                
                this.discount = result.data.discount;
                
                // Update UI to show discount
                this.showDiscount(this.discount);
                this.showSuccessMessage(`Promo code ${code} applied!`);
                input.value = '';
                
                // Hide promo form after successful application
                this.togglePromoForm();
            } else {
                this.showErrorMessage(result.message || 'Invalid promo code');
            }
        } catch (error) {
            console.error('Error applying promo code:', error);
            this.showErrorMessage('Error applying promo code');
        }
    }

    // Validate promo code without applying it
    async validatePromoCode(code) {
        try {
            const response = await fetch('/api/promotions/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    cartTotal: this.cart.total
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error validating promo code:', error);
            return false;
        }
    }

    // Validate and potentially remove applied promo code
    async validateAppliedPromoCode() {
        if (!this.appliedPromoCode) return;

        const { code, minPurchase } = this.appliedPromoCode;

        // Check minimum purchase requirement
        if (this.cart.total < minPurchase) {
            this.removePromoCode(`Promo code ${code} requires minimum purchase of Rs. ${minPurchase.toLocaleString()}. Your cart total is now Rs. ${this.cart.total.toLocaleString()}.`);
            return;
        }

        // Validate promo code with backend
        const isValid = await this.validatePromoCode(code);
        if (!isValid) {
            this.removePromoCode(`Promo code ${code} is no longer valid.`);
            return;
        }

        // Recalculate discount for new cart total
        try {
            const response = await fetch('/api/promotions/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    cartTotal: this.cart.total
                })
            });

            const result = await response.json();
            if (result.success) {
                this.discount = result.data.discount;
                this.showDiscount(this.discount);
            } else {
                this.removePromoCode(`Promo code ${code} is no longer valid.`);
            }
        } catch (error) {
            console.error('Error recalculating promo code discount:', error);
            this.removePromoCode(`Error validating promo code ${code}.`);
        }
    }

    // Remove applied promo code
    removePromoCode(message) {
        this.appliedPromoCode = null;
        this.discount = 0;
        this.hideDiscount();
        this.showErrorMessage(message);
    }

    // Manually remove promo code (user initiated)
    removePromoCodeManually() {
        if (!this.appliedPromoCode) return;
        
        this.appliedPromoCode = null;
        this.discount = 0;
        this.hideDiscount();
        this.showSuccessMessage('Promo code removed successfully');
    }

    showDiscount(discount) {
        const discountRow = document.getElementById('discountRow');
        const discountAmount = document.getElementById('discount');
        const removePromoBtn = document.getElementById('removePromoBtn');
        const mobileAppliedPromo = document.getElementById('mobileAppliedPromo');
        const mobilePromoCode = document.getElementById('mobilePromoCode');
        
        if (discountRow && discountAmount) {
            discountRow.classList.remove('hidden');
            discountAmount.textContent = `-₹${discount.toLocaleString()}`;
            
            // Show remove promo button
            if (removePromoBtn) {
                removePromoBtn.classList.remove('hidden');
            }
            
            // Show mobile applied promo
            if (mobileAppliedPromo && mobilePromoCode && this.appliedPromoCode) {
                mobileAppliedPromo.classList.remove('hidden');
                mobilePromoCode.textContent = this.appliedPromoCode.code;
            }
            
            // Update totals
            const finalTotal = this.cart.total - discount;
            document.getElementById('subtotal').textContent = `₹${this.cart.total.toLocaleString()}`;
            document.getElementById('desktopTotal').textContent = `₹${finalTotal.toLocaleString()}`;
            document.getElementById('mobileTotal').textContent = `₹${finalTotal.toLocaleString()}`;
        }
    }

    hideDiscount() {
        const discountRow = document.getElementById('discountRow');
        const removePromoBtn = document.getElementById('removePromoBtn');
        const mobileAppliedPromo = document.getElementById('mobileAppliedPromo');
        
        if (discountRow) {
            discountRow.classList.add('hidden');
        }
        
        // Hide remove promo button
        if (removePromoBtn) {
            removePromoBtn.classList.add('hidden');
        }
        
        // Hide mobile applied promo
        if (mobileAppliedPromo) {
            mobileAppliedPromo.classList.add('hidden');
        }
        
        // Update totals without discount
        document.getElementById('subtotal').textContent = `₹${this.cart.total.toLocaleString()}`;
        document.getElementById('desktopTotal').textContent = `₹${this.cart.total.toLocaleString()}`;
        document.getElementById('mobileTotal').textContent = `₹${this.cart.total.toLocaleString()}`;
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

        // Update totals (without discount for now, discount will be applied separately)
        const total = this.cart.total || 0;
        document.getElementById('subtotal').textContent = `₹${total.toLocaleString()}`;
        
        // Apply discount if exists
        if (this.appliedPromoCode && this.discount > 0) {
            const finalTotal = total - this.discount;
            document.getElementById('desktopTotal').textContent = `₹${finalTotal.toLocaleString()}`;
            document.getElementById('mobileTotal').textContent = `₹${finalTotal.toLocaleString()}`;
        } else {
            document.getElementById('desktopTotal').textContent = `₹${total.toLocaleString()}`;
            document.getElementById('mobileTotal').textContent = `₹${total.toLocaleString()}`;
        }

        // Update price displays for all items
        this.cart.items.forEach(item => {
            this.updatePriceDisplay(item._id);
        });

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
        const mobileContainer = document.getElementById('mobileCartContainer');
        const desktopContainer = document.getElementById('desktopCartItems');
        
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
    }

    showMobilePromoModal() {
        // Implementation for mobile promo modal
        this.togglePromoForm();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    quickHaptic(element) {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        element.classList.add('scale-95');
        setTimeout(() => {
            element.classList.remove('scale-95');
        }, 100);
    }

    getCartItem(cartItemId) {
        return this.cart.items.find(item => item._id === cartItemId);
    }

    showLoading(cartItemId) {
        const loadingEl = document.querySelector(`[data-cart-id="${cartItemId}"] .loading-spinner`);
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
        }
    }

    hideLoading(cartItemId) {
        const loadingEl = document.querySelector(`[data-cart-id="${cartItemId}"] .loading-spinner`);
        if (loadingEl) {
            loadingEl.classList.add('hidden');
        }
    }

    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.showToast(message, 'error');
    }


}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new VelvraCart();
});

// Set viewport height for mobile
const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};

window.addEventListener('resize', setVH);
setVH();