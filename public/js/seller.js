// Smooth scroll to form
function scrollToForm() {
    document.getElementById('registration-form').scrollIntoView({ behavior: 'smooth' });
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

        // City data for different locations
        const cityData = {
            kathmandu: [
                'Kathmandu Metropolitan City',
                'Lalitpur Metropolitan City',
                'Bhaktapur',
                'Madhyapur Thimi',
                'Kirtipur',
                'Budhanilkantha',
                'Chandragiri',
                'Dakshinkali',
                'Gokarneshwar',
                'Kageshwari Manohara',
                'Nagarjun',
                'Shankharapur',
                'Tarakeshwar',
                'Tokha',
                'Godawari',
                'Konjyosom',
                'Mahalaxmi',
                'Bagmati',
                'Mahankal',
                'Suryabinayak'
            ],
            pokhara: [
                'Pokhara Metropolitan City',
                'Lekhnath',
                'Sarangkot',
                'Begnas',
                'Rupa',
                'Arba',
                'Bhalam',
                'Dhampus',
                'Dhital',
                'Hansapur',
                'Hemja',
                'Kaskikot',
                'Lamachaur',
                'Lwang Ghalel',
                'Mijure',
                'Nirmalpokhari',
                'Pumdi Bhumdi',
                'Puranchaur',
                'Rupakot',
                'Sarangkot',
                'Sardikhola',
                'Thumki'
            ]
        };

        // Form validation state
        const formState = {
            brandName: false,
            instagram: true, // Optional field
            contactPerson: false,
            phone: false,
            email: false,
            businessType: false,
            ownerName: false,
            panVatNumber: false,
            panVatDocument: false,
            location: false,
            city: false
        };

        // Validation functions
        const validators = {
            brandName: (value) => value.trim().length >= 2,
            instagram: (value) => {
                if (!value) return true; // Optional
                const instagramRegex = /^@?[\w.]+$/;
                const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
                return instagramRegex.test(value) || urlRegex.test(value);
            },
            contactPerson: (value) => value.trim().length >= 2,
            phone: (value) => {
                const phoneRegex = /^9\d{9}$/;
                return phoneRegex.test(value.replace(/\D/g, ''));
            },
            email: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            },
            businessType: (value) => value !== '',
            ownerName: (value) => value.trim().length >= 3,
            panVatNumber: (value) => {
                const panRegex = /^\d{9}$/;
                return panRegex.test(value.trim());
            },
            panVatDocument: (file) => {
                if (!file) return false;
                const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'];
                const maxSize = 5 * 1024 * 1024; // 5MB
                return allowedTypes.includes(file.type) && file.size <= maxSize;
            },
            location: (value) => value !== '',
            city: (value) => value !== ''
        };

        // Add input event listeners
        function addValidation(fieldId, validator) {
            const field = document.getElementById(fieldId);
            const formGroup = field.closest('.form-group');
            const errorMessage = formGroup.querySelector('.error-message');
            const successIcon = formGroup.querySelector('.success-icon');

            field.addEventListener('input', () => {
                const isValid = validator(field.value);
                formState[fieldId] = isValid;

                if (isValid) {
                    field.classList.remove('error');
                    field.classList.add('success');
                    errorMessage.classList.remove('show');
                    if (successIcon) successIcon.classList.add('show');
                } else {
                    field.classList.add('error');
                    field.classList.remove('success');
                    errorMessage.classList.add('show');
                    if (successIcon) successIcon.classList.remove('show');
                }
            });

            field.addEventListener('blur', () => {
                if (!field.value && field.hasAttribute('required')) {
                    field.classList.add('error');
                    errorMessage.classList.add('show');
                }
            });
        }

        // Handle file upload
        const fileInput = document.getElementById('panVatDocument');
        const fileLabel = fileInput.nextElementSibling;
        const fileName = fileLabel.querySelector('.file-name');

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const isValid = validators.panVatDocument(file);
            formState.panVatDocument = isValid;

            if (isValid) {
                fileLabel.classList.add('has-file');
                fileLabel.classList.remove('error');
                fileName.textContent = `Selected: ${file.name}`;
                fileName.classList.remove('hidden');
                fileInput.closest('.form-group').querySelector('.error-message').classList.remove('show');
            } else {
                fileLabel.classList.add('error');
                fileLabel.classList.remove('has-file');
                fileName.classList.add('hidden');
                fileInput.closest('.form-group').querySelector('.error-message').classList.add('show');
            }
        });

        // Handle location change
        const locationSelect = document.getElementById('location');
        const citySelect = document.getElementById('city');

        locationSelect.addEventListener('change', (e) => {
            const selectedLocation = e.target.value;
            formState.location = selectedLocation !== '';
            
            // Clear city selection
            citySelect.innerHTML = '<option value="">Select City/Area *</option>';
            citySelect.disabled = !selectedLocation;
            formState.city = false;
            
            if (selectedLocation && cityData[selectedLocation]) {
                cityData[selectedLocation].forEach(city => {
                    const option = document.createElement('option');
                    option.value = city.toLowerCase().replace(/\s+/g, '-');
                    option.textContent = city;
                    citySelect.appendChild(option);
                });
            }
            
            // Validate location
            addValidation('location', validators.location);
        });

        // Initialize validation for all fields
        Object.keys(validators).forEach(fieldId => {
            if (fieldId !== 'panVatDocument') {
                addValidation(fieldId, validators[fieldId]);
            }
        });