const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Cart = require('../models/cart');
const reviewController = require('../controllers/reviewController');
const reviewMulter = require('../middlewares/reviewMulter');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const asyncWrap = require('../utils/asyncWrap');
const AppError = require('../utils/AppError');

// --- Product Creation Route ---
const Joi = require('joi');
const Seller = require('../models/Seller');

// Validation schema for product creation
const productCreateSchema = Joi.object({
    name: Joi.string().min(5).max(120).required(),
    brand: Joi.string().min(1).required(),
    images: Joi.array().items(Joi.string().uri()).min(1).max(7).required(),
    colors: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            hex: Joi.string().required(),
            sizes: Joi.array().items(Joi.string()).required(), // Just size names, no stock
            imageUrl: Joi.string().uri().optional().allow(null)
        })
    ).min(1).required(),
    sizes: Joi.array().items(Joi.string()).min(1).required(),
    categoryPath: Joi.array().items(Joi.string()).min(1).required(),
    tags: Joi.array().items(Joi.string()).optional(),
    sizeChart: Joi.array().items(
        Joi.object({
            size: Joi.string().required(),
            bodyPart: Joi.string().required(),
            unit: Joi.string().required(),
            value: Joi.number().required()
        })
    ).optional(),
    variants: Joi.array().items(
        Joi.object({
            color: Joi.string().required(),
            size: Joi.string().required(),
            price: Joi.number().required(),
            salePrice: Joi.number().optional().allow(null),
            salePercentage: Joi.number().optional().default(0),
            stock: Joi.number().required(),
            sku: Joi.string().required(),
            active: Joi.boolean().optional()
        })
    ).min(1).required(), // Variants are now required
    highlights: Joi.array().items(Joi.string()).optional(),
    moreDetails: Joi.object().optional(),
    description: Joi.string().allow('').optional(),
    contentScore: Joi.number().min(0).max(100).required()
});

// POST /api/products - Create a new product
router.post('/api/products', isLoggedIn, asyncWrap(async (req, res) => {
    // Debug authentication
    console.log('User authentication check:', {
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? { id: req.user._id, email: req.user.email } : null,
        session: req.session ? 'exists' : 'missing'
    });

    // Validate seller
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('You must be a registered seller to add products.', 403);
    }

    // Debug received data
    console.log('Received product data:', {
        name: req.body.name,
        categoryPath: req.body.categoryPath,
        colors: req.body.colors?.length || 0,
        variants: req.body.variants?.length || 0
    });

    // Validate input
    const { error, value } = productCreateSchema.validate(req.body, { abortEarly: false });
    if (error) {
        console.log('Validation errors:', error.details.map(e => e.message));
        return res.status(400).json({ error: error.details.map(e => e.message).join(', ') });
    }

    // Prepare product data
    const productData = {
        ...value,
        seller: seller._id,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Set category and tags before saving (since validation runs before pre-save hook)
    if (Array.isArray(productData.categoryPath) && productData.categoryPath.length > 1) {
        productData.category = productData.categoryPath[1];
        productData.tags = productData.categoryPath.filter(tag => tag !== 'Fashion');
    }

    // Save product
    const product = new Product(productData);
    await product.save();

    res.status(201).json({ success: true, product });
}));

