// State Management
let productState = {
    selectedColor: 'Charcoal',
    selectedSize: 'M',
    quantity: 1,
    wishlist: [],
    currentImageIndex: 0
};

// DOM Elements
const mainImage = document.getElementById('mainImage');
const thumbnails = document.querySelectorAll('.thumbnail-btn');
const colorSelectors = document.querySelectorAll('.color-selector');
const sizeSelectors = document.querySelectorAll('.size-selector');
const selectedColorSpan = document.getElementById('selectedColor');
const selectedSizeSpan = document.getElementById('selectedSize');
const quantityInput = document.getElementById('quantity');
const decreaseBtn = document.getElementById('decreaseQty');
const increaseBtn = document.getElementById('increaseQty');
const addToCartBtn = document.getElementById('addToCartBtn');
const wishlistBtn = document.getElementById('wishlistBtn');
const buyNowBtn = document.getElementById('buyNowBtn');

// Initialize cart state on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if product is already in cart
    const isInCart = addToCartBtn.dataset.inCart === 'true';
    
    if (isInCart) {
        addToCartBtn.classList.add('in-cart');
        addToCartBtn.querySelector('.cartText').textContent = '✔️ Added to Cart';
    }
});

// Image Gallery Functionality
thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => {
        const newImage = thumbnail.dataset.image;
        mainImage.src = newImage;
        
        // Update thumbnail states
        thumbnails.forEach(t => t.classList.remove('border-velvra-gold'));
        thumbnails.forEach(t => t.classList.add('border-gray-200'));
        thumbnail.classList.remove('border-gray-200');
        thumbnail.classList.add('border-velvra-gold');
        
        productState.currentImageIndex = index;
    });
});

// Color Selection
colorSelectors.forEach(selector => {
    selector.addEventListener('click', () => {
        const color = selector.dataset.color;
        
        // Update visual states
        colorSelectors.forEach(s => {
            s.classList.remove('border-velvra-gold');
            s.classList.add('border-gray-200');
        });
        selector.classList.remove('border-gray-200');
        selector.classList.add('border-velvra-gold');
        
        // Update state and UI
        productState.selectedColor = color;
        selectedColorSpan.textContent = color;
    });
});

// Size Selection
sizeSelectors.forEach(selector => {
    selector.addEventListener('click', () => {
        const size = selector.dataset.size;
        
        // Update visual states
        sizeSelectors.forEach(s => {
            s.classList.remove('border-velvra-gold', 'gold-gradient', 'text-white');
            s.classList.add('border-gray-200');
        });
        selector.classList.remove('border-gray-200');
        selector.classList.add('border-velvra-gold', 'gold-gradient', 'text-white');
        
        // Update state and UI
        productState.selectedSize = size;
        selectedSizeSpan.textContent = size;
    });
});

// Quantity Controls
decreaseBtn.addEventListener('click', () => {
    if (productState.quantity > 1) {
        productState.quantity--;
        quantityInput.value = productState.quantity;
    }
});

increaseBtn.addEventListener('click', () => {
    if (productState.quantity < 10) {
        productState.quantity++;
        quantityInput.value = productState.quantity;
    }
});

quantityInput.addEventListener('change', (e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 10) {
        productState.quantity = value;
    } else {
        e.target.value = productState.quantity;
    }
});

// Wishlist Functionality
wishlistBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (wishlistBtn.classList.contains('active')) {
        wishlistBtn.classList.remove('active');
    } else {
        wishlistBtn.classList.add('active');
        createFloatingHeart(wishlistBtn);
    }
    
    // Animate button
    btn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        btn.style.transform = '';
    }, 200);
});

