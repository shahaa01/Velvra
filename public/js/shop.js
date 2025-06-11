// ===== LUXURY E-COMMERCE INTERACTION SCRIPT =====

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

// ===== SMOOTH SCROLLING & ANIMATIONS =====
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

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    // Animate cards on scroll
    document.querySelectorAll('.product-card, .feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.320, 1)';
        observer.observe(card);
    });

    // Initialize wishlist UI
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
        }, 600);
    });
});

// ===== FILTER SIDEBAR =====
const mobileFilterTrigger = document.getElementById('mobileFilterTrigger');
const filterSidebar = document.getElementById('filterSidebar');
const filterClose = document.getElementById('filterClose');
const filterOverlay = document.getElementById('filterOverlay');

// Open mobile filter
mobileFilterTrigger?.addEventListener('click', () => {
    filterSidebar.classList.add('active');
    filterOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
});

// Close mobile filter
const closeFilter = () => {
    filterSidebar.classList.remove('active');
    filterOverlay.classList.remove('active');
    document.body.style.overflow = '';
};

filterClose?.addEventListener('click', closeFilter);
filterOverlay?.addEventListener('click', closeFilter);

// Filter toggles
document.querySelectorAll('.filter-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const panel = toggle.nextElementSibling;
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        toggle.setAttribute('aria-expanded', !isExpanded);
        panel.classList.toggle('active');
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

// Wishlist functionality
document.querySelectorAll('.wishlist-btn').forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = `product-${index + 1}`;
        state.toggleWishlist(productId);
        
        // Add visual feedback
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 200);
    });
});

// Product card color options
document.querySelectorAll('.product-card .color-option').forEach(option => {
    option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Remove selected from siblings
        const siblings = option.parentElement.querySelectorAll('.color-option');
        siblings.forEach(sibling => sibling.classList.remove('selected'));
        
        // Add selected to clicked option
        option.classList.add('selected');
        
        // Update product image (simulate color change)
        const productCard = option.closest('.product-card');
        const primaryImage = productCard.querySelector('.product-image');
        
        // Add shimmer effect
        primaryImage.style.filter = 'brightness(1.1)';
        setTimeout(() => {
            primaryImage.style.filter = '';
        }, 300);
    });
});

// Quick size selection
document.querySelectorAll('.size-quick-option').forEach(sizeBtn => {
    sizeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Remove selected from siblings
        const siblings = sizeBtn.parentElement.querySelectorAll('.size-quick-option');
        siblings.forEach(sibling => sibling.classList.remove('selected'));
        
        // Add selected to clicked option
        sizeBtn.classList.add('selected');
        
        // Visual feedback
        sizeBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            sizeBtn.style.transform = '';
        }, 150);
    });
});

// Quick add functionality
document.querySelectorAll('.quick-add-mobile').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Show success animation
        btn.textContent = 'Added!';
        btn.style.background = 'var(--velvra-gold)';
        btn.style.color = 'var(--velvra-charcoal)';
        
        setTimeout(() => {
            btn.textContent = 'Quick Add';
            btn.style.background = '';
            btn.style.color = '';
        }, 2000);
    });
});

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
        
        // Update grid layout
        const grid = document.getElementById('productGrid');
        const viewMode = btn.dataset.view;
        
        if (viewMode === 'list') {
            grid.style.gridTemplateColumns = '1fr';
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.display = 'flex';
                card.style.height = '200px';
            });
        } else {
            grid.style.gridTemplateColumns = '';
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.display = '';
                card.style.height = '';
            });
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
        
        // Show success state
        submitBtn.textContent = 'Subscribed!';
        submitBtn.style.background = 'var(--velvra-gold)';
        
        // Reset form
        document.querySelector('.newsletter-input').value = '';
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
        }, 3000);
    }
});

// ===== SMOOTH SCROLL FOR HERO BUTTONS =====
document.querySelectorAll('.premium-btn-primary, .premium-btn-secondary').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (btn.textContent.includes('Explore')) {
            e.preventDefault();
            document.querySelector('.product-section').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== PERFORMANCE OPTIMIZATIONS =====

// Throttle scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy loading for images (if needed)
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        }
    });
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
    element.style.pointerEvents = 'none';
}

function hideLoading(element) {
    setTimeout(() => {
        element.classList.remove('loading');
        element.style.pointerEvents = '';
    }, 600);
}

// ===== PRODUCT HOVER EFFECTS =====
document.querySelectorAll('.product-card').forEach(card => {
    const image = card.querySelector('.product-image');
    const secondaryImage = card.querySelector('.product-image-secondary');
    
    card.addEventListener('mouseenter', () => {
        if (secondaryImage) {
            image.style.opacity = '0';
            secondaryImage.style.opacity = '1';
        }
    });
    
    card.addEventListener('mouseleave', () => {
        if (secondaryImage) {
            image.style.opacity = '1';
            secondaryImage.style.opacity = '0';
        }
    });
});

// ===== FLOATING ANIMATION =====
function startFloatingAnimation() {
    document.querySelectorAll('.floating').forEach((element, index) => {
        element.style.animationDelay = `${index * 0.2}s`;
    });
}

// Start animations when page loads
window.addEventListener('load', () => {
    startFloatingAnimation();
    
    // Add entrance animations
    setTimeout(() => {
        document.querySelectorAll('.hero-title, .hero-description, .hero-buttons').forEach((element, index) => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }, 100);
});

// ===== SEARCH FUNCTIONALITY (Basic) =====
function filterProducts(searchTerm) {
    const products = document.querySelectorAll('.product-card');
    const normalizedSearch = searchTerm.toLowerCase();
    
    products.forEach(product => {
        const name = product.querySelector('.product-name').textContent.toLowerCase();
        const brand = product.querySelector('.product-brand').textContent.toLowerCase();
        
        if (name.includes(normalizedSearch) || brand.includes(normalizedSearch)) {
            product.style.display = '';
            product.style.opacity = '1';
        } else {
            product.style.display = 'none';
            product.style.opacity = '0';
        }
    });
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('Velvra Error:', e.error);
    // Could send to analytics or show user-friendly message
});

// Add CSS custom properties for dynamic theming
document.documentElement.style.setProperty('--scroll-progress', '0%');

// Update scroll progress
window.addEventListener('scroll', throttle(() => {
    const scrolled = window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrolled / maxScroll) * 100;
    document.documentElement.style.setProperty('--scroll-progress', `${progress}%`);
}, 16));

// Add intersection observer for product cards
const productObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.320, 1)';
    productObserver.observe(card);
});
