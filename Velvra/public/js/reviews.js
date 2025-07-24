// Reviews functionality for individual product pages
// --- Custom Flash Message Helper ---
function showFlashMessage(type, message) {
    // Remove any existing flash messages
    let flashContainer = document.getElementById('flash-messages');
    if (!flashContainer) {
        flashContainer = document.createElement('div');
        flashContainer.id = 'flash-messages';
        flashContainer.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-md';
        document.body.appendChild(flashContainer);
    }
    // Create the flash message
    const flash = document.createElement('div');
    let classes = 'border rounded-xl p-4 shadow-lg transform transition-all duration-500 ease-in-out opacity-0 translate-x-full ';
    if (type === 'success') classes += 'bg-green-50 border-green-200 text-green-800';
    else if (type === 'error') classes += 'bg-red-50 border-red-200 text-red-800';
    else if (type === 'info') classes += 'bg-blue-50 border-blue-200 text-blue-800';
    else if (type === 'warning') classes += 'bg-yellow-50 border-yellow-200 text-yellow-800';
    flash.className = classes;
    flash.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0"></div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <div class="ml-auto pl-3">
                <div class="-mx-1.5 -my-1.5">
                    <button onclick="this.closest('div[role=alert]').remove()" class="hover:bg-red-100 hover:text-red-800 rounded-lg inline-flex p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors">
                        <span class="sr-only">Dismiss</span>
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
    flash.setAttribute('role', 'alert');
    flashContainer.appendChild(flash);
    setTimeout(() => {
        flash.classList.remove('opacity-0', 'translate-x-full');
        flash.classList.add('opacity-100', 'translate-x-0');
    }, 100);
    setTimeout(() => {
        flash.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => flash.remove(), 500);
    }, 5000);
}

class ReviewsManager {
    constructor() {
        this.currentRating = 0;
        this.uploadedImages = [];
        this.currentPage = 1;
        this.hasMoreReviews = true;
        this.currentSort = 'newest';
        this.currentFilter = 'all';
        this.productId = null;
        this.isLoggedIn = false;
        this.currentUserId = null;
        this.editingReviewId = null; // New property for editing
        this.isEditing = false; // New property for editing
    }

    // Initialize reviews component
    init(productId, loggedIn, userId = null) {
        this.productId = productId;
        this.isLoggedIn = loggedIn;
        this.currentUserId = userId;
        
        this.loadReviews();
        this.setupEventListeners();
        
        // Check if user can review this product
        if (this.isLoggedIn) {
            this.checkUserReviewEligibility();
        }
    }

    // Check if user can review the product
    async checkUserReviewEligibility() {
        try {
            const response = await fetch(`/product/${this.productId}/can-review`);
            const data = await response.json();
            
            if (response.ok) {
                if (!data.canReview) {
                    this.showReviewEligibilityMessage(data);
                }
                
                if (data.existingReview) {
                    this.populateFormWithExistingReview(data.existingReview);
                    this.showExistingReviewMessage();
                }
            }
        } catch (error) {
            console.error('Error checking review eligibility:', error);
        }
    }