// Add to Cart Functionality
addToCartBtn.addEventListener('click', async () => {
    // Check if user is logged in
    const isLoggedIn = addToCartBtn.dataset.loggedIn === 'true';
    
    if (!isLoggedIn) {
        Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'Please login to add items to your cart.',
            confirmButtonText: 'Login',
        }).then(result => {
            if (result.isConfirmed) {
                window.location.href = '/auth/login';
            }
        });
        return;
    }

    // Validate size selection
    if (!productState.selectedSize) {
        Swal.fire({
            icon: 'warning',
            title: 'Select Size',
            text: 'Please select a size before adding to cart.',
            confirmButtonText: 'OK'
        });
        return;
    }

    try {
        // Show loading state
        addToCartBtn.disabled = true;
        const originalText = addToCartBtn.querySelector('.cartText').textContent;
        addToCartBtn.querySelector('.cartText').textContent = 'Processing...';

        // Check if item is already in cart
        const isInCart = addToCartBtn.classList.contains('in-cart');

        if (isInCart) {
            // Confirm removal
            const result = await Swal.fire({
                icon: 'question',
                title: 'Remove from Cart?',
                text: 'Do you want to remove this item from your cart?',
                showCancelButton: true,
                confirmButtonText: 'Yes, remove it',
                cancelButtonText: 'No, keep it'
            });

            if (!result.isConfirmed) {
                addToCartBtn.disabled = false;
                addToCartBtn.querySelector('.cartText').textContent = originalText;
                return;
            }
        }

        // Toggle cart item
        const response = await fetch('/cart/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: addToCartBtn.dataset.productId,
                size: productState.selectedSize,
                color: productState.selectedColor,
                quantity: productState.quantity
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update cart');
        }

        const data = await response.json();

        // Update button state
        if (data.action === 'added') {
            addToCartBtn.classList.add('in-cart');
            addToCartBtn.querySelector('.cartText').textContent = '✔️ Added to Cart';            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Added!',
                text: 'Item has been added to your cart.',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            addToCartBtn.classList.remove('in-cart');
            addToCartBtn.querySelector('.cartText').textContent = 'Add to Cart';
            
            // Show removal message
            Swal.fire({
                icon: 'success',
                title: 'Removed!',
                text: 'Item has been removed from your cart.',
                timer: 1500,
                showConfirmButton: false
            });
        }

        // Update cart count if element exists
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = data.cartCount;
            cartCount.classList.add('animate-bounce');
            setTimeout(() => cartCount.classList.remove('animate-bounce'), 1000);
        }

    } catch (error) {
        console.error('Cart operation failed:', error);
        Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'Something went wrong. Please try again.',
            confirmButtonText: 'OK'
        });
    } finally {
        // Reset button state
        addToCartBtn.disabled = false;
    }
});

// Buy Now Functionality
buyNowBtn.addEventListener('click', async () => {
    // Check if user is logged in
    const isLoggedIn = buyNowBtn.dataset.loggedIn === 'true';
    
    if (!isLoggedIn) {
        Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'Please login to proceed with checkout.',
            confirmButtonText: 'Login',
        }).then(result => {
            if (result.isConfirmed) {
                window.location.href = '/auth/login';
            }
        });
        return;
    }

    // Validate size selection
    if (!productState.selectedSize) {
        Swal.fire({
            icon: 'warning',
            title: 'Select Size',
            text: 'Please select a size before proceeding.',
            confirmButtonText: 'OK'
        });
        return;
    }

    try {
        // Show loading state
        buyNowBtn.disabled = true;
        buyNowBtn.textContent = 'Processing...';

        // Add to cart and redirect to checkout
        const response = await fetch('/cart/toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: buyNowBtn.dataset.productId,
                size: productState.selectedSize,
                color: productState.selectedColor,
                quantity: productState.quantity
            })
        });

        if (!response.ok) {
            throw new Error('Failed to add item to cart');
        }

        // Redirect to checkout
        window.location.href = '/checkout';

    } catch (error) {
        console.error('Cart operation failed:', error);
        Swal.fire({
            icon: 'error',
            title: 'Oops!',
            text: 'Something went wrong. Please try again.',
            confirmButtonText: 'OK'
        });
    } finally {
        // Reset button state
        buyNowBtn.disabled = false;
        buyNowBtn.textContent = 'Buy Now';
    }
});

