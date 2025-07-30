const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const Seller = require('../models/Seller');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const { isLoggedIn, isSeller } = require('../middlewares/authMiddleware');
const mongoose = require('mongoose');
const User = require('../models/user');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');
const sellerController = require('../controllers/sellerController');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Remove Multer config and /images/upload route for product images

// Main Seller Dashboard
router.get('/', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    // Find the seller for the logged-in user
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

        // Get all products for this seller
        const products = await Product.find({ seller: seller._id });
        const productIds = products.map(p => p._id);

        // Get all orders that include any of the seller's products
        const orders = await Order.find({ 'items.seller': seller._id })
            .populate('items.product')
            .populate('user')
            .sort({ createdAt: -1 })
            .limit(10);

        // Calculate comprehensive stats
        const ordersByStatus = await Order.aggregate([
            { $match: { 'items.seller': seller._id } },
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        // Calculate earnings and other metrics
        let totalEarnings = 0;
        let pendingOrders = [];
        let completedOrders = [];
        let productSales = {};
        let chartData = {};

        orders.forEach(order => {
            let sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
            let orderTotalForSeller = sellerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            
            if (order.orderStatus === 'pending' || order.orderStatus === 'processing') {
                pendingOrders.push({ ...order, sellerItems });
            }
            if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') {
                completedOrders.push({ ...order, sellerItems });
                totalEarnings += orderTotalForSeller;
            }
            
            // Count sales per product
            sellerItems.forEach(item => {
                if (item.product && item.product._id) {
                    const productId = String(item.product._id);
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            id: productId,
                            name: item.product.name,
                            sales: 0,
                            revenue: 0
                        };
                    }
                    productSales[productId].sales += item.quantity;
                    productSales[productId].revenue += item.totalPrice || 0;
                }
            });
            
            // Chart data: group by day
            const day = new Date(order.createdAt).toISOString().slice(0, 10);
            chartData[day] = (chartData[day] || 0) + orderTotalForSeller;
        });

        // Top product by sales
        let topProduct = null;
        let topProductSales = 0;
        if (Object.keys(productSales).length > 0) {
            const topProductId = Object.keys(productSales).sort((a, b) => 
                productSales[b].sales - productSales[a].sales
            )[0];
            const topProductData = productSales[topProductId];
            topProduct = products.find(p => String(p._id) === topProductId);
            topProductSales = topProductData ? topProductData.sales : 0;
        }

        // Inventory stats
        let lowStock = products.filter(p => p.inStock && p.stock <= 3 && p.stock > 0);
        let outOfStock = products.filter(p => !p.inStock || p.stock === 0);
        let inStock = products.filter(p => p.inStock && p.stock > 0).length;

        // Chart data for different time periods
        const generateChartData = (days) => {
            const labels = [];
            const values = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                const formattedDate = d.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                });
                labels.push(formattedDate);
                values.push(chartData[key] || 0);
            }
            return { labels, values };
        };

        const chartData7Days = generateChartData(7);
        const chartData30Days = generateChartData(30);
        const chartData90Days = generateChartData(90);

        // Get unread messages count
        const unreadMessagesCount = await Message.countDocuments({
            recipient: seller._id,
            recipientModel: 'Seller',
            isRead: false
        });

        // Enhanced stats object with all required fields
        const stats = {
            totalOrders: ordersByStatus.reduce((sum, s) => sum + s.count, 0),
            pendingOrders: ordersByStatus.find(s => s._id === 'pending')?.count || 0,
            processingOrders: ordersByStatus.find(s => s._id === 'processing')?.count || 0,
            deliveredOrders: ordersByStatus.find(s => s._id === 'delivered')?.count || 0,
            totalEarnings: totalEarnings,
            totalProducts: products.length,
            inStock: inStock,
            lowStock: lowStock.length,
            outOfStock: outOfStock.length,
            unreadMessages: unreadMessagesCount
        };

        // Ensure orders have proper structure for frontend
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
            total: order.items
                .filter(item => String(item.seller) === String(seller._id))
                .reduce((sum, item) => sum + (item.totalPrice || 0), 0),
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
            user: order.user,
            items: order.items.filter(item => String(item.seller) === String(seller._id))
        }));

        // Fetch the full user document for sidebar toggle logic
        const user = await User.findById(req.user._id);
        res.render('page/SellerDashboard/sellerDashboard', {
            title: 'Seller Dashboard - Velvra',
            user,
            seller,
            products,
            orders: formattedOrders,
            pendingOrders,
            completedOrders,
            stats,
            topProduct,
            topProductSales,
            lowStock,
            outOfStock,
            chartData7Days,
            chartData30Days,
            chartData90Days,
            currentPage: 'dashboard'
        });
}));

