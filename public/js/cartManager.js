// ==========================================
// GLOBAL CART MANAGER
// ==========================================

class CartManager {
    constructor() {
        this.cartCount = 0;
        this.cartCountElements = [];
        this.init();
    }

    init() {
        // Get all cart count elements on page load
        this.updateCartCountElements();
        
        // Listen for cart updates from other parts of the app
        this.setupEventListeners();
        
        // Initial cart count update
        this.updateCartCount();
    }

    updateCartCountElements() {
        // Find all cart count elements on the page
        this.cartCountElements = document.querySelectorAll('.cart-count');
    }

    setupEventListeners() {
        // Listen for custom cart update events
        document.addEventListener('cartUpdated', (event) => {
            this.updateCartCountFromEvent(event.detail);
        });

        // Listen for cart count changes from server responses
        document.addEventListener('cartCountChanged', (event) => {
            this.updateCartCount(event.detail.count);
        });
    }

    updateCartCountFromEvent(detail) {
        if (detail && typeof detail.cartCount !== 'undefined') {
            this.updateCartCount(detail.cartCount);
        }
    }

    updateCartCount(count) {
        this.cartCount = count;
        
        // Update all cart count elements
        this.cartCountElements.forEach(element => {
            element.textContent = count;
            
            // Add animation
            element.classList.add('animate-bounce');
            setTimeout(() => {
                element.classList.remove('animate-bounce');
            }, 1000);
        });

        // Show/hide cart count based on count
        this.cartCountElements.forEach(element => {
            if (count === 0) {
                element.style.display = 'none';
            } else {
                element.style.display = 'flex';
            }
        });
    }

    // Method to be called after successful cart operations
    handleCartUpdate(response) {
        if (response && typeof response.cartCount !== 'undefined') {
            this.updateCartCount(response.cartCount);
            
            // Dispatch custom event for other components
            const event = new CustomEvent('cartUpdated', {
                detail: { cartCount: response.cartCount }
            });
            document.dispatchEvent(event);
        }
    }

    // Method to increment cart count (for optimistic updates)
    incrementCartCount() {
        this.updateCartCount(this.cartCount + 1);
    }

    // Method to decrement cart count (for optimistic updates)
    decrementCartCount() {
        this.updateCartCount(Math.max(0, this.cartCount - 1));
    }
}

// ==========================================
// GLOBAL CART API FUNCTIONS
// ==========================================

// Function to add item to cart with real-time updates
async function addToCart(productData) {
    try {
        // Optimistic update
        if (window.cartManager && typeof window.cartManager.incrementCartCount === 'function') {
            window.cartManager.incrementCartCount();
        }

        const response = await fetch('/cart/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Failed to update cart');
        }

        const data = await response.json();
        
        // Update with actual server response
        if (window.cartManager && typeof window.cartManager.handleCartUpdate === 'function') {
            window.cartManager.handleCartUpdate(data);
        }
        
        return data;
    } catch (error) {
        // Revert optimistic update on error
        if (window.cartManager && typeof window.cartManager.decrementCartCount === 'function') {
            window.cartManager.decrementCartCount();
        }
        throw error;
    }
}

// Function to remove item from cart with real-time updates
async function removeFromCart(productData) {
    try {
        // Optimistic update
        if (window.cartManager && typeof window.cartManager.decrementCartCount === 'function') {
            window.cartManager.decrementCartCount();
        }

        const response = await fetch('/cart/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Failed to update cart');
        }

        const data = await response.json();
        
        // Update with actual server response
        if (window.cartManager && typeof window.cartManager.handleCartUpdate === 'function') {
            window.cartManager.handleCartUpdate(data);
        }
        
        return data;
    } catch (error) {
        // Revert optimistic update on error
        if (window.cartManager && typeof window.cartManager.incrementCartCount === 'function') {
            window.cartManager.incrementCartCount();
        }
        throw error;
    }
}

// Function to update cart count from server
async function refreshCartCount() {
    try {
        const response = await fetch('/cart/count');
        if (response.ok) {
            const data = await response.json();
            if (window.cartManager && typeof window.cartManager.updateCartCount === 'function') {
                window.cartManager.updateCartCount(data.count);
            } else {
                console.warn('Cart manager not initialized yet, skipping cart count update');
            }
        }
    } catch (error) {
        console.error('Failed to refresh cart count:', error);
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global cart manager instance
    window.cartManager = new CartManager();
    
    // Refresh cart count on page load after a short delay to ensure initialization
    setTimeout(() => {
        refreshCartCount();
    }, 100);
});

// Safe function to get cart manager instance
function getCartManager() {
    if (window.cartManager && typeof window.cartManager === 'object') {
        return window.cartManager;
    }
    console.warn('Cart manager not initialized yet');
    return null;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CartManager, addToCart, removeFromCart, refreshCartCount, getCartManager };
} 