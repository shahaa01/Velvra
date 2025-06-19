// Password Toggle
const togglePassword = document.getElementById('togglePassword');
const password = document.getElementById('password');
const eyeOpen = document.getElementById('eyeOpen');
const eyeClosed = document.getElementById('eyeClosed');

togglePassword?.addEventListener('click', () => {
   const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
   password.setAttribute('type', type);
   
   eyeOpen.classList.toggle('hidden');
   eyeClosed.classList.toggle('hidden');
});

// Add input animations
[emailInput, passwordInput].forEach(input => {
   input?.addEventListener('focus', () => {
       input.parentElement.classList.add('scale-[1.02]');
   });
   
   input?.addEventListener('blur', () => {
       input.parentElement.classList.remove('scale-[1.02]');
   });
});

// Mobile optimizations
if (window.innerWidth <= 640) {
   // Prevent zoom on input focus
   document.querySelectorAll('input').forEach(input => {
       input.setAttribute('autocomplete', 'off');
   });
}

document.addEventListener('DOMContentLoaded', function() {
    // Handle Google authentication button loading state
    const googleButton = document.querySelector('a[href*="google"]');
    
    if (googleButton) {
        googleButton.addEventListener('click', function(e) {
            // Add loading state
            this.classList.add('loading');
            this.style.pointerEvents = 'none';
            
            // Change text to show loading
            const textSpan = this.querySelector('span');
            if (textSpan) {
                textSpan.textContent = 'Connecting to Google...';
            }
            
            // Remove loading state after a delay (in case of errors)
            setTimeout(() => {
                this.classList.remove('loading');
                this.style.pointerEvents = 'auto';
                if (textSpan) {
                    textSpan.textContent = 'Continue with Google';
                }
            }, 10000); // 10 seconds timeout
        });
    }
    
    // Handle password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const eyeOpen = document.getElementById('eyeOpen');
    const eyeClosed = document.getElementById('eyeClosed');
    
    if (togglePassword && passwordInput && eyeOpen && eyeClosed) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icons
            if (type === 'text') {
                eyeOpen.classList.add('hidden');
                eyeClosed.classList.remove('hidden');
            } else {
                eyeOpen.classList.remove('hidden');
                eyeClosed.classList.add('hidden');
            }
        });
    }
    
    // Handle form submission
    const loginForm = document.getElementById('loginForm');
    const submitButton = loginForm?.querySelector('button[type="submit"]');
    
    if (loginForm && submitButton) {
        loginForm.addEventListener('submit', function(e) {
            // Add loading state to submit button
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="relative z-10">Signing In...</span><div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>';
            submitButton.classList.add('opacity-75');
        });
    }
    
    // Enhanced input validation
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
    
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        
        // Remove existing error styling
        field.classList.remove('error', 'border-red-500');
        
        // Validation rules
        let isValid = true;
        let errorMessage = '';
        
        switch (fieldName) {
            case 'username':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;
                
            case 'password':
                if (value.length < 1) {
                    isValid = false;
                    errorMessage = 'Password is required';
                }
                break;
        }
        
        // Apply error styling if invalid
        if (!isValid) {
            field.classList.add('error', 'border-red-500');
            
            // Show error message
            let errorElement = field.parentNode.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('p');
                errorElement.className = 'error-message text-red-500 text-xs mt-1';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = errorMessage;
        } else {
            // Remove error message
            const errorElement = field.parentNode.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }
        
        return isValid;
    }
    
    // Remember me functionality
    const rememberMeCheckbox = document.querySelector('input[type="checkbox"]');
    
    if (rememberMeCheckbox) {
        // Load saved state
        const savedState = localStorage.getItem('rememberMe');
        if (savedState === 'true') {
            rememberMeCheckbox.checked = true;
        }
        
        // Save state on change
        rememberMeCheckbox.addEventListener('change', function() {
            localStorage.setItem('rememberMe', this.checked);
        });
    }
});