// Products Management
router.get('/products', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

    const products = await Product.find({ seller: seller._id })
        .sort({ createdAt: -1 });

    // Calculate cart counts for each product
    const Cart = require('../models/cart');
    const productsWithCartCounts = await Promise.all(products.map(async (product) => {
        const cartCount = await Cart.countDocuments({
            'items.product': product._id
        });
        
        // Update the product's cart count in the database
        await Product.findByIdAndUpdate(product._id, { cartCount });
        
        return {
            ...product.toObject(),
            cartCount
        };
    }));

    const stats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => {
            // Check if any variant has stock > 0
            return p.variants && p.variants.some(v => v.stock > 0 && v.active);
        }).length,
        lowStock: products.filter(p => {
            // Check if any variant has low stock (1-3)
            return p.variants && p.variants.some(v => v.stock > 0 && v.stock <= 3 && v.active);
        }).length,
        outOfStock: products.filter(p => {
            // Check if all variants are out of stock or inactive
            return !p.variants || p.variants.every(v => v.stock === 0 || !v.active);
        }).length
    };

    // Fetch the full user document for sidebar toggle logic
    const user = await User.findById(req.user._id);
    res.render('page/SellerDashboard/product', {
        title: 'Products - Velvra',
        user,
        seller,
        products: productsWithCartCounts,
        stats,
        currentPage: 'products'
    });
}));

// API: Get products with search and filtering
router.get('/api/products', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 404);
    }

    const { search, category, status, sortBy } = req.query;
    
    // Build query
    let query = { seller: seller._id };
    
    // Search functionality
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }
    
    // Category filter
    if (category) {
        query.category = category;
    }
    
    // Status filter (exclude draft)
    if (status && status !== 'draft') {
        if (status === 'active') {
            query['variants'] = { $elemMatch: { stock: { $gt: 0 }, active: true } };
        } else if (status === 'out-of-stock') {
            query.$or = [
                { variants: { $size: 0 } },
                { variants: { $not: { $elemMatch: { stock: { $gt: 0 }, active: true } } } }
            ];
        }
    }
    
    // Note: Sorting is now handled in JavaScript after fetching products
    // to properly calculate total stock and handle complex sorting logic
    
    let products = await Product.find(query);
    
    // Calculate cart counts and total stock
    const Cart = require('../models/cart');
    const productsWithCartCounts = await Promise.all(products.map(async (product) => {
        const cartCount = await Cart.countDocuments({
            'items.product': product._id
        });
        
        // Calculate total stock across all variants
        const totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
        
        // Update cart count in database
        await Product.findByIdAndUpdate(product._id, { cartCount });
        
        return {
            ...product.toObject(),
            cartCount,
            totalStock
        };
    }));
    
    // Apply custom sorting for stock-low
    if (sortBy === 'stock-low') {
        productsWithCartCounts.sort((a, b) => a.totalStock - b.totalStock);
    } else {
        // For other sorts, apply the database sort
        productsWithCartCounts.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'price-high':
                    const maxPriceA = Math.max(...a.variants.map(v => v.price || 0));
                    const maxPriceB = Math.max(...b.variants.map(v => v.price || 0));
                    return maxPriceB - maxPriceA;
                case 'price-low':
                    const minPriceA = Math.min(...a.variants.map(v => v.price || 0));
                    const minPriceB = Math.min(...b.variants.map(v => v.price || 0));
                    return minPriceA - minPriceB;
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }
    
    res.json({ success: true, products: productsWithCartCounts });
}));

