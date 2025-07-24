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
        this.productId = this.container?.dataset.productId;
        
        console.log('InfiniteHorizontalScroll initialized:', {
            container: !!this.container,
            sentinel: !!this.sentinel,
            productId: this.productId
        });
        
        if (this.container && this.sentinel && this.productId) {
            this.init();
        } else {
            console.error('Required elements not found');
        }
    }
    
    init() {
        console.log('Initializing infinite scroll');
        this.setupIntersectionObserver();
        this.setupScrollIndicators();
        this.setupTouchEvents();
    }
    
    setupIntersectionObserver() {
        console.log('Setting up intersection observer');
        const options = {
            root: this.container,
            rootMargin: '0px 200px 0px 0px', // Load 200px before reaching the end
            threshold: 0.01
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                console.log('Intersection:', {
                    isIntersecting: entry.isIntersecting,
                    isLoading: this.isLoading,
                    hasMoreProducts: this.hasMoreProducts,
                    boundingRect: entry.boundingClientRect
                });
                
                if (entry.isIntersecting && !this.isLoading && this.hasMoreProducts) {
                    console.log('Loading more products...');
                    this.loadMoreProducts();
                }
            });
        }, options);
        
        this.observer.observe(this.sentinel);
    }
    
    setupScrollIndicators() {
        const updateIndicators = () => {
            if (!this.container || !this.leftFade || !this.rightFade) return;
            
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
        // Initial check after a delay
        setTimeout(updateIndicators, 500);
    }
    
    setupTouchEvents() {
        if (!this.container) return;
        
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
            const walk = (x - startX) * 1.5;
            this.container.scrollLeft = scrollLeft - walk;
        }, { passive: true });
        
        this.container.addEventListener('touchend', () => {
            isScrolling = false;
        }, { passive: true });
    }
    
    async loadMoreProducts() {
        console.log('loadMoreProducts called');
        if (this.isLoading || !this.hasMoreProducts) {
            return;
        }
        
        this.isLoading = true;
        this.sentinel.setAttribute('data-loading', 'true');
        
        // Show skeleton loaders
        this.showSkeletonLoaders();
        
        try {
            const url = `/product/api/similar-products/${this.productId}?page=${this.currentPage + 1}&limit=4`;
            console.log('Fetching:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received data:', data);
            
            // Hide skeleton loaders
            this.hideSkeletonLoaders();
            
            if (data.products && data.products.length > 0) {
                // Create and append new product cards
                const fragment = document.createDocumentFragment();
                data.products.forEach(product => {
                    const card = this.createProductCard(product);
                    fragment.appendChild(card);
                });
                
                // Insert new products before the sentinel
                this.container.insertBefore(fragment, this.sentinel);

                // Initialize carousel for new cards
                this.initializeCarouselForNewCards();

                // Update state
                this.currentPage++;
                this.hasMoreProducts = data.pagination.hasMore;
                
                // Update scroll indicators
                this.container.dispatchEvent(new Event('scroll'));
                
                console.log('Products loaded successfully');
            } else {
                this.hasMoreProducts = false;
            }
            
            if (!this.hasMoreProducts) {
                this.observer.disconnect();
                this.rightFade?.classList.remove('active');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.hideSkeletonLoaders();
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'flex-shrink-0 w-80 p-4 text-center text-red-500';
            errorDiv.textContent = 'Failed to load more products';
            this.container.insertBefore(errorDiv, this.sentinel);
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
        
        const colorOptionsHTML = product.colors.slice(0, 3).map(color => `
            <button class="color-option w-6 h-6 rounded-full border-2 border-gray-200 hover:border-velvra-gold transition-all duration-200" 
                    style="background-color: ${color.hex}" 
                    data-color="${color.name}"></button>
        `).join('');

        // Render all images for carousel
        let imagesHTML = '';
        if (product.images && product.images.length > 0) {
            imagesHTML = product.images.map((img, i) =>
                `<img src="${img}" alt="${product.name}" class="product-image${i === 0 ? ' active' : ''} w-full h-full object-cover transition-transform duration-700" data-index="${i}">`
            ).join('');
        }
        // Add image counter if more than one image
        let imageCounterHTML = '';
        if (product.images && product.images.length > 1) {
            imageCounterHTML = `<div class="image-counter absolute bottom-2 right-2 bg-white/80 text-xs rounded-full px-2 py-0.5 shadow-sm"><span class="current-image">1</span>/${product.images.length}</div>`;
        }
        
        article.innerHTML = `
            ${product.salePercentage ? `<div class="sale-badge absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full z-10">Sale ${product.salePercentage}% Off</div>` : ''}
            
            <figure class="aspect-[4/5] relative overflow-hidden product-image-container">
                <a href="/product/${product._id}">
                    ${imagesHTML}
                </a>
                ${imageCounterHTML}
            </figure>

            <div class="p-6">
                <p class="text-sm font-medium text-velvra-stone uppercase tracking-wider mb-2">${product.brand || 'VELVRA'}</p>
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
        
        // Fade in animation
        requestAnimationFrame(() => {
            article.style.opacity = '1';
            article.style.transition = 'opacity 0.5s ease-out';
        });
        
        return article;
    }
    
    createFloatingHeart(button) {
        const heart = document.createElement('div');
        heart.innerHTML = '♥';
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

    initializeCarouselForNewCards() {
        const cards = this.container.querySelectorAll('.product-card');
        cards.forEach(card => {
            // Prevent duplicate listeners
            if (card.dataset.carouselInitialized) return;
            const images = card.querySelectorAll('.product-image');
            const counter = card.querySelector('.image-counter .current-image');
            if (images.length > 1) {
                let currentIndex = 0;
                let interval = null;
                card.addEventListener('mouseenter', () => {
                    interval = setInterval(() => {
                        images[currentIndex].classList.remove('active');
                        currentIndex = (currentIndex + 1) % images.length;
                        images[currentIndex].classList.add('active');
                        if (counter) counter.textContent = (currentIndex + 1);
                    }, 2000);
                });
                card.addEventListener('mouseleave', () => {
                    clearInterval(interval);
                    images.forEach(img => img.classList.remove('active'));
                    images[0].classList.add('active');
                    currentIndex = 0;
                    if (counter) counter.textContent = '1';
                });
            }
            card.dataset.carouselInitialized = 'true';
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - checking for related products section');
    const relatedProducts = document.getElementById('relatedProducts');
    if (relatedProducts) {
        console.log('Related products section found, initializing infinite scroll');
        new InfiniteHorizontalScroll();
    }
});