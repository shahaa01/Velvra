

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
            s.classList.remove('border-velvra-gold', 'bg-velvra-gold', 'text-white');
            s.classList.add('border-gray-200');
        });
        selector.classList.remove('border-gray-200');
        selector.classList.add('border-velvra-gold', 'bg-velvra-gold', 'text-white');
        
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
wishlistBtn.addEventListener('click', () => {
    const isInWishlist = productState.wishlist.includes('premium-cashmere-coat');
    
    if (isInWishlist) {
        // Remove from wishlist
        productState.wishlist = productState.wishlist.filter(id => id !== 'premium-cashmere-coat');
        wishlistBtn.classList.remove('bg-velvra-gold', 'text-white');
        wishlistBtn.querySelector('.heart-outline').style.fill = 'none';
    } else {
        // Add to wishlist
        productState.wishlist.push('premium-cashmere-coat');
        wishlistBtn.classList.add('bg-velvra-gold', 'text-white');
        wishlistBtn.querySelector('.heart-outline').style.fill = 'currentColor';
        
        // Create floating heart effect
        createFloatingHeart(wishlistBtn);
    }
    
    // Animate button
    wishlistBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        wishlistBtn.style.transform = '';
    }, 200);
});

// Add to Cart Functionality
addToCartBtn.addEventListener('click', () => {
    // Simulate add to cart
    const originalText = addToCartBtn.innerHTML;
    addToCartBtn.innerHTML = `
        <span class="relative z-10 flex items-center justify-center space-x-2">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Adding...</span>
        </span>
    `;
    
    setTimeout(() => {
        addToCartBtn.innerHTML = `
            <span class="relative z-10 flex items-center justify-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Added to Cart!</span>
            </span>
        `;
        
        setTimeout(() => {
            addToCartBtn.innerHTML = originalText;
        }, 1500);
    }, 1000);
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
    
    console.log('🎨 Velvra Product Detail Page initialized');
    console.log('💎 All interactive features ready');
    console.log('📱 Mobile-first responsive design optimized');
    console.log('🏆 World-class luxury fashion experience complete');
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

// Smooth scrolling for related products on mobile
let isScrollingRelated = false;
relatedProducts.addEventListener('scroll', () => {
    if (!isScrollingRelated) {
        isScrollingRelated = true;
        setTimeout(() => {
            isScrollingRelated = false;
        }, 150);
    }
});

// Update scroll button visibility
function updateScrollButtons() {
    const scrollLeft = relatedProducts.scrollLeft;
    const maxScroll = relatedProducts.scrollWidth - relatedProducts.clientWidth;
    
    scrollLeftBtn.style.opacity = scrollLeft > 0 ? '1' : '0.5';
    scrollRightBtn.style.opacity = scrollLeft < maxScroll ? '1' : '0.5';
}

relatedProducts.addEventListener('scroll', updateScrollButtons);
window.addEventListener('resize', updateScrollButtons);
updateScrollButtons();

// Add smooth transitions for better UX
const style = document.createElement('style');
style.textContent = `
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .product-card:hover .wishlist-btn {
        transform: scale(1.1);
    }
    
    .thumbnail-btn:hover {
        transform: scale(1.05);
    }
    
    .color-selector:hover,
    .size-selector:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(212, 175, 55, 0.3);
    }
    
    .accordion-trigger:hover {
        background-color: rgba(248, 246, 240, 0.5);
    }
    
    @media (max-width: 768px) {
        .related-products {
            scroll-snap-type: x mandatory;
        }
        
        .product-card {
            scroll-snap-align: start;
        }
    }
`;
document.head.appendChild(style);
