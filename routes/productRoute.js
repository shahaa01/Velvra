const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Cart = require('../models/cart');

// API endpoint for loading more similar products
router.get('/api/similar-products/:id', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const skip = (page - 1) * limit;

        // Get the reference product
        const referenceProduct = await Product.findById(req.params.id);
        if (!referenceProduct) {
            return res.status(404).json({ error: 'Product not found' });
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
    } catch (error) {
        console.error('Error loading similar products:', error);
        res.status(500).json({ error: 'Error loading similar products' });
    }
});

router.route('/:id')
    .get(async (req, res) => {
        try {
            const reqProduct = await Product.findById(req.params.id);
            if (!reqProduct) {
                console.error('Product not found:', req.params.id);
                return res.status(404).render('error', {message: 'Product not found'});
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
                isInCart: isInCart
            });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {message: 'Internal Server Error'});
        }
    });

module.exports = router;