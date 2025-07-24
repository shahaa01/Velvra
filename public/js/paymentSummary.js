let quantity = 1;
let basePrice = 24500;
let discount = 0;
let addressSaved = false;

// Check if this is a buy now order
const urlParams = new URLSearchParams(window.location.search);
const isBuyNow = urlParams.has('productId') && urlParams.has('size') && urlParams.has('color') && urlParams.has('quantity');

// Helper function to get stock for specific color and size
function getStockForColorSize(product, colorName, sizeName) {
    if (!product.colors || !Array.isArray(product.colors)) return 0;
    const color = product.colors.find(c => c.name === colorName);
    if (!color) return 0;
    const sizeObj = color.sizes.find(s => s.size === sizeName);
    return sizeObj ? sizeObj.stock : 0;
}

// Check if quantity change is allowed based on stock
function canIncreaseQuantity(product, colorName, currentQuantity) {
    const currentStock = getStockForColorSize(product, colorName, product.size);
    return currentQuantity < currentStock;
}

// Show premium stock error message
function showStockError(message) {
    // Remove any existing error messages
    removeStockError();
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'stock-error-message text-red-500 text-sm mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg animate-fade-in';
    errorDiv.textContent = message;
    errorDiv.style.animation = 'fadeIn 0.3s ease-out';
    
    // Find the quantity controls container and insert error message
    const quantityContainer = document.querySelector('.quantity-controls');
    if (quantityContainer) {
        quantityContainer.appendChild(errorDiv);
    }
    
    // Auto-remove error message after 3 seconds
    setTimeout(() => {
        removeStockError();
    }, 3000);
}

// Remove stock error message
function removeStockError() {
    const existingError = document.querySelector('.stock-error-message');
    if (existingError) {
        existingError.remove();
    }
}

// Update stock validation for quantity buttons
function updateStockValidation() {
    if (isBuyNow) {
        // For buy now, get product data from the page
        const productData = window.buyNowItem?.product;
        const colorName = window.buyNowItem?.color;
        
        if (productData && colorName) {
            const currentStock = getStockForColorSize(productData, colorName, productData.size);
            const increaseBtn = document.querySelector('.increase-btn');
            
            if (increaseBtn) {
                if (quantity >= currentStock) {
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
    } else {
        // For cart items, update each item's stock validation
        document.querySelectorAll('[data-cart-item-id]').forEach(itemElement => {
            const cartItemId = itemElement.dataset.cartItemId;
            const item = window.cart?.items?.find(item => item._id === cartItemId);
            
            if (item) {
                const currentStock = getStockForColorSize(item.product, item.color, item.product.size);
                const increaseBtn = itemElement.querySelector('.increase-btn');
                
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
        });
    }
}

function updateQuantity(change) {
    // Only allow quantity updates for cart orders, not buy now
    if (isBuyNow) return;
    
    const newQuantity = Math.max(1, quantity + change);
    
    // Check stock limit for increase operations
    if (change > 0) {
        const productData = window.buyNowItem?.product;
        const colorName = window.buyNowItem?.color;
        
        if (productData && colorName) {
            const currentStock = getStockForColorSize(productData, colorName, productData.size);
            if (quantity >= currentStock) {
                showStockError(`Sorry, we only have ${currentStock} of this item in stock.`);
                return;
            }
        }
    }
    
    quantity = newQuantity;
    document.getElementById('quantity').textContent = quantity;
    updatePrices();
    updateStockValidation();
}

function updatePrices() {
    // Only update prices for cart orders, not buy now
    if (isBuyNow) return;
    
    const subtotal = basePrice * quantity;
    const total = subtotal - discount;
    
    document.getElementById('subtotal').textContent = `NPR ${subtotal.toLocaleString()}`;
    document.getElementById('totalPrice').textContent = `NPR ${total.toLocaleString()}`;
}

// Address Form Handling
const addressForm = document.getElementById('addressForm');
const addressList = document.getElementById('addressList');
const addAddressBtn = document.getElementById('addAddressBtn');

// Show sidebar - Fix event listener setup
if (addAddressBtn) {
    addAddressBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Add address button clicked');
        openAddressSidebar();
    });
} else {
    console.error('Add address button not found');
}

function openAddressSidebar() {
    document.getElementById('addressSidebar').classList.remove('invisible');
    document.body.classList.add('modal-open');
}
function closeAddressSidebar() {
    document.getElementById('addressSidebar').classList.add('invisible');
    document.body.classList.remove('modal-open');
}

// Form validation
const validateField = (field, value) => {
    const errorElement = document.getElementById(`${field}Error`);
    let isValid = true;
    let errorMessage = '';

    switch (field) {
        case 'name':
            if (!value || value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters long';
            }
            break;
        case 'phone':
            if (!value || !/^[0-9]{10}$/.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid 10-digit phone number';
            }
            break;
        case 'street':
            if (!value || !value.trim()) {
                isValid = false;
                errorMessage = 'Street address is required';
            }
            break;
        case 'city':
            if (!value || !value.trim()) {
                isValid = false;
                errorMessage = 'City is required';
            }
            break;
        case 'state':
            if (!value || !value.trim()) {
                isValid = false;
                errorMessage = 'State is required';
            }
            break;
        case 'postalCode':
            if (!value || !/^[0-9]{5}$/.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid 5-digit postal code';
            }
            break;
        case 'defaultShipping':
            // Checkbox is optional, always valid
            isValid = true;
            break;
        default:
            // For any other fields, assume valid
            isValid = true;
            break;
    }

    if (errorElement) {
        if (!isValid) {
            errorElement.textContent = errorMessage;
            errorElement.classList.remove('hidden');
        } else {
            errorElement.classList.add('hidden');
        }
    }

    return isValid;
};

// Real-time validation
addressForm.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
        validateField(e.target.name, e.target.value);
    });
});

