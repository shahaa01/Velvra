const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Product = require('../models/product');
const Seller = require('../models/Seller');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const mongoose = require('mongoose');
const User = require('../models/user');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Main Seller Dashboard
router.get('/', isLoggedIn, asyncWrap(async (req, res) => {
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
router.get('/products', isLoggedIn, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

    const products = await Product.find({ seller: seller._id })
        .sort({ createdAt: -1 });

    const stats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.inStock && p.stock > 0).length,
        lowStock: products.filter(p => p.inStock && p.stock <= 3 && p.stock > 0).length,
        outOfStock: products.filter(p => !p.inStock || p.stock === 0).length
    };

    // Fetch the full user document for sidebar toggle logic
    const user = await User.findById(req.user._id);
    res.render('page/SellerDashboard/product', {
        title: 'Products - Velvra',
        user,
        seller,
        products,
        stats,
        currentPage: 'products'
    });
}));

// Orders Management
router.get('/orders', isLoggedIn, asyncWrap(async (req, res) => {
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
router.get('/inventory', isLoggedIn, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

    const products = await Product.find({ seller: seller._id })
        .sort({ stock: 1, name: 1 });

    const stats = {
        totalProducts: products.length,
        inStock: products.filter(p => p.inStock && p.stock > 0).length,
        lowStock: products.filter(p => p.inStock && p.stock <= 3 && p.stock > 0).length,
        outOfStock: products.filter(p => !p.inStock || p.stock === 0).length
    };

    // Fetch the full user document for sidebar toggle logic
    const user = await User.findById(req.user._id);
    res.render('page/SellerDashboard/sellerInventory', {
        title: 'Inventory - Velvra',
        user,
        seller,
        products,
        stats,
        currentPage: 'inventory'
    });
}));

// Promotions Management
router.get('/promotions', isLoggedIn, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

    // Get products for promotion creation
    const products = await Product.find({ seller: seller._id, inStock: true, stock: { $gt: 0 } });

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
router.get('/performance', isLoggedIn, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
        return res.redirect('/seller');
    }

        // Get orders for analytics
        const orders = await Order.find({ 'items.seller': seller._id })
            .populate('items.product')
            .populate('user')
            .sort({ createdAt: -1 });

        // Calculate performance metrics
        let totalRevenue = 0;
        let totalOrders = orders.length;
        let completedOrders = 0;
        let productPerformance = {};

        orders.forEach(order => {
            let sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
            let orderTotalForSeller = sellerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            
            if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') {
                totalRevenue += orderTotalForSeller;
                completedOrders++;
            }
            
            sellerItems.forEach(item => {
                if (!productPerformance[item.product]) {
                    productPerformance[item.product] = {
                        name: item.product?.name || 'Unknown Product',
                        sales: 0,
                        revenue: 0
                    };
                }
                productPerformance[item.product].sales += item.quantity;
                productPerformance[item.product].revenue += item.totalPrice;
            });
        });

        const stats = {
            totalRevenue,
            totalOrders,
            completedOrders,
            completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0,
            averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
        };

        // Fetch the full user document for sidebar toggle logic
        const user = await User.findById(req.user._id);
        res.render('page/SellerDashboard/sellerPerformance', {
            title: 'Performance - Velvra',
            user,
            seller,
            orders,
            stats,
            productPerformance: Object.values(productPerformance),
            currentPage: 'performance'
        });
}));

// Messages (Inbox)
router.get('/messages', isLoggedIn, asyncWrap(async (req, res) => {
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
router.get('/settings', isLoggedIn, asyncWrap(async (req, res) => {
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
router.get('/api/orders/:orderId', isLoggedIn, asyncWrap(async (req, res) => {
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
router.post('/api/orders/:orderId/status', isLoggedIn, asyncWrap(async (req, res) => {
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
router.post('/api/orders/:orderId/shipping', isLoggedIn, asyncWrap(async (req, res) => {
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
router.post('/api/orders/:orderId/cancel', isLoggedIn, asyncWrap(async (req, res) => {
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
                const sizeObj = colorObj.sizes.find(s => s.size === item.size);
                if (sizeObj) {
                    sizeObj.stock = sizeObj.stock + item.quantity;
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
router.get('/api/orders', isLoggedIn, asyncWrap(async (req, res) => {
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
router.get('/api/chart-data/:period', isLoggedIn, asyncWrap(async (req, res) => {
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
router.get('/api/messages', isLoggedIn, asyncWrap(async (req, res) => {
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
router.get('/api/messages/:conversationId/messages', isLoggedIn, asyncWrap(async (req, res) => {
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
router.post('/api/messages/:conversationId/send', isLoggedIn, asyncWrap(async (req, res) => {
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
router.post('/api/messages/:conversationId/read', isLoggedIn, asyncWrap(async (req, res) => {
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
router.get('/profile', isLoggedIn, asyncWrap(async (req, res) => {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) throw new AppError('Seller not found', 403);
    res.json({ success: true, sellerId: seller._id.toString() });
}));

module.exports = router;
