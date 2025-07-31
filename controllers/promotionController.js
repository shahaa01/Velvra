// const Promotion = require('../models/promotion');
// const Seller = require('../models/Seller');
// const Product = require('../models/product');
// const AppError = require('../utils/AppError');
// const asyncWrap = require('../utils/asyncWrap');

// // Get all promotions for a seller
// exports.getPromotions = asyncWrap(async (req, res) => {
//     const seller = await Seller.findOne({ user: req.user._id });
//     if (!seller) {
//         throw new AppError('Seller not found', 404);
//     }

//     const { 
//         search, 
//         status, 
//         type, 
//         sortBy = 'newest',
//         page = 1,
//         limit = 10
//     } = req.query;

//     // Build query
//     let query = { seller: seller._id };

//     // Search filter
//     if (search) {
//         query.$or = [
//             { code: { $regex: search, $options: 'i' } },
//             { description: { $regex: search, $options: 'i' } }
//         ];
//     }

//     // Status filter
//     if (status && status !== 'all') {
//         query.status = status;
//     }

//     // Type filter
//     if (type && type !== 'all') {
//         query.type = type;
//     }

//     // Calculate skip for pagination
//     const skip = (page - 1) * limit;

//     // Build sort object
//     let sort = {};
//     switch (sortBy) {
//         case 'newest':
//             sort = { createdAt: -1 };
//             break;
//         case 'oldest':
//             sort = { createdAt: 1 };
//             break;
//         case 'most-used':
//             sort = { usageCount: -1 };
//             break;
//         case 'expiring':
//             sort = { endDate: 1 };
//             break;
//         default:
//             sort = { createdAt: -1 };
//     }

//     // Execute query
//     const promotions = await Promotion.find(query)
//         .populate('products', 'name brand images')
//         .sort(sort)
//         .skip(skip)
//         .limit(parseInt(limit));

//     // Add current status to each promotion
//     const now = new Date();
//     const promotionsWithCurrentStatus = promotions.map(promo => {
//         const promoObj = promo.toObject();
        
//         // Calculate current status
//         if (promoObj.status === 'paused') {
//             promoObj.currentStatus = 'paused';
//         } else if (promoObj.endDate < now) {
//             promoObj.currentStatus = 'expired';
//         } else if (promoObj.startDate > now) {
//             promoObj.currentStatus = 'scheduled';
//         } else {
//             promoObj.currentStatus = 'active';
//         }
        
//         return promoObj;
//     });

//     // Get total count for pagination
//     const total = await Promotion.countDocuments(query);

//     // Calculate statistics
//     const stats = await calculatePromotionStats(seller._id);

//     res.json({
//         success: true,
//         data: {
//             promotions: promotionsWithCurrentStatus,
//             pagination: {
//                 currentPage: parseInt(page),
//                 totalPages: Math.ceil(total / limit),
//                 total,
//                 hasNext: page * limit < total,
//                 hasPrev: page > 1
//             },
//             stats
//         }
//     });
// });

// // Get single promotion
// exports.getPromotion = asyncWrap(async (req, res) => {
//     const seller = await Seller.findOne({ user: req.user._id });
//     if (!seller) {
//         throw new AppError('Seller not found', 404);
//     }

//     const promotion = await Promotion.findOne({
//         _id: req.params.id,
//         seller: seller._id
//     }).populate('products', 'name brand images category');

//     if (!promotion) {
//         throw new AppError('Promotion not found', 404);
//     }

//     // Add current status
//     const promoObj = promotion.toObject();
//     const now = new Date();
    
//     if (promoObj.status === 'paused') {
//         promoObj.currentStatus = 'paused';
//     } else if (promoObj.endDate < now) {
//         promoObj.currentStatus = 'expired';
//     } else if (promoObj.startDate > now) {
//         promoObj.currentStatus = 'scheduled';
//     } else {
//         promoObj.currentStatus = 'active';
//     }

//     res.json({
//         success: true,
//         data: promoObj
//     });
// });

// // Create new promotion
// exports.createPromotion = asyncWrap(async (req, res) => {
//     const seller = await Seller.findOne({ user: req.user._id });
//     if (!seller) {
//         throw new AppError('Seller not found', 404);
//     }

//     const {
//         code,
//         description,
//         type,
//         value,
//         minPurchase,
//         totalLimit,
//         customerLimit,
//         startDate,
//         endDate,
//         applyTo,
//         categories,
//         products
//     } = req.body;

