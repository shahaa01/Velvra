const Review = require('../models/Review');
const Product = require('../models/product');
const { reviewSchema } = require('../validations/reviewValidation');

// Helper to recalculate and update product's averageRating and totalReviews
async function updateProductReviewStats(productId) {
  const reviews = await Review.find({ productId });
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) : 0;
  await Product.findByIdAndUpdate(productId, {
    averageRating: averageRating.toFixed(2),
    totalReviews
  });
}

// GET /product/:id/reviews
exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const sort = req.query.sort || 'newest';
    const filter = req.query.filter || 'all';
    let query = { productId: id };
    if (['1','2','3','4','5'].includes(filter)) query.rating = Number(filter);
    // Add more filter logic if needed
    let reviews = await Review.find(query).sort({
      createdAt: sort === 'oldest' ? 1 : -1,
      rating: sort === 'highest' ? -1 : sort === 'lowest' ? 1 : undefined
    });
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// POST /product/:id/reviews
exports.createOrUpdateReview = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    const { id } = req.params;
    const { rating, comment, reviewerName } = req.body;
    const images = req.files ? req.files.map(f => '/uploads/reviews/' + f.filename) : [];
    const { error } = reviewSchema.validate({ rating, comment, reviewerName, images });
    if (error) return res.status(400).json({ error: error.details[0].message });
    let review = await Review.findOne({ productId: id, userId: req.user._id });
    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      review.reviewerName = reviewerName;
      if (images.length > 0) review.images = images;
      await review.save();
    } else {
      // Create new review
      review = new Review({
        userId: req.user._id,
        productId: id,
        rating,
        comment,
        reviewerName,
        images
      });
      await review.save();
    }
    await updateProductReviewStats(id);
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

// PUT /product/:id/reviews/:reviewId
exports.editReview = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    const { id, reviewId } = req.params;
    const { rating, comment, reviewerName } = req.body;
    const images = req.files ? req.files.map(f => '/uploads/reviews/' + f.filename) : [];
    const { error } = reviewSchema.validate({ rating, comment, reviewerName, images });
    if (error) return res.status(400).json({ error: error.details[0].message });
    let review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
    review.rating = rating;
    review.comment = comment;
    review.reviewerName = reviewerName;
    if (images.length > 0) review.images = images;
    await review.save();
    await updateProductReviewStats(id);
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to edit review' });
  }
};

// DELETE /product/:id/reviews/:reviewId
exports.deleteReview = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Login required' });
    const { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.userId.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
    await review.remove();
    await updateProductReviewStats(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
}; 