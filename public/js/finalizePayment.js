let selectedPayment = null;
let selectedAddress = null;
let codConfirmed = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    let addresses = window.userAddresses || [];
    if (!addresses.length) {
        // Fallback to DOM if window.userAddresses is not available
        const addressCards = document.querySelectorAll('.address-card');
        addresses = Array.from(addressCards).map(card => ({
            _id: card.dataset.addressId,
            defaultShipping: card.classList.contains('default-shipping'),
        }));
    }
    if (addresses.length === 1) {
        selectedAddress = addresses[0]._id || addresses[0].id;
        selectAddress(selectedAddress);
    } else if (addresses.length > 1) {
        const defaultAddr = addresses.find(addr => addr.defaultShipping);
        if (defaultAddr) {
            selectedAddress = defaultAddr._id || defaultAddr.id;
            selectAddress(selectedAddress);
        } else {
            selectedAddress = addresses[0]._id || addresses[0].id;
            selectAddress(selectedAddress);
        }
    }

    // Initialize address modal functionality
    initializeAddressModal();
});

function selectPayment(method) {
    selectedPayment = method;
    
    // Remove active state from all payment cards
    document.querySelectorAll('.payment-card').forEach(card => {
        card.classList.remove('active');
        card.querySelector('.payment-check').classList.add('hidden');
    });
    
    // Add active state to selected card
    const selectedCard = document.querySelector(`input[value="${method}"]`).closest('.payment-card');
    selectedCard.classList.add('active');
    selectedCard.querySelector('.payment-check').classList.remove('hidden');
    
    // Show/hide payment benefit
    const benefitDiv = document.getElementById('paymentBenefit');
    if (method === 'cod') {
        benefitDiv.classList.add('hidden');
    } else {
        benefitDiv.classList.remove('hidden');
    }
}

function selectAddress(addressId) {
    selectedAddress = addressId;
    
    // Remove active state from all address cards
    document.querySelectorAll('.address-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active state to selected card
    const selectedCard = document.getElementById(`address-${addressId}`);
    selectedCard.classList.add('active');
}

// Process payment and create order
async function processPayment() {
    const confirmBtn = document.getElementById('confirmBtn');
    const originalText = confirmBtn.innerHTML;
    
    // Validate payment method
    if (!selectedPayment) {
        showNotification('Please select a payment method', 'error');
        return;
    }
    
    // Check if there are any addresses available
    const addressCards = document.querySelectorAll('.address-card');
    if (addressCards.length === 0) {
        showNotification('Please add a shipping address first', 'error');
        return;
    }
    
    // If no address is selected, auto-select the first/default one
    if (!selectedAddress) {
        const defaultAddress = document.querySelector('.address-card.default-shipping');
        if (defaultAddress) {
            selectedAddress = defaultAddress.dataset.addressId;
            selectAddress(selectedAddress);
        } else {
            selectedAddress = addressCards[0].dataset.addressId;
            selectAddress(selectedAddress);
        }
    }
    
    // Show processing overlay
    const processingOverlay = document.getElementById('processingOverlay');
    processingOverlay.classList.remove('hidden');
    
    // Disable the confirm button
    confirmBtn.disabled = true;
    
    try {
        // Get address data
        let shippingAddress;
        if (typeof selectedAddress === 'string') {
            // Address ID was selected, get the address data
            const addressCard = document.getElementById(`address-${selectedAddress}`);
            shippingAddress = {
                name: addressCard.dataset.name,
                phone: addressCard.dataset.phone,
                street: addressCard.dataset.street,
                city: addressCard.dataset.city,
                state: addressCard.dataset.state,
                postalCode: addressCard.dataset.postalCode
            };
        } else {
            // Address object was already selected
            shippingAddress = selectedAddress;
        }
        
        // Determine if this is a buy now order or cart order
        const urlParams = new URLSearchParams(window.location.search);
        const isBuyNow = urlParams.has('productId') && urlParams.has('size') && urlParams.has('color') && urlParams.has('quantity');
        
        let response;
        if (isBuyNow) {
            // Buy Now order
            response = await fetch('/payment/create-buyNow-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentMethod: selectedPayment,
                    shippingAddress: shippingAddress,
                    productId: urlParams.get('productId'),
                    size: urlParams.get('size'),
                    color: urlParams.get('color'),
                    quantity: urlParams.get('quantity')
                })
            });
        } else {
            // Cart order
            response = await fetch('/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentMethod: selectedPayment,
                    shippingAddress: shippingAddress
                })
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Update overlay message for success
            const overlayTitle = processingOverlay.querySelector('h3');
            const overlayMessage = processingOverlay.querySelector('p');
            const overlayContent = processingOverlay.querySelector('div > div');
            
            // Add success animation
            overlayContent.classList.add('success-animation');
            
            // Update content
            overlayTitle.textContent = 'Order Created Successfully!';
            overlayMessage.textContent = 'Redirecting to your orders...';
            
            // Update the processing steps to show completion
            const processingSteps = processingOverlay.querySelectorAll('.flex.items-center.justify-center');
            processingSteps.forEach((step, index) => {
                const dot = step.querySelector('.w-2.h-2');
                const text = step.querySelector('span');
                
                if (index === 0) {
                    dot.className = 'w-2 h-2 bg-green-500 rounded-full';
                    text.textContent = 'Payment method validated ✓';
                } else if (index === 1) {
                    dot.className = 'w-2 h-2 bg-green-500 rounded-full';
                    text.textContent = 'Order created ✓';
                } else if (index === 2) {
                    dot.className = 'w-2 h-2 bg-green-500 rounded-full';
                    text.textContent = 'Confirmation ready ✓';
                }
            });
            
            // Redirect based on payment method
            if (selectedPayment === 'cod') {
                // For COD, redirect to order confirmation
                setTimeout(() => {
                    window.location.href = `/dashboard/orders`;
                }, 2500);
            } else {
                // For digital payments, redirect to payment gateway
                setTimeout(() => {
                    window.location.href = `/payment/gateway/${result.order._id}`;
                }, 2500);
            }
        } else {
            // Hide overlay and show error
            processingOverlay.classList.add('hidden');
            showNotification(result.error || 'Failed to create order', 'error');
        }
        
    } catch (error) {
        console.error('Error creating order:', error);
        // Hide overlay and show error
        processingOverlay.classList.add('hidden');
        showNotification('An error occurred while creating your order', 'error');
    } finally {
        // Reset button state
        confirmBtn.disabled = false;
    }
}

