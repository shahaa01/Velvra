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
    
    // Show loading state
    confirmBtn.innerHTML = '<span class="relative z-10">Processing...</span>';
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
            showNotification('Order created successfully!', 'success');
            
            // Redirect based on payment method
            if (selectedPayment === 'cod') {
                // For COD, redirect to order confirmation
                setTimeout(() => {
                    window.location.href = `/dashboard/orders`;
                }, 1500);
            } else {
                // For digital payments, redirect to payment gateway
                setTimeout(() => {
                    window.location.href = `/payment/gateway/${result.order._id}`;
                }, 1500);
            }
        } else {
            showNotification(result.error || 'Failed to create order', 'error');
        }
        
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('An error occurred while creating your order', 'error');
    } finally {
        // Reset button state
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
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
    
    if (item.style.maxHeight) {
        item.style.maxHeight = null;
        arrow.style.transform = 'rotate(0deg)';
    } else {
        // Close all other items
        accordionItems.forEach((otherItem, otherIndex) => {
            if (otherIndex !== index) {
                otherItem.style.maxHeight = null;
                arrows[otherIndex].style.transform = 'rotate(0deg)';
            }
        });
        
        // Open the clicked item
        item.style.maxHeight = item.scrollHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
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