// Accordion Functionality
const accordionTriggers = document.querySelectorAll('.accordion-trigger');

accordionTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
        const target = document.getElementById(trigger.dataset.target);
        const icon = trigger.querySelector('.accordion-icon');
        const isActive = target.classList.contains('active');
        
        // Close all other accordions
        document.querySelectorAll('.accordion-content').forEach(content => {
            if (content !== target) {
                content.classList.remove('active');
            }
        });
        
        document.querySelectorAll('.accordion-icon').forEach(i => {
            if (i !== icon) {
                i.style.transform = '';
            }
        });
        
        // Toggle current accordion
        if (isActive) {
            target.classList.remove('active');
            icon.style.transform = '';
        } else {
            target.classList.add('active');
            icon.style.transform = 'rotate(180deg)';
        }
    });
});

// Related Products Scroll
const relatedProducts = document.getElementById('relatedProducts');
const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');

scrollLeftBtn.addEventListener('click', () => {
    relatedProducts.scrollBy({ left: -320, behavior: 'smooth' });
});

scrollRightBtn.addEventListener('click', () => {
    relatedProducts.scrollBy({ left: 320, behavior: 'smooth' });
});

// Related Products Wishlist Buttons
document.querySelectorAll('.product-card .wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
        } else {
            btn.classList.add('active');
            createFloatingHeart(btn);
        }
        
        // Animate button
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 200);
    });
});

// Utility Functions
function createFloatingHeart(button) {
    const heart = document.createElement('div');
    heart.innerHTML = '♥';
    heart.className = 'fixed text-velvra-gold text-2xl pointer-events-none z-50 animate-float';
    heart.style.cssText = `
        position: fixed;
        color: #d4af37;
        font-size: 1.5rem;
        pointer-events: none;
        z-index: 1000;
        animation: floatingHeart 2s ease-out forwards;
    `;
    
    const rect = button.getBoundingClientRect();
    heart.style.left = rect.left + rect.width/2 + 'px';
    heart.style.top = rect.top + rect.height/2 + 'px';
    
    document.body.appendChild(heart);
    
    setTimeout(() => {
        if (heart.parentNode) {
            heart.remove();
        }
    }, 2000);
}

// Add floating heart animation
const heartAnimation = document.createElement('style');
heartAnimation.textContent = `
    @keyframes floatingHeart {
        0% {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        50% {
            transform: translateY(-50px) scale(1.2);
            opacity: 0.8;
        }
        100% {
            transform: translateY(-100px) scale(0.5);
            opacity: 0;
        }
    }
`;
document.head.appendChild(heartAnimation);

