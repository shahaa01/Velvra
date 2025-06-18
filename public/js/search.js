class IntelligentSearch {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.mobileSearchInput = document.getElementById('mobile-search-input');
        this.searchForm = document.getElementById('search-form');
        this.mobileSearchForm = document.getElementById('mobile-search-form');
        this.suggestionsContainer = document.getElementById('search-suggestions');
        this.mobileSuggestionsContainer = document.getElementById('mobile-search-suggestions');
        this.suggestionsContent = document.getElementById('suggestions-content');
        this.mobileSuggestionsContent = document.getElementById('mobile-suggestions-content');
        
        this.debounceTimer = null;
        this.selectedIndex = -1;
        this.suggestions = [];
        this.isMobile = false;
        this.minQueryLength = 2;
        
        this.init();
    }
    
    init() {
        // Desktop search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleInput(e, false));
            this.searchInput.addEventListener('keydown', (e) => this.handleKeydown(e, false));
            this.searchInput.addEventListener('focus', (e) => this.handleFocus(e, false));
            this.searchInput.addEventListener('blur', (e) => this.handleBlur(e, false));
            this.searchForm.addEventListener('submit', (e) => this.handleSubmit(e, false));
        }
        
        // Mobile search
        if (this.mobileSearchInput) {
            this.mobileSearchInput.addEventListener('input', (e) => this.handleInput(e, true));
            this.mobileSearchInput.addEventListener('keydown', (e) => this.handleKeydown(e, true));
            this.mobileSearchInput.addEventListener('focus', (e) => this.handleFocus(e, true));
            this.mobileSearchInput.addEventListener('blur', (e) => this.handleBlur(e, true));
            this.mobileSearchForm.addEventListener('submit', (e) => this.handleSubmit(e, true));
        }
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            const searchContainer = e.target.closest('#search-form') || e.target.closest('#mobile-search-form');
            const suggestionsEl = e.target.closest('#search-suggestions') || e.target.closest('#mobile-search-suggestions');
            
            if (!searchContainer && !suggestionsEl) {
                this.hideSuggestions(false);
                this.hideSuggestions(true);
            }
        });
    }
    
    handleFocus(event, isMobile) {
        const input = isMobile ? this.mobileSearchInput : this.searchInput;
        if (input.value.trim().length >= this.minQueryLength) {
            this.fetchSuggestions(input.value.trim(), isMobile);
        }
    }
    
    handleBlur(event, isMobile) {
        // Delay hiding to allow click events on suggestions
        setTimeout(() => {
            const container = isMobile ? this.mobileSuggestionsContainer : this.suggestionsContainer;
            if (container && !container.matches(':hover')) {
                this.hideSuggestions(isMobile);
            }
        }, 200);
    }
    
    handleInput(event, isMobile) {
        const query = event.target.value.trim();
        
        // Clear previous timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Hide suggestions if query is too short
        if (query.length < this.minQueryLength) {
            this.hideSuggestions(isMobile);
            this.suggestions = [];
            return;
        }
        
        // Show loading state
        this.showLoadingState(isMobile);
        
        // Debounce the search
        this.debounceTimer = setTimeout(() => {
            this.fetchSuggestions(query, isMobile);
        }, 300);
    }
    
    showLoadingState(isMobile) {
        const container = isMobile ? this.mobileSuggestionsContent : this.suggestionsContent;
        const suggestionsContainer = isMobile ? this.mobileSuggestionsContainer : this.suggestionsContainer;
        
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center p-4 text-stone-500">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-velvra-gold"></div>
                    <span class="ml-2 text-sm">Searching...</span>
                </div>
            `;
            suggestionsContainer.classList.remove('hidden');
        }
    }
    
    async fetchSuggestions(query, isMobile) {
        try {
            const response = await fetch(`/search/suggestions?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch suggestions');
            }
            
            const data = await response.json();
            
            if (data.suggestions && data.suggestions.length > 0) {
                this.suggestions = data.suggestions;
                this.displaySuggestions(isMobile);
            } else {
                this.showNoResults(query, isMobile);
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            this.showError(isMobile);
        }
    }
    
    showNoResults(query, isMobile) {
        const container = isMobile ? this.mobileSuggestionsContent : this.suggestionsContent;
        const suggestionsContainer = isMobile ? this.mobileSuggestionsContainer : this.suggestionsContainer;
        
        if (container) {
            container.innerHTML = `
                <div class="p-4 text-center">
                    <p class="text-sm text-stone-500 mb-2">No results found for "${this.escapeHtml(query)}"</p>
                    <button onclick="document.getElementById('${isMobile ? 'mobile-search-form' : 'search-form'}').submit()" 
                            class="text-sm text-velvra-gold hover:text-velvra-gold-dark font-medium">
                        Search anyway →
                    </button>
                </div>
            `;
            suggestionsContainer.classList.remove('hidden');
        }
    }
    
    showError(isMobile) {
        const container = isMobile ? this.mobileSuggestionsContent : this.suggestionsContent;
        
        if (container) {
            container.innerHTML = `
                <div class="p-4 text-center text-sm text-red-500">
                    Error loading suggestions. Please try again.
                </div>
            `;
        }
    }
    
    displaySuggestions(isMobile) {
        const container = isMobile ? this.mobileSuggestionsContent : this.suggestionsContent;
        const suggestionsContainer = isMobile ? this.mobileSuggestionsContainer : this.suggestionsContainer;
        
        if (!container || this.suggestions.length === 0) {
            this.hideSuggestions(isMobile);
            return;
        }
        
        container.innerHTML = '';
        
        // Group suggestions by type
        const productSuggestions = this.suggestions.filter(s => s.type === 'product');
        const categorySuggestions = this.suggestions.filter(s => s.type === 'category');
        
        // Display product suggestions
        if (productSuggestions.length > 0) {
            const productsHeader = document.createElement('div');
            productsHeader.className = 'px-4 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider bg-stone-50';
            productsHeader.textContent = 'Products';
            container.appendChild(productsHeader);
            
            productSuggestions.forEach((suggestion, index) => {
                const suggestionElement = this.createSuggestionElement(suggestion, index, isMobile);
                container.appendChild(suggestionElement);
            });
        }
        
        // Display category suggestions
        if (categorySuggestions.length > 0) {
            const categoriesHeader = document.createElement('div');
            categoriesHeader.className = 'px-4 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider bg-stone-50';
            categoriesHeader.textContent = 'Categories';
            container.appendChild(categoriesHeader);
            
            categorySuggestions.forEach((suggestion, index) => {
                const suggestionElement = this.createSuggestionElement(suggestion, productSuggestions.length + index, isMobile);
                container.appendChild(suggestionElement);
            });
        }
        
        // Add "View all results" link
        const viewAllLink = document.createElement('div');
        viewAllLink.className = 'px-4 py-3 bg-stone-50 border-t border-stone-200 text-center';
        viewAllLink.innerHTML = `
            <button onclick="document.getElementById('${isMobile ? 'mobile-search-form' : 'search-form'}').submit()" 
                    class="text-sm font-medium text-velvra-gold hover:text-velvra-gold-dark">
                View all results →
            </button>
        `;
        container.appendChild(viewAllLink);
        
        this.showSuggestions(isMobile);
        this.selectedIndex = -1;
    }
    
    createSuggestionElement(suggestion, index, isMobile) {
        const div = document.createElement('div');
        div.className = 'suggestion-item px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors border-b border-stone-100 last:border-0';
        div.dataset.index = index;
        
        let icon = '';
        let title = suggestion.title;
        let subtitle = '';
        let rightContent = '';
        
        switch (suggestion.type) {
            case 'product':
                icon = `<svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>`;
                subtitle = `${suggestion.brand} • ${suggestion.category || 'Product'}`;
                if (suggestion.price) {
                    rightContent = `<span class="text-sm font-semibold text-velvra-gold">₹${suggestion.price}</span>`;
                }
                break;
            case 'category':
                icon = `<svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>`;
                subtitle = 'Browse Collection';
                break;
            case 'brand':
                icon = `<svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                </svg>`;
                subtitle = 'Brand';
                break;
        }
        
        // Highlight matched text if available
        if (suggestion.matches && suggestion.matches.length > 0) {
            title = this.highlightText(suggestion.title, suggestion.matches);
        }
        
        div.innerHTML = `
            <div class="flex items-center">
                <div class="flex-shrink-0 mr-3">
                    ${icon}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-stone-900">${title}</div>
                    ${subtitle ? `<div class="text-xs text-stone-500 mt-0.5">${subtitle}</div>` : ''}
                </div>
                ${rightContent ? `<div class="flex-shrink-0 ml-3">${rightContent}</div>` : ''}
            </div>
        `;
        
        // Add click event
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.selectSuggestion(suggestion, isMobile);
        });
        
        // Add hover event
        div.addEventListener('mouseenter', () => {
            this.setSelectedIndex(index, isMobile);
        });
        
        return div;
    }
    
    highlightText(text, matches) {
        if (!matches || matches.length === 0) return this.escapeHtml(text);
        
        let highlighted = this.escapeHtml(text);
        
        // Find matches for the main text
        const textMatch = matches.find(m => m.key === 'name' || m.key === 'title');
        if (textMatch && textMatch.indices) {
            // Sort indices by start position in reverse order to avoid offset issues
            const sortedIndices = [...textMatch.indices].sort((a, b) => b[0] - a[0]);
            
            sortedIndices.forEach(([start, end]) => {
                const before = highlighted.substring(0, start);
                const match = highlighted.substring(start, end + 1);
                const after = highlighted.substring(end + 1);
                highlighted = `${before}<mark class="bg-yellow-200 font-semibold">${match}</mark>${after}`;
            });
        }
        
        return highlighted;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    setSelectedIndex(index, isMobile) {
        const container = isMobile ? this.mobileSuggestionsContent : this.suggestionsContent;
        const items = container.querySelectorAll('.suggestion-item');
        
        // Remove previous selection
        items.forEach(item => item.classList.remove('bg-stone-100'));
        
        // Set new selection
        this.selectedIndex = index;
        if (items[index]) {
            items[index].classList.add('bg-stone-100');
        }
    }
    
    selectSuggestion(suggestion, isMobile) {
        const input = isMobile ? this.mobileSearchInput : this.searchInput;
        
        if (suggestion.type === 'product') {
            // Redirect to product page
            window.location.href = `/product/${suggestion.id}`;
        } else if (suggestion.type === 'category') {
            // Redirect to category page or search with category
            const categoryPath = suggestion.category.toLowerCase();
            if (categoryPath === 'men' || categoryPath === 'women') {
                window.location.href = `/shop/${categoryPath}`;
            } else {
                input.value = suggestion.category;
                this.submitSearch(isMobile);
            }
        } else {
            // Set the search input and submit
            input.value = suggestion.title;
            this.hideSuggestions(isMobile);
            this.submitSearch(isMobile);
        }
    }
    
    handleKeydown(event, isMobile) {
        const suggestions = isMobile ? this.mobileSuggestionsContainer : this.suggestionsContainer;
        
        if (!suggestions || suggestions.classList.contains('hidden')) {
            return;
        }
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.navigateSuggestions(1, isMobile);
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.navigateSuggestions(-1, isMobile);
                break;
            case 'Enter':
                if (this.selectedIndex >= 0 && this.suggestions[this.selectedIndex]) {
                    event.preventDefault();
                    this.selectSuggestion(this.suggestions[this.selectedIndex], isMobile);
                }
                break;
            case 'Escape':
                event.preventDefault();
                this.hideSuggestions(isMobile);
                const input = isMobile ? this.mobileSearchInput : this.searchInput;
                input.blur();
                break;
        }
    }
    
    navigateSuggestions(direction, isMobile) {
        const container = isMobile ? this.mobileSuggestionsContent : this.suggestionsContent;
        const items = container.querySelectorAll('.suggestion-item');
        
        if (items.length === 0) return;
        
        // Calculate new index
        let newIndex = this.selectedIndex + direction;
        
        if (newIndex >= items.length) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = items.length - 1;
        }
        
        this.setSelectedIndex(newIndex, isMobile);
        
        // Scroll into view if needed
        if (items[newIndex]) {
            items[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
    
    handleSubmit(event, isMobile) {
        event.preventDefault();
        this.submitSearch(isMobile);
    }
    
    submitSearch(isMobile) {
        const input = isMobile ? this.mobileSearchInput : this.searchInput;
        const query = input.value.trim();
        
        if (query) {
            // Hide suggestions before redirecting
            this.hideSuggestions(isMobile);
            
            // Redirect to search results page
            window.location.href = `/search/products?q=${encodeURIComponent(query)}`;
        }
    }
    
    showSuggestions(isMobile) {
        const container = isMobile ? this.mobileSuggestionsContainer : this.suggestionsContainer;
        if (container) {
            container.classList.remove('hidden');
            container.style.opacity = '0';
            requestAnimationFrame(() => {
                container.style.transition = 'opacity 0.2s ease-out';
                container.style.opacity = '1';
            });
        }
    }
    
    hideSuggestions(isMobile) {
        const container = isMobile ? this.mobileSuggestionsContainer : this.suggestionsContainer;
        if (container) {
            container.style.transition = 'opacity 0.15s ease-in';
            container.style.opacity = '0';
            setTimeout(() => {
                container.classList.add('hidden');
            }, 150);
        }
        this.selectedIndex = -1;
        this.suggestions = [];
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IntelligentSearch();
});