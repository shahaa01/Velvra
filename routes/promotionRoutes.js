// const express = require('express');
// const router = express.Router();
// const promotionController = require('../controllers/promotionController');
// const { isLoggedIn, isSeller } = require('../middlewares/authMiddleware');
// const updatePromotionStatuses = require('../middlewares/promotionStatusMiddleware');

// // Seller promotion routes (protected)
// router.use('/seller', isLoggedIn, isSeller);

// // Apply status update middleware to all seller routes
// router.use('/seller', updatePromotionStatuses);

// // Get all promotions for seller
// router.get('/seller/promotions', promotionController.getPromotions);

// // Get single promotion
// router.get('/seller/promotions/:id', promotionController.getPromotion);

// // Create new promotion
// router.post('/seller/promotions', promotionController.createPromotion);

// // Update promotion
// router.put('/seller/promotions/:id', promotionController.updatePromotion);

// // Delete promotion
// router.delete('/seller/promotions/:id', promotionController.deletePromotion);

// // Toggle promotion status
// router.patch('/seller/promotions/:id/toggle', promotionController.togglePromotionStatus);

// // Get promotion statistics
// router.get('/seller/promotions/stats', promotionController.getPromotionStats);

// // Public routes for validation (used in cart/checkout)
// router.post('/validate', promotionController.validatePromotionCode);

// module.exports = router; 