    // Show review eligibility message
    showReviewEligibilityMessage(data) {
        const writeReviewSection = document.querySelector('.write-review-section');
        if (writeReviewSection) {
            const existingMessage = writeReviewSection.querySelector('.review-eligibility-message');
            if (!existingMessage) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'review-eligibility-message mb-4 p-3 border rounded-lg';
                
                if (!data.hasOrdered) {
                    messageDiv.className += ' bg-yellow-50 border-yellow-200';
                    messageDiv.innerHTML = `
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="text-yellow-700 text-sm">You can only review products you have purchased and received. Please order this product first to leave a review.</span>
                        </div>
                    `;
                } else if (data.hasReviewed) {
                    messageDiv.className += ' bg-blue-50 border-blue-200';
                    messageDiv.innerHTML = `
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="text-blue-700 text-sm">You have already reviewed this product. You can edit your existing review below.</span>
                        </div>
                    `;
                }
                
                const title = writeReviewSection.querySelector('h3');
                if (title) {
                    title.parentNode.insertBefore(messageDiv, title.nextSibling);
                }
            }
        }
    }

    // Populate form with existing review data
    populateFormWithExistingReview(review) {
        const reviewInput = document.getElementById('reviewText');
        const starRatingInput = document.querySelector('.star-rating-input');
        
        if (reviewInput) reviewInput.value = review.comment;
        
        this.currentRating = review.rating;
        if (starRatingInput) {
            starRatingInput.dataset.rating = this.currentRating;
            this.updateStarDisplay();
        }
        
        // Handle images if they exist
        if (review.images && review.images.length > 0) {
            // Note: We can't populate file inputs with existing images due to security restrictions
            // But we can show a message about existing images
            console.log('User has existing review images:', review.images);
        }
    }

    // Show message that user has already reviewed
    showExistingReviewMessage() {
        const writeReviewSection = document.querySelector('.write-review-section');
        if (writeReviewSection) {
            const existingMessage = writeReviewSection.querySelector('.existing-review-message');
            if (!existingMessage) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'existing-review-message mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg';
                messageDiv.innerHTML = `
                    <div class="flex items-center">
                        <svg class="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="text-blue-700 text-sm">You have already reviewed this product. You can edit your review below or use the edit button on your existing review.</span>
                    </div>
                `;
                
                const title = writeReviewSection.querySelector('h3');
                if (title) {
                    title.parentNode.insertBefore(messageDiv, title.nextSibling);
                }
            }
        }
    }

    // Load reviews from backend
    async loadReviews(page = 1, append = false) {
        try {
            const loadingEl = document.getElementById('loadingReviews');
            if (page === 1 && loadingEl) {
                loadingEl.style.display = 'block';
            }
            
            const params = new URLSearchParams({
                page: page,
                sort: this.currentSort,
                filter: this.currentFilter
            });
            
            const response = await fetch(`/product/${this.productId}/reviews?${params}`);
            const data = await response.json();
            
            if (response.ok) {
                if (page === 1) {
                    this.renderReviewsSummary(data.summary);
                    this.renderReviews(data.reviews);
                } else {
                    this.appendReviews(data.reviews);
                }
                
                this.hasMoreReviews = data.pagination.hasMore;
                this.currentPage = page;
                
                const loadMoreContainer = document.getElementById('loadMoreContainer');
                if (loadMoreContainer) {
                    loadMoreContainer.style.display = this.hasMoreReviews ? 'block' : 'none';
                }
            } else {
                throw new Error(data.error || 'Failed to load reviews');
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            const container = document.getElementById('reviewsContainer');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-red-500">Failed to load reviews. Please try again.</p>
                    </div>
                `;
            }
            showFlashMessage('error', 'Failed to load reviews. Please refresh the page and try again.');
        } finally {
            const loadingEl = document.getElementById('loadingReviews');
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
        }
    }

    // Render reviews summary
    renderReviewsSummary(summary) {
        const averageRatingEl = document.getElementById('averageRating');
        const totalReviewsEl = document.getElementById('totalReviews');
        const averageStarsEl = document.getElementById('averageStars');
        const distributionEl = document.getElementById('ratingDistribution');
        
        if (averageRatingEl) {
            averageRatingEl.textContent = summary.averageRating.toFixed(1);
        }
        
        if (totalReviewsEl) {
            totalReviewsEl.textContent = summary.totalReviews;
        }
        
        if (averageStarsEl) {
            averageStarsEl.innerHTML = this.generateStars(summary.averageRating);
        }
        
        if (distributionEl) {
            distributionEl.innerHTML = '';
            
            for (let i = 5; i >= 1; i--) {
                const percentage = summary.totalReviews > 0 ? (summary.ratingCounts[i] || 0) / summary.totalReviews * 100 : 0;
                distributionEl.innerHTML += `
                    <div class="flex items-center gap-3">
                        <span class="text-sm text-gray-600 w-8">${i}★</span>
                        <div class="flex-1 rating-bar">
                            <div class="rating-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-sm text-gray-500 w-8">${summary.ratingCounts[i] || 0}</span>
                    </div>
                `;
            }
        }
    }

    // Render reviews list
    renderReviews(reviews) {
        const container = document.getElementById('reviewsContainer');
        if (!container) return;
        
        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">No reviews yet. Be the first to review this product!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = reviews.map(review => this.createReviewHTML(review)).join('');
    }

    // Append more reviews
    appendReviews(reviews) {
        const container = document.getElementById('reviewsContainer');
        if (!container) return;
        
        const reviewHTML = reviews.map(review => this.createReviewHTML(review)).join('');
        container.insertAdjacentHTML('beforeend', reviewHTML);
    }

    // Create review HTML
    createReviewHTML(review) {
        const stars = this.generateStars(review.rating);
        const date = new Date(review.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const imagesHTML = review.images && review.images.length > 0 ? `
            <div class="flex gap-2 mt-3">
                ${review.images.map((img, index) => `
                    <img src="${img}" alt="Review image ${index + 1}" 
                         class="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity" 
                         onclick="reviewsManager.openImageModal('${img}')">
                `).join('')}
            </div>
        ` : '';
        
        const isOwner = this.currentUserId && review.userId === this.currentUserId;
        
        return `
            <div class="review-card p-6 fade-in" data-rating="${review.rating}" data-date="${review.createdAt}" data-review-id="${review._id}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-medium text-gray-900">${review.reviewerName}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <div class="star-rating" style="display: flex; gap: 1px;">
                                ${stars}
                            </div>
                        </div>
                    </div>
                    <span class="text-sm text-gray-500">${date}</span>
                </div>
                <p class="text-gray-700 mb-3 leading-relaxed">${review.comment}</p>
                ${imagesHTML}
                <div class="flex items-center gap-4 text-sm text-gray-500">
                    <button class="hover:text-gray-700 transition-colors" onclick="reviewsManager.markHelpful('${review._id}')">
                        👍 Helpful (${review.helpfulCount || 0})
                    </button>
                    ${isOwner ? `
                        <button class="hover:text-gray-700 transition-colors" onclick="reviewsManager.editReview('${review._id}')">Edit</button>
                        <button class="hover:text-gray-700 transition-colors" onclick="reviewsManager.deleteReview('${review._id}')">Delete</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Generate stars HTML
    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const starClass = i <= rating ? 'filled' : 'empty';
            stars += `<span class="star ${starClass}" style="font-size: 20px; color: ${i <= rating ? '#fbbf24' : '#d1d5db'}; width: 20px; height: 20px;">★</span>`;
        }
        return stars;
    }

    // Setup event listeners
    setupEventListeners() {
        // Star rating input
        const starRatingInput = document.querySelector('.star-rating-input');
        if (starRatingInput) {
            const starInputs = starRatingInput.querySelectorAll('.star-input');
            
            starInputs.forEach((star, index) => {
                star.addEventListener('click', () => {
                    this.currentRating = index + 1;
                    starRatingInput.dataset.rating = this.currentRating;
                    this.updateStarDisplay();
                });
                
                star.addEventListener('mouseenter', () => {
                    this.highlightStars(index + 1);
                });
            });
            
            starRatingInput.addEventListener('mouseleave', () => {
                this.updateStarDisplay();
            });
        }
        
        // Image upload
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        
        // Form submission
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => this.handleReviewSubmission(e));
        }
        
        // Filter and sort
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.loadReviews(1);
            });
        }
        
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.currentPage = 1;
                this.loadReviews(1);
            });
        }
        
        // Load more
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadReviews(this.currentPage + 1, true);
            });
        }
        
        // Image modal
        const closeModalBtn = document.getElementById('closeModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeImageModal());
        }
        
        const imageModal = document.getElementById('imageModal');
        if (imageModal) {
            imageModal.addEventListener('click', (e) => {
                if (e.target === imageModal) {
                    this.closeImageModal();
                }
            });
        }
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeImageModal();
            }
        });
    }

    // Star rating functions
    highlightStars(rating) {
        const starInputs = document.querySelectorAll('.star-input');
        starInputs.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#fbbf24';
                star.classList.add('filled');
                star.classList.remove('empty');
            } else {
                star.style.color = '#d1d5db';
                star.classList.add('empty');
                star.classList.remove('filled');
            }
        });
    }

    updateStarDisplay() {
        this.highlightStars(this.currentRating);
    }

    // Image upload handling
    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        
        if (this.uploadedImages.length + files.length > 5) {
            showFlashMessage('warning', 'You can only upload up to 5 images.');
            return;
        }
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = {
                        src: e.target.result,
                        file: file
                    };
                    this.uploadedImages.push(imageData);
                    this.renderImagePreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    renderImagePreview() {
        const imagePreview = document.getElementById('imagePreview');
        if (!imagePreview) return;
        
        if (this.uploadedImages.length === 0) {
            imagePreview.classList.add('hidden');
            return;
        }
        
        imagePreview.classList.remove('hidden');
        imagePreview.innerHTML = this.uploadedImages.map((image, index) => `
            <div class="image-preview aspect-square bg-gray-100">
                <img src="${image.src}" alt="Preview ${index + 1}">
                <button type="button" class="remove-image" onclick="reviewsManager.removeImage(${index})">×</button>
            </div>
        `).join('');
    }

    removeImage(index) {
        this.uploadedImages.splice(index, 1);
        this.renderImagePreview();
    }

    // Review submission
    async handleReviewSubmission(e) {
        e.preventDefault();
        const reviewInput = document.getElementById('reviewText');
        const errorDiv = document.getElementById('reviewTextError');
        if (!reviewInput) return;
        const review = reviewInput.value.trim();
        // Instant validation before submit
        if (!review || review.length < 5) {
            if (errorDiv) {
                errorDiv.textContent = 'Review must be at least 5 characters long.';
                errorDiv.style.display = 'block';
                reviewInput.classList.add('border-red-500');
            }
            return;
        } else if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
            reviewInput.classList.remove('border-red-500');
        }
        
        if (!reviewInput) return;
        
        if (!review || this.currentRating === 0) {
            showFlashMessage('warning', 'Please fill in all required fields and provide a rating.');
            return;
        }
        
        const submitBtn = document.getElementById('submitReview');
        if (!submitBtn) return;
        
        submitBtn.disabled = true;
        submitBtn.textContent = this.isEditing ? 'Updating...' : 'Submitting...';
        
        try {
            const formData = new FormData();
            formData.append('rating', this.currentRating);
            formData.append('comment', review);
            
            this.uploadedImages.forEach((image) => {
                formData.append('images', image.file);
            });
            
            let url = `/product/${this.productId}/reviews`;
            let method = 'POST';

            if (this.isEditing && this.editingReviewId) {
                url = `/product/${this.productId}/reviews/${this.editingReviewId}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method: method,
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                const message = this.isEditing ? 'Review updated successfully!' : 'Thank you for your review!';
                showFlashMessage('success', message);
                
                const reviewForm = document.getElementById('reviewForm');
                if (reviewForm) {
                    reviewForm.reset();
                }
                this.currentRating = 0;
                this.updateStarDisplay();
                this.uploadedImages = [];
                this.renderImagePreview();
                this.isEditing = false;
                this.editingReviewId = null;
                
                // Update submit button text back to original
                const submitBtn = document.getElementById('submitReview');
                if (submitBtn) {
                    submitBtn.textContent = 'Submit Review';
                }
                
                // Remove editing message
                const editingMessage = document.querySelector('.editing-review-message');
                if (editingMessage) {
                    editingMessage.remove();
                }
                
                // Reload reviews to show the updated/new one
                this.loadReviews(1);
            } else {
                // Handle specific error cases
                let errorMsg = data.message || data.error || 'Failed to submit review';
                showFlashMessage('error', errorMsg);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showFlashMessage('error', 'Failed to submit review. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = this.isEditing ? 'Update Review' : 'Submit Review';
            }
        }
    }

    // Review actions
    async markHelpful(reviewId) {
        // Implement helpful marking functionality
        console.log('Marking review as helpful:', reviewId);
    }

    async editReview(reviewId) {
        try {
            // Find the review data from the current reviews list
            const reviewElement = document.querySelector(`[data-review-id="${reviewId}"]`);
            if (!reviewElement) {
                console.error('Review element not found');
                return;
            }
            
            // Get review data from the element
            const rating = parseInt(reviewElement.dataset.rating);
            const comment = reviewElement.querySelector('p').textContent;
            
            // Populate the form with existing review data
            const reviewInput = document.getElementById('reviewText');
            const starRatingInput = document.querySelector('.star-rating-input');
            
            if (reviewInput) reviewInput.value = comment;
            
            this.currentRating = rating;
            if (starRatingInput) {
                starRatingInput.dataset.rating = this.currentRating;
                this.updateStarDisplay();
            }
            
            // Store the review ID for editing
            this.editingReviewId = reviewId;
            
            // Change form submission behavior
            this.isEditing = true;
            
            // Update submit button text
            const submitBtn = document.getElementById('submitReview');
            if (submitBtn) {
                submitBtn.textContent = 'Update Review';
            }
            
            // Show editing message
            this.showEditingMessage();
            
            // Scroll to the form
            const writeReviewSection = document.querySelector('.write-review-section');
            if (writeReviewSection) {
                writeReviewSection.scrollIntoView({ behavior: 'smooth' });
            }
            
        } catch (error) {
            console.error('Error editing review:', error);
            showFlashMessage('error', 'Failed to load review for editing. Please try again.');
        }
    }

    // Show editing message
    showEditingMessage() {
        const writeReviewSection = document.querySelector('.write-review-section');
        if (writeReviewSection) {
            const existingMessage = writeReviewSection.querySelector('.editing-review-message');
            if (!existingMessage) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'editing-review-message mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
                messageDiv.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                            </svg>
                            <span class="text-yellow-700 text-sm">You are editing your existing review. Click "Update Review" to save changes.</span>
                        </div>
                        <button onclick="reviewsManager.cancelEdit()" class="text-yellow-600 hover:text-yellow-800 text-sm underline">
                            Cancel Edit
                        </button>
                    </div>
                `;
                
                const title = writeReviewSection.querySelector('h3');
                if (title) {
                    title.parentNode.insertBefore(messageDiv, title.nextSibling);
                }
            }
        }
    }

    // Cancel editing
    cancelEdit() {
        this.isEditing = false;
        this.editingReviewId = null;
        
        // Reset form
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.reset();
        }
        
        this.currentRating = 0;
        this.updateStarDisplay();
        this.uploadedImages = [];
        this.renderImagePreview();
        
        // Update submit button text
        const submitBtn = document.getElementById('submitReview');
        if (submitBtn) {
            submitBtn.textContent = 'Submit Review';
        }
        
        // Remove editing message
        const editingMessage = document.querySelector('.editing-review-message');
        if (editingMessage) {
            editingMessage.remove();
        }
    }

    async deleteReview(reviewId) {
        const result = await Swal.fire({
            title: 'Delete Review?',
            text: "Are you sure you want to delete this review? This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });
        
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/product/${this.productId}/reviews/${reviewId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    showFlashMessage('success', 'Your review has been deleted successfully.');
                    this.loadReviews(1);
                } else {
                    throw new Error('Failed to delete review');
                }
            } catch (error) {
                console.error('Error deleting review:', error);
                showFlashMessage('error', 'Failed to delete review. Please try again.');
            }
        }
    }

    // Image modal functions
    openImageModal(imageSrc) {
        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        
        if (modal && modalImage) {
            modalImage.src = imageSrc;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    }

    closeImageModal() {
        const modal = document.getElementById('imageModal');
        
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            
            // Restore body scroll
            document.body.style.overflow = 'auto';
        }
    }
}

// Global instance
const reviewsManager = new ReviewsManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a product page with reviews
    const productId = document.querySelector('[data-product-id]')?.dataset.productId;
    if (productId) {
        const isLoggedIn = window.currentUserId && window.currentUserId !== '';
        reviewsManager.init(productId, isLoggedIn, window.currentUserId);
    }

    const reviewInput = document.getElementById('reviewText');
    const errorDiv = document.getElementById('reviewTextError');
    if (reviewInput && errorDiv) {
        reviewInput.addEventListener('input', function() {
            const value = reviewInput.value.trim();
            if (value.length < 5) {
                errorDiv.textContent = 'Review must be at least 5 characters long.';
                errorDiv.style.display = 'block';
                reviewInput.classList.add('border-red-500');
            } else {
                errorDiv.textContent = '';
                errorDiv.style.display = 'none';
                reviewInput.classList.remove('border-red-500');
            }
        });
    }
});

// Make it globally accessible
window.reviewsManager = reviewsManager;
