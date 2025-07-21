const Review = require('../models/Review');
const Product = require('../models/product');
const Order = require('../models/order');
const { reviewSchema } = require('../validations/reviewValidation');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Helper to check if user has ordered the product
async function hasUserOrderedProduct(userId, productId) {
  try {
    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: 'delivered'
    });
    return !!order;
  } catch (error) {
    console.error('Error checking user order:', error);
    return false;
  }
}

// Helper to recalculate and update product's averageRating and totalReviews
async function updateProductReviewStats(productId) {
  const reviews = await Review.find({ productId });
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) : 0;
  
  // Calculate rating distribution
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    ratingCounts[review.rating] = (ratingCounts[review.rating] || 0) + 1;
  });
  
  await Product.findByIdAndUpdate(productId, {
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews
  });
  
  return { averageRating: parseFloat(averageRating.toFixed(2)), totalReviews, ratingCounts };
}

// GET /product/:id/reviews
exports.getReviews = asyncWrap(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || 'newest';
  const filter = req.query.filter || 'all';
  
  // Build query
  let query = { productId: id };
  if (['1','2','3','4','5'].includes(filter)) {
    query.rating = parseInt(filter);
  }
  
  // Build sort object
  let sortObj = {};
  switch (sort) {
    case 'newest':
      sortObj = { createdAt: -1 };
      break;
    case 'oldest':
      sortObj = { createdAt: 1 };
      break;
    case 'highest':
      sortObj = { rating: -1, createdAt: -1 };
      break;
    case 'lowest':
      sortObj = { rating: 1, createdAt: -1 };
      break;
    case 'helpful':
      sortObj = { helpfulCount: -1, createdAt: -1 };
      break;
    default:
      sortObj = { createdAt: -1 };
  }
  
  // Get reviews with pagination
  const skip = (page - 1) * limit;
  const reviews = await Review.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'firstName lastName');
  
  // Get total count for pagination
  const totalReviews = await Review.countDocuments(query);
  const hasMore = skip + reviews.length < totalReviews;
  
  // Get summary data
  const summary = await updateProductReviewStats(id);
  
  // Format reviews for frontend
  const formattedReviews = reviews.map(review => ({
    _id: review._id,
    rating: review.rating,
    comment: review.comment,
    reviewerName: review.reviewerName,
    images: review.images,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt,
    userId: review.userId._id
  }));
  
  res.json({
    reviews: formattedReviews,
    summary,
    pagination: {
      page,
      limit,
      total: totalReviews,
      hasMore
    }
  });
});

// POST /product/:id/reviews
exports.createOrUpdateReview = asyncWrap(async (req, res) => {
  if (!req.user) {
    throw new AppError('Login required', 401);
  }
  
  const { id } = req.params;
  const { rating, comment } = req.body;
  const images = req.files ? req.files.map(f => '/uploads/reviews/' + f.filename) : [];
  
  // Check if user has ordered this product
  const hasOrdered = await hasUserOrderedProduct(req.user._id, id);
  if (!hasOrdered) {
    throw new AppError('You can only review products you have purchased and received. Please order this product first.', 403);
  }
  
  // Automatically get reviewer name from user data
  const reviewerName = `${req.user.firstName} ${req.user.lastName}`.trim();
  
  // Validate input (without reviewerName since we get it from user)
  const { error } = reviewSchema.validate({ rating, comment, reviewerName, images });
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }
  
  // Check if product exists
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  // Check if user already reviewed this product
  const existingReview = await Review.findOne({ productId: id, userId: req.user._id });
  
  if (existingReview) {
    throw new AppError('You have already reviewed this product. You can edit your existing review instead.', 400);
  }
  
  // Create new review
  const review = new Review({
    userId: req.user._id,
    productId: id,
    rating: parseInt(rating),
    comment,
    reviewerName,
    images
  });
  
  await review.save();
  
  // Update product stats
  await updateProductReviewStats(id);
  
  // Return success response
  res.json({
    success: true,
    review: {
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      reviewerName: review.reviewerName,
      images: review.images,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      userId: review.userId
    },
    message: 'Review submitted successfully'
  });
});

// PUT /product/:id/reviews/:reviewId
exports.editReview = asyncWrap(async (req, res) => {
  if (!req.user) {
    throw new AppError('Login required', 401);
  }
  
  const { id, reviewId } = req.params;
  const { rating, comment } = req.body;
  const images = req.files ? req.files.map(f => '/uploads/reviews/' + f.filename) : [];
  
  // Automatically get reviewer name from user data
  const reviewerName = `${req.user.firstName} ${req.user.lastName}`.trim();
  
  // Validate input (without reviewerName since we get it from user)
  const { error } = reviewSchema.validate({ rating, comment, reviewerName, images });
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }
  
  // Find and verify review ownership
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }
  
  if (review.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You can only edit your own reviews', 403);
  }
  
  // Update review
  review.rating = parseInt(rating);
  review.comment = comment;
  review.reviewerName = reviewerName;
  if (images.length > 0) {
    review.images = images;
  }
  await review.save();
  
  // Update product stats
  await updateProductReviewStats(id);
  
  res.json({
    success: true,
    review: {
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      reviewerName: review.reviewerName,
      images: review.images,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      userId: review.userId
    },
    message: 'Review updated successfully'
  });
});

// DELETE /product/:id/reviews/:reviewId
exports.deleteReview = asyncWrap(async (req, res) => {
  if (!req.user) {
    throw new AppError('Login required', 401);
  }
  
  const { id, reviewId } = req.params;
  
  // Find and verify review ownership
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found', 404);
  }
  
  if (review.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You can only delete your own reviews', 403);
  }
  
  // Delete review
  await Review.findByIdAndDelete(reviewId);
  
  // Update product stats
  await updateProductReviewStats(id);
  
  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// GET /product/:id/can-review
exports.canUserReview = asyncWrap(async (req, res) => {
  if (!req.user) {
    throw new AppError('Login required', 401);
  }
  
  const { id } = req.params;
  
  // Check if user has ordered this product
  const hasOrdered = await hasUserOrderedProduct(req.user._id, id);
  
  // Check if user already reviewed this product
  const existingReview = await Review.findOne({ productId: id, userId: req.user._id });
  
  res.json({
    canReview: hasOrdered && !existingReview,
    hasOrdered: hasOrdered,
    hasReviewed: !!existingReview,
    existingReview: existingReview ? {
      _id: existingReview._id,
      rating: existingReview.rating,
      comment: existingReview.comment,
      images: existingReview.images,
      createdAt: existingReview.createdAt
    } : null
  });
}); 