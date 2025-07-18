// User Settings JavaScript

// Toggle switches
document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        const setting = toggle.dataset.toggle;
        const isActive = toggle.classList.contains('active');
        
        // Save preference (simulated)
        localStorage.setItem(`setting_${setting}`, isActive);
        
        if (setting === '2fa' && isActive) {
            showNotification('Two-factor authentication setup required. Check your email.');
        }
    });
});

// Form handling for user settings
document.addEventListener('DOMContentLoaded', function() {
    // Personal Information Form
    const personalForm = document.getElementById('personalForm');
    if (personalForm) {
        personalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
                
                const response = await fetch('/dashboard/settings/personal-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        firstName: formData.get('firstName'),
                        lastName: formData.get('lastName'),
                        email: formData.get('email'),
                        phone: formData.get('phone'),
                        birthMonth: parseInt(formData.get('birthMonth')) || null,
                        birthDay: parseInt(formData.get('birthDay')) || null,
                        birthYear: parseInt(formData.get('birthYear')) || null
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showNotification('Personal information updated successfully!', 'success');
                } else {
                    showNotification(data.message || 'Failed to update personal information', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Failed to update personal information', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Address Form
    const addressForm = document.getElementById('addressForm');
    if (addressForm) {
        addressForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Updating...';
                
                const response = await fetch('/dashboard/settings/address', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        street: formData.get('street'),
                        apartment: formData.get('apartment'),
                        city: formData.get('city'),
                        state: formData.get('state'),
                        postalCode: formData.get('postalCode')
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showNotification('Address updated successfully!', 'success');
                } else {
                    showNotification(data.message || 'Failed to update address', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Failed to update address', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Password Form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Client-side validation
            const newPassword = formData.get('newPassword');
            const confirmPassword = formData.get('confirmPassword');
            
            if (newPassword !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 8) {
                showNotification('Password must be at least 8 characters long', 'error');
                return;
            }
            
            if (!/(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
                showNotification('Password must contain at least one letter and one number', 'error');
                return;
            }
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Updating...';
                
                const response = await fetch('/dashboard/settings/password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        currentPassword: formData.get('currentPassword'),
                        newPassword: formData.get('newPassword'),
                        confirmPassword: formData.get('confirmPassword')
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showNotification('Password updated successfully!', 'success');
                    this.reset();
                } else {
                    showNotification(data.message || 'Failed to update password', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Failed to update password', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Logout Modal
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');

    if (logoutBtn && logoutModal) {
        logoutBtn.addEventListener('click', () => {
            logoutModal.classList.remove('hidden');
        });

        cancelLogout?.addEventListener('click', () => {
            logoutModal.classList.add('hidden');
        });

        confirmLogout?.addEventListener('click', () => {
            window.location.href = '/logout';
        });
    }

    // Close modals on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            logoutModal?.classList.add('hidden');
        }
    });
});

// Notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 hover:opacity-75">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Delete account
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const deleteModal = document.getElementById('deleteModal');
const deleteConfirmInput = document.getElementById('deleteConfirm');
const confirmDeleteBtn = document.getElementById('confirmDelete');

if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
        deleteModal.classList.remove('hidden');
    });
}

if (deleteConfirmInput) {
    deleteConfirmInput.addEventListener('input', (e) => {
        confirmDeleteBtn.disabled = e.target.value !== 'DELETE';
    });
}

const cancelDelete = document.getElementById('cancelDelete');
if (cancelDelete) {
    cancelDelete.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        deleteConfirmInput.value = '';
        confirmDeleteBtn.disabled = true;
    });
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (deleteConfirmInput.value === 'DELETE') {
            showNotification('Account deletion in progress...');
            setTimeout(() => {
                window.location.href = '/auth/logout';
            }, 2000);
        }
    });
}

// Close modals on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (deleteModal) deleteModal.classList.add('hidden');
        if (logoutModal) logoutModal.classList.add('hidden');
    }
}); 