//     // Validate code uniqueness
//     const existingPromotion = await Promotion.findOne({ code: code.toUpperCase() });
//     if (existingPromotion) {
//         throw new AppError('Promotion code already exists', 400);
//     }

//     // Validate dates
//     const start = new Date(startDate);
//     const end = new Date(endDate);
    
//     if (start >= end) {
//         throw new AppError('End date must be after start date', 400);
//     }

//     // Validate products if applyTo is 'products'
//     if (applyTo === 'products' && (!products || products.length === 0)) {
//         throw new AppError('At least one product must be selected', 400);
//     }

//     // Validate categories if applyTo is 'category'
//     if (applyTo === 'category' && (!categories || categories.length === 0)) {
//         throw new AppError('At least one category must be selected', 400);
//     }

//     // Create promotion
//     const promotion = new Promotion({
//         code: code.toUpperCase(),
//         description,
//         type,
//         value: parseFloat(value),
//         minPurchase: parseFloat(minPurchase) || 0,
//         totalLimit: totalLimit ? parseInt(totalLimit) : null,
//         customerLimit: parseInt(customerLimit) || 1,
//         startDate: start,
//         endDate: end,
//         applyTo,
//         categories: categories || [],
//         products: products || [],
//         seller: seller._id
//     });

//     await promotion.save();

//     res.status(201).json({
//         success: true,
//         message: 'Promotion created successfully',
//         data: promotion
//     });
// });

// // Update promotion
// exports.updatePromotion = asyncWrap(async (req, res) => {
//     const seller = await Seller.findOne({ user: req.user._id });
//     if (!seller) {
//         throw new AppError('Seller not found', 404);
//     }

//     const promotion = await Promotion.findOne({
//         _id: req.params.id,
//         seller: seller._id
//     });

//     if (!promotion) {
//         throw new AppError('Promotion not found', 404);
//     }

//     const {
//         code,
//         description,
//         type,
//         value,
//         minPurchase,
//         totalLimit,
//         customerLimit,
//         startDate,
//         endDate,
//         applyTo,
//         categories,
//         products
//     } = req.body;

//     // Check if code is being changed and validate uniqueness
//     if (code && code.toUpperCase() !== promotion.code) {
//         const existingPromotion = await Promotion.findOne({ 
//             code: code.toUpperCase(),
//             _id: { $ne: req.params.id }
//         });
//         if (existingPromotion) {
//             throw new AppError('Promotion code already exists', 400);
//         }
//         promotion.code = code.toUpperCase();
//     }

//     // Validate dates if being updated
//     if (startDate && endDate) {
//         const start = new Date(startDate);
//         const end = new Date(endDate);
        
//         if (start >= end) {
//             throw new AppError('End date must be after start date', 400);
//         }
//         promotion.startDate = start;
//         promotion.endDate = end;
//     }

//     // Update other fields
//     if (description) promotion.description = description;
//     if (type) promotion.type = type;
//     if (value !== undefined) promotion.value = parseFloat(value);
//     if (minPurchase !== undefined) promotion.minPurchase = parseFloat(minPurchase) || 0;
//     if (totalLimit !== undefined) promotion.totalLimit = totalLimit ? parseInt(totalLimit) : null;
//     if (customerLimit !== undefined) promotion.customerLimit = parseInt(customerLimit) || 1;
//     if (applyTo) promotion.applyTo = applyTo;
//     if (categories) promotion.categories = categories;
//     if (products) promotion.products = products;

//     await promotion.save();

//     res.json({
//         success: true,
//         message: 'Promotion updated successfully',
//         data: promotion
//     });
// });

// // Delete promotion
// exports.deletePromotion = asyncWrap(async (req, res) => {
//     const seller = await Seller.findOne({ user: req.user._id });
//     if (!seller) {
//         throw new AppError('Seller not found', 404);
//     }

//     const promotion = await Promotion.findOne({
//         _id: req.params.id,
//         seller: seller._id
//     });

//     if (!promotion) {
//         throw new AppError('Promotion not found', 404);
//     }

//     // Check if promotion has been used
//     if (promotion.usageCount > 0) {
//         throw new AppError('Cannot delete promotion that has been used', 400);
//     }

//     await Promotion.findByIdAndDelete(req.params.id);

//     res.json({
//         success: true,
//         message: 'Promotion deleted successfully'
//     });
// });

// // Toggle promotion status (pause/unpause)
// exports.togglePromotionStatus = asyncWrap(async (req, res) => {
//     const seller = await Seller.findOne({ user: req.user._id });
//     if (!seller) {
//         throw new AppError('Seller not found', 404);
//     }