// API: Get single product for editing
router.get('/api/products/:id', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 404);
    }
    
    const product = await Product.findOne({ _id: req.params.id, seller: seller._id });
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    
    res.json({ success: true, product });
}));

// API: Update product
router.put('/api/products/:id', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 404);
    }
    
    const product = await Product.findOne({ _id: req.params.id, seller: seller._id });
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    
    const { name, description, images, variants, highlights, moreDetails, variantSalePrices } = req.body;
    
    // Update product
    const updateData = {
        name,
        description,
        images,
        variants,
        highlights,
        moreDetails
    };
    
    // Update individual variant sale prices
    if (variantSalePrices && typeof variantSalePrices === 'object') {
        const product = await Product.findById(req.params.id);
        if (product && product.variants && product.variants.length > 0) {
            const updatedVariants = product.variants.map((variant, index) => ({
                ...variant.toObject(),
                salePrice: variantSalePrices[index] !== undefined ? variantSalePrices[index] : variant.salePrice
            }));
            updateData.variants = updatedVariants;
        }
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );
    
    res.json({ success: true, product: updatedProduct });
}));

// API: Delete product
router.delete('/api/products/:id', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 404);
    }
    
    const product = await Product.findOne({ _id: req.params.id, seller: seller._id });
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Product deleted successfully' });
}));

// API: Increment view count
router.post('/api/products/:id/view', asyncWrap(async (req, res) => {
    await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ success: true });
}));

