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

    // Initialize all event listeners
    initializeEventListeners();
});

function initializeEventListeners() {
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
        
        wishlistBtn.classList.toggle('active');
        if (wishlistBtn.classList.contains('active')) {
            createFloatingHeart(wishlistBtn);
        }
        
        // Animate button
        wishlistBtn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            wishlistBtn.style.transform = '';
        }, 200);
    });

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
                document.body.style.overflow = '';
            }
        });

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleEscape);
            }
        };
        
        document.addEventListener('keydown', handleEscape);
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
}

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

// ... rest of the existing code (InfiniteHorizontalScroll class, etc.) ...