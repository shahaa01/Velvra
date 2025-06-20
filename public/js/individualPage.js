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

    // Auto-select the first color if available
    if (colorSelectors.length > 0) {
        colorSelectors[0].click();
    }

    // Set quantity to 1 for in-stock, 0 for out-of-stock
    let firstColorObj = window.productColors && window.productColors.length > 0 ? window.productColors[0] : null;
    if (firstColorObj && firstColorObj.stock > 0) {
        productState.quantity = 1;
        quantityInput.value = 1;
    } else {
        productState.quantity = 0;
        quantityInput.value = 0;
    }
    updateQuantityUI();
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
            updateQuantityUI();
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
            updateQuantityUI();
        }
    });

    increaseBtn.addEventListener('click', () => {
        const colorObj = getSelectedColorObj();
        const maxStock = colorObj ? colorObj.stock : 0;
        if (productState.quantity < maxStock) {
            productState.quantity++;
            quantityInput.value = productState.quantity;
            updateQuantityUI();
        } else {
            showQuantityError('Sorry, we do not have more of this item in stock right now, try choosing different product');
        }
    });

    quantityInput.addEventListener('change', (e) => {
        const value = parseInt(e.target.value);
        const colorObj = getSelectedColorObj();
        const maxStock = colorObj ? colorObj.stock : 0;
        if (value >= 1 && value <= maxStock) {
            productState.quantity = value;
        } else {
            showQuantityError('Sorry, we do not have more of this item in stock right now, try choosing different product');
            e.target.value = productState.quantity;
        }
        updateQuantityUI();
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
            } else {
                addToCartBtn.classList.remove('in-cart');
                addToCartBtn.querySelector('.cartText').textContent = 'Add to Cart';
                
                // Show removal message
                Swal.fire({
                    icon: 'success',
                    title: 'Removed!',
                    text: 'Item has been removed from your cart.',
                    timer: 800,
                    showConfirmButton: false
                });
            }

            // Update cart count using the global cart manager
            if (window.cartManager) {
                window.cartManager.handleCartUpdate(data);
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

            // Redirect to buy now checkout with product details
            const params = new URLSearchParams({
                productId: buyNowBtn.dataset.productId,
                size: productState.selectedSize,
                color: productState.selectedColor,
                quantity: productState.quantity
            });

            window.location.href = `/payment/buyNow?${params.toString()}`;

        } catch (error) {
            console.error('Buy now failed:', error);
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

    // On load, set initial UI
    updateQuantityUI();
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

// --- Stock/Quantity Logic ---
function getSelectedColorObj() {
    return window.productColors.find(c => c.name === productState.selectedColor);
}

function updateQuantityUI() {
    const colorObj = getSelectedColorObj();
    const maxStock = colorObj ? colorObj.stock : 0;
    quantityInput.max = maxStock;
    if (productState.quantity > maxStock) {
        productState.quantity = maxStock;
        quantityInput.value = maxStock;
    }
    // Show stock left if less than 5
    const stockMsg = document.getElementById('stockMessage');
    if (colorObj && colorObj.stock < 5 && colorObj.stock > 0) {
        stockMsg.innerHTML = `<span style="color:#D7263D;font-weight:400;font-size:1.1rem;">Only ${colorObj.stock} item${colorObj.stock > 1 ? 's' : ''} of this color left in stock</span>`;
    } else {
        stockMsg.innerHTML = '';
    }
    // Out of stock UI
    const addToCartBtn = document.getElementById('addToCartBtn');
    const buyNowBtn = document.getElementById('buyNowBtn');
    const buyNowContainer = document.getElementById('buyNowContainer');
    if (colorObj && colorObj.stock === 0) {
        addToCartBtn.disabled = true;
        addToCartBtn.style.opacity = 0.5;
        addToCartBtn.style.cursor = 'not-allowed';
        if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.style.opacity = 0.5;
            buyNowBtn.style.cursor = 'not-allowed';
        }
        if (buyNowContainer) {
            buyNowContainer.style.display = 'none';
        }
        stockMsg.innerHTML = `<span style="color:#D7263D;font-weight:400;font-size:1.3rem;">Out of Stock</span>`;
    } else {
        addToCartBtn.disabled = false;
        addToCartBtn.style.opacity = 1;
        addToCartBtn.style.cursor = '';
        if (buyNowBtn) {
            buyNowBtn.disabled = false;
            buyNowBtn.style.opacity = 1;
            buyNowBtn.style.cursor = '';
        }
        if (buyNowContainer) {
            buyNowContainer.style.display = '';
        }
    }
}

function showQuantityError(msg) {
    const errDiv = document.getElementById('quantityError');
    errDiv.innerHTML = `<span style="color:#D7263D;font-weight:400;font-size:1rem;">${msg}</span>`;
    setTimeout(() => { errDiv.innerHTML = ''; }, 2500);
}

// ... rest of the existing code (InfiniteHorizontalScroll class, etc.) ...