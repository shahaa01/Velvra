const express = require('express');
const router = express.Router();
const asyncWrap = require('../utils/asyncWrap');
const Product = require('../models/product');
const Order = require('../models/order');
const {authenticateJWT} = require('../middlewares/jwtMiddleware');

// Get featured/most popular products for home screen (limited set)
router.get('/products/featured', asyncWrap(async (req, res) => {
    const limit = parseInt(req.query.limit) || 8;
    // Aggregate order data to get total sold per product
    const salesAgg = await Order.aggregate([
        { $unwind: '$items' },
        { $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' }
        }},
        { $sort: { totalSold: -1 } },
        { $limit: limit }
    ]);
    let productIds = salesAgg.map(r => r._id);
    let products = await Product.find({ _id: { $in: productIds } });
    // If not enough, fill with top-rated products
    if (products.length < limit) {
        const moreProducts = await Product.find({ _id: { $nin: productIds } })
            .sort({ averageRating: -1, createdAt: -1 })
            .limit(limit - products.length);
        products = products.concat(moreProducts);
    }
    res.json({ products });
}));

// Get all products (for "See All" screen)
router.get('/products/all', asyncWrap(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const totalProducts = await Product.countDocuments({});
    const products = await Product.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    
    const totalPages = Math.ceil(totalProducts / limit);
    const hasMore = page < totalPages;
    
    res.json({
        products,
        pagination: {
            currentPage: page,
            totalPages,
            totalProducts,
            hasMore,
            itemsPerPage: limit
        }
    });
}));

// Get the highest salePercentage among all products
router.get('/products/highest-sale-percentage', asyncWrap(async (req, res) => {
    const result = await Product.findOne({ salePercentage: { $exists: true, $ne: null } })
        .sort({ salePercentage: -1 })
        .select('salePercentage');
    const highestSalePercentage = result ? result.salePercentage : 0;
    res.json({ highestSalePercentage });
}));

// Get a single product by ID (for product details page)
router.get('/products/:id', asyncWrap(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
}));

// Get all reviews for a product by productId
router.get('/products/:id/reviews', asyncWrap(async (req, res) => {
    const reviews = await require('../models/Review').find({ productId: req.params.id }).sort({ createdAt: -1 });
    res.json({ reviews });
}));

// Get similar products for a given product (by id)
router.get('/products/:id/similar', asyncWrap(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Find the reference product
    const referenceProduct = await Product.findById(id);
    if (!referenceProduct) {
        return res.status(404).json({ error: 'Product not found' });
    }

    // Find similar products: same category, and (overlapping tags or same brand), exclude itself
    const query = {
        _id: { $ne: referenceProduct._id },
        category: referenceProduct.category,
        $or: [
            { tags: { $in: referenceProduct.tags || [] } },
            { brand: referenceProduct.brand }
        ]
    };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    res.json({
        products,
        pagination: {
            currentPage: page,
            totalPages,
            totalProducts: total,
            hasMore,
            itemsPerPage: limit
        }
    });
}));

// API endpoint to get the logged-in user's profile info (for mobile app)
router.get('/user/profile', authenticateJWT, asyncWrap(async (req, res) => {
    const user = await require('../models/user').findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const initials = ((user.firstName?.[0] || '') + (user.lastName?.[0] || '')).toUpperCase();
    res.json({ firstName: user.firstName, lastName: user.lastName, initials });
}));

module.exports = router;