// Image Zoom Functionality
mainImage.addEventListener('click', () => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="relative max-w-4xl max-h-full">
            <img src="${mainImage.src}" alt="Product Image" class="w-full h-full object-contain rounded-lg">
            <button class="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('button')) {
            modal.remove();
        }
    });
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Animate elements on load
    document.querySelectorAll('.animate-fadeInUp').forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });

    // Get DOM elements
    const addToCartBtn = document.getElementById('addToCartBtn');
    const buyNowBtn = document.getElementById('buyNowBtn');
    const quantityInput = document.getElementById('quantity');
    const decreaseQtyBtn = document.getElementById('decreaseQty');
    const increaseQtyBtn = document.getElementById('increaseQty');
    const sizeSelectors = document.querySelectorAll('.size-selector');
    const colorSelectors = document.querySelectorAll('.color-selector');
    const selectedSizeSpan = document.getElementById('selectedSize');
    const selectedColorSpan = document.getElementById('selectedColor');

    // State variables
    let selectedSize = '';
    let selectedColor = '';
    let quantity = 1;

    // Handle quantity changes
    decreaseQtyBtn.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            quantityInput.value = quantity;
        }
    });

    increaseQtyBtn.addEventListener('click', () => {
        if (quantity < 10) {
            quantity++;
            quantityInput.value = quantity;
        }
    });

    quantityInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= 10) {
            quantity = value;
        } else {
            quantity = 1;
            e.target.value = 1;
        }
    });

    // Handle size selection
    sizeSelectors.forEach(selector => {
        selector.addEventListener('click', () => {
            // Remove selected class from all size selectors
            sizeSelectors.forEach(s => s.classList.remove('selected', 'border-velvra-gold'));
            
            // Add selected class to clicked size
            selector.classList.add('selected', 'border-velvra-gold');
            
            // Update selected size
            selectedSize = selector.dataset.size;
            selectedSizeSpan.textContent = selectedSize;
        });
    });

    // Handle color selection
    colorSelectors.forEach(selector => {
        selector.addEventListener('click', () => {
            // Remove selected class from all color selectors
            colorSelectors.forEach(s => s.classList.remove('selected', 'ring-2', 'ring-velvra-gold'));
            
            // Add selected class to clicked color
            selector.classList.add('selected', 'ring-2', 'ring-velvra-gold');
            
            // Update selected color
            selectedColor = selector.dataset.color;
            selectedColorSpan.textContent = selectedColor;
        });
    });

    // Initialize first size and color as selected
    if (sizeSelectors.length > 0) {
        sizeSelectors[0].click();
    }
    if (colorSelectors.length > 0) {
        colorSelectors[0].click();
    }
});

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    // Close modal with Escape key
    if (e.key === 'Escape') {
        const modal = document.querySelector('.fixed.inset-0.bg-black\\/80');
        if (modal) {
            modal.remove();
        }
    }
    
    // Navigate thumbnails with arrow keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const currentIndex = productState.currentImageIndex;
        let newIndex;
        
        if (e.key === 'ArrowLeft') {
            newIndex = currentIndex > 0 ? currentIndex - 1 : thumbnails.length - 1;
        } else {
            newIndex = currentIndex < thumbnails.length - 1 ? currentIndex + 1 : 0;
        }
        
        thumbnails[newIndex].click();
    }
});

// Touch/Swipe Support for Mobile
let startX = 0;
let startY = 0;
let isScrolling = false;

mainImage.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isScrolling = false;
}, { passive: true });

mainImage.addEventListener('touchmove', (e) => {
    if (!startX || !startY) return;
    
    const diffX = Math.abs(e.touches[0].clientX - startX);
    const diffY = Math.abs(e.touches[0].clientY - startY);
    
    if (diffY > diffX) {
        isScrolling = true;
    }
}, { passive: true });

mainImage.addEventListener('touchend', (e) => {
    if (!startX || !startY || isScrolling) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    
    // Swipe threshold
    if (Math.abs(diffX) > 50) {
        const currentIndex = productState.currentImageIndex;
        let newIndex;
        
        if (diffX > 0) {
            // Swipe left - next image
            newIndex = currentIndex < thumbnails.length - 1 ? currentIndex + 1 : 0;
        } else {
            // Swipe right - previous image
            newIndex = currentIndex > 0 ? currentIndex - 1 : thumbnails.length - 1;
        }
        
        thumbnails[newIndex].click();
    }
    
    // Reset
    startX = 0;
    startY = 0;
    isScrolling = false;
}, { passive: true });

// Performance Optimization
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe related product cards for lazy animation
document.querySelectorAll('.product-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.320, 1)';
    observer.observe(card);
});

// Infinite Horizontal Scroll Implementation
class InfiniteHorizontalScroll {
    constructor() {
        this.container = document.getElementById('relatedProducts');
        this.sentinel = document.querySelector('.loader-sentinel');
        this.leftFade = document.querySelector('.scroll-fade-left');
        this.rightFade = document.querySelector('.scroll-fade-right');
        this.isLoading = false;
        this.currentPage = 1;
        this.hasMoreProducts = true;
        this.productId = window.location.pathname.split('/').pop();
        
        this.init();
    }
    
