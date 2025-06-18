document.addEventListener('DOMContentLoaded', () => {
        // Mobile Menu Toggle
    function initMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuIcon = document.getElementById('mobile-menu-icon');
        const mobileCloseIcon = document.getElementById('mobile-close-icon');
        let isMenuOpen = false;

        function toggleMobileMenu() {
            isMenuOpen = !isMenuOpen;
            
            if (isMenuOpen) {
                // Open menu
                mobileMenu.classList.remove('translate-x-full');
                mobileMenu.classList.add('translate-x-0');
                mobileMenuIcon.classList.add('hidden');
                mobileCloseIcon.classList.remove('hidden');
                
                // Prevent body scroll
                document.body.style.overflow = 'hidden';
            } else {
                // Close menu
                mobileMenu.classList.add('translate-x-full');
                mobileMenu.classList.remove('translate-x-0');
                mobileMenuIcon.classList.remove('hidden');
                mobileCloseIcon.classList.add('hidden');
                
                // Restore body scroll
                document.body.style.overflow = '';
            }
        }

        // Attach click handler
        if (mobileMenuButton) {
            mobileMenuButton.onclick = toggleMobileMenu;
        }

        // Close menu when clicking links
        const menuLinks = mobileMenu?.querySelectorAll('a');
        menuLinks?.forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen) toggleMobileMenu();
            });
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                toggleMobileMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024 && isMenuOpen) {
                toggleMobileMenu();
            }
        });
    }

    // Mobile Search Functionality
    function initMobileSearch() {
        const mobileSearchInput = document.getElementById('mobile-nav-search-input');
        const mobileSearchSuggestions = document.getElementById('mobile-nav-search-suggestions');
        const mobileSuggestionsContent = document.getElementById('mobile-nav-suggestions-content');
        const mobileSearchForm = document.getElementById('mobile-nav-search-form');
        
        let searchTimeout;
        let currentSearchQuery = '';

        // Debounced search function
        function debouncedSearch(query) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (query.trim().length >= 2) {
                    fetchSearchSuggestions(query, mobileSuggestionsContent, mobileSearchSuggestions);
                } else {
                    hideSuggestions();
                }
            }, 300);
        }

        // Fetch search suggestions
        async function fetchSearchSuggestions(query, contentElement, suggestionsElement) {
            try {
                const response = await fetch(`/search/suggestions?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.suggestions && data.suggestions.length > 0) {
                    displaySuggestions(data.suggestions, contentElement, suggestionsElement);
                } else {
                    hideSuggestions();
                }
            } catch (error) {
                console.error('Error fetching search suggestions:', error);
                hideSuggestions();
            }
        }

        // Display suggestions
        function displaySuggestions(suggestions, contentElement, suggestionsElement) {
            const suggestionsHTML = suggestions.map(suggestion => {
                if (suggestion.type === 'product') {
                    return `
                        <a href="/product/${suggestion.id}" class="flex items-center p-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0">
                            <div class="flex-shrink-0 w-10 h-10 bg-stone-200 rounded-lg mr-3 flex items-center justify-center">
                                ${suggestion.image ? 
                                    `<img src="${suggestion.image}" alt="${suggestion.title}" class="w-full h-full object-cover rounded-lg">` :
                                    `<svg class="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>`
                                }
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-stone-900 truncate">${suggestion.title}</p>
                                <p class="text-xs text-stone-500">${suggestion.brand} • ₹${suggestion.price}</p>
                            </div>
                        </a>
                    `;
                } else if (suggestion.type === 'category') {
                    return `
                        <a href="/search/products?q=${encodeURIComponent(suggestion.title)}" class="flex items-center p-3 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0">
                            <div class="flex-shrink-0 w-10 h-10 bg-velvra-gold/10 rounded-lg mr-3 flex items-center justify-center">
                                <svg class="w-5 h-5 text-velvra-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-stone-900">${suggestion.title}</p>
                                <p class="text-xs text-stone-500">Category</p>
                            </div>
                        </a>
                    `;
                }
                return '';
            }).join('');

            contentElement.innerHTML = suggestionsHTML;
            suggestionsElement.classList.remove('hidden');
        }

        // Hide suggestions
        function hideSuggestions() {
            if (mobileSearchSuggestions) {
                mobileSearchSuggestions.classList.add('hidden');
            }
        }

        // Event listeners for mobile search
        if (mobileSearchInput) {
            // Input event for live search
            mobileSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                currentSearchQuery = query;
                
                if (query.length >= 2) {
                    debouncedSearch(query);
                } else {
                    hideSuggestions();
                }
            });

            // Focus event
            mobileSearchInput.addEventListener('focus', () => {
                if (currentSearchQuery.length >= 2) {
                    debouncedSearch(currentSearchQuery);
                }
            });

            // Blur event (with delay to allow clicking suggestions)
            mobileSearchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    hideSuggestions();
                }, 200);
            });

            // Keydown event for navigation
            mobileSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    hideSuggestions();
                    mobileSearchInput.blur();
                }
            });
        }

        // Handle form submission
        if (mobileSearchForm) {
            mobileSearchForm.addEventListener('submit', (e) => {
                const query = mobileSearchInput.value.trim();
                if (query.length === 0) {
                    e.preventDefault();
                    mobileSearchInput.focus();
                } else {
                    hideSuggestions();
                }
            });
        }

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileSearchInput?.contains(e.target) && !mobileSearchSuggestions?.contains(e.target)) {
                hideSuggestions();
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initMobileMenu();
            initMobileSearch();
        });
    } else {
        initMobileMenu();
        initMobileSearch();
    }

    // Calculate and set navbar height
    function setNavbarHeight() {
        const navbar = document.querySelector('nav');
        if (navbar) {
            const height = navbar.offsetHeight;
            document.documentElement.style.setProperty('--navbar-height', `${height}px`);
            document.documentElement.style.setProperty('--navbar-height-mobile', `${height}px`);
        }
    }
    
    // Set initial height
    setNavbarHeight();
    
    // Recalculate on resize
    window.addEventListener('resize', setNavbarHeight);
    
    // Recalculate when navbar content changes
    const observer = new MutationObserver(setNavbarHeight);
    const navbar = document.querySelector('nav') || document.querySelector('.navbar');
    if (navbar) {
        observer.observe(navbar, { childList: true, subtree: true });
    }
})