// Smooth scroll to form
function scrollToForm() {
    document.getElementById('registration-form').scrollIntoView({ behavior: 'smooth' });
}

// Form handling
document.getElementById('sellerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Hide form and show success message
        this.parentElement.style.display = 'none';
        document.getElementById('successMessage').classList.remove('hidden');
        
        // Scroll to success message
        document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
});

// Reset form
function resetForm() {
    document.getElementById('sellerForm').reset();
    document.getElementById('sellerForm').parentElement.style.display = 'block';
    document.getElementById('successMessage').classList.add('hidden');
    scrollToForm();
}

// Accordion functionality
function toggleAccordion(index) {
    const items = document.querySelectorAll('.accordion-item');
    const currentItem = items[index];
    const wasActive = currentItem.classList.contains('active');
    
    // Close all items
    items.forEach(item => item.classList.remove('active'));
    
    // Open clicked item if it wasn't active
    if (!wasActive) {
        currentItem.classList.add('active');
    }
}

// Testimonial carousel
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.testimonial-card');
const dots = document.querySelectorAll('.testimonial-dot');

function goToTestimonial(index) {
    currentTestimonial = index;
    const track = document.querySelector('.testimonial-track');
    track.style.transform = `translateX(-${index * 100}%)`;
    
    // Update active states
    testimonials.forEach((testimonial, i) => {
        testimonial.classList.toggle('active', i === index);
    });
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('bg-velvra-gold', i === index);
        dot.classList.toggle('bg-velvra-stone', i !== index);
    });
}

// Auto-rotate testimonials
setInterval(() => {
    goToTestimonial((currentTestimonial + 1) % testimonials.length);
}, 5000);

// Reveal on scroll
const revealElements = document.querySelectorAll('.reveal');
const revealOnScroll = () => {
    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        const isVisible = (elementTop < window.innerHeight - 100) && (elementBottom > 0);
        
        if (isVisible) {
            element.classList.add('active');
        }
    });
};

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// Sticky footer show/hide
let lastScroll = 0;
const stickyFooter = document.getElementById('stickyFooter');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    const scrolledPastHero = currentScroll > window.innerHeight;
    
    if (scrolledPastHero && currentScroll < lastScroll) {
        // Scrolling up - show footer
        stickyFooter.style.transform = 'translateY(0)';
    } else {
        // Scrolling down or at top - hide footer
        stickyFooter.style.transform = 'translateY(100%)';
    }
    
    lastScroll = currentScroll;
});

// Form label animation fix
document.querySelectorAll('.form-input').forEach(input => {
    // Check on load
    if (input.value) {
        input.nextElementSibling.style.transform = 'translateY(-25px) scale(0.85)';
    }
    
    // Check on change
    input.addEventListener('change', function() {
        if (this.value) {
            this.nextElementSibling.style.transform = 'translateY(-25px) scale(0.85)';
        }
    });
});

// Mobile menu optimization
const checkViewport = () => {
    const isMobile = window.innerWidth < 768;
    document.body.classList.toggle('is-mobile', isMobile);
};

window.addEventListener('resize', checkViewport);
checkViewport();

// Performance optimization - lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.opacity = '0';
                img.onload = () => {
                    img.style.transition = 'opacity 0.5s ease';
                    img.style.opacity = '1';
                };
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img').forEach(img => {
        imageObserver.observe(img);
    });
}
