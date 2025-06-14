// These specific changes fix the mobile filter sidebar issues without affecting other functionality

// ===== 1. TOUCH EVENT HANDLING FIXES =====
// Replace the existing touch event handlers for filterSidebar with this improved version
// This fixes the weird scaling and flashy behavior

// First, remove the problematic touch event handlers
filterSidebar?.removeEventListener('touchstart', null);
filterSidebar?.removeEventListener('touchmove', null);
filterSidebar?.removeEventListener('touchend', null);

// Fix #1: Add improved touch handling for the sidebar
let touchStartX = 0;
let touchCurrentX = 0;
let isSwiping = false;

filterSidebar?.addEventListener('touchstart', (e) => {
    // Only initiate swipe on the main filter sidebar, not on interactive elements
    if (e.target.closest('.filter-checkbox, .color-swatch, .size-option, .brand-checkbox, .discount-checkbox, input, button')) {
        isSwiping = false;
        return;
    }
    
    touchStartX = e.touches[0].clientX;
    isSwiping = true;
    // Don't add any transform during touch start
}, { passive: true });

filterSidebar?.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    
    touchCurrentX = e.touches[0].clientX;
    const deltaX = touchStartX - touchCurrentX;
    
    // Only apply transform if swiping left (to close)
    if (deltaX > 0) {
        // Use translateX instead of combined transform
        filterSidebar.style.transform = `translateX(-${Math.min(deltaX, 100)}px)`;
    }
}, { passive: true });

filterSidebar?.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    
    const deltaX = touchStartX - touchCurrentX;
    if (deltaX > 100) {
        closeFilter();
    } else {
        // Reset transform with a transition
        filterSidebar.style.transition = 'transform 0.3s ease';
        filterSidebar.style.transform = '';
        
        // Remove the transition after it completes
        setTimeout(() => {
            filterSidebar.style.transition = '';
        }, 300);
    }
    
    isSwiping = false;
}, { passive: true });

// ===== 2. FILTER TOGGLE FIXES =====
// Replace the existing filter toggle event handlers with optimized versions

// First, remove all existing toggle event listeners to prevent duplicates
document.querySelectorAll('.filter-toggle').forEach(toggle => {
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
});

// Fix #2: Re-add improved toggle handlers
document.querySelectorAll('.filter-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        
        const panel = toggle.nextElementSibling;
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        // Toggle the aria-expanded attribute
        toggle.setAttribute('aria-expanded', !isExpanded);
        
        // Use classList toggle for better performance
        panel.classList.toggle('active');
        
        // Ensure the panel remains visible when expanded
        if (!isExpanded) {
            // If opening, make sure it's visible in the viewport
            setTimeout(() => {
                if (window.innerWidth < 1024) { // Only on mobile
                    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 50);
        }
    });
});

// ===== 3. SCROLLING FIXES =====
// Fix #3: Improve filter sidebar scrolling behavior

// A. Fix filter content height
const fixFilterHeight = () => {
    const filterSidebar = document.getElementById('filterSidebar');
    const filterHeader = filterSidebar?.querySelector('.filter-header');
    const filterContent = filterSidebar?.querySelector('.filter-content');
    
    if (filterSidebar && filterHeader && filterContent && window.innerWidth < 1024) {
        // Calculate available height
        const headerHeight = filterHeader.offsetHeight;
        const viewportHeight = window.innerHeight;
        
        // Set content height to allow proper scrolling
        filterContent.style.height = `${viewportHeight - headerHeight}px`;
        filterContent.style.overflowY = 'auto';
        filterContent.style.overflowX = 'hidden';
        
        // Remove overflow from sidebar itself (let the content scroll)
        filterSidebar.style.overflow = 'hidden';
    } else if (filterContent && window.innerWidth >= 1024) {
        // Reset styles on desktop
        filterContent.style.height = '';
        filterContent.style.overflowY = '';
        filterSidebar.style.overflow = '';
    }
};

// B. Apply CSS fixes for mobile filter content
const styleEl = document.createElement('style');
styleEl.textContent = `
    @media (max-width: 1023px) {
        /* Fix content scrolling */
        .filter-content {
            -webkit-overflow-scrolling: touch;
            padding-bottom: 80px; /* Extra padding at bottom to ensure visibility */
        }
        
        /* Prevent color swatch scale animation during touch on mobile */
        .color-swatch:active {
            transform: none !important;
        }
        
        /* Fix for color swatches */
        .color-grid {
            touch-action: manipulation;
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 0.75rem;
            will-change: transform;
        }
        
        /* Improve filter panel animation */
        .filter-panel {
            height: auto !important;
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
            padding: 0 1rem;
        }
        
        .filter-panel.active {
            max-height: 500px; /* Large enough to contain content */
            padding: 1rem;
            transition: max-height 0.5s ease-in;
        }
        
        /* Prevent brand list from disappearing */
        .brand-list {
            max-height: 200px;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 10px;
        }
        
        /* Force brand/discount sections to be visible when active */
        .filter-panel.active .brand-list,
        .filter-panel.active .discount-options {
            visibility: visible !important;
            opacity: 1 !important;
        }
    }
`;
document.head.appendChild(styleEl);

// Call fixFilterHeight on relevant events
fixFilterHeight();
window.addEventListener('resize', fixFilterHeight);
window.addEventListener('orientationchange', fixFilterHeight);

// Make sure we fix the height when filter is opened
mobileFilterTrigger?.addEventListener('click', () => {
    setTimeout(fixFilterHeight, 50);
});

// ===== 4. FIX OVERLAY INTERACTIONS =====
// Fix #4: Ensure overlay properly prevents background scrolling and closes filter

// Improve the closeFilter function
const improvedCloseFilter = () => {
    filterSidebar.style.transform = '';
    filterSidebar.classList.remove('active');
    filterOverlay.classList.remove('active');
    document.body.style.overflow = '';
};

// Replace the original closeFilter reference
filterClose?.addEventListener('click', improvedCloseFilter);
filterOverlay?.addEventListener('click', improvedCloseFilter);

// Make overlay capture touch events to prevent them from reaching elements behind it
filterOverlay?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    improvedCloseFilter();
}, { passive: false });