// Orders Management
router.get('/orders', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

        // Get all orders that include seller's products
        const orders = await Order.find({ 'items.seller': seller._id })
            .populate('items.product')
            .populate('user')
            .sort({ createdAt: -1 });

        // Calculate comprehensive order statistics
        const orderStats = await Order.aggregate([
            { $match: { 'items.seller': seller._id } },
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        // Format orders for frontend
        const formattedOrders = orders.map(order => {
            // Filter items that belong to this seller
            const sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
            const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            
            return {
                _id: order._id,
                orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                customer: {
                    name: `${order.user.firstName} ${order.user.lastName}`,
                    email: order.user.email,
                    phone: order.user.phone || 'N/A',
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(order.user.firstName + ' ' + order.user.lastName)}&background=e8dcc6&color=1a1a1a`
                },
                items: sellerItems.map(item => ({
                    name: item.product ? item.product.name : 'Product Not Found',
                    quantity: item.quantity,
                    price: item.price,
                    totalPrice: item.totalPrice,
                    image: item.product && item.product.images && item.product.images.length > 0 
                        ? item.product.images[0] 
                        : 'https://via.placeholder.com/100x100?text=No+Image'
                })),
                total: sellerTotal,
                status: order.orderStatus,
                priority: order.priority || 'medium',
                paymentStatus: order.paymentStatus || 'paid',
                paymentMethod: order.paymentMethod || 'Credit Card',
                shippingAddress: order.shippingAddress || 'Address not available',
                orderDate: order.createdAt,
                deliveryDate: order.deliveryDate,
                trackingNumber: order.trackingNumber,
                notes: order.notes || null
            };
        });

        // Enhanced stats with all statuses
        const stats = {
            totalOrders: formattedOrders.length,
            pendingOrders: orderStats.find(s => s._id === 'pending')?.count || 0,
            processingOrders: orderStats.find(s => s._id === 'processing')?.count || 0,
            shippedOrders: orderStats.find(s => s._id === 'shipped')?.count || 0,
            deliveredOrders: orderStats.find(s => s._id === 'delivered')?.count || 0,
            cancelledOrders: orderStats.find(s => s._id === 'cancelled')?.count || 0,
            returnedOrders: orderStats.find(s => s._id === 'returned')?.count || 0
        };

        // Fetch the full user document for sidebar toggle logic
        const user = await User.findById(req.user._id);
        res.render('page/SellerDashboard/order', {
            title: 'Orders - Velvra',
            user,
            seller,
            orders: formattedOrders,
            stats,
            currentPage: 'orders'
        });
}));

// Inventory Management
router.get('/inventory', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

    const products = await Product.find({ seller: seller._id })
        .sort({ createdAt: -1 });

    // Calculate inventory statistics based on variants
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    const productsWithStats = products.map(product => {
        // Calculate total stock from variants
        const totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
        
        // Determine status based on total stock
        let status = 'in-stock';
        if (totalStock === 0) {
            status = 'out-of-stock';
            outOfStock++;
        } else if (totalStock <= 5) {
            status = 'low-stock';
            lowStock++;
        } else {
            inStock++;
        }

        // Calculate total value
        const productValue = totalStock * (product.variants[0]?.price || 0);
        totalValue += productValue;

        return {
            ...product.toObject(),
            totalStock,
            status,
            productValue
        };
    });

    const stats = {
        totalProducts: products.length,
        inStock,
        lowStock,
        outOfStock,
        totalValue: Math.round(totalValue)
    };

    // Fetch the full user document for sidebar toggle logic
    const user = await User.findById(req.user._id);
    res.render('page/SellerDashboard/sellerInventory', {
        title: 'Inventory - Velvra',
        user,
        seller,
        products: productsWithStats,
        stats,
        currentPage: 'inventory'
    });
}));

// Promotions Management
router.get('/promotions', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

    // Get products for promotion creation
    const products = await Product.find({ seller: seller._id }).select('name brand images category');

    // Fetch the full user document for sidebar toggle logic
    const user = await User.findById(req.user._id);
    res.render('page/SellerDashboard/promotions', {
        title: 'Promotions - Velvra',
        user,
        seller,
        products,
        currentPage: 'promotions'
    });
}));

// Performance Analytics
router.get('/performance', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

    // Fetch the full user document for sidebar toggle logic
    const user = await User.findById(req.user._id);
    res.render('page/SellerDashboard/sellerPerformance', {
        title: 'Performance - Velvra',
        user,
        seller,
        currentPage: 'performance'
    });
}));

// Analytics API endpoints
const analyticsController = require('../controllers/analyticsController');

// Track user interaction
router.post('/analytics/track', analyticsController.trackInteraction);

// Get seller analytics data
router.get('/analytics/data', isLoggedIn, isSeller, analyticsController.getSellerAnalytics);

// Test endpoint for development (remove in production)
router.get('/analytics/test-data', analyticsController.getTestAnalytics);

// Export analytics data
router.get('/analytics/export', isLoggedIn, isSeller, analyticsController.exportAnalytics);

// Messages (Inbox)
router.get('/messages', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 404);
    }

    // Find all conversations where seller is a participant
    const conversations = await Conversation.find({
        'participants.id': seller._id,
        'participants.model': 'Seller'
    }).populate('order').sort({ updatedAt: -1 });

    // Get comprehensive data for each conversation
    const conversationsWithDetails = [];
    for (const conversation of conversations) {
        // Get the other participant (user)
        const userParticipant = conversation.participants.find(p => p.model === 'User');
        if (!userParticipant) continue;
        
        const user = await mongoose.model('User').findById(userParticipant.id);
        if (!user) continue;
        
        // Get messages for this conversation
        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .limit(1);
        
        // Get unread count for this conversation
        const unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            recipient: seller._id,
            recipientModel: 'Seller',
            isRead: false
        });

        conversationsWithDetails.push({
            _id: conversation._id,
            user: user,
            lastMessage: conversation.lastMessage,
            updatedAt: conversation.updatedAt,
            unreadCount: unreadCount,
            order: conversation.order,
            latestMessage: messages[0] || null
        });
    }

    // Fetch the full user document for sidebar toggle logic
    const user = await User.findById(req.user._id);
    res.render('page/SellerDashboard/sellerMessages', {
        title: 'Messages - Velvra',
        user,
        seller,
        conversations: conversationsWithDetails,
        currentConversationId: null,
        currentPage: 'messages'
    });
}));

// Settings
router.get('/settings', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 404);
    }

    // Fetch the full user document for sidebar toggle logic
    const user = await User.findById(req.user._id);
    res.render('page/SellerDashboard/sellerSetting', {
        title: 'Settings - Velvra',
        user,
        seller,
        currentPage: 'settings'
    });
}));

// Toggle user mode (buyer/seller)
// (Removed, now handled globally in app.js)

// API endpoint to get order details
router.get('/api/orders/:orderId', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 403);
    }

    const order = await Order.findById(req.params.orderId)
        .populate('items.product')
        .populate('user');

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Verify order contains seller's products
    const hasSellerItems = order.items.some(item => String(item.seller) === String(seller._id));
    if (!hasSellerItems) {
        throw new AppError('Access denied', 403);
    }

    // Filter items that belong to this seller
    const sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
    const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    const formattedOrder = {
        _id: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
        customer: {
            name: `${order.user.firstName} ${order.user.lastName}`,
            email: order.user.email,
            phone: order.user.phone || 'N/A',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(order.user.firstName + ' ' + order.user.lastName)}&background=e8dcc6&color=1a1a1a`
        },
        items: sellerItems.map(item => ({
            name: item.product ? item.product.name : 'Product Not Found',
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
            image: item.product && item.product.images && item.product.images.length > 0 
                ? item.product.images[0] 
                : 'https://via.placeholder.com/100x100?text=No+Image'
        })),
        total: sellerTotal,
        status: order.orderStatus,
        priority: order.priority || 'medium',
        paymentStatus: order.paymentStatus || 'paid',
        paymentMethod: order.paymentMethod || 'Credit Card',
        shippingAddress: order.shippingAddress || 'Address not available',
        orderDate: order.createdAt,
        deliveryDate: order.deliveryDate,
        trackingNumber: order.trackingNumber,
        notes: order.notes || null
    };

    res.json({
        success: true,
        order: formattedOrder
    });
}));

// API endpoint to update order status
router.post('/api/orders/:orderId/status', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 403);
    }

    const { status } = req.body;
    const orderId = req.params.orderId;

    if (!status) {
        throw new AppError('Status is required', 400);
    }

    // Verify order exists and contains seller's products
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    const hasSellerItems = order.items.some(item => String(item.seller) === String(seller._id));
    if (!hasSellerItems) {
        throw new AppError('Access denied', 403);
    }

    // Update order status
    order.orderStatus = status;
    order.updatedAt = new Date();
    await order.save();

    res.json({
        success: true,
        message: 'Order status updated successfully',
        order: {
            _id: order._id,
            orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
            status: order.orderStatus
        }
    });
}));

