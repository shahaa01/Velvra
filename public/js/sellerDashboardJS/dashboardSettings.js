
// Mobile menu functionality
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    mobileMenuOverlay.classList.toggle('hidden');
});

mobileMenuOverlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    mobileMenuOverlay.classList.add('hidden');
});

// Store Profile Form Handling
const storeProfileForm = document.getElementById('storeProfileForm');
const saveAllBtn = document.getElementById('saveAllBtn');

// Form submission
storeProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = storeProfileForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    submitBtn.disabled = true;
    
    try {
        // Collect form data
        const formData = new FormData(storeProfileForm);
        const data = Object.fromEntries(formData);
        
        // Validate phone number format
        if (!/^9\d{9}$/.test(data.phone)) {
            throw new Error('Phone number must be exactly 10 digits starting with 9');
        }
        
        // Validate PAN/VAT number format
        if (!/^\d{9}$/.test(data.panVatNumber)) {
            throw new Error('PAN/VAT number must be exactly 9 digits');
        }
        
        // Make API call to update seller profile
        const response = await fetch('/seller-dashboard/settings/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Failed to update profile');
        }
        
        // Update the display section with new values
        updateDisplaySection(data);
        
        // Show success notification
        showNotification('Store profile updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification(error.message || 'Failed to update profile', 'error');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Save all button functionality
saveAllBtn.addEventListener('click', () => {
    storeProfileForm.dispatchEvent(new Event('submit'));
});

// Update display section with new values
function updateDisplaySection(data) {
    const displayElements = {
        'currentBrandName': data.brandName,
        'currentContactPerson': data.contactPerson,
        'currentPhone': data.phone,
        'currentEmail': data.email,
        'currentBusinessType': data.businessType,
        'currentLocation': data.location,
        'currentCity': data.city,
        'currentOwnerName': data.ownerName,
        'currentPanVatNumber': data.panVatNumber
    };
    
    Object.keys(displayElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = displayElements[id];
        }
    });
}

// Real-time validation
const phoneInput = document.getElementById('phone');
const panVatInput = document.getElementById('panVatNumber');

phoneInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value && !/^9\d{9}$/.test(value)) {
        phoneInput.classList.add('border-red-500');
        phoneInput.classList.remove('border-beige');
    } else {
        phoneInput.classList.remove('border-red-500');
        phoneInput.classList.add('border-beige');
    }
});

// PAN/VAT input is readonly, but we can still validate on form submission
panVatInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value && !/^\d{9}$/.test(value)) {
        panVatInput.classList.add('border-red-500');
        panVatInput.classList.remove('border-beige');
    } else {
        panVatInput.classList.remove('border-red-500');
        panVatInput.classList.add('border-beige');
    }
});

// Utility functions
function showNotification(message, type = 'success') {
    const notification = type === 'success' ? 
        document.getElementById('successNotification') : 
        document.getElementById('errorNotification');
    
    const messageElement = type === 'success' ? 
        document.getElementById('notificationMessage') : 
        document.getElementById('errorMessage');
    
    messageElement.textContent = message;
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateY(100%)';
    }, 3000);
}

// Initialize
window.addEventListener('load', () => {
    // Any initialization code here
    console.log('Seller settings page loaded');
});
