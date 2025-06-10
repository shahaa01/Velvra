// Password Toggle
const togglePassword = document.getElementById('togglePassword');
const password = document.getElementById('password');
const eyeOpen = document.getElementById('eyeOpen');
const eyeClosed = document.getElementById('eyeClosed');

togglePassword?.addEventListener('click', () => {
   const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
   password.setAttribute('type', type);
   
   eyeOpen.classList.toggle('hidden');
   eyeClosed.classList.toggle('hidden');
});

// Form Validation & Animation
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

loginForm?.addEventListener('submit', async (e) => {
   e.preventDefault();
   
   // Add loading state
   const submitBtn = loginForm.querySelector('button[type="submit"]');
   const originalText = submitBtn.innerHTML;
   submitBtn.disabled = true;
   submitBtn.innerHTML = `
       <span class="flex items-center justify-center">
           <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
               <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
               <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           Signing in...
       </span>
   `;
   
   // Simulate API call
   setTimeout(() => {
       submitBtn.disabled = false;
       submitBtn.innerHTML = originalText;
       // Handle login logic here
   }, 2000);
});

// Add input animations
[emailInput, passwordInput].forEach(input => {
   input?.addEventListener('focus', () => {
       input.parentElement.classList.add('scale-[1.02]');
   });
   
   input?.addEventListener('blur', () => {
       input.parentElement.classList.remove('scale-[1.02]');
   });
});

// Mobile optimizations
if (window.innerWidth <= 640) {
   // Prevent zoom on input focus
   document.querySelectorAll('input').forEach(input => {
       input.setAttribute('autocomplete', 'off');
   });
}