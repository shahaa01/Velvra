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
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.id = 'menu-backdrop';
            backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden';
            backdrop.onclick = toggleMobileMenu;
            document.body.appendChild(backdrop);
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Close menu
            mobileMenu.classList.add('translate-x-full');
            mobileMenu.classList.remove('translate-x-0');
            mobileMenuIcon.classList.remove('hidden');
            mobileCloseIcon.classList.add('hidden');
            
            // Remove backdrop
            const backdrop = document.getElementById('menu-backdrop');
            if (backdrop) backdrop.remove();
            
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

    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Intersection Observer for fade in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
    
    // Testimonial Slider
    let currentSlide = 0;
    const testimonials = [
        {
            name: "Sarah Johnson",
            text: "Velvra changed the way I shop local fashion! The quality is amazing and delivery is always on time.",
            image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
        },
        {
            name: "Maya Patel",
            text: "Finally, a platform that brings together all the best Instagram boutiques in one place!",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
        },
        {
            name: "Priya Sharma",
            text: "The cash on delivery option makes shopping so convenient. Love the trendy collections!",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
        }
    ];
    
    // Image lazy loading
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.remove('skeleton');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img').forEach(img => {
        img.classList.add('skeleton');
        imageObserver.observe(img);
    });
    
    // Smooth parallax effect on scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.relative img');
        if (parallax) {
            const speed = 0.5;
            parallax.style.transform = `translateY(${scrolled * speed}px)`;
        }
    });
    
// Smooth parallax effect on scroll with boundary
// Smooth parallax effect on scroll within hero section bounds
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroSection = document.querySelector('section.relative.min-h-screen');
    const parallaxImg = heroSection ? heroSection.querySelector('img') : null;

    if (parallaxImg && heroSection) {
        const rect = heroSection.getBoundingClientRect();
        const sectionTop = heroSection.offsetTop;
        const sectionHeight = heroSection.offsetHeight;

        // Only apply parallax if scroll is within hero section
        if (scrolled >= sectionTop && scrolled < sectionTop + sectionHeight) {
            const speed = 0.5;
            const relativeScroll = scrolled - sectionTop;
            const maxTranslate = sectionHeight - parallaxImg.offsetHeight;
            const translateY = Math.min(relativeScroll * speed, Math.max(0, maxTranslate));
            parallaxImg.style.transform = `translateY(${translateY}px)`;
        } else {
            // Reset transform when out of section bounds
            parallaxImg.style.transform = `translateY(0px)`;
        }
    }
});

    
    // Newsletter form handling
    const newsletterForm = document.querySelector('#newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for subscribing to Velvra newsletter!');
            e.target.reset();
        });
    }
    
    // Dynamic year in footer
    const yearElement = document.querySelector('#current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }


