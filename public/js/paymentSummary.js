// ===== VELVRA PAYMENT SUMMARY SYSTEM =====

class PaymentSummary {
    constructor() {
        this.discount = 0;
        this.appliedPromoCode = null;
        this.isBuyNow = false;
        this.cart = null;
        this.buyNowItem = null;
        this.addressSaved = false;
        this.init();
    }

    init() {
        this.setupData();
        this.setupEventListeners();
        
        // Calculate cart total first
        if (!this.isBuyNow && this.cart) {
            this.calculateCartTotal();
        }
        
        // Update prices immediately
        this.updatePrices();
        
        // Load promo code state and update prices again if needed
        this.loadPromoCodeState();
        
        // Load addresses
        this.loadAddresses();
        
        // Force a final price update to ensure everything is correct
        setTimeout(() => {
            this.updatePrices();
        }, 100);
    }

    setupData() {
        // Check if this is a buy now order
        const urlParams = new URLSearchParams(window.location.search);
        this.isBuyNow = urlParams.has('productId') && urlParams.has('size') && urlParams.has('color') && urlParams.has('quantity');
        
        if (this.isBuyNow) {
            this.buyNowItem = window.buyNowItem;
            console.log('Buy Now Item:', this.buyNowItem);
        } else {
            this.cart = window.cart;
            console.log('Cart Data:', this.cart);
            
            // Ensure cart data is properly structured
            if (this.cart && !this.cart.total) {
                console.warn('Cart total not found, calculating from items...');
                this.calculateCartTotal();
            }
        }
    }
    
    // Calculate cart total from items if not provided
    calculateCartTotal() {
        if (!this.cart || !this.cart.items) {
            console.log('No cart or cart items found');
            return 0;
        }
        
        console.log('Cart items:', this.cart.items);
        let total = 0;
        
        this.cart.items.forEach((item, index) => {
            console.log(`Processing item ${index}:`, item);
            
            if (!item.product) {
                console.log(`Item ${index} has no product`);
                return;
            }
            
            if (!item.product.variants) {
                console.log(`Item ${index} product has no variants`);
                return;
            }
            
            console.log(`Item ${index} variants:`, item.product.variants);
            console.log(`Item ${index} color: ${item.color}, size: ${item.size}`);
            
            const variant = item.product.variants.find(v => 
                v.color === item.color && v.size === item.size
            );
            
            if (variant) {
                const itemPrice = variant.salePrice || variant.price;
                const itemTotal = itemPrice * item.quantity;
                total += itemTotal;
                console.log(`Item ${index} - Price: ${itemPrice}, Qty: ${item.quantity}, Total: ${itemTotal}`);
            } else {
                console.log(`Item ${index} - No matching variant found for color: ${item.color}, size: ${item.size}`);
            }
        });
        
        this.cart.total = total;
        console.log('Final calculated cart total:', total);
        return total;
    }

    setupEventListeners() {
        // Promo code apply button
        document.getElementById('applyBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.applyPromoCode();
        });

