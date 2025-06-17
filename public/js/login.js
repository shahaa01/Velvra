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