//     const promotion = await Promotion.findOne({
//         _id: req.params.id,
//         seller: seller._id
//     });

//     if (!promotion) {
//         throw new AppError('Promotion not found', 404);
//     }

//     // Toggle between active and paused
//     if (promotion.status === 'active') {
//         promotion.status = 'paused';
//     } else if (promotion.status === 'paused') {
//         promotion.status = 'active';
//     } else {
//         throw new AppError('Cannot toggle status for scheduled or expired promotions', 400);
//     }

//     await promotion.save();

//     res.json({
//         success: true,
//         message: `Promotion ${promotion.status === 'active' ? 'activated' : 'paused'} successfully`,
//         data: promotion
//     });
// });

// // Validate promotion code (for cart/checkout)
// exports.validatePromotionCode = asyncWrap(async (req, res) => {
//     const { code, cartTotal } = req.body;

//     if (!code || !cartTotal) {
//         throw new AppError('Promotion code and cart total are required', 400);
//     }

//     // For now, we'll validate against all sellers' promotions
//     // In a real implementation, you might want to validate against specific seller
//     const promotion = await Promotion.findOne({
//         code: code.toUpperCase(),
//         isActive: true,
//         status: 'active',
//         startDate: { $lte: new Date() },
//         endDate: { $gte: new Date() }
//     });

//     if (!promotion) {
//         return res.json({
//             success: false,
//             message: 'Invalid or expired promotion code'
//         });
//     }

//     // Check total usage limit
//     if (promotion.totalLimit && promotion.usageCount >= promotion.totalLimit) {
//         return res.json({
//             success: false,
//             message: 'Promotion usage limit reached'
//         });
//     }

//     // Check minimum purchase
//     if (cartTotal < promotion.minPurchase) {
//         return res.json({
//             success: false,
//             message: `Minimum purchase of Rs. ${promotion.minPurchase} required`
//         });
//     }

//     // Calculate discount
//     const discount = promotion.calculateDiscount(cartTotal);

//     res.json({
//         success: true,
//         message: 'Promotion code applied successfully',
//         data: {
//             promotion: {
//                 id: promotion._id,
//                 code: promotion.code,
//                 description: promotion.description,
//                 type: promotion.type,
//                 value: promotion.value,
//                 discountDisplay: promotion.discountDisplay
//             },
//             discount,
//             finalAmount: cartTotal - discount
//         }
//     });
// });

// // Get promotion statistics
// exports.getPromotionStats = asyncWrap(async (req, res) => {
//     const seller = await Seller.findOne({ user: req.user._id });
//     if (!seller) {
//         throw new AppError('Seller not found', 404);
//     }

//     const stats = await calculatePromotionStats(seller._id);

//     res.json({
//         success: true,
//         data: stats
//     });
// });

// // Helper function to calculate promotion statistics
// async function calculatePromotionStats(sellerId) {
//     const now = new Date();
//     const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
//     const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

//     // Get all promotions for the seller
//     const allPromotions = await Promotion.find({ seller: sellerId });
    
//     // Get active promotions (using current status logic)
//     const activePromotions = allPromotions.filter(p => {
//         if (p.status === 'paused') return false;
//         if (p.endDate < now) return false;
//         if (p.startDate > now) return false;
//         return true;
//     });

//     // Get promotions created this week
//     const thisWeekPromotions = allPromotions.filter(p => 
//         p.createdAt >= oneWeekAgo
//     );

//     // Calculate total usage and revenue
//     const totalUsage = allPromotions.reduce((sum, p) => sum + p.usageCount, 0);
//     const totalRevenue = allPromotions.reduce((sum, p) => sum + p.revenue, 0);

//     // Calculate average discount
//     const activePromotionsWithValue = activePromotions.filter(p => p.value > 0);
//     const avgDiscount = activePromotionsWithValue.length > 0 
//         ? activePromotionsWithValue.reduce((sum, p) => sum + p.value, 0) / activePromotionsWithValue.length 
//         : 0;

//     return {
//         activeCoupons: activePromotions.length,
//         activeCouponsIncrease: thisWeekPromotions.length,
//         totalUses: totalUsage,
//         totalUsesPeriod: 'This month',
//         revenueImpact: totalRevenue,
//         revenueIncrease: '15%', // This would need more complex calculation
//         avgDiscount: Math.round(avgDiscount),
//         avgDiscountPeriod: 'Per order'
//     };
// } 