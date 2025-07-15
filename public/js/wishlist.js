// wishlist.js

document.addEventListener('DOMContentLoaded', function () {
  // Helper: update heart icon
  function setHeartActive(btn, active) {
    if (active) {
      btn.classList.add('in-wishlist');
      btn.querySelector('svg').classList.add('text-red-500');
    } else {
      btn.classList.remove('in-wishlist');
      btn.querySelector('svg').classList.remove('text-red-500');
    }
  }

  // Helper: show login toast
  function showLoginToast() {
    if (window.Swal) {
      Swal.fire({
        icon: 'info',
        title: 'Login Required',
        html: 'Please <a href="/auth/login?returnTo=' + encodeURIComponent(window.location.pathname + window.location.search) + '" style="color:#d4af37;text-decoration:underline;">login</a> to use your wishlist.',
        showConfirmButton: false,
        timer: 4000
      });
    } else {
      alert('Please login to use your wishlist.');
    }
  }

  // Find all wishlist buttons
  const wishlistBtns = document.querySelectorAll('.wishlist-btn[data-product-id]');
  if (!wishlistBtns.length) return;

  // On click, toggle wishlist
  wishlistBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const productId = btn.getAttribute('data-product-id');
      const isActive = btn.classList.contains('in-wishlist');
      // Optimistically toggle
      setHeartActive(btn, !isActive);
      // AJAX call
      fetch(`/dashboard/wishlist/${isActive ? 'remove' : 'add'}`, {
        method: isActive ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      })
      .then(async response => {
        if (response.status === 401 || response.redirected) {
          setHeartActive(btn, isActive); // revert
          showLoginToast();
          return;
        }
        const data = await response.json();
        if (!data.success) {
          setHeartActive(btn, isActive); // revert
          if (window.Swal) {
            Swal.fire({ icon: 'error', title: 'Wishlist Error', text: data.message || 'Failed to update wishlist.' });
          } else {
            alert(data.message || 'Failed to update wishlist.');
          }
        } else {
          // Optionally update wishlist count in navbar
          if (window.updateWishlistCount && typeof data.wishlistCount !== 'undefined') {
            window.updateWishlistCount(data.wishlistCount);
          }
        }
      })
      .catch(() => {
        setHeartActive(btn, isActive); // revert
        if (window.Swal) {
          Swal.fire({ icon: 'error', title: 'Wishlist Error', text: 'Failed to update wishlist.' });
        } else {
          alert('Failed to update wishlist.');
        }
      });
    });
    // Set initial state based on class
    setHeartActive(btn, btn.classList.contains('in-wishlist'));
  });
}); 