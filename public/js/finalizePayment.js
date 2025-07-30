// Finalize Payment Page - Robust Promo Code System
class FinalizePayment {
    constructor() {
        this.isBuyNow = window.isBuyNow || false;
        this.buyNowItem = window.buyNowItem || null;
        this.cart = window.cart || null;
        this.appliedPromoCode = null;
        this.discount = 0;
        this.selectedPayment = null;
        this.selectedAddress = null;
        this.codConfirmed = false;
    }

    init() {
        this.setupData();
        this.setupEventListeners();
        
        // Calculate totals first
        this.calculateTotals();
        
        // Load promo code state and update prices
        this.loadPromoCodeState();
        
        // Setup address selection
        this.setupAddressSelection();
        
        // Initialize address modal functionality
        this.initializeAddressModal();
        
        // Set default payment method (COD)
        this.selectPayment('cod');
        
        // Force a final price update to ensure everything is correct
        setTimeout(() => {
            this.updatePrices();
        }, 100);
    }

    setupData() {
        console.log('FinalizePayment setupData - isBuyNow:', this.isBuyNow);
        console.log('Buy Now Item:', this.buyNowItem);
        console.log('Cart Data:', this.cart);
        console.log('Window cart:', window.cart);
        console.log('Window isBuyNow:', window.isBuyNow);
    }

    calculateTotals() {
        console.log('=== CALCULATE TOTALS DEBUG ===');
        console.log('this.isBuyNow:', this.isBuyNow);
        console.log('this.buyNowItem:', this.buyNowItem);
        console.log('this.cart:', this.cart);
        console.log('this.cart?.items:', this.cart?.items);
        
        if (this.isBuyNow && this.buyNowItem) {
            // Calculate buy now total
            const variant = this.buyNowItem.product.variants.find(v => 
                v.color === this.buyNowItem.color && v.size === this.buyNowItem.size
            );
            if (variant) {
                const itemPrice = variant.salePrice || variant.price;
                this.subtotal = itemPrice * this.buyNowItem.quantity;
                console.log('Buy Now - Item Price:', itemPrice, 'Qty:', this.buyNowItem.quantity, 'Subtotal:', this.subtotal);
            }
        } else if (this.cart && this.cart.items) {
            // Calculate cart total
            console.log('Calculating cart total from', this.cart.items.length, 'items');
            this.subtotal = this.cart.items.reduce((total, item) => {
                console.log('Processing cart item:', item);
                if (item.product && item.product.variants) {
                    const variant = item.product.variants.find(v => 
                        v.color === item.color && v.size === item.size
                    );
                    if (variant) {
                        const itemPrice = variant.salePrice || variant.price;
                        const itemTotal = itemPrice * item.quantity;
                        console.log(`Cart Item: ${item.product.name}, Price: ${itemPrice}, Qty: ${item.quantity}, Total: ${itemTotal}`);
                        return total + itemTotal;
                    } else {
                        console.log('Variant not found for item:', item);
                    }
                } else {
                    console.log('Item missing product or variants:', item);
                }
                return total;
            }, 0);
            console.log('Cart Subtotal calculated:', this.subtotal);
        } else {
            console.log('No valid cart or buy now data found');
            this.subtotal = 0;
        }
        console.log('=== END CALCULATE TOTALS ===');
    }