// API endpoint to update shipping information
router.post('/api/orders/:orderId/shipping', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 403);
    }

        const { trackingNumber, deliveryDate } = req.body;
        const orderId = req.params.orderId;

        // Verify order exists and contains seller's products
        const order = await Order.findById(orderId);
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        const hasSellerItems = order.items.some(item => String(item.seller) === String(seller._id));
        if (!hasSellerItems) {
            throw new AppError('Access denied', 403);
        }

        // Update shipping information
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (deliveryDate) order.deliveryDate = deliveryDate;
        order.updatedAt = new Date();
        await order.save();

        res.json({
            success: true,
            message: 'Shipping information updated successfully',
            order: {
                _id: order._id,
                orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                trackingNumber: order.trackingNumber,
                deliveryDate: order.deliveryDate
            }
        });
}));

// API endpoint to cancel order
router.post('/api/orders/:orderId/cancel', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 403);
    }

    const { reason } = req.body;
    const orderId = req.params.orderId;

    // Verify order exists and contains seller's products
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    const hasSellerItems = order.items.some(item => String(item.seller) === String(seller._id));
    if (!hasSellerItems) {
        throw new AppError('Access denied', 403);
    }

    // Only allow cancellation of pending or processing orders
    if (!['pending', 'processing'].includes(order.orderStatus)) {
        throw new AppError('Order cannot be cancelled in current status', 400);
    }

    // Update order status to cancelled
    order.orderStatus = 'cancelled';
    order.cancellationReason = reason;
    order.updatedAt = new Date();

    // Restore inventory for cancelled items
    for (const item of order.items) {
        const productDoc = await Product.findById(item.product);
        if (productDoc) {
            const colorObj = productDoc.colors.find(c => c.name === item.color);
            if (colorObj) {
                // Find the variant and update its stock
                const variant = productDoc.variants.find(v => v.color === item.color && v.size === item.size);
                if (variant) {
                    variant.stock = variant.stock + item.quantity;
                }
            }
            await productDoc.save();
        }
    }

    await order.save();

    res.json({
        success: true,
        message: 'Order cancelled successfully',
        order: {
            _id: order._id,
            orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
            status: order.orderStatus
        }
    });
}));

