const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const { isLoggedIn } = require('../middlewares/authMiddleware');

router.route('/paymentSummary')
    .get(isLoggedIn, async(req, res) => {
        try {
            // Get user's cart with populated product details
            const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
            
            if (!cart) {
                return res.redirect('/cart');
            }

            res.render('page/paymentSummary', { cart });
        } catch (error) {
            console.error('Error loading payment summary:', error);
            res.status(500).render('error', { error: 'Failed to load payment summary' });
        }
    });

router.route('/finalizePayment')
    .get(isLoggedIn, async(req, res) => {
        try {
            // Get user's cart with populated product details
            const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
            
            if (!cart) {
                return res.redirect('/cart');
            }

            res.render('page/finalizePayment', { cart });
        } catch (error) {
            console.error('Error loading payment page:', error);
            res.status(500).render('error', { error: 'Failed to load payment page' });
        }
    });

module.exports = router;