    setupEventListeners() {
        // Payment method selection
        document.querySelectorAll('input[name="payment"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.selectPayment(e.target.value);
            });
        });

        // Address selection - these are handled by onclick attributes in the EJS template
        // No need to add event listeners here as they're already set up in the template

        // Add address button
        const addAddressBtn = document.getElementById('addAddressBtn');
        if (addAddressBtn) {
            addAddressBtn.addEventListener('click', () => {
                this.openAddressSidebar();
            });
        }

        // Address form submission
        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
            addressForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAddress();
            });
            
            // Add real-time validation for address form fields
            const formFields = addressForm.querySelectorAll('input[required]');
            formFields.forEach(field => {
                field.addEventListener('input', (e) => {
                    this.validateField(e.target.name, e.target.value);
                });
                
                field.addEventListener('blur', (e) => {
                    this.validateField(e.target.name, e.target.value);
                });
            });
        }

        // Close address sidebar
        const closeAddressBtn = document.querySelector('[onclick="closeAddressSidebar()"]');
        if (closeAddressBtn) {
            closeAddressBtn.addEventListener('click', () => {
                this.closeAddressSidebar();
            });
        }
    }

    setupAddressSelection() {
        // Get addresses from the EJS template data
        const addresses = window.userAddresses || [];
        console.log('Setting up address selection with addresses:', addresses);
        
        if (addresses.length === 1) {
            this.selectedAddress = addresses[0]._id || addresses[0].id;
            this.selectAddress(this.selectedAddress);
        } else if (addresses.length > 1) {
            const defaultAddr = addresses.find(addr => addr.defaultShipping);
            if (defaultAddr) {
                this.selectedAddress = defaultAddr._id || defaultAddr.id;
                this.selectAddress(this.selectedAddress);
            } else {
                this.selectedAddress = addresses[0]._id || addresses[0].id;
                this.selectAddress(this.selectedAddress);
            }
        } else {
            console.log('No addresses available for selection');
            // Show notification to add address
            this.showNotification('Please add a delivery address to continue', 'info');
        }
    }

    loadPromoCodeState() {
        try {
            const storedPromoCode = localStorage.getItem('appliedPromoCode');
            const storedDiscount = localStorage.getItem('promoDiscount');
            
            if (storedPromoCode && storedDiscount) {
                this.appliedPromoCode = JSON.parse(storedPromoCode);
                this.discount = parseFloat(storedDiscount);
                
                console.log('Loaded promo code state:', this.appliedPromoCode);
                console.log('Loaded discount:', this.discount);
                
                // Show discount in UI
                this.showDiscount();
                
                // Show success message
                this.showNotification(`Promo code ${this.appliedPromoCode.code} applied!`, 'success');
            }
        } catch (error) {
            console.error('Error loading promo code state:', error);
        }
    }

    async validateStoredPromoCode() {
        if (!this.appliedPromoCode || this.discount <= 0) {
            return;
        }

        try {
            const cartTotal = this.getCartTotal();
            
            // Skip validation if cart total is 0 or invalid
            if (!cartTotal || cartTotal <= 0) {
                console.log('Cart total is 0 or invalid, skipping promo validation');
                return;
            }

            const response = await fetch('/api/promotions/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: this.appliedPromoCode.code,
                    cartTotal: cartTotal
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                console.log('Stored promo code validation failed:', result.message);
                this.removePromoCode(result.message || 'Promo code is no longer valid');
            }
        } catch (error) {
            console.error('Error validating stored promo code:', error);
            this.removePromoCode('Error validating promo code');
        }
    }

    getCartTotal() {
        console.log('=== GET CART TOTAL DEBUG ===');
        console.log('this.isBuyNow:', this.isBuyNow);
        console.log('this.buyNowItem:', this.buyNowItem);
        console.log('this.cart:', this.cart);
        console.log('this.subtotal:', this.subtotal);
        
        // Use the calculated subtotal if available
        if (this.subtotal && this.subtotal > 0) {
            console.log('Using calculated subtotal:', this.subtotal);
            return this.subtotal;
        }
        
        if (this.isBuyNow && this.buyNowItem) {
            const variant = this.buyNowItem.product.variants.find(v => 
                v.color === this.buyNowItem.color && v.size === this.buyNowItem.size
            );
            if (variant) {
                const itemPrice = variant.salePrice || variant.price;
                const total = itemPrice * this.buyNowItem.quantity;
                console.log('Buy Now total:', total);
                return total;
            }
            console.log('Buy Now variant not found');
            return 0;
        } else if (this.cart && this.cart.items) {
            const total = this.cart.items.reduce((total, item) => {
                if (item.product && item.product.variants) {
                    const variant = item.product.variants.find(v => 
                        v.color === item.color && v.size === item.size
                    );
                    if (variant) {
                        const itemPrice = variant.salePrice || variant.price;
                        return total + (itemPrice * item.quantity);
                    }
                }
                return total;
            }, 0);
            console.log('Cart total calculated:', total);
            return total;
        }
        console.log('No valid data found, returning 0');
        return 0;
    }

    showDiscount() {
        const discountRow = document.getElementById('discountRow');
        const discountAmount = document.getElementById('discountAmount');
        
        if (discountRow && discountAmount && this.discount > 0) {
            discountRow.classList.remove('hidden');
            discountAmount.textContent = this.discount.toLocaleString();
        }
    }

    hideDiscount() {
        const discountRow = document.getElementById('discountRow');
        if (discountRow) {
            discountRow.classList.add('hidden');
        }
    }

    removePromoCode(message) {
        this.appliedPromoCode = null;
        this.discount = 0;
        this.hideDiscount();
        this.showNotification(message, 'error');
        
        // Clear localStorage
        localStorage.removeItem('appliedPromoCode');
        localStorage.removeItem('promoDiscount');
        
        // Update prices
        this.updatePrices();
    }

    updatePrices() {
        const subtotal = this.getCartTotal();
        const finalTotal = Math.max(0, subtotal - this.discount);
        
        console.log('=== FINALIZE PAYMENT PRICE UPDATE ===');
        console.log('Subtotal:', subtotal);
        console.log('Discount:', this.discount);
        console.log('Final Total:', finalTotal);
        console.log('Calculation:', `${subtotal} - ${this.discount} = ${finalTotal}`);
        console.log('=====================================');
        
        // Update subtotal display
        const subtotalElement = document.getElementById('subtotal');
        if (subtotalElement) {
            subtotalElement.textContent = `₹${subtotal.toLocaleString()}`;
            console.log('Updated subtotal element:', subtotalElement.textContent);
        }
        
        // Update total display
        const totalElement = document.getElementById('totalPrice');
        if (totalElement) {
            totalElement.textContent = `₹${finalTotal.toLocaleString()}`;
            console.log('Updated total element:', totalElement.textContent);
        }
        
        // Update discount amount if visible
        const discountAmountElement = document.getElementById('discountAmount');
        if (discountAmountElement && this.discount > 0) {
            discountAmountElement.textContent = this.discount.toLocaleString();
            console.log('Updated discount element:', discountAmountElement.textContent);
        }
    }

    selectPayment(method) {
        this.selectedPayment = method;
        
        // Remove active state from all payment cards
        document.querySelectorAll('.payment-card').forEach(card => {
            card.classList.remove('active');
            const check = card.querySelector('.payment-check');
            if (check) check.classList.add('hidden');
        });
        
        // Add active state to selected card
        const selectedCard = document.querySelector(`input[value="${method}"]`).closest('.payment-card');
        if (selectedCard) {
            selectedCard.classList.add('active');
            const check = selectedCard.querySelector('.payment-check');
            if (check) check.classList.remove('hidden');
        }
        
        // Show/hide payment benefit
        const benefitDiv = document.getElementById('paymentBenefit');
        if (benefitDiv) {
            if (method === 'cod') {
                benefitDiv.classList.add('hidden');
            } else {
                benefitDiv.classList.remove('hidden');
            }
        }
    }

    selectAddress(addressId) {
        this.selectedAddress = addressId;
        console.log('Address selected:', addressId);
        
        // Remove active state from all address cards
        document.querySelectorAll('.address-card').forEach(card => {
            card.classList.remove('border-gold-500', 'bg-gold-50', 'ring-2', 'ring-gold-200');
            card.classList.add('border-gray-200');
        });
        
        // Add active state to selected card
        const selectedCard = document.getElementById(`address-${addressId}`);
        if (selectedCard) {
            selectedCard.classList.remove('border-gray-200');
            selectedCard.classList.add('border-gold-500', 'bg-gold-50', 'ring-2', 'ring-gold-200');
            
            // Add a subtle animation
            selectedCard.style.transform = 'scale(1.02)';
            setTimeout(() => {
                selectedCard.style.transform = '';
            }, 200);
        }
        
        // Store selected address
        localStorage.setItem('selectedAddressId', addressId);
        
        // Show a brief success message
        this.showNotification('Address selected for delivery!', 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm';
            document.body.appendChild(notification);
        }

        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white'
        };

        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${colors[type] || colors.info}`;
        notification.textContent = message;
        notification.classList.remove('hidden');

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    // Address management functions
    openAddressSidebar() {
        const sidebar = document.getElementById('addressSidebar');
        if (sidebar) {
            sidebar.classList.remove('invisible');
            sidebar.classList.add('visible');
            sidebar.style.display = 'flex';
            sidebar.style.zIndex = '9999';
        }
    }

    closeAddressSidebar() {
        const sidebar = document.getElementById('addressSidebar');
        if (sidebar) {
            sidebar.classList.remove('visible');
            sidebar.classList.add('invisible');
            sidebar.style.display = 'none';
        }
    }

    async saveAddress() {
        const form = document.getElementById('addressForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!this.validateAddressForm(formData)) {
            return;
        }

        try {
            const addressData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                street: formData.get('street'),
                city: formData.get('city'),
                state: formData.get('state'),
                postalCode: formData.get('postalCode'),
                defaultShipping: formData.get('defaultShipping') === 'on'
            };

            const response = await fetch('/address/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });

            const result = await response.json();
            
            if (result.message && result.addresses) {
                this.showNotification(result.message || 'Address saved successfully!', 'success');
                this.closeAddressSidebar();
                
                // Reload addresses
                await this.loadAddresses();
                
                // Reset form
                form.reset();
            } else {
                this.showNotification(result.message || 'Error saving address', 'error');
            }
        } catch (error) {
            console.error('Error saving address:', error);
            this.showNotification('Error saving address', 'error');
        }
    }

    validateAddressForm(formData) {
        const fields = ['name', 'phone', 'street', 'city', 'state', 'postalCode'];
        let isValid = true;

        fields.forEach(field => {
            const value = formData.get(field);
            
            if (!value || value.trim() === '') {
                this.showFieldError(field, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
                isValid = false;
            } else {
                // Additional pattern validation
                let fieldValid = true;
                let errorMessage = '';
                
                switch (field) {
                    case 'phone':
                        if (!/^[0-9]{10}$/.test(value)) {
                            fieldValid = false;
                            errorMessage = 'Please enter a valid 10-digit phone number';
                        }
                        break;
                    case 'postalCode':
                        if (!/^[0-9]{5}$/.test(value)) {
                            fieldValid = false;
                            errorMessage = 'Please enter a valid 5-digit postal code';
                        }
                        break;
                    case 'name':
                        if (value.length < 2) {
                            fieldValid = false;
                            errorMessage = 'Name must be at least 2 characters long';
                        }
                        break;
                    case 'street':
                    case 'city':
                    case 'state':
                        if (value.length < 2) {
                            fieldValid = false;
                            errorMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least 2 characters long`;
                        }
                        break;
                }
                
                if (!fieldValid) {
                    this.showFieldError(field, errorMessage);
                    isValid = false;
                } else {
                    this.hideFieldError(field);
                }
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    hideFieldError(field) {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    validateField(fieldName, value) {
        if (!value || value.trim() === '') {
            this.showFieldError(fieldName, 'This field is required');
            return false;
        }

        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'phone':
                if (!/^[0-9]{10}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid 10-digit phone number';
                }
                break;
            case 'postalCode':
                if (!/^[0-9]{5}$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid 5-digit postal code';
                }
                break;
            case 'name':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Name must be at least 2 characters long';
                }
                break;
            case 'street':
            case 'city':
            case 'state':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 2 characters long`;
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(fieldName, errorMessage);
        } else {
            this.hideFieldError(fieldName);
        }

        return isValid;
    }

    async loadAddresses() {
        try {
            const response = await fetch('/address/');
            if (!response.ok) {
                this.showNotification('Please add a delivery address to continue with your order.', 'info');
                return;
            }
            const result = await response.json();
            if (result.addresses && result.addresses.length > 0) {
                this.updateAddressList(result.addresses);
            } else {
                this.showNotification('Please add a delivery address to continue with your order.', 'info');
            }
        } catch (error) {
            this.showNotification('Unable to load addresses. Please add a delivery address.', 'error');
        }
    }

    updateAddressList(addresses) {
        const addressContent = document.getElementById('addressContent');
        if (!addressContent) return;

        if (addresses.length === 0) {
            addressContent.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    No addresses found. Please add a delivery address.
                </div>
                <button id="addAddressBtn" class="flex items-center space-x-3 text-left touch-scale mt-4">
                    <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"></path>
                        </svg>
                    </div>
                    <span class="font-medium">Add Delivery Address</span>
                </button>
            `;
            return;
        }

        const addressList = document.getElementById('addressList');
        if (addressList) {
            addressList.innerHTML = addresses.map(address => `
                <div class="address-card p-4 border ${address.defaultShipping ? 'border-gold-500 bg-gold-50 default-shipping' : 'border-gray-200'} rounded-xl transition-all duration-300 cursor-pointer"
                     id="address-${address._id}"
                     data-address-id="${address._id}"
                     data-name="${address.name}"
                     data-phone="${address.phone}"
                     data-street="${address.street}"
                     data-city="${address.city}"
                     data-state="${address.state}"
                     data-postal-code="${address.postalCode}">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <h4 class="font-medium">${address.name}</h4>
                                ${address.defaultShipping ? '<span class="px-2 py-1 text-xs bg-gold-100 text-gold-700 rounded-full">Default</span>' : ''}
                            </div>
                            <p class="text-sm text-gray-500 mt-1">${address.phone}</p>
                            <p class="text-sm text-gray-500 mt-1">
                                ${address.street}<br>
                                ${address.city}, ${address.state} ${address.postalCode}
                            </p>
                        </div>
                    </div>
                </div>
            `).join('');

            // Re-attach event listeners
            document.querySelectorAll('.address-card').forEach(card => {
                card.addEventListener('click', () => {
                    const addressId = card.dataset.addressId;
                    this.selectAddress(addressId);
                });
            });
        }
    }

    initializeAddressModal() {
        // Add address button event listener
        const addAddressBtn = document.getElementById('addAddressBtn');
        if (addAddressBtn) {
            addAddressBtn.addEventListener('click', () => {
                this.openAddressSidebar();
            });
        }

        // Address form submission
        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
            addressForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAddress();
            });
        }
    }

    // Payment processing
    async processPayment() {
        console.log('Processing payment...');
        console.log('Selected payment:', this.selectedPayment);
        console.log('Selected address:', this.selectedAddress);
        
        if (!this.selectedPayment) {
            this.showNotification('Please select a payment method', 'error');
            return;
        }

        if (!this.selectedAddress) {
            this.showNotification('Please select a delivery address', 'error');
            return;
        }

        if (this.selectedPayment === 'cod') {
            console.log('Showing COD modal...');
            this.showCodModal();
            return;
        }

        console.log('Creating order...');
        await this.createOrder();
    }

    async createOrder() {
        this.showProcessingOverlay();

        try {
            // Get promo code information from localStorage
            const storedPromoCode = localStorage.getItem('appliedPromoCode');
            const storedDiscount = localStorage.getItem('promoDiscount');
            let promoCodeInfo = null;
            
            if (storedPromoCode && storedDiscount) {
                try {
                    const promoCode = JSON.parse(storedPromoCode);
                    const discount = parseFloat(storedDiscount);
                    promoCodeInfo = {
                        code: promoCode.code,
                        discount: discount,
                        promotionId: promoCode.promotion._id
                    };
                } catch (error) {
                    console.error('Error parsing stored promo code:', error);
                }
            }

            // Get the selected address data
            const selectedAddressData = window.userAddresses.find(addr => 
                addr._id === this.selectedAddress || addr.id === this.selectedAddress
            );
            
            if (!selectedAddressData) {
                this.hideProcessingOverlay();
                this.showNotification('Selected address not found', 'error');
                return;
            }

            const orderData = {
                paymentMethod: this.selectedPayment,
                shippingAddress: selectedAddressData,
                promoCode: promoCodeInfo
            };

            let url = '/payment/create-order';
            if (this.isBuyNow && this.buyNowItem) {
                url = '/payment/create-buyNow-order';
                orderData.productId = this.buyNowItem.product._id;
                orderData.size = this.buyNowItem.size;
                orderData.color = this.buyNowItem.color;
                orderData.quantity = this.buyNowItem.quantity;
            }

            console.log('Sending order data:', orderData);
            console.log('Request URL:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            let result;
            try {
                result = await response.json();
                console.log('Order creation response:', result);
            } catch (error) {
                console.error('Error parsing response:', error);
                this.hideProcessingOverlay();
                this.showNotification('Error processing server response', 'error');
                return;
            }

            if (result.success) {
                // Clear promo code state after successful order creation
                localStorage.removeItem('appliedPromoCode');
                localStorage.removeItem('promoDiscount');
                
                // Redirect to order confirmation
                window.location.href = `/payment/orders/${result.order._id}`;
            } else {
                this.hideProcessingOverlay();
                this.showNotification(result.message || 'Error creating order', 'error');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            this.hideProcessingOverlay();
            this.showNotification('Error creating order', 'error');
        }
    }

    showProcessingOverlay() {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
            overlay.style.zIndex = '9999';
        }
    }

    hideProcessingOverlay() {
        const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
    }

    showCodModal() {
        const modal = document.getElementById('codModal');
        console.log('Modal element:', modal);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            modal.style.display = 'flex';
            modal.style.zIndex = '9999';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.right = '0';
            modal.style.bottom = '0';
            modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            
            // Also ensure modal content is visible
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.transform = 'translateY(0)';
                modalContent.style.backgroundColor = 'white';
                modalContent.style.borderRadius = '1rem';
                modalContent.style.padding = '1.5rem';
                modalContent.style.margin = '1rem';
                modalContent.style.maxWidth = '28rem';
                modalContent.style.width = '100%';
                console.log('Modal content styled');
            }
            
            console.log('COD modal shown');
            console.log('Modal classes:', modal.className);
            console.log('Modal style display:', modal.style.display);
            console.log('Modal style zIndex:', modal.style.zIndex);
        } else {
            console.error('COD modal element not found!');
        }
    }

    closeCodModal() {
        const modal = document.getElementById('codModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('active');
            modal.style.display = 'none';
            console.log('COD modal hidden');
        }
    }

    confirmCod() {
        this.closeCodModal();
        this.codConfirmed = true;
        this.createOrder();
    }
}

