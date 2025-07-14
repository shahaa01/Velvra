const express = require('express');
const router = express.Router();
const Cart = require('../models/cart');
const Product = require('../models/product');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const User = require('../models/user');
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
router.get('/count', isLoggedIn, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        const count = cart ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
        res.json({ count });
    } catch (error) {
        console.error('Error fetching cart count:', error);
        res.status(500).json({ error: 'Failed to fetch cart count' });
    }
});

// Get cart
router.get('/cart', isLoggedIn, autoSwitchToBuyer, async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        res.render('page/cartPage', { cart });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Toggle cart item
router.post('/toggle', isLoggedIn, async (req, res) => {
    try {
        const { productId, size, color, quantity } = req.body;
        
        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
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
            if (!colorObj) return res.status(400).json({ error: 'Color not available' });
            const sizeObj = colorObj.sizes.find(s => s.size === size);
            if (!sizeObj) return res.status(400).json({ error: 'Size not available for this color' });
            if (sizeObj.stock < quantity) return res.status(400).json({ error: 'Not enough stock for this variant' });
            
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
    } catch (error) {
        console.error('Error toggling cart item:', error);
        res.status(500).json({ error: 'Failed to toggle cart item' });
    }
});

// Update cart item quantity
router.put('/update', isLoggedIn, async (req, res) => {
    try {
        const { cartItemId, change } = req.body;
        
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        
        const item = cart.items.id(cartItemId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found in cart' });
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
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Update cart item color
router.put('/update-color', isLoggedIn, async (req, res) => {
    try {
        const { cartItemId, color } = req.body;
        
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        
        // Find the item
        const item = cart.items.id(cartItemId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found in cart' });
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
    } catch (error) {
        console.error('Error updating color:', error);
        res.status(500).json({ error: 'Failed to update color' });
    }
});

// Remove item from cart
router.post('/remove', isLoggedIn, async (req, res) => {
    try {
        const { cartItemId } = req.body;
        
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
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
    } catch (error) {
        console.error('Error removing item:', error);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// Clear cart
router.delete('/clear', isLoggedIn, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        
        cart.items = [];
        await cart.save();
        
        res.json({ success: true, cart, total: 0 });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// Add autoSwitchToBuyer to /checkout route
router.get('/checkout', isLoggedIn, autoSwitchToBuyer, async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        res.render('page/checkoutPage', { cart });
    } catch (error) {
        console.error('Error fetching checkout:', error);
        res.status(500).json({ error: 'Failed to fetch checkout' });
    }
});

module.exports = router; 