const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Order = require('../models/order');
const Product = require('../models/product');
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

            // Get user's addresses
            const user = await req.user.populate('addresses');
            const addresses = user.addresses || [];

            res.render('page/finalizePayment', { cart, addresses });
        } catch (error) {
            console.error('Error loading payment page:', error);
            res.status(500).render('error', { error: 'Failed to load payment page' });
        }
    });

// Buy Now - Single Product Checkout
router.route('/buyNow')
    .get(isLoggedIn, async(req, res) => {
        try {
            const { productId, size, color, quantity } = req.query;
            
            if (!productId || !size || !color || !quantity) {
                return res.redirect('/shop');
            }

            // Get product details
            const product = await Product.findById(productId);
            if (!product) {
                return res.redirect('/shop');
            }

            // Create a single item cart-like structure for the product
            const buyNowItem = {
                product: product,
                quantity: parseInt(quantity),
                size: size,
                color: color,
                price: product.salePrice || product.price,
                totalPrice: (product.salePrice || product.price) * parseInt(quantity)
            };

            // Calculate totals
            const subtotal = buyNowItem.totalPrice;
            const shippingCost = 0; // Free shipping
            const discount = 0; // No discount for now
            const total = subtotal + shippingCost - discount;

            res.render('page/paymentSummary', { 
                buyNowItem,
                isBuyNow: true,
                subtotal,
                shippingCost,
                discount,
                total
            });
        } catch (error) {
            console.error('Error loading buy now page:', error);
            res.status(500).render('error', { error: 'Failed to load buy now page' });
        }
    });

// Buy Now - Finalize Payment
router.route('/buyNow/finalize')
    .get(isLoggedIn, async(req, res) => {
        try {
            const { productId, size, color, quantity } = req.query;
            
            if (!productId || !size || !color || !quantity) {
                return res.redirect('/shop');
            }

            // Get product details
            const product = await Product.findById(productId);
            if (!product) {
                return res.redirect('/shop');
            }

            // Create a single item cart-like structure for the product
            const buyNowItem = {
                product: product,
                quantity: parseInt(quantity),
                size: size,
                color: color,
                price: product.salePrice || product.price,
                totalPrice: (product.salePrice || product.price) * parseInt(quantity)
            };

            // Calculate totals
            const subtotal = buyNowItem.totalPrice;
            const shippingCost = 0; // Free shipping
            const discount = 0; // No discount for now
            const total = subtotal + shippingCost - discount;

            // Get user's addresses
            const user = await req.user.populate('addresses');
            const addresses = user.addresses || [];

            res.render('page/finalizePayment', { 
                buyNowItem,
                isBuyNow: true,
                addresses,
                subtotal,
                shippingCost,
                discount,
                total
            });
        } catch (error) {
            console.error('Error loading buy now finalize page:', error);
            res.status(500).render('error', { error: 'Failed to load buy now finalize page' });
        }
    });

// Create Buy Now Order
router.post('/create-buyNow-order', isLoggedIn, async (req, res) => {
    try {
        const { paymentMethod, shippingAddress, productId, size, color, quantity } = req.body;

        // Validate required fields
        if (!productId || !size || !color || !quantity) {
            return res.status(400).json({ error: 'Missing required product information' });
        }

        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Create order item
        const orderItem = {
            product: product._id,
            seller: product.seller,
            quantity: parseInt(quantity),
            size: size,
            color: color,
            price: product.salePrice || product.price,
            totalPrice: (product.salePrice || product.price) * parseInt(quantity)
        };

        // Calculate totals
        const subtotal = orderItem.totalPrice;
        const shippingCost = 0; // Free shipping
        const discount = 0; // No discount for now
        const total = subtotal + shippingCost - discount;

        // Create order
        const order = new Order({
            user: req.user._id,
            items: [orderItem],
            shippingAddress,
            paymentMethod,
            subtotal,
            shippingCost,
            discount,
            total
        });

        await order.save();

        res.json({
            success: true,
            order: order,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Error creating buy now order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Create order
router.post('/create-order', isLoggedIn, async (req, res) => {
    try {
        const { paymentMethod, shippingAddress } = req.body;

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Create order items from cart
        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            seller: item.product.seller,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: item.product.salePrice || item.product.price,
            totalPrice: (item.product.salePrice || item.product.price) * item.quantity
        }));

        // Calculate totals
        const subtotal = cart.total;
        const shippingCost = 0; // Free shipping
        const discount = 0; // No discount for now
        const total = subtotal + shippingCost - discount;

        // Create order
        const order = new Order({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            shippingCost,
            discount,
            total
        });

        await order.save();

        // Clear the cart
        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            order: order,
            message: 'Order created successfully'
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Order confirmation page
router.get('/orders/:orderId', isLoggedIn, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user')
            .populate('items.product');
        
        if (!order) {
            return res.status(404).render('error', { error: 'Order not found' });
        }
        
        // Check if the order belongs to the current user
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', { error: 'Access denied' });
        }
        
        res.render('page/orderConfirmation', { order });
    } catch (error) {
        console.error('Error loading order:', error);
        res.status(500).render('error', { error: 'Failed to load order' });
    }
});

module.exports = router;