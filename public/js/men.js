        // Mobile Filter Toggle
        const filterToggle = document.getElementById('filterToggle');
        const filterSidebar = document.getElementById('filterSidebar');
        const filterOverlay = document.getElementById('filterOverlay');
        const filterClose = document.getElementById('filterClose');

        function toggleFilters() {
            filterSidebar.classList.toggle('-translate-x-full');
            filterOverlay.classList.toggle('opacity-0');
            filterOverlay.classList.toggle('invisible');
            document.body.classList.toggle('overflow-hidden');
        }

        filterToggle?.addEventListener('click', toggleFilters);
        filterOverlay?.addEventListener('click', toggleFilters);
        filterClose?.addEventListener('click', toggleFilters);

        // Load More Functionality
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const productGrid = document.getElementById('productGrid');
        let currentPage = 1;

        loadMoreBtn?.addEventListener('click', async () => {
            // Show loading state
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = `
                <span class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Loading...
                </span>
            `;

            // Simulate loading
            setTimeout(() => {
                // Add skeleton loaders
                for(let i = 0; i < 8; i++) {
                    const skeleton = document.createElement('div');
                    skeleton.innerHTML = `<%- include('../partials/product-card', { loading: true }) %>`;
                    productGrid.appendChild(skeleton.firstElementChild);
                }

                // Replace skeletons with actual products after delay
                setTimeout(() => {
                    const skeletons = productGrid.querySelectorAll('.skeleton-card');
                    skeletons.forEach((skeleton, index) => {
                        setTimeout(() => {
                            const product = document.createElement('div');
                            product.innerHTML = `<%- include('../partials/product-card', { loading: false }) %>`;
                            skeleton.replaceWith(product.firstElementChild);
                        }, index * 100);
                    });
                }, 1000);

                // Reset button
                loadMoreBtn.disabled = false;
                loadMoreBtn.innerHTML = '<span class="relative z-10">Load More</span><div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>';
                currentPage++;
            }, 500);
        });

        // Sort functionality
        const sortSelect = document.getElementById('sortSelect');
        sortSelect?.addEventListener('change', (e) => {
            console.log('Sorting by:', e.target.value);
            // Implement sort logic here
        });
