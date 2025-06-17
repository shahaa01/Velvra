let selectedPayment = null;
let codConfirmed = false;

function selectPayment(method) {
    selectedPayment = method;
    
    // Update UI
    document.querySelectorAll('.payment-card').forEach(card => {
        card.classList.remove('selected');
        card.querySelector('.payment-check').classList.add('hidden');
    });
    
    const selectedCard = document.querySelector(`input[value="${method}"]`).closest('.payment-card');
    selectedCard.classList.add('selected');
    selectedCard.querySelector('.payment-check').classList.remove('hidden');
    
    // Show benefit for digital payments
    const benefitEl = document.getElementById('paymentBenefit');
    if (method !== 'cod') {
        benefitEl.classList.remove('hidden');
        benefitEl.classList.add('slide-up');
    } else {
        benefitEl.classList.add('hidden');
    }
    
    // Update button state
    // updateConfirmButton();
}

// function updateConfirmButton() {
//     const btn = document.getElementById('confirmBtn');
//     if (selectedPayment) {
//         btn.classList.remove('opacity-50');
//         btn.disabled = false;
//     } else {
//         btn.classList.add('opacity-50');
//         btn.disabled = true;
//     }
// }

function processPayment() {
    if (!selectedPayment) return;
    
    if (selectedPayment === 'cod' && !codConfirmed) {
        showCodModal();
        return;
    }
    
    const btn = document.getElementById('confirmBtn');
    btn.innerHTML = '<span class="loading-spinner"></span> Processing...';
    btn.disabled = true;
    
    // Simulate payment processing
    setTimeout(() => {
        btn.innerHTML = '<svg class="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Payment Successful!';
        btn.classList.remove('gold-gradient');
        btn.classList.add('bg-green-500');
        
        // Redirect after success
        setTimeout(() => {
            btn.innerHTML = 'Redirecting to order...';
        }, 1500);
    }, 2000);
}

function toggleAccordion(index) {
    const contents = document.querySelectorAll('.accordion-content');
    const arrows = document.querySelectorAll('.accordion-arrow');
    
    contents[index].classList.toggle('open');
    arrows[index].classList.toggle('rotate-180');
}

function showCodModal() {
    document.getElementById('codModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCodModal() {
    document.getElementById('codModal').classList.remove('active');
    document.body.style.overflow = '';
}

function confirmCod() {
    codConfirmed = true;
    closeCodModal();
    processPayment();
}

// Initialize
// updateConfirmButton();

// Add touch feedback
document.querySelectorAll('.touch-scale').forEach(el => {
    el.addEventListener('touchstart', () => el.classList.add('scale-95'));
    el.addEventListener('touchend', () => el.classList.remove('scale-95'));
});

// Prevent double tap zoom on mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Add visual feedback for payment selection
document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('click', function() {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transform = '';
        }, 100);
    });
});

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
