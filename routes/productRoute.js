const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Cart = require('../models/cart');
const reviewController = require('../controllers/reviewController');
const reviewMulter = require('../middlewares/reviewMulter');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const asyncWrap = require('../utils/asyncWrap');
const AppError = require('../utils/AppError');

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

    // Get similar products (same category)
    const similarProducts = await Product.find({
        category: referenceProduct.category,
        _id: { $ne: referenceProduct._id } // Exclude the current product
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

    // Get total count for pagination
    const totalProducts = await Product.countDocuments({
        category: referenceProduct.category,
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
            currentUser: req.user
        });
    }));

// Review routes
router.get('/:id/reviews', reviewController.getReviews);
router.get('/:id/can-review', isLoggedIn, reviewController.canUserReview);
router.post('/:id/reviews', isLoggedIn, reviewMulter.array('images', 5), reviewController.createOrUpdateReview);
router.put('/:id/reviews/:reviewId', isLoggedIn, reviewMulter.array('images', 5), reviewController.editReview);
router.delete('/:id/reviews/:reviewId', isLoggedIn, reviewController.deleteReview);

module.exports = router;