// API endpoint to get filtered orders
router.get('/api/orders', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 403);
    }

        const { status, dateFilter, search, sortBy } = req.query;

        // Build query
        let query = { 'items.seller': seller._id };
        
        if (status && status !== '') {
            query.orderStatus = status;
        }

        if (dateFilter && dateFilter !== '') {
            const now = new Date();
            switch (dateFilter) {
                case 'today':
                    query.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
                    break;
                case 'week':
                    const weekAgo = new Date(now.setDate(now.getDate() - 7));
                    query.createdAt = { $gte: weekAgo };
                    break;
                case 'month':
                    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                    query.createdAt = { $gte: monthAgo };
                    break;
                case 'quarter':
                    const quarterAgo = new Date(now.setMonth(now.getMonth() - 3));
                    query.createdAt = { $gte: quarterAgo };
                    break;
            }
        }

        // Build sort
        let sort = { createdAt: -1 };
        if (sortBy) {
            switch (sortBy) {
                case 'oldest':
                    sort = { createdAt: 1 };
                    break;
                case 'amount-high':
                    sort = { total: -1 };
                    break;
                case 'amount-low':
                    sort = { total: 1 };
                    break;
            }
        }

        const orders = await Order.find(query)
            .populate('items.product')
            .populate('user')
            .sort(sort);

        // Format orders
        const formattedOrders = orders.map(order => {
            const sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
            const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            
            return {
                _id: order._id,
                orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6).toUpperCase()}`,
                customer: {
                    name: `${order.user.firstName} ${order.user.lastName}`,
                    email: order.user.email,
                    phone: order.user.phone || 'N/A',
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(order.user.firstName + ' ' + order.user.lastName)}&background=e8dcc6&color=1a1a1a`
                },
                items: sellerItems.map(item => ({
                    name: item.product ? item.product.name : 'Product Not Found',
                    quantity: item.quantity,
                    price: item.price,
                    totalPrice: item.totalPrice,
                    image: item.product && item.product.images && item.product.images.length > 0 
                        ? item.product.images[0] 
                        : 'https://via.placeholder.com/100x100?text=No+Image'
                })),
                total: sellerTotal,
                status: order.orderStatus,
                priority: order.priority || 'medium',
                paymentStatus: order.paymentStatus || 'paid',
                paymentMethod: order.paymentMethod || 'Credit Card',
                shippingAddress: order.shippingAddress || 'Address not available',
                orderDate: order.createdAt,
                deliveryDate: order.deliveryDate,
                trackingNumber: order.trackingNumber,
                notes: order.notes || null
            };
        });

        // Apply search filter if provided
        let filteredOrders = formattedOrders;
        if (search && search.trim() !== '') {
            const searchTerm = search.toLowerCase();
            filteredOrders = formattedOrders.filter(order => 
                order.orderNumber.toLowerCase().includes(searchTerm) ||
                order.customer.name.toLowerCase().includes(searchTerm) ||
                order.customer.email.toLowerCase().includes(searchTerm)
            );
        }

        res.json({
            success: true,
            orders: filteredOrders,
            total: filteredOrders.length
        });
}));

