// Analytics Tracker
class AnalyticsTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.trackedActions = new Set();
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupEventListeners();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async trackAction(action, productId) {
        if (!productId) return;

        const actionKey = `${action}_${productId}`;
        if (this.trackedActions.has(actionKey)) return;

        try {
            const response = await fetch('/seller-dashboard/analytics/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    action,
                    sessionId: this.sessionId
                })
            });

            if (response.ok) {
                this.trackedActions.add(actionKey);
            }
        } catch (error) {
            console.error('Error tracking action:', error);
        }
    }

    trackPageView() {
        const productId = this.getProductId();
        if (productId) {
            this.trackAction('view', productId);
        }
    }

    setupEventListeners() {
        // Track clicks on product links
        document.addEventListener('click', (e) => {
            const productLink = e.target.closest('[data-product-id]');
            if (productLink) {
                const productId = productLink.dataset.productId;
                this.trackAction('click', productId);
            }
        });

        // Track add to cart
        document.addEventListener('click', (e) => {
            const addToCartBtn = e.target.closest('[data-add-to-cart]');
            if (addToCartBtn) {
                const productId = addToCartBtn.dataset.addToCart;
                this.trackAction('add_to_cart', productId);
            }
        });

        // Track checkout
        document.addEventListener('click', (e) => {
            const checkoutBtn = e.target.closest('[data-checkout]');
            if (checkoutBtn) {
                const productId = checkoutBtn.dataset.checkout;
                this.trackAction('checkout', productId);
            }
        });

        // Track purchase (when order is completed)
        if (window.location.pathname.includes('/order-confirmation')) {
            const orderId = this.getOrderId();
            if (orderId) {
                this.trackPurchase(orderId);
            }
        }
    }

    getProductId() {
        // Try to get product ID from various sources
        const productIdElement = document.querySelector('[data-product-id]');
        if (productIdElement) {
            return productIdElement.dataset.productId;
        }

        // Try to get from URL
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('productId') || urlParams.get('id');
    }

    getOrderId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('orderId') || urlParams.get('id');
    }

    async trackPurchase(orderId) {
        try {
            // Get order details to track purchase for each product
            const response = await fetch(`/api/orders/${orderId}`);
            if (response.ok) {
                const order = await response.json();
                order.items.forEach(item => {
                    this.trackAction('purchase', item.product);
                });
            }
        } catch (error) {
            console.error('Error tracking purchase:', error);
        }
    }
}

// Initialize analytics tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsTracker = new AnalyticsTracker();
});

// Export for use in other scripts
window.AnalyticsTracker = AnalyticsTracker; 