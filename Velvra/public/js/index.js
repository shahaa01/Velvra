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


    // Touch gesture support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    const productGrid = document.getElementById('productGrid');
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swiped left - could implement carousel navigation
            console.log('Swiped left');
        }
        if (touchEndX > touchStartX + 50) {
            // Swiped right - could implement carousel navigation
            console.log('Swiped right');
        }
    }
    
    productGrid?.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    productGrid?.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    // Intersection Observer for lazy loading
    const imageObserverLazy = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('animate-fade-in');
                observer.unobserve(img);
            }
        });
    });
    
    // Observe all product images
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserverLazy.observe(img);
    });
    
    // Premium scroll effects
    let lastScrollTop = 0;
    const nav = document.querySelector('nav');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down - hide nav
            nav?.classList.add('-translate-y-full');
        } else {
            // Scrolling up - show nav
            nav?.classList.remove('-translate-y-full');
        }
        
        lastScrollTop = scrollTop;
    });