// API endpoint to fetch chart data for different time periods
router.get('/api/chart-data/:period', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        throw new AppError('Seller not found', 403);
    }

        const { period } = req.params;
        const days = parseInt(period) || 7;

        // Get orders for the specified period
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const orders = await Order.find({
            'items.seller': seller._id,
            createdAt: { $gte: startDate }
        }).populate('items.product');

        // Group data by day
        const chartData = {};
        orders.forEach(order => {
            let sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
            let orderTotalForSeller = sellerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            
            const day = new Date(order.createdAt).toISOString().slice(0, 10);
            chartData[day] = (chartData[day] || 0) + orderTotalForSeller;
        });

        // Generate chart data
        const labels = [];
        const values = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const formattedDate = d.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            labels.push(formattedDate);
            values.push(chartData[key] || 0);
        }

        res.json({
            success: true,
            data: {
                labels,
                values,
                period: days
            }
        });
}));

// --- SELLER MESSAGING API ENDPOINTS ---

// Get all conversations for the seller (JSON)
router.get('/api/messages', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) throw new AppError('Seller not found', 403);

        // Find all conversations where seller is a participant
        const conversations = await Conversation.find({
            'participants.id': seller._id,
            'participants.model': 'Seller'
        }).populate('order').sort({ updatedAt: -1 });

        // Get comprehensive data for each conversation
        const conversationsWithDetails = [];
        for (const conversation of conversations) {
            // Get the other participant (user)
            const userParticipant = conversation.participants.find(p => p.model === 'User');
            if (!userParticipant) continue;
            const user = await mongoose.model('User').findById(userParticipant.id);
            if (!user) continue;
            // Get latest message
            const messages = await Message.find({ conversationId: conversation._id })
                .sort({ createdAt: -1 })
                .limit(1);
            // Get unread count for this conversation
            const unreadCount = await Message.countDocuments({
                conversationId: conversation._id,
                recipient: seller._id,
                recipientModel: 'Seller',
                isRead: false
            });
            conversationsWithDetails.push({
                _id: conversation._id,
                user: user,
                lastMessage: conversation.lastMessage,
                updatedAt: conversation.updatedAt,
                unreadCount: unreadCount,
                order: conversation.order,
                latestMessage: messages[0] || null
            });
        }
        res.json({ success: true, conversations: conversationsWithDetails });
}));

// Get all messages for a conversation (JSON)
router.get('/api/messages/:conversationId/messages', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) throw new AppError('Seller not found', 403);
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);
    // Check seller is a participant
    const isParticipant = conversation.participants.some(p => p.id.equals(seller._id) && p.model === 'Seller');
    if (!isParticipant) throw new AppError('Access denied', 403);
    // Get messages
    const messages = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 });
    // Ensure sender is always a string (ObjectId)
    const messagesWithSenderId = messages.map(msg => ({
        ...msg.toObject(),
        sender: msg.sender.toString(),
        senderId: msg.sender.toString(),
    }));
    res.json({ success: true, messages: messagesWithSenderId });
}));

