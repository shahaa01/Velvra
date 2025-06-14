
// State Management
class VelvraState {
    constructor() {
        this.filters = {
            price: { min: 0, max: 2000 },
            categories: [],
            colors: [],
            sizes: [],
            brands: []
        };
        this.sortBy = 'featured';
        this.viewMode = 'grid';
        this.wishlist = JSON.parse(localStorage.getItem('velvra-wishlist') || '[]');
    }

    updateFilter(type, value) {
        if (Array.isArray(this.filters[type])) {
            const index = this.filters[type].indexOf(value);
            if (index > -1) {
                this.filters[type].splice(index, 1);
            } else {
                this.filters[type].push(value);
            }
        } else {
            this.filters[type] = value;
        }
        this.applyFilters();
    }

    applyFilters() {
        // Simulate filtering (in real app, this would filter products)
        console.log('Filters applied:', this.filters);
        // Add loading animation
        document.getElementById('productGrid').classList.add('loading');
        setTimeout(() => {
            document.getElementById('productGrid').classList.remove('loading');
        }, 800);
    }

    toggleWishlist(productId) {
        const index = this.wishlist.indexOf(productId);
        if (index > -1) {
            this.wishlist.splice(index, 1);
        } else {
            this.wishlist.push(productId);
        }
        localStorage.setItem('velvra-wishlist', JSON.stringify(this.wishlist));
        this.updateWishlistUI();
    }

