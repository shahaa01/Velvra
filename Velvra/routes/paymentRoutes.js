const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Order = require('../models/order');
const Product = require('../models/product');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

router.route('/paymentSummary')
    .get(isLoggedIn, asyncWrap(async(req, res) => {
        // Get user's cart with populated product details
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        
        if (!cart) {
            throw new AppError('Cart not found', 404);
        }

        console.log('Rendering paymentSummary with hideFooter:', true);
        res.render('page/paymentSummary', {
            cart,
            hideFooter: true
        });
    }));

router.route('/finalizePayment')
    .get(isLoggedIn, asyncWrap(async(req, res) => {
        // Get user's cart with populated product details
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        
        if (!cart) {
            throw new AppError('Cart not found', 404);
        }

        // Get user's addresses
        const user = await req.user.populate('addresses');
        const addresses = user.addresses || [];

        res.render('page/finalizePayment', { cart, addresses, hideFooter: true });
    }));

// Buy Now - Single Product Checkout
router.route('/buyNow')
    .get(isLoggedIn, asyncWrap(async(req, res) => {
        const { productId, size, color, quantity } = req.query;
        
        if (!productId || !size || !color || !quantity) {
            throw new AppError('Missing required product information', 400);
        }

        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            throw new AppError('Product not found', 404);
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
    }));

// Buy Now - Finalize Payment
router.route('/buyNow/finalize')
    .get(isLoggedIn, asyncWrap(async(req, res) => {
        const { productId, size, color, quantity } = req.query;
        
        if (!productId || !size || !color || !quantity) {
            throw new AppError('Missing required product information', 400);
        }

        // Get product details
        const product = await Product.findById(productId);
        if (!product) {
            throw new AppError('Product not found', 404);
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
    }));

// Create Buy Now Order
router.post('/create-buyNow-order', isLoggedIn, asyncWrap(async (req, res) => {
    const { paymentMethod, shippingAddress, productId, size, color, quantity } = req.body;

    // Validate required fields
    if (!productId || !size || !color || !quantity) {
        throw new AppError('Missing required product information', 400);
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
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

    // Decrement product stock for buy now
    const productDoc = await Product.findById(productId);
    if (productDoc) {
        const colorObj = productDoc.colors.find(c => c.name === color);
        if (colorObj) {
            const sizeObj = colorObj.sizes.find(s => s.size === size);
            if (sizeObj) {
                sizeObj.stock = Math.max(0, sizeObj.stock - parseInt(quantity));
            }
        }
        await productDoc.save();
    }

    // Auto-switch seller to buyer mode
    if (req.user.isSeller && req.user.activeMode === 'seller') {
        const User = require('../models/user');
        const userDoc = await User.findById(req.user._id);
        userDoc.activeMode = 'buyer';
        await userDoc.save();
        req.user.activeMode = 'buyer';
        req.flash('info', 'Switched to buyer mode to complete this action.');
    }

    res.json({
        success: true,
        order: order,
        message: 'Order created successfully'
    });
}));

// Create order
router.post('/create-order', isLoggedIn, asyncWrap(async (req, res) => {
    const { paymentMethod, shippingAddress } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
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

    // Decrement product stock for each item in the order
    for (const item of orderItems) {
        const productDoc = await Product.findById(item.product);
        if (productDoc) {
            const colorObj = productDoc.colors.find(c => c.name === item.color);
            if (colorObj) {
                const sizeObj = colorObj.sizes.find(s => s.size === item.size);
                if (sizeObj) {
                    sizeObj.stock = Math.max(0, sizeObj.stock - item.quantity);
                }
            }
            await productDoc.save();
        }
    }

    // Clear the cart
    cart.items = [];
    await cart.save();

    // Auto-switch seller to buyer mode
    if (req.user.isSeller && req.user.activeMode === 'seller') {
        const User = require('../models/user');
        const userDoc = await User.findById(req.user._id);
        userDoc.activeMode = 'buyer';
        await userDoc.save();
        req.user.activeMode = 'buyer';
        req.flash('info', 'Switched to buyer mode to complete this action.');
    }

    res.json({
        success: true,
        order: order,
        message: 'Order created successfully'
    });
}));

// Order confirmation page
router.get('/orders/:orderId', isLoggedIn, asyncWrap(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
        .populate('user')
        .populate('items.product');
    
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    
    // Check if the order belongs to the current user
    if (order.user._id.toString() !== req.user._id.toString()) {
        throw new AppError('Access denied', 403);
    }
    
    res.render('page/orderConfirmation', { order });
}));

module.exports = router;