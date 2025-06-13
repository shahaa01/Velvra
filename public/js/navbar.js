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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
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