// Send a message as the seller
router.post('/api/messages/:conversationId/send', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const { content } = req.body;
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) throw new AppError('Seller not found', 403);
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);
    // Check seller is a participant
    const isParticipant = conversation.participants.some(p => p.id.equals(seller._id) && p.model === 'Seller');
    if (!isParticipant) throw new AppError('Access denied', 403);
    // Get the user participant
    const userParticipant = conversation.participants.find(p => p.model === 'User');
    if (!userParticipant) throw new AppError('User participant not found', 400);
    // Create the message
    const message = await Message.create({
        conversationId: conversation._id,
        sender: seller._id,
        senderModel: 'Seller',
        recipient: userParticipant.id,
        recipientModel: 'User',
        order: conversation.order,
        content: content.trim()
    });
    // Update conversation's last message
    conversation.lastMessage = content.trim();
    conversation.updatedAt = new Date();
    await conversation.save();
    // Populate sender details for response
    await message.populate('sender', 'brandName');
    res.json({ success: true, message });
}));

// Mark all messages as read for the seller
router.post('/api/messages/:conversationId/read', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) throw new AppError('Seller not found', 403);
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) throw new AppError('Conversation not found', 404);
    // Check seller is a participant
    const isParticipant = conversation.participants.some(p => p.id.equals(seller._id) && p.model === 'Seller');
    if (!isParticipant) throw new AppError('Access denied', 403);
    // Mark all unread messages as read
    await Message.updateMany({
        conversationId: conversation._id,
        recipient: seller._id,
        recipientModel: 'Seller',
        isRead: false
    }, { isRead: true });
    res.json({ success: true });
}));

// Get seller profile data
router.get('/profile', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) throw new AppError('Seller not found', 403);
    res.json({ success: true, sellerId: seller._id.toString() });
}));

// API Routes for Inventory Management

// Get product details for stock update modal
router.get('/api/inventory/product/:productId', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) throw new AppError('Seller not found', 403);
    
    const product = await Product.findOne({ 
        _id: req.params.productId, 
        seller: seller._id 
    });
    
    if (!product) throw new AppError('Product not found', 404);
    
    res.json({ success: true, product });
}));

// Update product stock
router.put('/api/inventory/product/:productId/stock', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) throw new AppError('Seller not found', 403);
    
    const { variants, lowStockThreshold } = req.body;
    
    const product = await Product.findOne({ 
        _id: req.params.productId, 
        seller: seller._id 
    });
    
    if (!product) throw new AppError('Product not found', 404);
    
    // Update variants with new stock values
    if (variants && Array.isArray(variants)) {
        product.variants = variants;
    }
    
    // Update low stock threshold if provided
    if (lowStockThreshold !== undefined) {
        product.lowStockThreshold = lowStockThreshold;
    }
    
    await product.save();
    
    // Calculate updated stats
    const totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    let status = 'in-stock';
    if (totalStock === 0) {
        status = 'out-of-stock';
    } else if (totalStock <= 5) {
        status = 'low-stock';
    }
    
    res.json({ 
        success: true, 
        message: 'Stock updated successfully',
        product: {
            ...product.toObject(),
            totalStock,
            status
        }
    });
}));

// Get filtered inventory data
router.get('/api/inventory/filter', isLoggedIn, isSeller, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) throw new AppError('Seller not found', 403);
    
    const { search, category, stockStatus } = req.query;
    
    let query = { seller: seller._id };
    
    // Apply search filter
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { brand: { $regex: search, $options: 'i' } }
        ];
    }
    
    // Apply category filter
    if (category && category !== '') {
        query.category = category;
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    
    // Apply stock status filter and calculate stats
    const productsWithStats = products.map(product => {
        const totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
        let status = 'in-stock';
        if (totalStock === 0) {
            status = 'out-of-stock';
        } else if (totalStock <= 5) {
            status = 'low-stock';
        }
        
        // Calculate product value
        const productValue = totalStock * (product.variants[0]?.price || 0);
        
        return {
            ...product.toObject(),
            totalStock,
            status,
            productValue
        };
    }).filter(product => {
        if (stockStatus && stockStatus !== '') {
            return product.status === stockStatus;
        }
        return true;
    });
    
    res.json({ success: true, products: productsWithStats });
}));

router.get('/add_product', isLoggedIn, isSeller, sellerController.renderAddProduct);

module.exports = router;