    init() {
        // Set up intersection observer for infinite scroll
        this.setupIntersectionObserver();
        
        // Set up scroll event for fade indicators
        this.setupScrollIndicators();
        
        // Set up touch events for mobile
        this.setupTouchEvents();
        
        // Initialize wishlist buttons
        this.initializeWishlistButtons();
    }
    
    setupIntersectionObserver() {
        const options = {
            root: this.container,
            rootMargin: '0px 200px 0px 0px', // Trigger 200px before reaching the end
            threshold: 0.1
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading && this.hasMoreProducts) {
                    this.loadMoreProducts();
                }
            });
        }, options);
        
        this.observer.observe(this.sentinel);
    }
    
    setupScrollIndicators() {
        const updateIndicators = () => {
            const scrollLeft = this.container.scrollLeft;
            const scrollWidth = this.container.scrollWidth;
            const clientWidth = this.container.clientWidth;
            
            // Show/hide fade indicators
            if (scrollLeft > 50) {
                this.leftFade.classList.add('active');
            } else {
                this.leftFade.classList.remove('active');
            }
            
            if (scrollLeft < scrollWidth - clientWidth - 50) {
                this.rightFade.classList.add('active');
            } else {
                this.rightFade.classList.remove('active');
            }
        };
        
        this.container.addEventListener('scroll', updateIndicators);
        
        // Initial check
        setTimeout(updateIndicators, 100);
    }
    
    setupTouchEvents() {
        let isScrolling = false;
        let startX = 0;
        let scrollLeft = 0;
        
        this.container.addEventListener('touchstart', (e) => {
            isScrolling = true;
            startX = e.touches[0].pageX - this.container.offsetLeft;
            scrollLeft = this.container.scrollLeft;
        }, { passive: true });
        
        this.container.addEventListener('touchmove', (e) => {
            if (!isScrolling) return;
            const x = e.touches[0].pageX - this.container.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed multiplier
            this.container.scrollLeft = scrollLeft - walk;
        }, { passive: true });
        
        this.container.addEventListener('touchend', () => {
            isScrolling = false;
        }, { passive: true });
    }
    
    async loadMoreProducts() {
        if (this.isLoading || !this.hasMoreProducts) return;
        
        this.isLoading = true;
        this.sentinel.setAttribute('data-loading', 'true');
        
        // Show skeleton loaders
        this.showSkeletonLoaders();
        
        try {
            // Fetch next page of products
            const response = await fetch(`/product/api/similar-products/${this.productId}?page=${this.currentPage + 1}&limit=4`);
            if (!response.ok) throw new Error('Failed to load products');
            
            const data = await response.json();
            
            // Remove skeleton loaders
            this.hideSkeletonLoaders();
            
            if (data.products.length > 0) {
                // Create and append new product cards
                const fragment = document.createDocumentFragment();
                data.products.forEach(product => {
                    const card = this.createProductCard(product);
                    fragment.appendChild(card);
                });
                
                // Insert new products before the sentinel
                this.container.insertBefore(fragment, this.sentinel);
                
                // Update pagination state
                this.currentPage++;
                this.hasMoreProducts = data.pagination.hasMore;
                
                // Reinitialize wishlist buttons for new products
                this.initializeWishlistButtons();
                
                // Update scroll indicators
                this.container.dispatchEvent(new Event('scroll'));
            } else {
                this.hasMoreProducts = false;
            }
            
            if (!this.hasMoreProducts) {
                this.observer.disconnect();
                // Hide right fade indicator
                this.rightFade.classList.remove('active');
            }
        } catch (error) {
            console.error('Error loading more products:', error);
            this.hideSkeletonLoaders();
        } finally {
            this.isLoading = false;
            this.sentinel.setAttribute('data-loading', 'false');
        }
    }
    
    showSkeletonLoaders() {
        const skeletonHTML = `
            <div class="skeleton-card">
                <div class="skeleton-image skeleton-loader"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line short skeleton-loader"></div>
                    <div class="skeleton-line medium skeleton-loader"></div>
                    <div class="skeleton-line skeleton-loader"></div>
                    <div class="skeleton-price skeleton-loader"></div>
                </div>
            </div>
        `;
        
        for (let i = 0; i < 4; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-wrapper flex-shrink-0 w-80';
            skeleton.innerHTML = skeletonHTML;
            this.container.insertBefore(skeleton, this.sentinel);
        }
    }
    
    hideSkeletonLoaders() {
        const skeletons = this.container.querySelectorAll('.skeleton-wrapper');
        skeletons.forEach((skeleton, index) => {
            setTimeout(() => {
                skeleton.style.opacity = '0';
                skeleton.style.transform = 'scale(0.95)';
                skeleton.style.transition = 'all 0.3s ease-out';
                setTimeout(() => skeleton.remove(), 300);
            }, index * 50);
        });
    }
    
    createProductCard(product) {
        const article = document.createElement('article');
        article.className = 'product-card flex-shrink-0 w-80 bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500';
        article.style.opacity = '0';
        
        // Build color options HTML
        const colorOptionsHTML = product.colors.slice(0, 3).map(color => `
            <button class="color-option w-6 h-6 rounded-full border-2 border-gray-200 hover:border-velvra-gold transition-all duration-200" 
                    style="background-color: ${color.hex}" 
                    data-color="${color.name}"></button>
        `).join('');
        
        article.innerHTML = `
            <button class="wishlist-btn absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center z-10 hover:bg-velvra-gold hover:text-white transition-all duration-300">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path class="heart-outline" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" fill="white" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
            
            ${product.salePercentage ? `<div class="sale-badge absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full z-10">Sale ${product.salePercentage}% Off</div>` : ''}
            
            <figure class="aspect-[4/5] relative overflow-hidden">
                <a href="/product/${product._id}">
                    <img src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700">
                </a>
            </figure>

            <div class="p-6">
                <p class="text-sm font-medium text-velvra-stone uppercase tracking-wider mb-2">${product.brand}</p>
                <h3 class="text-lg font-semibold text-velvra-charcoal mb-4 line-clamp-2">${product.name}</h3>
                
                <div class="color-options flex gap-2 mb-4">
                    ${colorOptionsHTML}
                </div>
                
                <div class="flex items-baseline space-x-2">
                    <span class="text-xl font-semibold text-velvra-charcoal">₹${product.salePrice || product.price}</span>
                    ${product.sale ? `<span class="text-sm text-velvra-stone line-through">₹${product.price}</span>` : ''}
                </div>
            </div>
        `;
        
        // Fade in the card
        requestAnimationFrame(() => {
            article.style.opacity = '1';
            article.style.transition = 'opacity 0.3s ease-out';
        });
        
        return article;
    }
    
    initializeWishlistButtons() {
        const wishlistButtons = this.container.querySelectorAll('.wishlist-btn');
        wishlistButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                button.classList.toggle('active');
                this.createFloatingHeart(button);
            });
        });
    }
    
    createFloatingHeart(button) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerHTML = `
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        `;
        
        button.appendChild(heart);
        
        // Trigger animation
        requestAnimationFrame(() => {
            heart.style.animation = 'float 1s ease-out forwards';
        });
        
        // Remove after animation
        setTimeout(() => heart.remove(), 1000);
    }
}

// Initialize infinite scroll
document.addEventListener('DOMContentLoaded', () => {
    new InfiniteHorizontalScroll();
});

// Add floating heart animation if not already present
if (!document.querySelector('style[data-heart-animation]')) {
    const heartAnimation = document.createElement('style');
    heartAnimation.setAttribute('data-heart-animation', 'true');
    heartAnimation.textContent = `
        @keyframes floatingHeart {
            0% {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            50% {
                transform: translateY(-50px) scale(1.2);
                opacity: 0.8;
            }
            100% {
                transform: translateY(-100px) scale(0.5);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(heartAnimation);
}