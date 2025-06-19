// ===== VELVRA FLASH MESSAGE FUNCTIONALITY =====

// Auto-show flash messages when page loads
document.addEventListener('DOMContentLoaded', function() {
    const flashMessages = document.querySelectorAll('.flash-message');
    
    flashMessages.forEach((message, index) => {
        // Stagger the appearance of multiple messages
        setTimeout(() => {
            message.classList.add('show');
            
            // Auto-dismiss after specified time
            const autoDismissTime = parseInt(message.dataset.autoDismiss) || 4000;
            setTimeout(() => {
                dismissFlashMessage(message.querySelector('.flash-message-close'));
            }, autoDismissTime);
            
        }, index * 200); // 200ms delay between each message
    });
});

// Dismiss flash message function
function dismissFlashMessage(closeButton) {
    const message = closeButton.closest('.flash-message');
    const container = message.closest('.flash-message-container');
    
    // Add hide animation
    message.classList.add('hide');
    
    // Remove from DOM after animation
    setTimeout(() => {
        message.remove();
        
        // Remove container if no messages left
        if (container && container.querySelectorAll('.flash-message').length === 0) {
            container.remove();
        }
    }, 600);
}

// Add keyboard support for dismissing messages
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const flashMessages = document.querySelectorAll('.flash-message.show');
        flashMessages.forEach(message => {
            const closeButton = message.querySelector('.flash-message-close');
            if (closeButton) {
                dismissFlashMessage(closeButton);
            }
        });
    }
});

// Pause auto-dismiss on hover
document.addEventListener('DOMContentLoaded', function() {
    const flashMessages = document.querySelectorAll('.flash-message');
    
    flashMessages.forEach(message => {
        let autoDismissTimer;
        const autoDismissTime = parseInt(message.dataset.autoDismiss) || 4000;
        
        // Set initial auto-dismiss timer
        const setAutoDismissTimer = () => {
            autoDismissTimer = setTimeout(() => {
                const closeButton = message.querySelector('.flash-message-close');
                if (closeButton) {
                    dismissFlashMessage(closeButton);
                }
            }, autoDismissTime);
        };
        
        // Pause on hover
        message.addEventListener('mouseenter', () => {
            clearTimeout(autoDismissTimer);
        });
        
        // Resume on mouse leave
        message.addEventListener('mouseleave', () => {
            setAutoDismissTimer();
        });
    });
});

// Add touch support for mobile swipe-to-dismiss
document.addEventListener('DOMContentLoaded', function() {
    const flashMessages = document.querySelectorAll('.flash-message');
    
    flashMessages.forEach(message => {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        message.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        }, { passive: true });
        
        message.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            
            if (deltaX > 0) {
                message.style.transform = `translateX(${deltaX}px)`;
                message.style.opacity = Math.max(0.3, 1 - (deltaX / 200));
            }
        }, { passive: true });
        
        message.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            const deltaX = currentX - startX;
            if (deltaX > 100) {
                // Swipe to dismiss
                const closeButton = message.querySelector('.flash-message-close');
                if (closeButton) {
                    dismissFlashMessage(closeButton);
                }
            } else {
                // Snap back
                message.style.transform = '';
                message.style.opacity = '';
            }
        });
    });
});
