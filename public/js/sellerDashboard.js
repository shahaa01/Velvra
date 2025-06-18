// Dark mode toggle
document.getElementById('darkModeToggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
});

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
}

// Update greeting based on time
function updateGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    document.getElementById('greeting').textContent = greeting;
}
updateGreeting();

// Chart period toggle
document.querySelectorAll('.flex.gap-2 button').forEach(btn => {
    btn.addEventListener('click', function() {
        this.parentElement.querySelectorAll('button').forEach(b => {
            b.classList.remove('bg-[#D4AF37]', 'text-black');
           b.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
       });
       this.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
       this.classList.add('bg-[#D4AF37]', 'text-black');
   });
});

// Simulate order status updates
function simulateOrderUpdate() {
   const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
   const colors = {
       'Pending': 'bg-amber-100 text-amber-700',
       'Processing': 'bg-blue-100 text-blue-700',
       'Shipped': 'bg-purple-100 text-purple-700',
       'Delivered': 'bg-emerald-100 text-emerald-700'
   };
   
   const statusElements = document.querySelectorAll('tbody tr td:nth-child(4) span');
   statusElements.forEach((el, index) => {
       setTimeout(() => {
           const currentStatus = el.textContent;
           const currentIndex = statuses.indexOf(currentStatus);
           if (currentIndex < statuses.length - 1 && Math.random() > 0.5) {
               const newStatus = statuses[currentIndex + 1];
               el.textContent = newStatus;
               el.className = `px-2.5 py-1 ${colors[newStatus]} text-xs font-medium rounded-full`;
               
               // Add animation
               el.style.transform = 'scale(0.8)';
               setTimeout(() => {
                   el.style.transform = 'scale(1)';
               }, 200);
           }
       }, index * 1000 + 5000);
   });
}

// Start simulation after page load
setTimeout(simulateOrderUpdate, 3000);

// Product action buttons
document.querySelectorAll('button').forEach(btn => {
   if (btn.textContent.includes('Process') || btn.textContent.includes('View') || btn.textContent.includes('Review')) {
       btn.addEventListener('click', function(e) {
           e.preventDefault();
           
           // Create modal overlay
           const modal = document.createElement('div');
           modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 opacity-0 transition-opacity duration-300';
           modal.innerHTML = `
               <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 transform scale-95 transition-transform duration-300">
                   <h3 class="font-playfair text-xl font-bold text-gray-900 dark:text-white mb-4">Order Action</h3>
                   <p class="text-gray-600 dark:text-gray-400 mb-6">This action would ${this.textContent.toLowerCase()} the order in a real application.</p>
                   <div class="flex gap-3">
                       <button class="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" onclick="this.closest('.fixed').remove()">
                           Cancel
                       </button>
                       <button class="flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg hover:bg-[#B8941F] transition-colors" onclick="this.closest('.fixed').remove()">
                           Confirm
                       </button>
                   </div>
               </div>
           `;
           
           document.body.appendChild(modal);
           
           // Trigger animation
           requestAnimationFrame(() => {
               modal.classList.add('opacity-100');
               modal.querySelector('.bg-white').classList.add('scale-100');
           });
           
           // Close on backdrop click
           modal.addEventListener('click', function(e) {
               if (e.target === modal) {
                   modal.remove();
               }
           });
       });
   }
});

// Animate numbers on scroll
const animateValue = (element, start, end, duration) => {
   const startTimestamp = Date.now();
   const step = (timestamp) => {
       const progress = Math.min((Date.now() - startTimestamp) / duration, 1);
       const value = Math.floor(progress * (end - start) + start);
       element.textContent = element.textContent.includes('₨') ? `₨ ${value.toLocaleString()}` : value.toLocaleString();
       if (progress < 1) {
           window.requestAnimationFrame(step);
       }
   };
   window.requestAnimationFrame(step);
};

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
   entries.forEach(entry => {
       if (entry.isIntersecting) {
           if (entry.target.classList.contains('chart-line')) {
               entry.target.style.animation = 'drawLine 2s ease-out forwards';
           } else if (entry.target.classList.contains('luxury-card')) {
               entry.target.style.opacity = '0';
               entry.target.style.transform = 'translateY(20px)';
               setTimeout(() => {
                   entry.target.style.transition = 'all 0.6s ease-out';
                   entry.target.style.opacity = '1';
                   entry.target.style.transform = 'translateY(0)';
               }, 100);
           }
       }
   });
}, { threshold: 0.1 });

