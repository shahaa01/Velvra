// State Management
class VelvraState {
    constructor() {
        this.filters = {
            price: { min: 0, max: 10000 },
            categories: [],
            colors: [],
            sizes: [],
            brands: [],
            discounts: []
        };
        this.sortBy = 'featured';
        this.viewMode = 'grid';
        this.wishlist = JSON.parse(localStorage.getItem('velvra-wishlist') || '[]');
        this.currentPage = 1;
        this.isFiltering = false;
        this.filterTimeout = null;
        this.pageCategory = window.location.pathname.includes('/men') ? 'men' : 
                           window.location.pathname.includes('/women') ? 'women' : null;
        
        // Store search query if on search page
        this.isSearchPage = window.location.pathname.includes('/search/products');
        const urlParams = new URLSearchParams(window.location.search);
        this.searchQuery = urlParams.get('q');
    }

    updateFilter(type, value) {
        if (type === 'price') {
            this.filters.price = value;
        } else if (Array.isArray(this.filters[type])) {
            const index = this.filters[type].indexOf(value);
            if (index > -1) {
                this.filters[type].splice(index, 1);
            } else {
                this.filters[type].push(value);
            }
        } else {
            this.filters[type] = value;
        }
        
        // Reset to first page when filters change
        this.currentPage = 1;
        
        // Debounce filter application
        clearTimeout(this.filterTimeout);
        this.filterTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    async applyFilters() {
        if (this.isFiltering) return;
        this.isFiltering = true;

        const productGrid = document.getElementById('productGrid');
        const loadMoreSection = document.getElementById('loadMoreSection');
        
        // Add loading state
        productGrid.classList.add('loading');
        
        try {
            // Build query parameters
            // Build query parameters
            const params = new URLSearchParams();
            params.append('page', this.currentPage);

            if (this.filters.price.min > 0) params.append('minPrice', this.filters.price.min);
            if (this.filters.price.max < 10000) params.append('maxPrice', this.filters.price.max);
            if (this.filters.categories.length > 0) params.append('categories', this.filters.categories.join(','));
            if (this.filters.colors.length > 0) params.append('colors', this.filters.colors.join(','));
            if (this.filters.brands.length > 0) params.append('brands', this.filters.brands.join(','));
            if (this.filters.discounts.length > 0) params.append('discounts', this.filters.discounts.join(','));
            if (this.filters.sizes.length > 0) params.append('sizes', this.filters.sizes.join(','));
            if (this.pageCategory) params.append('category', this.pageCategory);

            // Determine which endpoint to use
            let endpoint = '/shop/api/products';
            if (this.isSearchPage && this.searchQuery) {
                endpoint = '/search/api/products';
                params.append('q', this.searchQuery);
            }

            // Fetch filtered products
            const response = await fetch(`${endpoint}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            
            const data = await response.json();
            
            // Update product grid
            this.renderProducts(data.products);
            
            // Update pagination
            this.updatePagination(data.pagination);
            
            // Update results count
            this.updateResultsCount(data.pagination);
            
            // Update load more section
            this.updateLoadMoreSection(data.pagination);
            
            // Reset LoadMoreManager
            if (window.loadMoreManager) {
                window.loadMoreManager.reset();
            }
            
        } catch (error) {
            console.error('Error applying filters:', error);
            // Show error message
            productGrid.innerHTML = '<div class="empty-state"><p>Error loading products. Please try again.</p></div>';
        } finally {
            // Remove loading state
            setTimeout(() => {
                productGrid.classList.remove('loading');
            }, 300);
            this.isFiltering = false;
        }
    }

    renderProducts(products) {
        const productGrid = document.getElementById('productGrid');
        
        if (products.length === 0) {
            productGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <svg width="100" height="100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h3 class="empty-state-title">No products found</h3>
                    <p class="empty-state-description">Try adjusting your filters to see more results.</p>
                </div>
            `;
            return;
        }
        
        // Create product cards
        productGrid.innerHTML = products.map((product, index) => {
            const saleBadge = product.salePercentage && product.salePercentage > 0 ? 
                `<div class="sale-badge">${product.salePercentage}%</div>` : '';
            
            const images = product.images && product.images.length > 0 ? 
                product.images.map((img, i) => 
                    `<img src="${img}" alt="${product.name}" class="product-image ${i === 0 ? 'active' : ''}" data-index="${i}">`
                ).join('') : 
                '<div style="position: absolute; inset: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px;">No Image Available</div>';
            
            const imageCounter = product.images && product.images.length > 1 ? 
                `<div class="image-counter">
                    <span class="current-image">1</span>
                    <span class="separator">/</span>
                    <span class="total-images">${product.images.length}</span>
                </div>` : '';
            
            const colorOptions = product.colors.map(color => 
                `<button class="color-option ${product.colors.indexOf(color) === 0 ? 'selected' : ''}" style="background-color: ${color.hex}" data-color="${color.name}"></button>`
            ).join('');
            
            const currentPrice = product.salePrice || product.price;
            const originalPrice = product.sale ? 
                `<span class="text-base sm:text-xl text-red-700 line-through mt-1 sm:mt-0">₹${product.price}</span>` : '';
            const saleBadgeInline = product.sale ? 
                `<span class="hidden sm:inline-block px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">${product.salePercentage}% OFF</span>` : '';
            
            return `
                <article class="product-card">
                    <button class="wishlist-btn">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    ${saleBadge}
                    <figure class="product-image-container">
                        <a href="/product/${product._id}" class="product-link">
                            ${images}
                        </a>
                        ${imageCounter}
                    </figure>
                    <div class="product-info">
                        <p class="product-brand">${product.brand}</p>
                        <h3 class="product-name">${product.name}</h3>
                        <div class="color-options">
                            ${colorOptions}
                        </div>
                        <div class="flex flex-col sm:flex-row sm:items-baseline sm:gap-x-3">
                            <span class="text-xl sm:text-2xl font-semibold text-velvra-charcoal">₹${currentPrice}</span>
                            ${originalPrice}
                            ${saleBadgeInline}
                        </div>
                    </div>
                </article>
            `;
        }).join('');
        
        // Add fade-in animation to new products
        const newProducts = productGrid.querySelectorAll('.product-card');
        newProducts.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
        
        // Reinitialize product features
        this.initializeProductFeatures();
    }

    initializeProductFeatures() {
        // Reinitialize wishlist
        this.updateWishlistUI();
        
        // Reinitialize image carousels
        document.querySelectorAll('.product-card').forEach(card => {
            const images = card.querySelectorAll('.product-image');
            if (images.length > 1) {
                this.setupCarouselForCard(card, images);
            }
        });
        
        // Reinitialize color options
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const siblings = option.parentElement.querySelectorAll('.color-option');
                siblings.forEach(sibling => sibling.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }

    setupCarouselForCard(card, images) {
        let currentIndex = 0;
        let interval = null;
        
        card.addEventListener('mouseenter', () => {
            interval = setInterval(() => {
                images[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % images.length;
                images[currentIndex].classList.add('active');
                
                const counter = card.querySelector('.image-counter');
                if (counter) {
                    counter.querySelector('.current-image').textContent = currentIndex + 1;
                }
            }, 2000);
        });
        
        card.addEventListener('mouseleave', () => {
            clearInterval(interval);
            images.forEach(img => img.classList.remove('active'));
            images[0].classList.add('active');
            currentIndex = 0;
            
            const counter = card.querySelector('.image-counter');
            if (counter) {
                counter.querySelector('.current-image').textContent = '1';
            }
        });
    }

    updatePagination(pagination) {
        this.currentPage = pagination.currentPage;
    }

    updateResultsCount(pagination) {
        const resultsCount = document.querySelector('.results-count');
        if (resultsCount) {
            resultsCount.innerHTML = `Showing <span class="count">${pagination.startItem}–${pagination.endItem}</span> of <span class="count">${pagination.totalProducts}</span> items`;
        }
    }

    updateLoadMoreSection(pagination) {
        const loadMoreSection = document.getElementById('loadMoreSection');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const loadMoreInfo = document.querySelector('.load-more-info');
        
        if (!loadMoreSection) return;
        
        if (pagination.hasMore) {
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'inline-block';
            }
            if (loadMoreInfo) {
                loadMoreInfo.innerHTML = `Showing <span class="count">${pagination.endItem}</span> of <span class="count">${pagination.totalProducts}</span> products`;
            }
        } else {
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
            if (loadMoreInfo && pagination.totalProducts > 0) {
                loadMoreInfo.innerHTML = `<span style="color: var(--velvra-gold); font-weight: 600;">✓ All ${pagination.totalProducts} products loaded</span>`;
            }
        }
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
        const icategorypanded = toggle.getAttribute('aria-expanded') === 'true';
        
        // Lock during animation
        isAnimating = true;
        
        // 🛠 Fixed: Ensure only one section is open at a time on mobile
        if (window.innerWidth <= 768 && !icategorypanded) {
            // Close all other panels first
            document.querySelectorAll('.filter-panel.active').forEach(otherPanel => {
                if (otherPanel !== panel) {
                    otherPanel.classList.remove('active');
                    otherPanel.previousElementSibling.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        // Toggle current panel
        toggle.setAttribute('aria-expanded', !icategorypanded);
        panel.classList.toggle('active');
        
        // 🛠 Fixed: Smooth scroll to expanded section on mobile
        if (!icategorypanded && window.innerWidth <= 768) {
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

// Range slider state
let isSliderDragging = false;
let activeThumb = null;
const RANGE_MAX = 10000;
const RANGE_MIN = 0;
const RANGE_STEP = 100;

function updateRangeSlider() {
    const min = parseInt(minRange.value);
    const max = parseInt(maxRange.value);
    
    // Ensure minimum value is not less than 0
    const adjustedMin = Math.max(RANGE_MIN, min);
    if (min !== adjustedMin) {
        minRange.value = adjustedMin;
    }
    
    // Calculate percentages (0-100)
    const minPercent = ((adjustedMin - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;
    const maxPercent = ((max - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;
    
    // Update progress bar
    rangeProgress.style.left = minPercent + '%';
    rangeProgress.style.right = (100 - maxPercent) + '%';
    
    // Update thumb positions (account for thumb width)
    minThumb.style.left = `calc(${minPercent}% - 0.75rem)`;
    maxThumb.style.left = `calc(${maxPercent}% - 0.75rem)`;
    
    // Update tooltips
    const minTooltip = minThumb.querySelector('.price-tooltip');
    const maxTooltip = maxThumb.querySelector('.price-tooltip');
    if (minTooltip) minTooltip.textContent = `₹${adjustedMin}`;
    if (maxTooltip) maxTooltip.textContent = `₹${max}`;
    
    // Update input values
    minPrice.value = adjustedMin;
    maxPrice.value = max;
    
    // Update state
    state.filters.price = { min: adjustedMin, max };
}

// Mouse/Touch event handlers for thumb dragging
function startDragging(e, thumb) {
    e.preventDefault();
    e.stopPropagation();
    isSliderDragging = true;
    activeThumb = thumb;
    thumb.style.cursor = 'grabbing';
    
    // Add event listeners for dragging
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchmove', handleDrag, { passive: false });
    document.addEventListener('touchend', stopDragging);
}

function handleDrag(e) {
    if (!isSliderDragging || !activeThumb) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const container = document.querySelector('.range-slider-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    
    // Calculate position relative to container
    let percent = ((clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));
    
    // Convert percentage to value
    const value = Math.round((percent / 100) * (RANGE_MAX - RANGE_MIN) + RANGE_MIN);
    
    // Update the appropriate range input
    if (activeThumb === minThumb) {
        const maxValue = parseInt(maxRange.value);
        const newValue = Math.min(value, maxValue - 10);
        minRange.value = newValue;
    } else if (activeThumb === maxThumb) {
        const minValue = parseInt(minRange.value);
        const newValue = Math.max(value, minValue + 10);
        maxRange.value = newValue;
    }
    
    updateRangeSlider();
    // Trigger filter update immediately after drag
    state.updateFilter('price', { 
        min: parseInt(minRange.value), 
        max: parseInt(maxRange.value) 
    });
}

function stopDragging() {
    if (!isSliderDragging) return;
    
    isSliderDragging = false;
    if (activeThumb) {
        activeThumb.style.cursor = 'grab';
        activeThumb = null;
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDragging);
    document.removeEventListener('touchmove', handleDrag);
    document.removeEventListener('touchend', stopDragging);
}

// Range input event listeners
minRange?.addEventListener('input', (e) => {
    const minValue = Math.max(RANGE_MIN, parseInt(e.target.value));
    const maxValue = parseInt(maxRange.value);
    
    if (minValue >= maxValue) {
        e.target.value = maxValue - RANGE_STEP;
    } else {
        e.target.value = minValue;
    }
    updateRangeSlider();
});

maxRange?.addEventListener('input', (e) => {
    const maxValue = parseInt(e.target.value);
    const minValue = parseInt(minRange.value);
    
    if (maxValue <= minValue) {
        e.target.value = minValue + RANGE_STEP;
    }
    updateRangeSlider();
});

// Price input event listeners
minPrice?.addEventListener('change', (e) => {
    const value = Math.max(RANGE_MIN, Math.min(parseInt(e.target.value) || RANGE_MIN, RANGE_MAX));
    const maxValue = parseInt(maxPrice.value);
    
    if (value >= maxValue) {
        e.target.value = maxValue - RANGE_STEP;
        minRange.value = maxValue - RANGE_STEP;
    } else {
        minRange.value = value;
    }
    updateRangeSlider();
});

maxPrice?.addEventListener('change', (e) => {
    const value = Math.max(RANGE_MIN, Math.min(parseInt(e.target.value) || RANGE_MAX, RANGE_MAX));
    const minValue = parseInt(minPrice.value);
    
    if (value <= minValue) {
        e.target.value = minValue + RANGE_STEP;
        maxRange.value = minValue + RANGE_STEP;
    } else {
        maxRange.value = value;
    }
    updateRangeSlider();
});

// Add drag event listeners to thumbs
minThumb?.addEventListener('mousedown', (e) => startDragging(e, minThumb));
maxThumb?.addEventListener('mousedown', (e) => startDragging(e, maxThumb));
minThumb?.addEventListener('touchstart', (e) => startDragging(e, minThumb), { passive: false });
maxThumb?.addEventListener('touchstart', (e) => startDragging(e, maxThumb), { passive: false });

// Click on track to set value
document.querySelector('.range-slider-container')?.addEventListener('click', (e) => {
    if (isSliderDragging || e.target.classList.contains('range-thumb')) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = (clickX / rect.width) * 100;
    const value = Math.round((percent / 100) * (RANGE_MAX - RANGE_MIN) + RANGE_MIN);
    
    // Ensure value is not less than minimum
    const adjustedValue = Math.max(RANGE_MIN, value);
    
    // Determine which thumb to update based on click position
    const minValue = parseInt(minRange.value);
    const maxValue = parseInt(maxRange.value);
    const minPercent = ((minValue - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;
    const maxPercent = ((maxValue - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100;
    
    if (percent < (minPercent + maxPercent) / 2) {
        // Click closer to min thumb
        const newValue = Math.min(adjustedValue, maxValue - RANGE_STEP);
        minRange.value = newValue;
    } else {
        // Click closer to max thumb
        const newValue = Math.max(adjustedValue, minValue + RANGE_STEP);
        maxRange.value = newValue;
    }
    
    updateRangeSlider();
});

// Initialize range slider
document.addEventListener('DOMContentLoaded', () => {
    // Set range input attributes
    if (minRange && maxRange) {
        minRange.min = RANGE_MIN;
        minRange.max = RANGE_MAX;
        minRange.step = RANGE_STEP;
        maxRange.min = RANGE_MIN;
        maxRange.max = RANGE_MAX;
        maxRange.step = RANGE_STEP;
    }

    // Set price input attributes
    if (minPrice && maxPrice) {
        minPrice.min = RANGE_MIN;
        minPrice.max = RANGE_MAX;
        minPrice.step = RANGE_STEP;
        maxPrice.min = RANGE_MIN;
        maxPrice.max = RANGE_MAX;
        maxPrice.step = RANGE_STEP;
    }

    // Initialize the slider
    updateRangeSlider();
});

// ===== FILTER INTERACTIONS =====

// category checkboxes
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
        e.preventDefault();
        e.stopPropagation();
        const sizeValue = e.currentTarget.dataset.size;
        
        // Toggle selected class
        e.currentTarget.classList.toggle('selected');
        
        // Update filter state
        state.updateFilter('sizes', sizeValue);
    });
});

document.querySelectorAll('.discount-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const discount = e.target.dataset.discount;
        
        // Toggle selected class on parent
        const discountItem = e.target.closest('.discount-item');
        if (discountItem) {
            discountItem.classList.toggle('selected');
        }
        
        // Update filter state
        state.updateFilter('discounts', discount);
    });
});

// Also add click handler for the discount item label
document.querySelectorAll('.discount-item').forEach(item => {
    item.addEventListener('click', (e) => {
        // If clicking on the checkbox itself, let the checkbox handler handle it
        if (e.target.classList.contains('discount-checkbox')) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const checkbox = item.querySelector('.discount-checkbox');
        if (checkbox) {
            // Toggle checkbox state
            checkbox.checked = !checkbox.checked;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(event);
        }
    });
});

// Brand filter
document.querySelectorAll('.brand-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const brand = e.target.dataset.brand;
        state.updateFilter('brands', brand);
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

// Quick Add Functionality
document.querySelectorAll('.quick-add-mobile').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Check if user is logged in
        const isLoggedIn = btn.dataset.loggedIn === 'true';
        
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

        // Get size selection
        const sizeSelector = btn.closest('.product-card').querySelector('.size-selector.selected');
        if (!sizeSelector) {
            Swal.fire({
                icon: 'warning',
                title: 'Select Size',
                text: 'Please select a size before adding to cart.',
                confirmButtonText: 'OK'
            });
            return;
        }

        const size = sizeSelector.dataset.size;
        const color = btn.closest('.product-card').querySelector('.color-selector.selected')?.dataset.color || 'Default';
        const productId = btn.dataset.productId;

        try {
            // Show loading state
            btn.disabled = true;
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Processing...';

            // Check if item is already in cart
            const isInCart = btn.classList.contains('in-cart');

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
                    btn.disabled = false;
                    btn.innerHTML = originalText;
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
                    productId,
                    size,
                    color,
                    quantity: 1
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update cart');
            }

            const data = await response.json();

            // Update button state
            if (data.action === 'added') {
                btn.classList.add('in-cart');
                btn.innerHTML = 'Added to Cart ✓';
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Added!',
                    text: 'Item has been added to your cart.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                btn.classList.remove('in-cart');
                btn.innerHTML = 'Quick Add';
                
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
            btn.disabled = false;
            if (!btn.classList.contains('in-cart')) {
                btn.innerHTML = 'Quick Add';
            }
        }
    });
});

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
    body:not(.is-scrolling) .use-css-hover:hover .product-image-secondary {
        opacity: 1;
    }
    
    /* Disable transitions during scroll for better performance */
    .is-scrolling * {
        transition-duration: 0.0001s !important;
    }
`;
document.head.appendChild(styleEl);

// ===== IMAGE CAROUSEL FUNCTIONALITY =====
class ProductImageCarousel {
    constructor() {
        this.carousels = new Map();
        this.init();
    }

    init() {
        // Only initialize carousels for product cards with multiple images
        document.querySelectorAll('.product-card').forEach(card => {
            const images = card.querySelectorAll('.product-image');
            const counter = card.querySelector('.image-counter');
            
            if (images.length > 1) {
                // Only create carousel for multiple images
                const carousel = {
                    card,
                    images: Array.from(images),
                    counter,
                    currentIndex: 0,
                    interval: null,
                    isHovering: false
                };
                
                this.carousels.set(card, carousel);
                this.setupCarousel(carousel);
                
                // Ensure first image is active on initialization
                this.showImage(carousel, 0);
            }
            // For single images, do nothing - let the link work naturally
        });
    }

    setupCarousel(carousel) {
        const { card, images, counter } = carousel;

        // Only add carousel event listeners if there are multiple images
        if (images.length > 1) {
            // Mouse enter - start carousel
            card.addEventListener('mouseenter', () => {
                carousel.isHovering = true;
                this.startCarousel(carousel);
            });

            // Mouse leave - stop carousel and reset to first image
            card.addEventListener('mouseleave', () => {
                carousel.isHovering = false;
                this.stopCarousel(carousel);
                this.showImage(carousel, 0);
            });

            // Add click handlers for manual navigation
            images.forEach((image, index) => {
                image.addEventListener('click', (e) => {
                    this.showImage(carousel, index);
                });
            });
        }
    }

    startCarousel(carousel) {
        if (carousel.interval) return;
        
        carousel.interval = setInterval(() => {
            if (!carousel.isHovering) return;
            
            const nextIndex = (carousel.currentIndex + 1) % carousel.images.length;
            this.showImage(carousel, nextIndex);
        }, 2000); // Change image every 2 seconds
    }

    stopCarousel(carousel) {
        if (carousel.interval) {
            clearInterval(carousel.interval);
            carousel.interval = null;
        }
    }

    showImage(carousel, index) {
        const { images, counter } = carousel;
        
        // Hide all images
        images.forEach(img => {
            img.classList.remove('active');
        });
        
        // Show selected image
        images[index].classList.add('active');
        
        // Update counter
        if (counter) {
            const currentImageSpan = counter.querySelector('.current-image');
            if (currentImageSpan) {
                currentImageSpan.textContent = index + 1;
            }
        }
        
        carousel.currentIndex = index;
    }
}

// Initialize image carousels
document.addEventListener('DOMContentLoaded', () => {
    new ProductImageCarousel();
});

// ===== LOAD MORE FUNCTIONALITY =====
class LoadMoreManager {
    constructor(state) {
        this.state = state;
        this.isLoading = false;
        this.hasMore = true;
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.loadMoreSection = document.getElementById('loadMoreSection');
        this.productGrid = document.getElementById('productGrid');
        this.resultsCount = document.querySelector('.results-count');
        this.loadMoreInfo = document.querySelector('.load-more-info');
        
        this.init();
    }

    init() {
        if (this.loadMoreBtn) {
            // Remove any existing event listeners
            const newBtn = this.loadMoreBtn.cloneNode(true);
            this.loadMoreBtn.parentNode.replaceChild(newBtn, this.loadMoreBtn);
            this.loadMoreBtn = newBtn;
            
            // Add new event listener
            this.loadMoreBtn.addEventListener('click', () => this.loadMore());
        }
    }

    reset() {
        this.isLoading = false;
        this.hasMore = true;
        this.init();
    }

    async loadMore() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        this.updateButtonState();

        try {
            // Increment the page number
            this.state.currentPage++;
            
            // Build query parameters from the state's filters
            const params = new URLSearchParams();
            params.append('page', this.state.currentPage);
            
            // Append all existing filters from the state
            if (this.state.filters.price.min > 0) params.append('minPrice', this.state.filters.price.min);
            if (this.state.filters.price.max < 10000) params.append('maxPrice', this.state.filters.price.max);
            if (this.state.filters.categories.length > 0) params.append('categories', this.state.filters.categories.join(','));
            if (this.state.filters.colors.length > 0) params.append('colors', this.state.filters.colors.join(','));
            if (this.state.filters.brands.length > 0) params.append('brands', this.state.filters.brands.join(','));
            if (this.state.filters.discounts.length > 0) params.append('discounts', this.state.filters.discounts.join(','));
            if (this.state.filters.sizes.length > 0) params.append('sizes', this.state.filters.sizes.join(','));
            if (this.state.pageCategory) params.append('category', this.state.pageCategory);

            // Determine which endpoint to use
            let endpoint = '/shop/api/products';
            if (this.state.isSearchPage && this.state.searchQuery) {
                endpoint = '/search/api/products';
                params.append('q', this.state.searchQuery);
            }

            const response = await fetch(`${endpoint}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error('Failed to load products');
            }

            const data = await response.json();
            
            // Add new products to the grid
            this.addProductsToGrid(data.products);
            
            // Update pagination state
            this.hasMore = data.pagination.hasMore;
            
            // Update UI elements
            this.updateResultsCount(data.pagination);
            this.updateLoadMoreInfo(data.pagination);
            
            // Hide load more button if no more products
            if (!this.hasMore) {
                this.hideLoadMoreButton();
            }

        } catch (error) {
            console.error('Error loading more products:', error);
            this.showError();
            // Reset page number on error
            this.state.currentPage--;
        } finally {
            this.isLoading = false;
            this.updateButtonState();
        }
    }

    addProductsToGrid(products) {
        products.forEach((product, index) => {
            const productCard = this.createProductCard(product);
            
            // Add loading animation class
            productCard.classList.add('loading-in');
            
            // Append to grid
            this.productGrid.appendChild(productCard);
            
            // Remove animation class after animation completes
            setTimeout(() => {
                productCard.classList.remove('loading-in');
                // Ensure final state is visible
                productCard.style.opacity = '1';
                
                // Reinitialize carousel for this product card
                this.initializeProductCardFeatures(productCard);
            }, 600 + (index * 100));
        });
    }

    initializeProductCardFeatures(productCard) {
        // Reinitialize image carousel if needed
        const images = productCard.querySelectorAll('.product-image');
        if (images.length > 1) {
            // Add carousel functionality
            this.setupCarouselForCard(productCard, images);
        }
        
        // Add wishlist functionality
        const wishlistBtn = productCard.querySelector('.wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Add wishlist functionality here if needed
                wishlistBtn.classList.toggle('active');
            });
        }
        
        // Add color option functionality
        const colorOptions = productCard.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Remove selected from siblings
                colorOptions.forEach(sibling => sibling.classList.remove('selected'));
                // Add selected to clicked option
                option.classList.add('selected');
            });
        });
    }

    setupCarouselForCard(card, images) {
        let currentIndex = 0;
        
        // Mouse enter - start carousel
        card.addEventListener('mouseenter', () => {
            this.startCarouselForCard(card, images, currentIndex);
        });

        // Mouse leave - stop carousel and reset to first image
        card.addEventListener('mouseleave', () => {
            this.stopCarouselForCard(card, images);
            this.showImageForCard(card, images, 0);
            currentIndex = 0;
        });

        // Add click handlers for manual navigation
        images.forEach((image, index) => {
            image.addEventListener('click', (e) => {
                this.showImageForCard(card, images, index);
                currentIndex = index;
            });
        });
    }

    startCarouselForCard(card, images, currentIndex) {
        if (card.carouselInterval) return;
        
        card.carouselInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % images.length;
            this.showImageForCard(card, images, currentIndex);
        }, 2000);
    }

    stopCarouselForCard(card, images) {
        if (card.carouselInterval) {
            clearInterval(card.carouselInterval);
            card.carouselInterval = null;
        }
    }

    showImageForCard(card, images, index) {
        // Hide all images
        images.forEach(img => {
            img.classList.remove('active');
        });
        
        // Show selected image
        images[index].classList.add('active');
        
        // Update counter
        const counter = card.querySelector('.image-counter');
        if (counter) {
            const currentImageSpan = counter.querySelector('.current-image');
            if (currentImageSpan) {
                currentImageSpan.textContent = index + 1;
            }
        }
    }

    createProductCard(product) {
        const article = document.createElement('article');
        article.className = 'product-card';
        
        // Create wishlist button
        const wishlistBtn = document.createElement('button');
        wishlistBtn.className = 'wishlist-btn';
        wishlistBtn.innerHTML = `
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        `;
        
        // Create sale badge if applicable
        let saleBadge = '';
        if (product.salePercentage && product.salePercentage > 0) {
            saleBadge = `<div class="sale-badge">${product.salePercentage}%</div>`;
        }
        
        // Create image container
        let imageContainer = '';
        if (product.images && product.images.length > 0) {
            const images = product.images.map((img, i) => 
                `<img src="${img}" alt="${product.name}" class="product-image ${i === 0 ? 'active' : ''}" data-index="${i}">`
            ).join('');
            
            const imageCounter = product.images.length > 1 ? 
                `<div class="image-counter">
                    <span class="current-image">1</span>
                    <span class="separator">/</span>
                    <span class="total-images">${product.images.length}</span>
                </div>` : '';
            
            imageContainer = `
                <figure class="product-image-container">
                    <a href="/product/${product._id}" class="product-link">
                        ${images}
                    </a>
                    ${imageCounter}
                </figure>
            `;
        } else {
            imageContainer = `
                <figure class="product-image-container">
                    <div style="position: absolute; inset: 0; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px;">
                        No Image Available
                    </div>
                </figure>
            `;
        }
        
        // Create color options
        const colorOptions = product.colors.map(color => 
                `<button class="color-option selected" style="background-color: ${color.hex}" data-color="${color.name}"></button>`
            ).join('');
        
        // Create price display
        const currentPrice = product.salePrice || product.price;
        const originalPrice = product.sale ? `<span class="text-base sm:text-xl text-red-700 line-through mt-1 sm:mt-0">₹${product.price}</span>` : '';
        const saleBadgeInline = product.sale ? `<span class="hidden sm:inline-block px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">${product.salePercentage}% OFF</span>` : '';
        
        // Set the innerHTML first
        article.innerHTML = `
            ${saleBadge}
            ${imageContainer}
            <div class="product-info">
                <p class="product-brand">${product.brand}</p>
                <h3 class="product-name">${product.name}</h3>
                <div class="color-options">
                    ${colorOptions}
                </div>
                <div class="flex flex-col sm:flex-row sm:items-baseline sm:gap-x-3">
                    <span class="text-xl sm:text-2xl font-semibold text-velvra-charcoal">₹${currentPrice}</span>
                    ${originalPrice}
                    ${saleBadgeInline}
                </div>
            </div>
        `;
        
        // Append the wishlist button to the beginning of the article
        article.insertBefore(wishlistBtn, article.firstChild);
        
        return article;
    }

    updateResultsCount(pagination) {
        if (this.resultsCount) {
            this.resultsCount.innerHTML = `Showing <span class="count">${pagination.startItem}–${pagination.endItem}</span> of <span class="count">${pagination.totalProducts}</span> items`;
        }
    }

    updateLoadMoreInfo(pagination) {
        if (this.loadMoreInfo) {
            this.loadMoreInfo.innerHTML = `Showing <span class="count">${pagination.endItem}</span> of <span class="count">${pagination.totalProducts}</span> products`;
        }
    }

    updateButtonState() {
        if (this.loadMoreBtn) {
            if (this.isLoading) {
                this.loadMoreBtn.textContent = 'Loading...';
                this.loadMoreBtn.disabled = true;
            } else {
                this.loadMoreBtn.textContent = 'Load More Products';
                this.loadMoreBtn.disabled = false;
            }
        }
    }

    hideLoadMoreButton() {
        if (this.loadMoreBtn) {
            this.loadMoreBtn.style.display = 'none';
        }
        
        // Show a message that all products have been loaded
        if (this.loadMoreInfo) {
            this.loadMoreInfo.innerHTML = `<span style="color: var(--velvra-gold); font-weight: 600;">✓ All ${this.loadMoreInfo.querySelector('.count').textContent} products loaded</span>`;
        }
    }

    showError() {
        if (this.loadMoreBtn) {
            this.loadMoreBtn.textContent = 'Error loading products. Try again.';
            setTimeout(() => {
                this.loadMoreBtn.textContent = 'Load More Products';
            }, 3000);
        }
    }
}