// Global functions for onclick handlers
function selectPayment(method) {
    if (window.finalizePayment) {
        window.finalizePayment.selectPayment(method);
    }
}

function selectAddress(addressId) {
    if (window.finalizePayment) {
        window.finalizePayment.selectAddress(addressId);
    }
}

function processPayment() {
    if (window.finalizePayment) {
        window.finalizePayment.processPayment();
    }
}

function showCodModal() {
    if (window.finalizePayment) {
        window.finalizePayment.showCodModal();
    }
}

function closeCodModal() {
    if (window.finalizePayment) {
        window.finalizePayment.closeCodModal();
    }
}

function confirmCod() {
    if (window.finalizePayment) {
        window.finalizePayment.confirmCod();
    }
}

function openAddressSidebar() {
    if (window.finalizePayment) {
        window.finalizePayment.openAddressSidebar();
    }
}

function closeAddressSidebar() {
    if (window.finalizePayment) {
        window.finalizePayment.closeAddressSidebar();
    }
}

function toggleAccordion(index) {
    const buttons = document.querySelectorAll('[onclick^="toggleAccordion"]');
    const contents = document.querySelectorAll('.accordion-content');
    const arrows = document.querySelectorAll('.accordion-arrow');
    
    if (contents[index]) {
        const isOpen = contents[index].style.display === 'block';
        
        // Close all accordions
        contents.forEach(content => content.style.display = 'none');
        arrows.forEach(arrow => arrow.style.transform = 'rotate(0deg)');
        
        // Open selected accordion if it was closed
        if (!isOpen) {
            contents[index].style.display = 'block';
            arrows[index].style.transform = 'rotate(180deg)';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing FinalizePayment...');
    
    // Test if modal element exists
    const modal = document.getElementById('codModal');
    console.log('COD Modal element on load:', modal);
    
    window.finalizePayment = new FinalizePayment();
    window.finalizePayment.init();
    
    console.log('FinalizePayment initialized');
});
