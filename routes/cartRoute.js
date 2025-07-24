const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Product = require('../models/product');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const User = require('../models/user');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

const autoSwitchToBuyer = async (req, res, next) => {
    if (req.user && req.user.isSeller && req.user.activeMode !== 'buyer') {
        const userDoc = await User.findById(req.user._id);
        userDoc.activeMode = 'buyer';
        await userDoc.save();
        req.user.activeMode = 'buyer';
        req.flash('info', 'Switched to buyer mode for shopping.');
        return res.redirect(req.originalUrl);
    }
    next();
};

// Get cart count
router.get('/count', isLoggedIn, asyncWrap(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    const count = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    res.json({ count });
}));

// Get cart
router.get('/', isLoggedIn, autoSwitchToBuyer, asyncWrap(async (req, res, next) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
    } else {
        // Filter out items with null products (deleted products)
        const validItems = cart.items.filter(item => item.product !== null);
        
        // If there are invalid items, update the cart
        if (validItems.length !== cart.items.length) {
            cart.items = validItems;
            await cart.save();
        }
    }

    res.render('page/cartPage', { cart });
}));

// Toggle cart item
router.post('/toggle', isLoggedIn, asyncWrap(async (req, res) => {
    const { productId, size, color, quantity } = req.body;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    
    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
    }
    
    // Check if item exists in cart
    const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
    );
    
    if (existingItemIndex > -1) {
        // Remove item if it exists
        cart.items.splice(existingItemIndex, 1);
        await cart.save();
        
        // Populate product details for response
        await cart.populate('items.product');
        
        // Ensure total is calculated correctly
        const calculatedTotal = await cart.calculateTotal();
        
        res.json({
            success: true,
            action: 'removed',
            cart,
            cartCount: cart.items.reduce((total, item) => total + item.quantity, 0),
            total: calculatedTotal
        });
    } else {
        // Add new item
        const colorObj = product.colors.find(c => c.name === color);
        if (!colorObj) {
            throw new AppError('Color not available', 400);
        }
        
        const sizeObj = colorObj.sizes.find(s => s.size === size);
        if (!sizeObj) {
            throw new AppError('Size not available for this color', 400);
        }
        
        if (sizeObj.stock < quantity) {
            throw new AppError('Not enough stock for this variant', 400);
        }
        
        cart.items.push({ product: productId, size, color, quantity });
        await cart.save();
        
        // Populate product details for response
        await cart.populate('items.product');
        
        // Ensure total is calculated correctly
        const calculatedTotal = await cart.calculateTotal();
        
        res.json({
            success: true,
            action: 'added',
            cart,
            cartCount: cart.items.reduce((total, item) => total + item.quantity, 0),
            total: calculatedTotal
        });
    }
}));

// Update cart item quantity
router.put('/update', isLoggedIn, asyncWrap(async (req, res) => {
    const { cartItemId, change } = req.body;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }
    
    const item = cart.items.id(cartItemId);
    if (!item) {
        throw new AppError('Item not found in cart', 404);
    }
    
    // Update quantity
    item.quantity = Math.max(1, item.quantity + change);
    await cart.save();
    
    // Calculate new total
    const total = await cart.calculateTotal();
    
    // Populate product details for response
    await cart.populate('items.product');
    
    res.json({
        success: true,
        cart,
        total
    });
}));

// Update cart item color
router.put('/update-color', isLoggedIn, asyncWrap(async (req, res) => {
    const { cartItemId, color } = req.body;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }
    
    // Find the item
    const item = cart.items.id(cartItemId);
    if (!item) {
        throw new AppError('Item not found in cart', 404);
    }
    
    // Update color
    item.color = color;
    
    // Save cart to trigger pre-save hook for total calculation
    await cart.save();
    
    // Populate product details for response
    await cart.populate('items.product');
    
    // Ensure total is calculated correctly
    const calculatedTotal = await cart.calculateTotal();
    
    res.json({
        success: true,
        cart,
        total: calculatedTotal
    });
}));

// Remove item from cart
router.post('/remove', isLoggedIn, asyncWrap(async (req, res) => {
    const { cartItemId } = req.body;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }
    
    // Remove the item
    cart.items = cart.items.filter(item => item._id.toString() !== cartItemId);
    
    // Save cart to trigger pre-save hook for total calculation
    await cart.save();
    
    // Populate product details for response
    await cart.populate('items.product');
    
    // Ensure total is calculated correctly
    const calculatedTotal = await cart.calculateTotal();
    
    res.json({
        success: true,
        cart,
        total: calculatedTotal
    });
}));

// Clear cart
router.delete('/clear', isLoggedIn, asyncWrap(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        throw new AppError('Cart not found', 404);
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({ success: true, cart, total: 0 });
}));

// Add autoSwitchToBuyer to /checkout route
router.get('/checkout', isLoggedIn, autoSwitchToBuyer, asyncWrap(async (req, res, next) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.render('page/checkoutPage', { cart });
}));

module.exports = router; 