    updateWishlistUI() {
        document.querySelectorAll('.wishlist-btn').forEach((btn, index) => {
            const productId = `product-${index + 1}`;
            if (this.wishlist.includes(productId)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

// Initialize state
const state = new VelvraState();

// Initialize wishlist UI
document.addEventListener('DOMContentLoaded', () => {
    state.updateWishlistUI();
});

// ===== SORT FUNCTIONALITY =====
const sortTrigger = document.getElementById('sortTrigger');
const sortDropdown = document.getElementById('sortDropdown');
const currentSortText = document.getElementById('currentSort');

sortTrigger?.addEventListener('click', () => {
    const isOpen = sortDropdown.classList.contains('active');
    sortDropdown.classList.toggle('active');
    sortTrigger.setAttribute('aria-expanded', !isOpen);
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!sortTrigger?.contains(e.target) && !sortDropdown?.contains(e.target)) {
        sortDropdown?.classList.remove('active');
        sortTrigger?.setAttribute('aria-expanded', 'false');
    }
});

// Handle sort selection
document.querySelectorAll('.sort-item').forEach(item => {
    item.addEventListener('click', () => {
        // Remove active from all items
        document.querySelectorAll('.sort-item').forEach(i => {
            i.classList.remove('active');
            i.querySelector('.checkmark').style.opacity = '0';
        });
        
        // Add active to clicked item
        item.classList.add('active');
        item.querySelector('.checkmark').style.opacity = '1';
        
        // Update current sort text
        const sortValue = item.dataset.sort;
        const sortText = item.querySelector('span').textContent;
        currentSortText.textContent = sortText;
        state.sortBy = sortValue;
        
        // Close dropdown
        sortDropdown.classList.remove('active');
        sortTrigger.setAttribute('aria-expanded', 'false');
        
        // Apply sort with loading animation
        document.getElementById('productGrid').classList.add('loading');
        setTimeout(() => {
            document.getElementById('productGrid').classList.remove('loading');
        }, 300);
    });
});

// ===== FILTER SIDEBAR =====
const mobileFilterTrigger = document.getElementById('mobileFilterTrigger');
const filterSidebar = document.getElementById('filterSidebar');
const filterClose = document.getElementById('filterClose');
const filterOverlay = document.getElementById('filterOverlay');

mobileFilterTrigger?.addEventListener('click', () => {
    if(filterSidebar.classList.contains('active') && filterOverlay.classList.contains('active')) {
        closeFilter();
    } else {
        filterSidebar.classList.add('active');
        filterOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.style.width = '100%';
        document.body.style.top = `-${window.scrollY}px`;
    }
});

// Close mobile filter with scroll restoration
const closeFilter = () => {
    const scrollY = document.body.style.top;
    
    filterSidebar.classList.remove('active');
    filterOverlay.classList.remove('active');
    
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
};

filterClose?.addEventListener('click', closeFilter);
filterOverlay?.addEventListener('click', closeFilter);

if ('ontouchstart' in window) {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            if (e.target.closest('.color-option, .size-option, .filter-toggle, .wishlist-btn')) {
                e.preventDefault();
            }
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// Filter toggles with mobile-optimized behavior
document.querySelectorAll('.filter-toggle').forEach(toggle => {
    let isAnimating = false; // Prevent rapid clicks
    
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 🛠 Fixed: Prevent race conditions during animation
        if (isAnimating) return;
        
        const panel = toggle.nextElementSibling;
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        // Lock during animation
        isAnimating = true;
        
        // 🛠 Fixed: Ensure only one section is open at a time on mobile
        if (window.innerWidth <= 768 && !isExpanded) {
            // Close all other panels first
            document.querySelectorAll('.filter-panel.active').forEach(otherPanel => {
                if (otherPanel !== panel) {
                    otherPanel.classList.remove('active');
                    otherPanel.previousElementSibling.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        // Toggle current panel
        toggle.setAttribute('aria-expanded', !isExpanded);
        panel.classList.toggle('active');
        
        // 🛠 Fixed: Smooth scroll to expanded section on mobile
        if (!isExpanded && window.innerWidth <= 768) {
            setTimeout(() => {
                toggle.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                });
            }, 100);
        }
        
        // Unlock after animation completes
        setTimeout(() => {
            isAnimating = false;
        }, 300);
    });
});

// ===== PRICE RANGE SLIDER =====
const minRange = document.getElementById('minRange');
const maxRange = document.getElementById('maxRange');
const minPrice = document.getElementById('minPrice');
const maxPrice = document.getElementById('maxPrice');
const rangeProgress = document.getElementById('rangeProgress');
const minThumb = document.getElementById('minThumb');
const maxThumb = document.getElementById('maxThumb');

function updateRangeSlider() {
    const min = parseInt(minRange.value);
    const max = parseInt(maxRange.value);
    const range = 2000;
    
    // Update progress bar
    const leftPercent = (min / range) * 100;
    const rightPercent = 100 - (max / range) * 100;
    
    rangeProgress.style.left = leftPercent + '%';
    rangeProgress.style.right = rightPercent + '%';
    
    // Update thumb positions
    minThumb.style.left = leftPercent + '%';
    maxThumb.style.left = (max / range) * 100 + '%';
    
    // Update tooltips
    minThumb.querySelector('.price-tooltip').textContent = `${min}`;
    maxThumb.querySelector('.price-tooltip').textContent = `${max}`;
    
    // Update input values
    minPrice.value = min;
    maxPrice.value = max;
    
    // Update state
    state.filters.price = { min, max };
}

// Range slider event listeners
minRange?.addEventListener('input', (e) => {
    if (parseInt(e.target.value) >= parseInt(maxRange.value)) {
        e.target.value = parseInt(maxRange.value) - 10;
    }
    updateRangeSlider();
});

maxRange?.addEventListener('input', (e) => {
    if (parseInt(e.target.value) <= parseInt(minRange.value)) {
        e.target.value = parseInt(minRange.value) + 10;
    }
    updateRangeSlider();
});

// Price input event listeners
minPrice?.addEventListener('change', (e) => {
    const value = Math.max(0, Math.min(parseInt(e.target.value) || 0, 2000));
    if (value >= parseInt(maxPrice.value)) {
        e.target.value = parseInt(maxPrice.value) - 10;
        return;
    }
    minRange.value = value;
    updateRangeSlider();
});

maxPrice?.addEventListener('change', (e) => {
    const value = Math.max(0, Math.min(parseInt(e.target.value) || 2000, 2000));
    if (value <= parseInt(minPrice.value)) {
        e.target.value = parseInt(minPrice.value) + 10;
        return;
    }
    maxRange.value = value;
    updateRangeSlider();
});

// Initialize range slider
updateRangeSlider();

// ===== FILTER INTERACTIONS =====

// Category checkboxes
document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        const category = e.target.dataset.category;
        state.updateFilter('categories', category);
    });
});

// Color swatches
document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        const color = e.currentTarget.dataset.color;
        swatch.classList.toggle('selected');
        state.updateFilter('colors', color);
    });
});

// Size options
document.querySelectorAll('.size-option').forEach(size => {
    size.addEventListener('click', (e) => {
        const sizeValue = e.target.dataset.size;
        e.target.classList.toggle('selected');
        state.updateFilter('sizes', sizeValue);
    });
});

// ===== PRODUCT INTERACTIONS =====