// Observe elements
document.querySelectorAll('.luxury-card').forEach(card => observer.observe(card));
document.querySelectorAll('.chart-line').forEach(line => observer.observe(line));

// Stock alert animations
document.querySelectorAll('.border-l-4').forEach((alert, index) => {
   alert.style.opacity = '0';
   alert.style.transform = 'translateX(-20px)';
   setTimeout(() => {
       alert.style.transition = 'all 0.5s ease-out';
       alert.style.opacity = '1';
       alert.style.transform = 'translateX(0)';
   }, 200 * index);
});

// Message notifications
let messageCount = 5;
const messageBadge = document.querySelector('.px-3.py-1.bg-\\[\\#D4AF37\\]');

setInterval(() => {
   if (Math.random() > 0.8) {
       messageCount++;
       messageBadge.textContent = `${messageCount} new`;
       messageBadge.style.transform = 'scale(1.2)';
       setTimeout(() => {
           messageBadge.style.transform = 'scale(1)';
       }, 200);
   }
}, 10000);

// Quick action hover effects
document.querySelectorAll('.grid.grid-cols-2 button').forEach(btn => {
   btn.addEventListener('mouseenter', function() {
       this.querySelector('svg').style.transform = 'scale(1.1) rotate(5deg)';
   });
   
   btn.addEventListener('mouseleave', function() {
       this.querySelector('svg').style.transform = 'scale(1) rotate(0deg)';
   });
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Mobile menu drawer (if needed)
function createMobileDrawer() {
   const drawer = document.createElement('div');
   drawer.className = 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl p-4 transform translate-y-full transition-transform duration-300 md:hidden z-40';
   drawer.innerHTML = `
       <div class="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
       <div class="grid grid-cols-4 gap-2">
           <button class="p-3 text-center">
               <svg class="w-6 h-6 mx-auto mb-1 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
               </svg>
               <span class="text-xs">Home</span>
           </button>
           <button class="p-3 text-center">
               <svg class="w-6 h-6 mx-auto mb-1 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
               </svg>
               <span class="text-xs">Orders</span>
           </button>
           <button class="p-3 text-center">
               <svg class="w-6 h-6 mx-auto mb-1 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
               </svg>
               <span class="text-xs">Analytics</span>
           </button>
           <button class="p-3 text-center">
               <svg class="w-6 h-6 mx-auto mb-1 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
               </svg>
               <span class="text-xs">Add</span>
           </button>
       </div>
   `;
   
   document.body.appendChild(drawer);
   
   // Show drawer on scroll up
   let lastScrollTop = 0;
   window.addEventListener('scroll', () => {
       const st = window.pageYOffset || document.documentElement.scrollTop;
       if (st > lastScrollTop && st > 100) {
           drawer.classList.add('translate-y-full');
       } else {
           drawer.classList.remove('translate-y-full');
       }
       lastScrollTop = st <= 0 ? 0 : st;
   });
}

// Initialize mobile drawer on smaller screens
if (window.innerWidth < 768) {
   createMobileDrawer();
}

// Performance optimization - lazy load images
document.querySelectorAll('img').forEach(img => {
   img.loading = 'lazy';
});

// Add subtle parallax effect to hero section
window.addEventListener('scroll', () => {
   const scrolled = window.pageYOffset;
   const hero = document.querySelector('.bg-gradient-to-br');
   if (hero) {
       hero.style.transform = `translateY(${scrolled * 0.5}px)`;
   }
});