// Function to update address list
function updateAddressList(addresses) {
    if (!addresses || addresses.length === 0) {
        addressList.innerHTML = `
            <div class="py-4 text-gray-500">
                No addresses found. Please add a delivery address.
            </div>
        `;
        return;
    }

    addressList.innerHTML = addresses.map((address) => `
        <div class="address-card p-4 border ${address.defaultShipping ? 'border-gold-500 bg-gold-50 default-shipping' : 'border-gray-200'} rounded-xl transition-all duration-300 cursor-pointer"
             id="address-${address._id}"
             data-address-id="${address._id}"
             data-name="${address.name}"
             data-phone="${address.phone}"
             data-street="${address.street}"
             data-city="${address.city}"
             data-state="${address.state}"
             data-postal-code="${address.postalCode}"
             onclick="selectAddress('${address._id}')">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <h4 class="font-medium">${address.name}</h4>
                        ${address.defaultShipping ? 
                            '<span class="px-2 py-1 text-xs bg-gold-100 text-gold-700 rounded-full">Default</span>' : 
                            ''}
                    </div>
                    <p class="text-sm text-gray-500 mt-1">${address.phone}</p>
                    <p class="text-sm text-gray-500 mt-1">
                        ${address.street}<br>
                        ${address.city}, ${address.state} ${address.postalCode}
                    </p>
                </div>
                <div class="flex items-center space-x-2" onclick="event.stopPropagation()">
                    <button onclick="editAddress('${address._id}')" class="text-sm text-gray-500 hover:text-gray-700 touch-scale">
                        Edit
                    </button>
                    ${!address.defaultShipping ? `
                        <button onclick="setDefaultAddress('${address._id}')" class="text-sm text-gold-500 hover:text-gold-700 touch-scale">
                            Set as Default
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Function to edit address
async function editAddress(addressId) {
    try {
        const response = await fetch(`/address/${addressId}`);
        const data = await response.json();
        
        if (response.ok) {
            const address = data.address;
            // Fill form with address data
            Object.keys(address).forEach(key => {
                const input = addressForm.querySelector(`[name="${key}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = address[key];
                    } else {
                        input.value = address[key];
                    }
                }
            });
            
            // Add address ID to form for update
            addressForm.dataset.addressId = addressId;
            
            // Open sidebar
            openAddressSidebar();
        }
    } catch (error) {
        console.error('Error loading address:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load address details'
        });
    }
}

// Function to set default address
async function setDefaultAddress(addressId) {
    try {
        const response = await fetch(`/address/${addressId}/default`, {
            method: 'PUT'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            updateAddressList(data.addresses);
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Default address updated',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Failed to update default address'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update default address'
        });
    }
}

// Load addresses on page load
async function loadAddresses() {
    try {
        const response = await fetch('/address');
        const data = await response.json();
        
        if (response.ok) {
            updateAddressList(data.addresses);
            if (data.addresses.length > 0) {
                addressSaved = true;
                
                // Auto-select default address
                const defaultAddress = data.addresses.find(addr => addr.defaultShipping);
                if (defaultAddress) {
                    selectAddress(defaultAddress._id);
                }
            }
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load addresses'
        });
    }
}

// Make closeAddressSidebar globally accessible for onclick in EJS
window.closeAddressSidebar = closeAddressSidebar;

// Load addresses when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing address form...');
    
    // Re-get the form element to ensure it exists
    const addressForm = document.getElementById('addressForm');
    console.log('Address form found:', !!addressForm);
    
    if (addressForm) {
        // Add form submission event listener
        addressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted');
            
            const formData = new FormData(addressForm);
            const addressData = Object.fromEntries(formData.entries());
            
            console.log('Form data:', addressData);
            
            // Convert checkbox value to boolean
            addressData.defaultShipping = addressData.defaultShipping === 'on';
            
            console.log('Processed address data:', addressData);
            
            // Validate all required fields (excluding checkbox)
            const requiredFields = ['name', 'phone', 'street', 'city', 'state', 'postalCode'];
            let isValid = true;
            
            for (const field of requiredFields) {
                if (!validateField(field, addressData[field])) {
                    isValid = false;
                }
            }
            
            console.log('Form validation result:', isValid);
            
            if (!isValid) return;
            
            try {
                const addressId = addressForm.dataset.addressId;
                const method = addressId ? 'PUT' : 'POST';
                const url = addressId ? `/address/${addressId}` : '/address/add';
                
                console.log('Sending request to:', url, 'with method:', method);
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(addressData)
                });
                
                const data = await response.json();
                console.log('Response:', data);
                
                if (response.ok) {
                    // Update address list
                    updateAddressList(data.addresses);
                    // Close sidebar and reset form
                    closeAddressSidebar();
                    addressForm.reset();
                    delete addressForm.dataset.addressId;
                    addressSaved = true;
                    
                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: addressId ? 'Address updated successfully' : 'Address saved successfully',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error || 'Failed to save address'
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to save address'
                });
            }
        });
        
        // Initialize form validation
        addressForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                validateField(e.target.name, e.target.value);
            });
        });
    } else {
        console.error('Address form not found on DOM load');
    }
    
    loadAddresses();
    updateStockValidation(); // Initialize stock validation
});

// Coupon handling
document.getElementById('applyBtn').addEventListener('click', () => {
    const couponInput = document.getElementById('couponInput');
    const message = document.getElementById('couponMessage');
    const code = couponInput.value.trim().toUpperCase();
    
    if (code === 'VELVRA20') {
        if (isBuyNow) {
            // For buy now, get the price from the page
            const subtotalElement = document.getElementById('subtotal');
            const subtotalText = subtotalElement.textContent.replace('₹', '').replace(',', '');
            const currentSubtotal = parseInt(subtotalText);
            discount = Math.floor(currentSubtotal * 0.2);
        } else {
            discount = Math.floor(basePrice * quantity * 0.2);
        }
        
        document.getElementById('discountAmount').textContent = discount.toLocaleString();
        document.getElementById('discountRow').classList.remove('hidden');
        message.textContent = 'Coupon applied successfully!';
        message.className = 'mt-3 text-sm text-green-600 fade-in';
        message.classList.remove('hidden');
        
        if (!isBuyNow) {
            updatePrices();
        } else {
            // Update total for buy now
            const subtotalElement = document.getElementById('subtotal');
            const subtotalText = subtotalElement.textContent.replace('₹', '').replace(',', '');
            const currentSubtotal = parseInt(subtotalText);
            const total = currentSubtotal - discount;
            document.getElementById('totalPrice').textContent = `₹${total.toLocaleString()}`;
        }
    } else if (code) {
        message.textContent = 'Invalid coupon code';
        message.className = 'mt-3 text-sm text-red-600 fade-in';
        message.classList.remove('hidden');
    }
});

// Add touch feedback
document.querySelectorAll('.touch-scale').forEach(el => {
    el.addEventListener('touchstart', () => el.classList.add('scale-95'));
    el.addEventListener('touchend', () => el.classList.remove('scale-95'));
});

// Quantity Controls with stock validation
if (!isBuyNow) {
    document.querySelectorAll('.increase-btn, .decrease-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const cartItemId = this.dataset.cartItemId;
            const change = this.classList.contains('increase-btn') ? 1 : -1;
            
            // Check if button is disabled (for increase)
            if (change > 0 && this.disabled) return;
            
            await updateQuantity(cartItemId, change);
        });
    });
}

async function updateQuantity(cartItemId, change) {
    try {
        // Get the cart item data
        const item = window.cart?.items?.find(item => item._id === cartItemId);
        if (!item) return;
        
        const currentQuantity = item.quantity;
        const newQuantity = Math.max(1, currentQuantity + change);
        
        // Check stock limit for increase operations
        if (change > 0) {
            const currentStock = getStockForColorSize(item.product, item.color, item.product.size);
            if (currentQuantity >= currentStock) {
                showStockError(`Sorry, we only have ${currentStock} of this item in stock.`);
                return;
            }
        }
        
        const response = await fetch('/cart/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cartItemId,
                change
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update quantity');
        }

        const data = await response.json();
        
        // Update the quantity display
        const itemElement = document.querySelector(`[data-cart-item-id="${cartItemId}"]`);
        const quantityDisplay = itemElement.querySelector('.quantity-display');
        quantityDisplay.textContent = data.cart.items.find(item => item._id === cartItemId).quantity;

        // Update the item total
        const itemTotal = itemElement.querySelector('.item-total');
        const updatedItem = data.cart.items.find(item => item._id === cartItemId);
        const itemPrice = updatedItem.product.salePrice || updatedItem.product.price;
        itemTotal.textContent = `₹${(itemPrice * updatedItem.quantity).toLocaleString()}`;

        // Update the cart totals
        document.getElementById('subtotal').textContent = `₹${data.total.toLocaleString()}`;
        document.getElementById('totalPrice').textContent = `₹${data.total.toLocaleString()}`;
        
        // Update stock validation
        updateStockValidation();

    } catch (error) {
        console.error('Error updating quantity:', error);
        alert(error.message || 'Failed to update quantity. Please try again.');
    }
}

// Update cart UI with new data
function updateCartUI(cart) {
    // Update each item's quantity and price
    cart.items.forEach(item => {
        const itemElement = document.querySelector(`[data-cart-item-id="${item._id}"]`);
        if (itemElement) {
            // Update quantity
            const quantityElement = itemElement.querySelector('.quantity-display');
            if (quantityElement) {
                quantityElement.textContent = item.quantity;
            }

            // Update price
            const priceElement = itemElement.querySelector('.item-total');
            if (priceElement) {
                const total = (item.product.salePrice || item.product.price) * item.quantity;
                priceElement.textContent = `₹${total.toLocaleString()}`;
            }
        }
    });

    // Update cart totals
    document.getElementById('subtotal').textContent = `₹${cart.total.toLocaleString()}`;
    document.getElementById('totalPrice').textContent = `₹${cart.total.toLocaleString()}`;
    
    // Update stock validation
    updateStockValidation();
}

// Function to select address
function selectAddress(addressId) {
    // Remove active state from all address cards
    document.querySelectorAll('.address-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active state to selected card
    const selectedCard = document.getElementById(`address-${addressId}`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
}