// Wishlist functionality - Event delegation for better performance
document.addEventListener('click', (e) => {
    if (e.target.closest('.wishlist-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.target.closest('.wishlist-btn');
        const index = Array.from(document.querySelectorAll('.wishlist-btn')).indexOf(btn);
        const productId = `product-${index + 1}`;
        state.toggleWishlist(productId);
        
        // Add visual feedback
        btn.classList.add('wishlist-animate');
        setTimeout(() => {
            btn.classList.remove('wishlist-animate');
        }, 300);
    }
});

// Product card color options - Event delegation
document.addEventListener('click', (e) => {
    const colorOption = e.target.closest('.product-card .color-option');
    if (colorOption) {
        e.preventDefault();
        e.stopPropagation();
        
        // 🛠 Fixed: Mobile flicker on color swatch rapid tap
        if (window.innerWidth <= 768) {
            colorSelectionHandler(colorOption);
        } else {
            // Desktop behavior remains unchanged
            const siblings = colorOption.parentElement.querySelectorAll('.color-option');
            siblings.forEach(sibling => sibling.classList.remove('selected'));
            colorOption.classList.add('selected');
            
            const productCard = colorOption.closest('.product-card');
            const primaryImage = productCard.querySelector('.product-image');
            
            primaryImage.classList.add('image-transition');
            setTimeout(() => {
                primaryImage.classList.remove('image-transition');
            }, 300);
        }
    }
});

// Quick size selection - Event delegation
document.addEventListener('click', (e) => {
    const sizeBtn = e.target.closest('.size-quick-option');
    if (sizeBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        // Remove selected from siblings
        const siblings = sizeBtn.parentElement.querySelectorAll('.size-quick-option');
        siblings.forEach(sibling => sibling.classList.remove('selected'));
        
        // Add selected to clicked option
        sizeBtn.classList.add('selected');
        sizeBtn.classList.add('size-animate');
        
        setTimeout(() => {
            sizeBtn.classList.remove('size-animate');
        }, 150);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.quick-add-mobile').forEach(btn => {
    btn.addEventListener('click', (e) => {
        console.log("Activated click handler");
        e.preventDefault();
        e.stopPropagation();
        console.log('Clicked', btn.textContent, 'Flag:', btn.dataset.quickAddFlag);

        const isAdded = btn.dataset.quickAddFlag === 'true';

        if (!isAdded) {
            btn.dataset.quickAddFlag = 'true';
            btn.textContent = 'Added!';
            btn.classList.add('added'); // Use CSS class
        } else {
            btn.dataset.quickAddFlag = 'false';
            btn.textContent = 'Quick Add';
            btn.classList.remove('added');
        }
    });
});
})



// Debounced color selection for mobile
const colorSelectionHandler = (() => {
    let timeout;
    const DEBOUNCE_DELAY = 150; // Prevent rapid fire events
    
    return (colorOption) => {
        clearTimeout(timeout);
        
        // Add immediate visual feedback
        colorOption.classList.add('color-selecting');
        
        timeout = setTimeout(() => {
            // Remove selected from siblings
            const siblings = colorOption.parentElement.querySelectorAll('.color-option');
            siblings.forEach(sibling => {
                sibling.classList.remove('selected', 'color-selecting');
            });
            
            // Add selected to clicked option
            colorOption.classList.add('selected');
            colorOption.classList.remove('color-selecting');
            
            // Update product image with smooth transition
            const productCard = colorOption.closest('.product-card');
            const primaryImage = productCard.querySelector('.product-image');
            
            // 🛠 Fixed: Prevent layout shift during color change
            if (primaryImage) {
                primaryImage.style.opacity = '0.8';
                setTimeout(() => {
                    primaryImage.style.opacity = '1';
                }, 300);
            }
        }, DEBOUNCE_DELAY);
    };
})();

// ===== VIEW TOGGLE =====
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all buttons
        document.querySelectorAll('.view-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        
        // Add active to clicked button
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        
        // Update grid layout with class instead of inline styles
        const grid = document.getElementById('productGrid');
        const viewMode = btn.dataset.view;
        
        if (viewMode === 'list') {
            grid.classList.add('list-view');
        } else {
            grid.classList.remove('list-view');
        }
        
        state.viewMode = viewMode;
    });
});

// ===== NEWSLETTER FORM =====
document.querySelector('.newsletter-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.querySelector('.newsletter-input').value;
    
    if (email) {
        const submitBtn = document.querySelector('.newsletter-submit');
        const originalText = submitBtn.textContent;
        
        // Show success state using classes instead of inline styles
        submitBtn.textContent = 'Subscribed!';
        submitBtn.classList.add('newsletter-success');
        
        // Reset form
        document.querySelector('.newsletter-input').value = '';
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('newsletter-success');
        }, 3000);
    }
});

// ===== PERFORMANCE OPTIMIZATIONS =====

