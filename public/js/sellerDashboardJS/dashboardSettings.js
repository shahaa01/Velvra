
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

// Tab functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Update active states
        tabButtons.forEach(btn => {
            btn.classList.remove('active', 'text-charcoal');
            btn.classList.add('text-gray-700');
        });
        button.classList.add('active', 'text-charcoal');
        button.classList.remove('text-gray-700');
        
        // Show corresponding content
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${targetTab}Tab`).classList.remove('hidden');
    });
});

// Toggle switches functionality
document.querySelectorAll('.toggle-switch').forEach(toggle => {
    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        
        // Special handling for 2FA toggle
        if (toggle.dataset.toggle === '2fa') {
            const setup = document.getElementById('2faSetup');
            if (toggle.classList.contains('active')) {
                setup.classList.remove('hidden');
                setup.classList.add('fade-in');
                // Simulate QR code generation
                generateQRCode();
            } else {
                setup.classList.add('hidden');
            }
        }
        
        // Enable/disable related inputs for shipping toggles
        if (toggle.dataset.toggle === 'intl-shipping') {
            const inputs = toggle.closest('.p-4').querySelectorAll('input, select');
            inputs.forEach(input => {
                if (toggle.classList.contains('active')) {
                    input.disabled = false;
                    input.classList.remove('opacity-50', 'cursor-not-allowed');
                } else {
                    input.disabled = true;
                    input.classList.add('opacity-50', 'cursor-not-allowed');
                }
            });
        }
    });
});

// Image upload functionality
const logoDropZone = document.getElementById('logoDropZone');
const logoInput = document.getElementById('logoInput');
const logoPreview = document.getElementById('logoPreview');

logoDropZone.addEventListener('click', () => logoInput.click());

logoDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    logoDropZone.classList.add('dragover');
});

logoDropZone.addEventListener('dragleave', () => {
    logoDropZone.classList.remove('dragover');
});

logoDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    logoDropZone.classList.remove('dragover');
    handleImageUpload(e.dataTransfer.files[0]);
});

logoInput.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0]);
});

function handleImageUpload(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoPreview.src = e.target.result;
            showNotification('Logo uploaded successfully!');
        };
        reader.readAsDataURL(file);
    } else {
        showNotification('Please upload a valid image file', 'error');
    }
}

// Password strength checker
const newPasswordInput = document.getElementById('newPassword');
const passwordStrength = document.getElementById('passwordStrength');
const passwordStrengthBar = document.getElementById('passwordStrengthBar');

newPasswordInput.addEventListener('input', () => {
    const password = newPasswordInput.value;
    let strength = 0;
    let strengthText = '';
    let strengthColor = '';

    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    switch (strength) {
        case 0:
        case 1:
            strengthText = 'Weak';
            strengthColor = 'bg-red-500';
            break;
        case 2:
            strengthText = 'Fair';
            strengthColor = 'bg-yellow-500';
            break;
        case 3:
            strengthText = 'Good';
            strengthColor = 'bg-blue-500';
            break;
        case 4:
            strengthText = 'Strong';
            strengthColor = 'bg-green-500';
            break;
    }

    passwordStrength.textContent = strengthText;
    passwordStrengthBar.style.width = `${strength * 25}%`;
    passwordStrengthBar.className = `h-2 rounded-full transition-all duration-300 ${strengthColor}`;
});

// Form submissions
document.getElementById('passwordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    // Simulate password update
    simulateSaving(() => {
        document.getElementById('passwordForm').reset();
        passwordStrength.textContent = '-';
        passwordStrengthBar.style.width = '0%';
        showNotification('Password updated successfully!');
    });
});

// Save section buttons
document.querySelectorAll('.save-section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        simulateSaving(() => {
            showNotification('Settings saved successfully!');
        });
    });
});

// Save all button
document.getElementById('saveAllBtn').addEventListener('click', () => {
    simulateSaving(() => {
        showNotification('All settings saved successfully!');
    }, 2000);
});

// Utility functions
function simulateSaving(callback, duration = 1000) {
    // Show loading state on buttons
    const buttons = document.querySelectorAll('button:not([disabled])');
    const originalContents = new Map();
    
    buttons.forEach(btn => {
        if (btn.textContent.includes('Save')) {
            originalContents.set(btn, btn.innerHTML);
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
            btn.disabled = true;
        }
    });

    setTimeout(() => {
        buttons.forEach(btn => {
            if (originalContents.has(btn)) {
                btn.innerHTML = originalContents.get(btn);
                btn.disabled = false;
                btn.classList.add('success-pulse');
                setTimeout(() => btn.classList.remove('success-pulse'), 500);
            }
        });
        callback();
    }, duration);
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('successNotification');
    const notificationMessage = document.getElementById('notificationMessage');
    
    notificationMessage.textContent = message;
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 z-50 ${
        type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
    }`;
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateY(100%)';
    }, 3000);
}

function generateQRCode() {
    const qrCode = document.getElementById('qrCode');
    // Simulate QR code generation with a pattern
    qrCode.innerHTML = `
        <div class="grid grid-cols-8 gap-0.5 p-2">
            ${Array(64).fill(0).map(() => `
                <div class="w-1 h-1 ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}"></div>
            `).join('')}
        </div>
    `;
}

// Character counter for bio
const storeBio = document.getElementById('storeBio');
const charCounter = storeBio.nextElementSibling;

storeBio.addEventListener('input', () => {
    const length = storeBio.value.length;
    charCounter.textContent = `${length}/200 characters`;
    
    if (length > 200) {
        storeBio.value = storeBio.value.substring(0, 200);
        charCounter.textContent = '200/200 characters';
    }
});

// Initialize
window.addEventListener('load', () => {
    // Any initialization code here
});