        // Remove promo code button
        document.getElementById('removePromoBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.removePromoCodeManually();
        });

        // Address form submission
        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
            addressForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Check if we're in edit mode
                const isEditMode = addressForm.dataset.editMode === 'true';
                const addressId = addressForm.dataset.addressId;
                
                if (isEditMode && addressId) {
                    this.updateAddress(addressId);
                } else {
                    this.saveAddress();
                }
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

        // Add address button
        const addAddressBtn = document.getElementById('addAddressBtn');
        if (addAddressBtn) {
            addAddressBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!addAddressBtn.disabled) {
                    this.openAddressSidebar();
                }
            });
        }

        // Address sidebar close
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addressSidebar') {
                this.closeAddressSidebar();
            }
        });

        // Touch feedback
        document.querySelectorAll('.touch-scale').forEach(el => {
            el.addEventListener('touchstart', () => el.classList.add('scale-95'));
            el.addEventListener('touchend', () => el.classList.remove('scale-95'));
        });
    }

    // Load promo code state from localStorage
    loadPromoCodeState() {
        try {
            const storedPromoCode = localStorage.getItem('appliedPromoCode');
            const storedDiscount = localStorage.getItem('promoDiscount');
            
            if (storedPromoCode && storedDiscount) {
                this.appliedPromoCode = JSON.parse(storedPromoCode);
                this.discount = parseFloat(storedDiscount);
                
                // Show the discount immediately
                this.showDiscount();
                
                // Validate the stored promo code after a short delay
                setTimeout(() => {
                    this.validateStoredPromoCode();
                }, 500);
            }
        } catch (error) {
            console.error('Error loading promo code state:', error);
            this.clearPromoCodeState();
        }
    }

    // Validate stored promo code
    async validateStoredPromoCode() {
        if (!this.appliedPromoCode) return;

        try {
            const cartTotal = this.getCartTotal();
            
            // Don't validate if cart total is 0 or invalid
            if (!cartTotal || cartTotal <= 0) {
                console.log('Cart total is invalid, skipping promo code validation');
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

            if (result.success) {
                // Update discount amount
                this.discount = result.data.discount;
                this.showDiscount();
                this.showSuccessMessage(`Promo code ${this.appliedPromoCode.code} is still valid!`);
            } else {
                // Promo code is no longer valid
                this.removePromoCode(`Promo code ${this.appliedPromoCode.code} is no longer valid.`);
            }
        } catch (error) {
            console.error('Error validating stored promo code:', error);
            this.removePromoCode('Error validating promo code.');
        }
    }

        // Get current cart total
    getCartTotal() {
        console.log('getCartTotal called - isBuyNow:', this.isBuyNow);
        
        if (this.isBuyNow) {
            if (this.buyNowItem && this.buyNowItem.product) {
                const variant = this.buyNowItem.product.variants.find(v => 
                    v.color === this.buyNowItem.color && v.size === this.buyNowItem.size
                );
                const itemPrice = variant ? (variant.salePrice || variant.price) : 0;
                const total = itemPrice * this.buyNowItem.quantity;
                console.log('Buy Now total:', total);
                return total;
            }
            console.log('Buy Now - no item or product');
            return 0;
        } else {
            console.log('Cart mode - cart data:', this.cart);
            
            // Calculate cart total from items if not available
            if (!this.cart?.total || this.cart.total <= 0) {
                console.log('Cart total is 0 or missing, calculating...');
                this.calculateCartTotal();
            }
            
            // Ensure we have a valid cart total
            const cartTotal = this.cart?.total;
            console.log('Cart total after calculation:', cartTotal);
            
            if (typeof cartTotal === 'number' && cartTotal > 0) {
                return cartTotal;
            }
            
            // Fallback calculation
            console.log('Using fallback calculation');
            return this.calculateCartTotal();
        }
    }

    // Apply promo code
    async applyPromoCode() {
        const input = document.getElementById('couponInput');
        const message = document.getElementById('couponMessage');
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
            const cartTotal = this.getCartTotal();
            
            const response = await fetch('/api/promotions/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    cartTotal: cartTotal
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
                this.showDiscount();
                this.showSuccessMessage(`Promo code ${code} applied!`);
                input.value = '';
                
                // Store in localStorage
                localStorage.setItem('appliedPromoCode', JSON.stringify(this.appliedPromoCode));
                localStorage.setItem('promoDiscount', this.discount.toString());
                
                // Update prices
                this.updatePrices();
            } else {
                this.showErrorMessage(result.message || 'Invalid promo code');
            }
        } catch (error) {
            console.error('Error applying promo code:', error);
            this.showErrorMessage('Error applying promo code');
        }
    }

    // Remove promo code manually
    removePromoCodeManually() {
        if (!this.appliedPromoCode) return;
        
        this.appliedPromoCode = null;
        this.discount = 0;
        this.hideDiscount();
        this.showSuccessMessage('Promo code removed successfully');
        
        // Clear localStorage
        this.clearPromoCodeState();
        
        // Update prices
        this.updatePrices();
    }

    // Remove promo code with message
    removePromoCode(message) {
        this.appliedPromoCode = null;
        this.discount = 0;
        this.hideDiscount();
        this.showErrorMessage(message);
        
        // Clear localStorage
        this.clearPromoCodeState();
        
        // Update prices
        this.updatePrices();
    }

    // Clear promo code state
    clearPromoCodeState() {
        localStorage.removeItem('appliedPromoCode');
        localStorage.removeItem('promoDiscount');
    }

    // Show discount in UI
    showDiscount() {
        const discountRow = document.getElementById('discountRow');
        const discountAmount = document.getElementById('discountAmount');
        const removePromoBtn = document.getElementById('removePromoBtn');
        
        if (discountRow && discountAmount) {
            discountRow.classList.remove('hidden');
            discountAmount.textContent = this.discount.toLocaleString();
            
            // Show remove promo button
            if (removePromoBtn) {
                removePromoBtn.classList.remove('hidden');
            }
        }
    }

    // Hide discount from UI
    hideDiscount() {
        const discountRow = document.getElementById('discountRow');
        const removePromoBtn = document.getElementById('removePromoBtn');
        
        if (discountRow) {
            discountRow.classList.add('hidden');
        }
        
        // Hide remove promo button
        if (removePromoBtn) {
            removePromoBtn.classList.add('hidden');
        }
    }

    // Update prices
    updatePrices() {
        const subtotal = this.getCartTotal();
        const finalTotal = Math.max(0, subtotal - this.discount);
        
        console.log('=== PRICE UPDATE DEBUG ===');
        console.log('Subtotal:', subtotal);
        console.log('Discount:', this.discount);
        console.log('Final Total:', finalTotal);
        console.log('Calculation:', `${subtotal} - ${this.discount} = ${finalTotal}`);
        console.log('========================');
        
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

    // Show success message
    showSuccessMessage(message) {
        const messageElement = document.getElementById('couponMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = 'mt-3 text-sm text-green-600 fade-in';
            messageElement.classList.remove('hidden');
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                messageElement.classList.add('hidden');
            }, 3000);
        }
    }

    // Show error message
    showErrorMessage(message) {
        const messageElement = document.getElementById('couponMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = 'mt-3 text-sm text-red-600 fade-in';
            messageElement.classList.remove('hidden');
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                messageElement.classList.add('hidden');
            }, 3000);
        }
    }

    // Address management functions
    openAddressSidebar() {
        document.getElementById('addressSidebar').classList.remove('invisible');
        document.getElementById('addressSidebar').classList.add('visible');
    }

    closeAddressSidebar() {
        document.getElementById('addressSidebar').classList.remove('visible');
        document.getElementById('addressSidebar').classList.add('invisible');
        
        // Reset the form when closing
        this.resetAddressForm();
    }

    async saveAddress() {
        const form = document.getElementById('addressForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!this.validateAddressForm(formData)) {
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;

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
                // Show success SweetAlert
                await Swal.fire({
                    icon: 'success',
                    title: 'Address Saved!',
                    text: result.message || 'Your address has been saved successfully.',
                    confirmButtonText: 'Great!',
                    confirmButtonColor: '#000',
                    timer: 1000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });

                // Close sidebar and reset form
                this.closeAddressSidebar();
                this.resetAddressForm();
                
                // Update DOM with new address list
                this.updateAddressList(result.addresses);
                
                // Show success message in the address section
                this.showAddressMessage('Address added successfully!', 'success');
                
            } else {
                // Show error SweetAlert
                await Swal.fire({
                    icon: 'error',
                    title: 'Failed to Save Address',
                    text: result.message || 'There was an error saving your address. Please try again.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#000'
                });
            }
        } catch (error) {
            console.error('Error saving address:', error);
            
            // Check if it's an address limit error
            if (error.message && error.message.includes('maximum of 3 addresses')) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Address Limit Reached',
                    text: 'You can only have a maximum of 3 addresses. Please delete an existing address before adding a new one.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#000'
                });
            } else {
                // Show error SweetAlert
                await Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Unable to save address. Please check your connection and try again.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#000'
                });
            }
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateAddressForm(formData) {
        const fields = ['name', 'phone', 'street', 'city', 'state', 'postalCode'];
        let isValid = true;

        fields.forEach(field => {
            const value = formData.get(field);
            
            if (!value || value.trim() === '') {
                this.showFieldError(field, 'This field is required');
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
                console.error('Address list request failed:', response.status);
                this.showAddressMessage('Please add a delivery address to continue with your order.', 'info');
                return;
            }
            
            const result = await response.json();

            if (result.addresses && result.addresses.length > 0) {
                this.updateAddressList(result.addresses);
                // Remove any info messages when addresses are loaded
                const existingMessage = document.querySelector('.address-message');
                if (existingMessage) {
                    existingMessage.remove();
                }
            } else {
                this.showAddressMessage('Please add a delivery address to continue with your order.', 'info');
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
            this.showAddressMessage('Unable to load addresses. Please add a delivery address.', 'error');
        }
    }
    
    // Show address message
    showAddressMessage(message, type = 'info') {
        const addressContent = document.getElementById('addressContent');
        if (!addressContent) return;
        
        // Remove any existing message
        const existingMessage = addressContent.querySelector('.address-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `address-message p-4 rounded-xl mb-4 transform transition-all duration-300 ${
            type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
            type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
            'bg-gray-50 border border-gray-200 text-gray-700'
        }`;
        
        // Get appropriate icon based on type
        let iconPath = '';
        switch (type) {
            case 'error':
                iconPath = 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
                break;
            case 'success':
                iconPath = 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
                break;
            case 'info':
                iconPath = 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
                break;
            default:
                iconPath = 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        }
        
        messageElement.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"></path>
                </svg>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;
        
        // Insert message at the top of address content
        addressContent.insertBefore(messageElement, addressContent.firstChild);
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.style.opacity = '0';
                    messageElement.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                        if (messageElement.parentNode) {
                            messageElement.remove();
                        }
                    }, 300);
                }
            }, 3000);
        }
    }

    updateAddressList(addresses) {
        const addressList = document.getElementById('addressList');
        if (!addressList) return;

        addressList.innerHTML = '';

        // Show address count
        const addressCount = addresses.length;
        const maxAddresses = 3;
        
        // Update or create address count display
        let countDisplay = document.querySelector('.address-count-display');
        if (!countDisplay) {
            countDisplay = document.createElement('div');
            countDisplay.className = 'address-count-display text-sm text-gray-500 mb-3';
            addressList.parentNode.insertBefore(countDisplay, addressList);
        }
        
        countDisplay.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${addressCount} of ${maxAddresses} addresses</span>
                ${addressCount >= maxAddresses ? 
                    '<span class="text-red-500 text-xs">Maximum limit reached</span>' : 
                    `<span class="text-green-500 text-xs">You can add ${maxAddresses - addressCount} more</span>`
                }
            </div>
        `;

        // Update Add Address button state
        const addAddressBtn = document.getElementById('addAddressBtn');
        if (addAddressBtn) {
            if (addressCount >= maxAddresses) {
                addAddressBtn.disabled = true;
                addAddressBtn.classList.add('opacity-50', 'cursor-not-allowed');
                addAddressBtn.classList.remove('touch-scale');
            } else {
                addAddressBtn.disabled = false;
                addAddressBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                addAddressBtn.classList.add('touch-scale');
            }
        }

        addresses.forEach(address => {
            const addressElement = document.createElement('div');
            addressElement.className = `address-item border ${address.defaultShipping ? 'border-gold-500 bg-gold-50' : 'border-gray-200'} rounded-xl p-4 cursor-pointer hover:border-gold-500 transition-all duration-300 transform hover:scale-[1.02] luxury-shadow`;
            addressElement.dataset.addressId = address._id;
            
            addressElement.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <h3 class="font-medium text-gray-900">${address.name}</h3>
                            ${address.defaultShipping ? '<span class="inline-block bg-gold-100 text-gold-800 text-xs px-2 py-1 rounded-full font-medium">Default</span>' : ''}
                        </div>
                        <div class="space-y-1">
                            <p class="text-sm text-gray-600 flex items-center">
                                <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                </svg>
                                ${address.phone}
                            </p>
                            <p class="text-sm text-gray-600 flex items-start">
                                <svg class="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span>${address.street}<br>${address.city}, ${address.state} ${address.postalCode}</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button onclick="event.stopPropagation(); paymentSummary.editAddress('${address._id}')" 
                                class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="Edit Address">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        ${!address.defaultShipping ? `
                            <button onclick="event.stopPropagation(); paymentSummary.setDefaultAddress('${address._id}')" 
                                    class="p-2 text-gray-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                                    title="Set as Default">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                </svg>
                            </button>
                        ` : ''}
                        ${addresses.length > 1 ? `
                            <button onclick="event.stopPropagation(); paymentSummary.deleteAddress('${address._id}')" 
                                    class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Address">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
            
            addressElement.addEventListener('click', () => {
                this.selectAddress(address._id);
            });
            
            addressList.appendChild(addressElement);
        });
    }

    selectAddress(addressId) {
        // Remove previous selection
        document.querySelectorAll('.address-item').forEach(item => {
            item.classList.remove('border-gold-500', 'bg-gold-50', 'ring-2', 'ring-gold-200');
            item.classList.add('border-gray-200');
        });
        
        // Add selection to clicked item
        const selectedItem = document.querySelector(`[data-address-id="${addressId}"]`);
        if (selectedItem) {
            selectedItem.classList.remove('border-gray-200');
            selectedItem.classList.add('border-gold-500', 'bg-gold-50', 'ring-2', 'ring-gold-200');
            
            // Add a subtle animation
            selectedItem.style.transform = 'scale(1.02)';
            setTimeout(() => {
                selectedItem.style.transform = '';
            }, 200);
        }
        
        // Store selected address
        localStorage.setItem('selectedAddressId', addressId);
        
        // Show a brief success message
        this.showAddressMessage('Address selected for delivery!', 'success');
    }

    async editAddress(addressId) {
        try {
            // Fetch the address data
            const response = await fetch(`/address/${addressId}`);
            const result = await response.json();

            if (!result.address) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Address Not Found',
                    text: 'The address you are trying to edit could not be found.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#000'
                });
                return;
            }

            const address = result.address;

            // Populate the form with existing data
            const form = document.getElementById('addressForm');
            form.querySelector('input[name="name"]').value = address.name;
            form.querySelector('input[name="phone"]').value = address.phone;
            form.querySelector('input[name="street"]').value = address.street;
            form.querySelector('input[name="city"]').value = address.city;
            form.querySelector('input[name="state"]').value = address.state;
            form.querySelector('input[name="postalCode"]').value = address.postalCode;
            form.querySelector('input[name="defaultShipping"]').checked = address.defaultShipping;

            // Change form submission to update instead of add
            form.dataset.editMode = 'true';
            form.dataset.addressId = addressId;

            // Update the submit button text
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Update Address';

            // Update the modal title
            const modalTitle = document.querySelector('#addressSidebar h3');
            if (modalTitle) {
                modalTitle.textContent = 'Edit Address';
            }

            // Open the sidebar
            this.openAddressSidebar();

        } catch (error) {
            console.error('Error loading address for edit:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Unable to load address details for editing.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#000'
            });
        }
    }

    async updateAddress(addressId) {
        const form = document.getElementById('addressForm');
        const formData = new FormData(form);
        
        // Validate form
        if (!this.validateAddressForm(formData)) {
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Updating...';
        submitBtn.disabled = true;

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

            const response = await fetch(`/address/${addressId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });
                
            const result = await response.json();
            
            if (result.message && result.addresses) {
                // Show success SweetAlert
                await Swal.fire({
                    icon: 'success',
                    title: 'Address Updated!',
                    text: result.message || 'Your address has been updated successfully.',
                    confirmButtonText: 'Great!',
                    confirmButtonColor: '#000',
                    timer: 1000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });

                // Close sidebar and reset form
                this.closeAddressSidebar();
                this.resetAddressForm();
                
                // Update DOM with new address list
                this.updateAddressList(result.addresses);
                
                // Show success message in the address section
                this.showAddressMessage('Address updated successfully!', 'success');
                
            } else {
                // Show error SweetAlert
                await Swal.fire({
                    icon: 'error',
                    title: 'Failed to Update Address',
                    text: result.message || 'There was an error updating your address. Please try again.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#000'
                });
            }
        } catch (error) {
            console.error('Error updating address:', error);
            
            // Show error SweetAlert
            await Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: 'Unable to update address. Please check your connection and try again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#000'
            });
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    resetAddressForm() {
        const form = document.getElementById('addressForm');
        form.reset();
        form.dataset.editMode = 'false';
        form.dataset.addressId = '';
        
        // Reset the submit button text
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Save Address';

        // Reset the modal title
        const modalTitle = document.querySelector('#addressSidebar h3');
        if (modalTitle) {
            modalTitle.textContent = 'Add New Address';
        }
    }

    async setDefaultAddress(addressId) {
        try {
            const response = await fetch(`/address/${addressId}/default`, {
                method: 'PUT'
            });

            const result = await response.json();

            if (result.message && result.addresses) {
                // Show success SweetAlert
                await Swal.fire({
                    icon: 'success',
                    title: 'Default Address Updated!',
                    text: 'This address is now set as your default shipping address.',
                    confirmButtonText: 'Great!',
                    confirmButtonColor: '#000',
                    timer: 1000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });

                // Update DOM with new address list
                this.updateAddressList(result.addresses);
                
                // Show success message in the address section
                this.showAddressMessage('Default address updated successfully!', 'success');
                
            } else {
                // Show error SweetAlert
                await Swal.fire({
                    icon: 'error',
                    title: 'Failed to Update',
                    text: result.message || 'There was an error updating your default address.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#000'
                });
            }
        } catch (error) {
            console.error('Error setting default address:', error);
            
            // Show error SweetAlert
            await Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: 'Unable to update default address. Please check your connection and try again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#000'
            });
        }
    }

    async deleteAddress(addressId) {
        // Show confirmation dialog
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Delete Address?',
            text: 'Are you sure you want to delete this address? This action cannot be undone.',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/address/${addressId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.message && data.addresses) {
                    // Show success SweetAlert
                    await Swal.fire({
                        icon: 'success',
                        title: 'Address Deleted!',
                        text: 'The address has been deleted successfully.',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#000',
                        timer: 1000,
                        timerProgressBar: true,
                        showConfirmButton: false
                    });

                    // Update DOM with new address list
                    this.updateAddressList(data.addresses);
                    
                    // Show success message in the address section
                    this.showAddressMessage('Address deleted successfully!', 'success');
                    
                } else {
                    // Show error SweetAlert
                    await Swal.fire({
                        icon: 'error',
                        title: 'Failed to Delete',
                        text: data.message || 'There was an error deleting the address.',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#000'
                    });
                }
            } catch (error) {
                console.error('Error deleting address:', error);
                
                // Show error SweetAlert
                await Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Unable to delete address. Please check your connection and try again.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#000'
                });
            }
        }
    }
}

// Initialize payment summary when DOM is loaded
let paymentSummary;
document.addEventListener('DOMContentLoaded', () => {
    paymentSummary = new PaymentSummary();
});

// Global functions for backward compatibility
function openAddressSidebar() {
    if (paymentSummary) {
        paymentSummary.openAddressSidebar();
    }
}

function closeAddressSidebar() {
    if (paymentSummary) {
        paymentSummary.closeAddressSidebar();
    }
}