// Throttle function for scroll events
function throttle(func, wait = 16) {
    let timeout = null;
    let previous = 0;
    
    return function(...args) {
        const now = Date.now();
        const remaining = wait - (now - previous);
        
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(this, args);
        } else if (!timeout) {
            timeout = setTimeout(() => {
                previous = Date.now();
                timeout = null;
                func.apply(this, args);
            }, remaining);
        }
    };
}

// Optimize image loading with IntersectionObserver
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                // Create a new image object to preload
                const tempImg = new Image();
                tempImg.onload = () => {
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    img.removeAttribute('data-src');
                };
                tempImg.src = img.dataset.src;
                imageObserver.unobserve(img);
            }
        }
    });
}, {
    rootMargin: '200px 0px', // Preload images 200px before they enter viewport
    threshold: 0.01
});

// Apply lazy loading to all images with data-src
document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

// ===== KEYBOARD ACCESSIBILITY =====
document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        if (filterSidebar.classList.contains('active')) {
            closeFilter();
        }
        if (sortDropdown.classList.contains('active')) {
            sortDropdown.classList.remove('active');
            sortTrigger.setAttribute('aria-expanded', 'false');
        }
    }
    
    // Enter key activates buttons
    if (e.key === 'Enter' && e.target.matches('.color-swatch, .size-option')) {
        e.target.click();
    }
});

// ===== TOUCH GESTURES FOR MOBILE =====
let startY = 0;
let currentY = 0;
let isDragging = false;

// Swipe to close filter on mobile
filterSidebar?.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
}, { passive: true });

filterSidebar?.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    if (deltaY > 0) {
        // Use CSS transform with will-change for better performance
        filterSidebar.style.transform = `translateX(-${Math.min(deltaY / 3, 100)}%)`;
    }
}, { passive: true });

filterSidebar?.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    
    const deltaY = currentY - startY;
    if (deltaY > 100) {
        closeFilter();
    } else {
        filterSidebar.style.transform = '';
    }
});

// ===== LOADING STATES =====
function showLoading(element) {
    element.classList.add('loading');
    element.setAttribute('aria-busy', 'true');
}

function hideLoading(element) {
    requestAnimationFrame(() => {
        setTimeout(() => {
            element.classList.remove('loading');
            element.setAttribute('aria-busy', 'false');
        }, 600);
    });
}

// ===== PRODUCT HOVER EFFECTS - OPTIMIZED =====
// Replace direct style changes with class toggles for better performance
// Use event delegation for all product cards
// ===== PRODUCT HOVER EFFECTS - SIMPLIFIED FIX =====
// Replace this section in your original JS file

// First, remove any existing product hover event listeners
document.querySelectorAll('.product-card').forEach(card => {
    const clone = card.cloneNode(true);
    card.parentNode.replaceChild(clone, card);
});

// Apply a class-based approach for secondary image
document.querySelectorAll('.product-card').forEach(card => {
    // Preload secondary image if it exists
    const secondaryImage = card.querySelector('.product-image-secondary');
    if (secondaryImage && secondaryImage.dataset.src) {
        const img = new Image();
        img.src = secondaryImage.dataset.src;
        secondaryImage.dataset.loaded = 'true';
    }
    
    // Add CSS class for hover rather than using JS events
    card.classList.add('use-css-hover');
});

// ===== OPTIMIZED PRODUCT CARD ANIMATIONS =====
// Simplified intersection observer with minimal processing
const productObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('product-visible');
            productObserver.unobserve(entry.target);
        }
    });
}, { 
    threshold: 0.15,
    rootMargin: '50px 0px'
});

// Apply animations with minimal processing
document.querySelectorAll('.product-card:not(.product-visible)').forEach(card => {
    productObserver.observe(card);
});

// Disable any heavy processing during scroll
window.addEventListener('scroll', () => {
    // Empty function with passive listener improves touch device performance
}, { passive: true });

// Turn off any unnecessary animations during scroll
let isScrolling;
window.addEventListener('scroll', () => {
    document.body.classList.add('is-scrolling');
    
    clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
    }, 100);
}, { passive: true });

// Add this CSS either inline or to your stylesheet
const styleEl = document.createElement('style');
styleEl.textContent = `
    .product-card {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1),
                    transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
    }
    
    .product-visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    .use-css-hover .product-image-secondary {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    /* Only apply hover effect when not scrolling */
    body:not(.is-scrolling) .use-css-hover:hover .product-image {
        opacity: 0;
    }
    
    body:not(.is-scrolling) .use-css-hover:hover .product-image-secondary {
        opacity: 1;
    }
    
    /* Disable transitions during scroll for better performance */
    .is-scrolling * {
        transition-duration: 0.0001s !important;
    }
`;
document.head.appendChild(styleEl);