// API endpoint for loading more similar products
router.get('/api/similar-products/:id', asyncWrap(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;

    // Get the reference product
    const referenceProduct = await Product.findById(req.params.id);
    if (!referenceProduct) {
        throw new AppError('Product not found', 404);
    }

    // Precompute reference values for aggregation
    const refTags = referenceProduct.tags || [];
    const refCategoryPath = referenceProduct.categoryPath || [];
    const refBrand = referenceProduct.brand;
    const refPrice = referenceProduct.price;
    const refColors = (referenceProduct.colors || []).map(c => c.name);
    const refFit = referenceProduct.moreDetails && referenceProduct.moreDetails.fit ? referenceProduct.moreDetails.fit : null;
    const refPattern = referenceProduct.moreDetails && referenceProduct.moreDetails.pattern ? referenceProduct.moreDetails.pattern : null;

    // --- Aggregation for similarity scoring ---
    const pipeline = [
        // Exclude the reference product
        { $match: { _id: { $ne: referenceProduct._id } } },
        // Add similarity score
        { $addFields: {
            similarityScore: {
                $add: [
                    // High: categoryPath overlap (max 4 points)
                    {
                        $multiply: [
                            4,
                            { $size: { $ifNull: [ { $setIntersection: ["$categoryPath", refCategoryPath] }, [] ] } }
                        ]
                    },
                    // High: tags overlap (max 3 points)
                    {
                        $multiply: [
                            3,
                            { $size: { $ifNull: [ { $setIntersection: ["$tags", refTags] }, [] ] } }
                        ]
                    },
                    // High: averageRating (max 3 points, normalized to 0-3)
                    {
                        $cond: [
                            { $gte: ["$averageRating", 4.5] }, 3,
                            { $cond: [ { $gte: ["$averageRating", 4] }, 2, { $cond: [ { $gte: ["$averageRating", 3] }, 1, 0 ] } ] }
                        ]
                    },
                    // Medium: price proximity (2 points if within ±20%)
                    {
                        $cond: [
                            { $and: [
                                { $gte: ["$price", refPrice * 0.8] },
                                { $lte: ["$price", refPrice * 1.2] }
                            ] },
                            2, 0
                        ]
                    },
                    // Medium: contentScore (max 2 points, normalized to 0-2)
                    {
                        $cond: [
                            { $gte: ["$contentScore", 80] }, 2,
                            { $cond: [ { $gte: ["$contentScore", 60] }, 1, 0 ] }
                        ]
                    },
                    // Low: brand match (1 point)
                    {
                        $cond: [ { $eq: ["$brand", refBrand] }, 1, 0 ]
                    },
                    // Low: color name overlap (1 point if any color matches)
                    {
                        $cond: [
                            { $gt: [
                                { $size: { $setIntersection: [
                                    { $map: { input: "$colors", as: "c", in: "$$c.name" } },
                                    refColors
                                ] } }, 0 ] }, 1, 0
                        ]
                    },
                    // Low: moreDetails.fit match (1 point)
                    {
                        $cond: [
                            { $and: [
                                { $ne: ["$moreDetails", null] },
                                { $eq: ["$moreDetails.fit", refFit] },
                                { $ne: [refFit, null] }
                            ] }, 1, 0
                        ]
                    },
                    // Low: moreDetails.pattern match (1 point)
                    {
                        $cond: [
                            { $and: [
                                { $ne: ["$moreDetails", null] },
                                { $eq: ["$moreDetails.pattern", refPattern] },
                                { $ne: [refPattern, null] }
                            ] }, 1, 0
                        ]
                    }
                ]
            }
        } },
        // Sort by similarityScore descending, then by createdAt descending
        { $sort: { similarityScore: -1, createdAt: -1 } },
        // Pagination
        { $skip: skip },
        { $limit: limit }
    ];

    // Run aggregation
    const similarProducts = await Product.aggregate(pipeline);

    // For total count, use the same $match as above (excluding the reference product)
    const totalProducts = await Product.countDocuments({
        _id: { $ne: referenceProduct._id }
    });

    res.json({
        products: similarProducts,
        pagination: {
            currentPage: page,
            totalProducts,
            hasMore: skip + similarProducts.length < totalProducts
        }
    });
}));

router.route('/:id')
    .get(asyncWrap(async (req, res) => {
        const reqProduct = await Product.findById(req.params.id);
        if (!reqProduct) {
            throw new AppError('Product not found', 404);
        }

        // Calculate total sales for this product
        const Order = require('../models/order');
        const salesData = await Order.aggregate([
            { $unwind: '$items' },
            { $match: { 'items.product': reqProduct._id } },
            { $group: {
                _id: null,
                totalSold: { $sum: '$items.quantity' }
            }}
        ]);
        
        const totalSold = salesData.length > 0 ? salesData[0].totalSold : 0;

        // Get initial similar products (first 4)
        const similarProducts = await Product.find({
            category: reqProduct.category,
            _id: { $ne: reqProduct._id }
        })
        .limit(4)
        .sort({ createdAt: -1 });

        // Check if product is in user's cart
        let isInCart = false;
        if (req.user) {
            const cart = await Cart.findOne({ user: req.user._id });
            if (cart) {
                isInCart = cart.items.some(item => item.product.toString() === reqProduct._id.toString());
            }
        }

        // Compute top-level inStock property for EJS
        reqProduct.inStock = reqProduct.colors && reqProduct.colors.some(c => c.sizes && c.sizes.some(s => s.stock > 0));

        res.render('page/individualProduct', {
            title: "Premium " + reqProduct.name + " | Velvra",
            product: reqProduct,
            similarProducts: similarProducts,
            isInCart: isInCart,
            currentUser: req.user,
            totalSold: totalSold
        });
    }));

// Review routes
router.get('/:id/reviews', reviewController.getReviews);
router.get('/:id/can-review', isLoggedIn, reviewController.canUserReview);
router.post('/:id/reviews', isLoggedIn, reviewMulter.array('images', 5), reviewController.createOrUpdateReview);
router.put('/:id/reviews/:reviewId', isLoggedIn, reviewMulter.array('images', 5), reviewController.editReview);
router.delete('/:id/reviews/:reviewId', isLoggedIn, reviewController.deleteReview);

module.exports = router;