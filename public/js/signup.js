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
    
    // Handle form validation
    const signupForm = document.querySelector('form[action="/auth/signup"]');
    const termsCheckbox = document.getElementById('terms');
    const submitButton = signupForm?.querySelector('button[type="submit"]');
    
    if (signupForm && termsCheckbox && submitButton) {
        // Check terms acceptance before allowing form submission
        function updateSubmitButton() {
            if (termsCheckbox.checked) {
                submitButton.disabled = false;
                submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                submitButton.disabled = true;
                submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
        
        // Initial check
        updateSubmitButton();
        
        // Listen for checkbox changes
        termsCheckbox.addEventListener('change', updateSubmitButton);
        
        // Form submission validation
        signupForm.addEventListener('submit', function(e) {
            if (!termsCheckbox.checked) {
                e.preventDefault();
                alert('Please accept the Terms of Service and Privacy Policy to continue.');
                return false;
            }
            
            // Add loading state to submit button
            submitButton.disabled = true;
            submitButton.textContent = 'Creating Account...';
            submitButton.classList.add('opacity-75');
        });
    }
    
    // Enhanced input validation
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    
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
            case 'firstName':
            case 'lastName':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Name must be at least 2 characters long';
                }
                break;
                
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;
                
            case 'password':
                if (value.length < 8) {
                    isValid = false;
                    errorMessage = 'Password must be at least 8 characters long';
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
});