// Initialize load more functionality
document.addEventListener('DOMContentLoaded', () => {
    // Store LoadMoreManager instance globally
    window.loadMoreManager = new LoadMoreManager(state);
});

// Update the filter event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Brand filter
    document.querySelector('.brand-list')?.addEventListener('change', (e) => {
        if (e.target.classList.contains('brand-checkbox')) {
            e.preventDefault();
            e.stopPropagation();
            const brand = e.target.dataset.brand;
            state.updateFilter('brands', brand);
        }
    });

    // Size filter
    document.querySelector('.size-grid')?.addEventListener('click', (e) => {
        const sizeOption = e.target.closest('.size-option');
        if (sizeOption) {
            e.preventDefault();
            e.stopPropagation();
            const sizeValue = sizeOption.dataset.size;
            
            // Toggle selected class
            sizeOption.classList.toggle('selected');
            
            // Update filter state
            state.updateFilter('sizes', sizeValue);
        }
    });

    // Price range slider
    const updatePriceFilter = () => {
        const min = parseInt(minRange.value);
        const max = parseInt(maxRange.value);
        state.updateFilter('price', { min, max });
    };

    // Add event listeners for price inputs
    minRange?.addEventListener('input', updatePriceFilter);
    maxRange?.addEventListener('input', updatePriceFilter);
    minPrice?.addEventListener('change', updatePriceFilter);
    maxPrice?.addEventListener('change', updatePriceFilter);

    // Add event listeners for price slider thumbs
    minThumb?.addEventListener('mousedown', (e) => startDragging(e, minThumb));
    maxThumb?.addEventListener('mousedown', (e) => startDragging(e, maxThumb));
    minThumb?.addEventListener('touchstart', (e) => startDragging(e, minThumb), { passive: false });
    maxThumb?.addEventListener('touchstart', (e) => startDragging(e, maxThumb), { passive: false });

    // Initialize the state
// Only apply filters if NOT on a search results page
const isSearchPage = window.location.pathname.includes('/search/products');
if (!isSearchPage) {
    state.applyFilters();
}
});