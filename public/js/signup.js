document.addEventListener('DOMContentLoaded', function() {
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
});

