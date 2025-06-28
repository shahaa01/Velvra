// User Settings JavaScript

// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    });
}

if (overlay) {
    overlay.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    });
}

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

// Form submissions
const personalForm = document.getElementById('personalForm');
if (personalForm) {
    personalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        simulateSaving(() => {
            showNotification('Personal information updated successfully!');
        });
    });
}

const addressForm = document.getElementById('addressForm');
if (addressForm) {
    addressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        simulateSaving(() => {
            showNotification('Shipping address updated successfully!');
        });
    });
}

const passwordForm = document.getElementById('passwordForm');
if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Please fill in all password fields', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            showNotification('New password must be at least 8 characters', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }
        
        simulateSaving(() => {
            document.getElementById('passwordForm').reset();
            showNotification('Password changed successfully!');
        });
    });
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

// Logout modal
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const cancelLogout = document.getElementById('cancelLogout');
const confirmLogout = document.getElementById('confirmLogout');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
    });
}

if (cancelLogout) {
    cancelLogout.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
    });
}

if (confirmLogout) {
    confirmLogout.addEventListener('click', () => {
        window.location.href = '/auth/logout';
    });
}

// Utility functions
function simulateSaving(callback) {
    // Show loading state on buttons
    const buttons = document.querySelectorAll('button[type="submit"]:not([disabled])');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    });

    setTimeout(() => {
        buttons.forEach(btn => {
            btn.disabled = false;
            if (btn.closest('#personalForm')) {
                btn.innerHTML = 'Save Changes';
            } else if (btn.closest('#addressForm')) {
                btn.innerHTML = 'Update Address';
            } else if (btn.closest('#passwordForm')) {
                btn.innerHTML = 'Change Password';
            }
            btn.classList.add('success-pulse');
            setTimeout(() => btn.classList.remove('success-pulse'), 500);
        });
        callback();
    }, 1500);
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.className = `fixed bottom-20 lg:bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 ${
        type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`;
    
    notification.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        notification.style.transform = 'translateY(100%)';
    }, 3000);
}

// Close modals on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (deleteModal) deleteModal.classList.add('hidden');
        if (logoutModal) logoutModal.classList.add('hidden');
    }
}); 