// Function to hide processing overlay
function hideProcessingOverlay() {
    const processingOverlay = document.getElementById('processingOverlay');
    if (processingOverlay) {
        processingOverlay.classList.add('hidden');
    }
}

// Function to show processing overlay
function showProcessingOverlay() {
    const processingOverlay = document.getElementById('processingOverlay');
    if (processingOverlay) {
        processingOverlay.classList.remove('hidden');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // Set background color based on type
    if (type === 'success') {
        notification.className += ' bg-green-500 text-white';
    } else if (type === 'error') {
        notification.className += ' bg-red-500 text-white';
    } else {
        notification.className += ' bg-blue-500 text-white';
    }
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function toggleAccordion(index) {
    const accordionItems = document.querySelectorAll('.accordion-content');
    const arrows = document.querySelectorAll('.accordion-arrow');
    
    // Toggle the clicked item
    const item = accordionItems[index];
    const arrow = arrows[index];
    
    if (!item) return;
    if (item.style.maxHeight) {
        item.style.maxHeight = null;
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        // Close all other items
        accordionItems.forEach((otherItem, otherIndex) => {
            if (otherIndex !== index && otherItem) {
                otherItem.style.maxHeight = null;
                if (arrows[otherIndex]) arrows[otherIndex].style.transform = 'rotate(0deg)';
            }
        });
        // Open the clicked item
        item.style.maxHeight = item.scrollHeight + 'px';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    }
}

function showCodModal() {
    document.getElementById('codModal').classList.remove('hidden');
}

function closeCodModal() {
    document.getElementById('codModal').classList.add('hidden');
}

function confirmCod() {
    codConfirmed = true;
    closeCodModal();
    processPayment();
}

// Address Modal Functionality
function initializeAddressModal() {
    const addAddressBtn = document.getElementById('addAddressBtn');
    const addressForm = document.getElementById('addressForm');

    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openAddressSidebar();
        });
    }

    if (addressForm) {
        // Initialize form validation
        addressForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                validateField(e.target.name, e.target.value);
            });
        });

        // Form submission
        addressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(addressForm);
            const addressData = Object.fromEntries(formData.entries());
            
            // Convert checkbox value to boolean
            addressData.defaultShipping = addressData.defaultShipping === 'on';
            
            // Validate all fields
            let isValid = true;
            for (const [field, value] of Object.entries(addressData)) {
                if (!validateField(field, value)) {
                    isValid = false;
                }
            }
            
            if (!isValid) return;
            
            try {
                const addressId = addressForm.dataset.addressId;
                const method = addressId ? 'PUT' : 'POST';
                const url = addressId ? `/address/${addressId}` : '/address/add';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(addressData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Update address list
                    updateAddressList(data.addresses);
                    // Close sidebar and reset form
                    closeAddressSidebar();
                    addressForm.reset();
                    delete addressForm.dataset.addressId;
                    
                    // Show success message
                    showNotification('Address saved successfully!', 'success');
                    
                    // Reload page to refresh address list
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showNotification(data.error || 'Failed to save address', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Failed to save address', 'error');
            }
        });
    }
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
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters long';
            }
            break;
        case 'phone':
            if (!/^[0-9]{10}$/.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid 10-digit phone number';
            }
            break;
        case 'street':
            if (!value.trim()) {
                isValid = false;
                errorMessage = 'Street address is required';
            }
            break;
        case 'city':
            if (!value.trim()) {
                isValid = false;
                errorMessage = 'City is required';
            }
            break;
        case 'state':
            if (!value.trim()) {
                isValid = false;
                errorMessage = 'State is required';
            }
            break;
        case 'postalCode':
            if (!/^[0-9]{5}$/.test(value)) {
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

    if (!isValid) {
        errorElement.textContent = errorMessage;
        errorElement.classList.remove('hidden');
    } else {
        errorElement.classList.add('hidden');
    }

    return isValid;
};

// Function to update address list
function updateAddressList(addresses) {
    const addressList = document.getElementById('addressList');
    const addressContent = document.getElementById('addressContent');
    
    if (!addresses || addresses.length === 0) {
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
            </div>
        </div>
    `).join('');
}

// Make closeAddressSidebar globally accessible
window.closeAddressSidebar = closeAddressSidebar;

// Add touch scale effect
document.addEventListener('DOMContentLoaded', function() {
    const touchElements = document.querySelectorAll('.touch-scale');
    
    touchElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        element.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });
});

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});