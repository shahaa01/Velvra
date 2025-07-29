const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const Wishlist = require('../models/wishlist');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const mongoose = require('mongoose');
const User = require('../models/user');
const Notification = require('../models/notification');
const IssueReport = require('../models/issueReport');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Toggle user mode (buyer/seller)
// (Removed, now handled globally in app.js)

// Main Dashboard
router.get('/', isLoggedIn, asyncWrap(async (req, res) => {
    // Get recent orders with product details
    const orders = await Order.find({ user: req.user._id })
        .populate('items.product')
        .populate('items.seller')
        .sort({ createdAt: -1 })
        .limit(5);

    // Calculate comprehensive stats
    const ordersByStatus = await Order.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    // Get wishlist count
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const wishlistCount = wishlist ? wishlist.products.length : 0;

    // Get unread messages count
    const unreadMessagesCount = await Message.countDocuments({
        recipient: req.user._id,
        recipientModel: 'User',
        isRead: false
    });

    // Calculate order statistics
    const stats = {
        activeOrders: ordersByStatus.find(s => s._id === 'processing')?.count || 0,
        deliveredOrders: ordersByStatus.find(s => s._id === 'delivered')?.count || 0,
        totalOrders: ordersByStatus.reduce((sum, s) => sum + s.count, 0),
        wishlistCount: wishlistCount,
        unreadMessages: unreadMessagesCount
    };

    // Get order activity data for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    console.log('Six months ago date:', sixMonthsAgo);
    console.log('User ID:', req.user._id);
    
    const orderActivity = await Order.aggregate([
        { 
            $match: { 
                user: req.user._id,
                createdAt: { $gte: sixMonthsAgo }
            } 
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 },
                total: { $sum: '$total' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    console.log('Order activity data:', orderActivity);
    console.log('Order activity JSON:', JSON.stringify(orderActivity));

    // If no order activity data, create a fallback with current month
    let finalOrderActivity = orderActivity;
    if (orderActivity.length === 0) {
        const currentDate = new Date();
        finalOrderActivity = [{
            _id: {
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1
            },
            count: 0,
            total: 0
        }];
        console.log('Using fallback order activity data:', finalOrderActivity);
    }

    // Remove notification fetching here; now handled by middleware
    res.render('page/UserDashboard/userDashboard', {
        title: 'Dashboard - Velvra',
        user: req.user,
        orders,
        stats,
        orderActivity: finalOrderActivity
        // notifications and unreadNotificationCount are now in res.locals
    });
}));

// Orders List
router.get('/orders', isLoggedIn, asyncWrap(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .populate('items.product')
        .populate('items.seller')
        .sort({ createdAt: -1 });

    // Get stats for sidebar navigation
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const wishlistCount = wishlist ? wishlist.products.length : 0;

    const unreadMessagesCount = await Message.countDocuments({
        recipient: req.user._id,
        recipientModel: 'User',
        isRead: false
    });

    // Calculate order statistics for filtering
    const orderStats = await Order.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    const stats = {
        wishlistCount: wishlistCount,
        unreadMessages: unreadMessagesCount,
        totalOrders: orders.length,
        processingOrders: orderStats.find(s => s._id === 'processing')?.count || 0,
        shippedOrders: orderStats.find(s => s._id === 'shipped')?.count || 0,
        deliveredOrders: orderStats.find(s => s._id === 'delivered')?.count || 0,
        returnedOrders: orderStats.find(s => s._id === 'cancelled')?.count || 0
    };

    res.render('page/UserDashboard/userOrders', {
        title: 'My Orders - Velvra',
        user: req.user,
        orders,
        stats
    });
}));

// Order Details (for Track Order, etc.)
router.get('/orders/:orderId', isLoggedIn, asyncWrap(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
        .populate('items.product')
        .populate('user');
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    if (order.user._id.toString() !== req.user._id.toString()) {
        throw new AppError('Access denied', 403);
    }
    res.render('page/UserDashboard/orderDetails', { 
        title: 'Order Details - Velvra',
        order, 
        user: req.user
    });
}));

// Get order sellers for contact selection
router.get('/orders/:orderId/sellers', isLoggedIn, asyncWrap(async (req, res) => {
    console.log('Seller API called for order:', req.params.orderId);
    
    const order = await Order.findById(req.params.orderId)
        .populate('items.product')
        .populate('items.seller');
    
    if (!order) {
        console.log('Order not found:', req.params.orderId);
        throw new AppError('Order not found', 404);
    }
    
    if (order.user.toString() !== req.user._id.toString()) {
        console.log('Access denied for user:', req.user._id);
        throw new AppError('Access denied', 403);
    }
    
    console.log('Order items:', order.items.length);
    
    // Extract seller information from order items
    const sellers = order.items.map(item => {
        let sellerId = null;
        let sellerName = 'Unknown Seller';
        if (item.seller && item.seller._id) {
            sellerId = item.seller._id;
            sellerName = item.seller.brandName || 'Unknown Seller';
        } else if (typeof item.seller === 'string' || item.seller instanceof mongoose.Types.ObjectId) {
            sellerId = item.seller;
        } else {
            console.warn('Order item has invalid seller:', item.seller);
        }
        // Defensive: ensure sellerId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            console.warn('Invalid sellerId for order item:', sellerId);
            sellerId = null;
        }
        return {
            id: sellerId,
            name: sellerName,
            productName: item.product?.name || 'Product'
        };
    });
    
    console.log('Returning sellers:', sellers);
    res.json({ success: true, sellers });
}));

// Download Invoice
router.get('/orders/:orderId/invoice', isLoggedIn, asyncWrap(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
        .populate('items.product')
        .populate('user');
    
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    
    if (order.user._id.toString() !== req.user._id.toString()) {
        throw new AppError('Access denied', 403);
    }

    // For now, we'll create a simple HTML invoice and convert it to PDF
    // In a production environment, you'd use a proper PDF library like puppeteer or jsPDF
    
    const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice - Order ${order.orderNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { text-align: center; margin-bottom: 30px; }
                .invoice-details { margin-bottom: 30px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                .items-table th { background-color: #f8f9fa; }
                .total { text-align: right; font-weight: bold; font-size: 18px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>VELVRA</h1>
                <h2>INVOICE</h2>
            </div>
            
            <div class="invoice-details">
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${order.createdAt.toLocaleDateString()}</p>
                <p><strong>Customer:</strong> ${order.user.firstName} ${order.user.lastName || ''}</p>
                <p><strong>Email:</strong> ${order.user.email}</p>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Size</th>
                        <th>Color</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.product?.name || 'Product'}</td>
                            <td>${item.size}</td>
                            <td>${item.color}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.price.toLocaleString()}</td>
                            <td>₹${item.totalPrice.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total">
                <p>Subtotal: ₹${order.subtotal.toLocaleString()}</p>
                <p>Shipping: ₹${order.shippingCost.toLocaleString()}</p>
                ${order.discount > 0 ? `<p>Discount: -₹${order.discount.toLocaleString()}</p>` : ''}
                <p>Total: ₹${order.total.toLocaleString()}</p>
            </div>
        </body>
        </html>
    `;

    // Set headers for PDF download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.html"`);
    res.send(invoiceHTML);
}));

// Order History
router.get('/order-history', isLoggedIn, asyncWrap(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .populate('items.product')
        .sort({ createdAt: -1 });
    res.render('page/UserDashboard/orderHistory', { 
        title: 'Order History - Velvra',
        orders, 
        user: req.user
    });
}));

// Wishlist
router.get('/wishlist', isLoggedIn, asyncWrap(async (req, res) => {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
        path: 'products',
        populate: {
            path: 'seller',
            select: 'businessName'
        }
    });
    
    if (!wishlist) {
        wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Get comprehensive stats for sidebar
    const stats = await getDashboardStats(req.user._id);

    res.render('page/UserDashboard/userWishlist', { 
        title: 'My Wishlist - Velvra',
        user: req.user, 
        wishlist,
        stats
    });
}));

// AJAX: Add product to wishlist
router.post('/wishlist/add', isLoggedIn, asyncWrap(async (req, res) => {
    const { productId } = req.body;
    
    if (!productId) {
        throw new AppError('Product ID is required', 400);
    }

    // Verify product exists
    const Product = require('../models/product');
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
        wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    // Check if product is already in wishlist
    if (wishlist.products.includes(productId)) {
        throw new AppError('Product already in wishlist', 400);
    }

    // Add product to wishlist
    wishlist.products.push(productId);
    await wishlist.save();

    res.json({ 
        success: true, 
        message: 'Product added to wishlist',
        wishlistCount: wishlist.products.length
    });
}));

// AJAX: Remove product from wishlist
router.delete('/wishlist/remove', isLoggedIn, asyncWrap(async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        throw new AppError('Product ID is required', 400);
    }
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
        throw new AppError('Wishlist not found', 404);
    }
    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();
    res.json({ 
        success: true, 
        message: 'Product removed from wishlist',
        wishlistCount: wishlist.products.length
    });
}));

// AJAX: Add product to cart from wishlist
router.post('/wishlist/add-to-cart', isLoggedIn, asyncWrap(async (req, res) => {
    const { productId, size, color, quantity = 1 } = req.body;
    
    if (!productId || !size || !color) {
        throw new AppError('Product ID, size, and color are required', 400);
    }

    // Verify product exists
    const Product = require('../models/product');
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Check if product is in wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist || !wishlist.products.includes(productId)) {
        throw new AppError('Product not in wishlist', 400);
    }

    // Validate color and size availability
    const colorObj = product.colors.find(c => c.name === color);
    if (!colorObj) {
        throw new AppError('Color not available', 400);
    }
    
    // Check if size is available for this color by checking variants
    const variant = product.variants.find(v => v.color === color && v.size === size);
    if (!variant) {
        throw new AppError('Size not available for this color', 400);
    }
    
    if (variant.stock < quantity) {
        throw new AppError('Not enough stock for this variant', 400);
    }

    // Add to cart (using existing cart logic)
    const Cart = require('../models/cart');
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => 
        item.product.toString() === productId && 
        item.size === size && 
        item.color === color
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            product: productId,
            size,
            color,
            quantity
        });
    }

    await cart.save();

    res.json({ 
        success: true, 
        message: 'Product added to cart',
        cartCount: cart.items.reduce((total, item) => total + item.quantity, 0)
    });
}));

// AJAX: Move product from wishlist to cart (removes from wishlist)
router.post('/wishlist/move-to-cart', isLoggedIn, asyncWrap(async (req, res) => {
    const { productId, size, color, quantity = 1 } = req.body;
    
    if (!productId || !size || !color) {
        throw new AppError('Product ID, size, and color are required', 400);
    }

    // Verify product exists
    const Product = require('../models/product');
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Check if product is in wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist || !wishlist.products.includes(productId)) {
        throw new AppError('Product not in wishlist', 400);
    }

    // Add to cart (using existing cart logic)
    const Cart = require('../models/cart');
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => 
        item.product.toString() === productId && 
        item.size === size && 
        item.color === color
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            product: productId,
            size,
            color,
            quantity
        });
    }

    await cart.save();

    // Remove from wishlist
    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();

    res.json({ 
        success: true, 
        message: 'Product moved to cart',
        wishlistCount: wishlist.products.length,
        cartCount: cart.items.reduce((total, item) => total + item.quantity, 0)
    });
}));

// AJAX: Get wishlist count (for navbar updates)
router.get('/wishlist/count', isLoggedIn, asyncWrap(async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const count = wishlist ? wishlist.products.length : 0;
    res.json({ success: true, count });
}));

// AJAX: Check if product is in wishlist (for product pages)
router.get('/wishlist/check/:productId', isLoggedIn, asyncWrap(async (req, res) => {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const isInWishlist = wishlist ? wishlist.products.includes(productId) : false;
    res.json({ success: true, isInWishlist });
}));

// AJAX: Get wishlist data with filtering and sorting
router.get('/wishlist/data', isLoggedIn, asyncWrap(async (req, res) => {
    const { filter = 'all', sort = 'recent' } = req.query;
    
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
        path: 'products',
        populate: {
            path: 'seller',
            select: 'businessName'
        }
    });
    
    if (!wishlist) {
        wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    let products = wishlist.products || [];

    // Apply filters
    if (filter === 'sale') {
        products = products.filter(product => {
            // Check if any variant has a sale price
            return product.variants && product.variants.some(variant => 
                variant.salePrice && variant.salePrice < variant.price
            );
        });
    } else if (filter === 'instock') {
        products = products.filter(product => {
            // Check if any variant has stock > 0
            return product.variants && product.variants.some(variant => 
                variant.stock > 0 && variant.active
            );
        });
    }

    // Apply sorting
    switch (sort) {
        case 'recent':
            products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'price-low':
            products.sort((a, b) => {
                const priceA = a.getBestPriceInfo ? a.getBestPriceInfo().displayPrice : 0;
                const priceB = b.getBestPriceInfo ? b.getBestPriceInfo().displayPrice : 0;
                return priceA - priceB;
            });
            break;
        case 'price-high':
            products.sort((a, b) => {
                const priceA = a.getBestPriceInfo ? a.getBestPriceInfo().displayPrice : 0;
                const priceB = b.getBestPriceInfo ? b.getBestPriceInfo().displayPrice : 0;
                return priceB - priceA;
            });
            break;
        case 'name':
            products.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    res.json({ 
        success: true, 
        products,
        count: products.length
    });
}));

// Messages (Inbox)
router.get('/messages', isLoggedIn, asyncWrap(async (req, res) => {
    console.log('Messages route accessed with query:', req.query);
    
    // If order and seller are provided, find or create the conversation
    if (req.query.order && req.query.seller) {
        const orderId = req.query.order;
        const sellerId = req.query.seller;
        
        console.log('Creating/finding conversation for order:', orderId, 'seller:', sellerId);
        
        // Validate seller ID is not null or invalid
        if (!sellerId || sellerId === 'null' || sellerId === 'undefined') {
            console.log('Invalid seller ID:', sellerId);
            throw new AppError('Invalid seller information. Please contact support.', 400);
        }
        
        // Validate seller exists
        const seller = await mongoose.model('Seller').findById(sellerId);
        if (!seller) {
            console.log('Seller not found:', sellerId);
            throw new AppError('Seller not found. Please contact support.', 404);
        }
        
        // Validate order exists and belongs to user
        const order = await Order.findById(orderId);
        if (!order) {
            console.log('Order not found:', orderId);
            throw new AppError('Order not found. Please contact support.', 404);
        }
        
        if (order.user.toString() !== req.user._id.toString()) {
            console.log('Order access denied for user:', req.user._id);
            throw new AppError('Access denied. This order does not belong to you.', 403);
        }
        
        // Prevent conversation creation for cancelled or returned orders
        if (order.orderStatus === 'cancelled' || order.orderStatus === 'returned') {
            console.log('Cannot create conversation for order with status:', order.orderStatus);
            throw new AppError(`Cannot contact seller for ${order.orderStatus} orders. Please contact support if you need assistance.`, 400);
        }
        
        // First, check if a conversation already exists between this user and seller (regardless of order)
        let conversation = await Conversation.findOne({
            'participants': {
                $all: [
                    { $elemMatch: { id: req.user._id, model: 'User' } },
                    { $elemMatch: { id: sellerId, model: 'Seller' } }
                ]
            }
        });
        
        if (conversation) {
            console.log('Found existing conversation between user and seller:', conversation._id);
            // If conversation exists but doesn't have this order, update it to include the order
            if (!conversation.order || conversation.order.toString() !== orderId) {
                conversation.order = orderId;
                await conversation.save();
                console.log('Updated existing conversation with order:', orderId);
            }
        } else {
            console.log('Creating new conversation between user and seller');
            conversation = await Conversation.create({
                participants: [
                    { id: req.user._id, model: 'User' },
                    { id: sellerId, model: 'Seller' }
                ],
                order: orderId
            });
        }
        
        return res.redirect(`/dashboard/messages/${conversation._id}`);
    }

    console.log('Loading all conversations for user:', req.user._id);
    
    // Find all conversations where user is a participant
    const conversations = await Conversation.find({
        'participants.id': req.user._id,
        'participants.model': 'User'
    }).populate('order').sort({ updatedAt: -1 });

    console.log('Found conversations:', conversations.length);

    // Get comprehensive data for each conversation
    const conversationsWithDetails = [];
    for (const conversation of conversations) {
        // Get the other participant (seller)
        const sellerParticipant = conversation.participants.find(p => p.model === 'Seller');
        if (!sellerParticipant) {
            console.log('No seller participant found for conversation:', conversation._id);
            continue; // Skip if no seller participant
        }
        
        const seller = await mongoose.model('Seller').findById(sellerParticipant.id);
        if (!seller) {
            console.log('Seller not found for participant:', sellerParticipant.id);
            continue; // Skip if seller doesn't exist
        }
        
        // Get messages for this conversation
        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .limit(1); // Get latest message
        
        // Get unread count for this conversation
        const unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            recipient: req.user._id,
            recipientModel: 'User',
            isRead: false
        });

        // Get order details if exists
        let orderDetails = null;
        if (conversation.order) {
            orderDetails = await Order.findById(conversation.order)
                .populate('items.product')
                .populate('items.seller');
        }

        conversationsWithDetails.push({
            _id: conversation._id,
            seller: seller,
            lastMessage: conversation.lastMessage,
            updatedAt: conversation.updatedAt,
            unreadCount: unreadCount,
            order: orderDetails,
            latestMessage: messages[0] || null
        });
    }

    console.log('Processed conversations:', conversationsWithDetails.length);

    // Get comprehensive stats for sidebar
    const stats = await getDashboardStats(req.user._id);

    res.render('page/UserDashboard/userMessage', {
        title: 'Messages - Velvra',
        user: req.user,
        conversations: conversationsWithDetails,
        stats: stats,
        currentConversationId: null
    });
}));

// API endpoint to get all user conversations
router.get('/api/messages', isLoggedIn, asyncWrap(async (req, res) => {
    const conversations = await Conversation.find({
        'participants.id': req.user._id,
        'participants.model': 'User'
    }).populate('order').sort({ updatedAt: -1 });

    const conversationsWithDetails = [];
    for (const conversation of conversations) {
        const sellerParticipant = conversation.participants.find(p => p.model === 'Seller');
        if (!sellerParticipant) continue; 

        const seller = await mongoose.model('Seller').findById(sellerParticipant.id);
        if (!seller) continue;

        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .limit(1);

        const unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            recipient: req.user._id,
            recipientModel: 'User',
            isRead: false
        });

        conversationsWithDetails.push({
            _id: conversation._id,
            seller: seller,
            lastMessage: conversation.lastMessage,
            updatedAt: conversation.updatedAt,
            unreadCount: unreadCount,
            order: conversation.order,
            latestMessage: messages[0] || null
        });
    }

    res.json({ success: true, conversations: conversationsWithDetails });
}));

// Single Conversation
router.get('/messages/:conversationId', isLoggedIn, asyncWrap(async (req, res) => {
    const conversation = await Conversation.findById(req.params.conversationId)
        .populate('order');
    
    if (!conversation) {
        throw new AppError('Conversation not found', 404);
    }

    // Check user is a participant
    const isParticipant = conversation.participants.some(p => p.id.equals(req.user._id) && p.model === 'User');
    if (!isParticipant) {
        throw new AppError('Access denied', 403);
    }

    // Get the seller participant
    const sellerParticipant = conversation.participants.find(p => p.model === 'Seller');
    const seller = await mongoose.model('Seller').findById(sellerParticipant.id);

    // Get all messages for this conversation
    const messages = await Message.find({ conversationId: conversation._id })
        .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
        {
            conversationId: conversation._id,
            recipient: req.user._id,
            recipientModel: 'User',
            isRead: false
        },
        { isRead: true }
    );

    // Get order details if exists
    let orderDetails = null;
    if (conversation.order) {
        orderDetails = await Order.findById(conversation.order)
            .populate('items.product')
            .populate('items.seller');
    }

    // Get all conversations for sidebar
    const allConversations = await Conversation.find({
        'participants.id': req.user._id,
        'participants.model': 'User'
    }).populate('order').sort({ updatedAt: -1 });

    const conversationsWithDetails = [];
    for (const conv of allConversations) {
        const sellerParticipant = conv.participants.find(p => p.model === 'Seller');
        if (!sellerParticipant) continue; // Skip if no seller participant
        
        const convSeller = await mongoose.model('Seller').findById(sellerParticipant.id);
        if (!convSeller) continue; // Skip if seller doesn't exist
        
        const unreadCount = await Message.countDocuments({
            conversationId: conv._id,
            recipient: req.user._id,
            recipientModel: 'User',
            isRead: false
        });

        conversationsWithDetails.push({
            _id: conv._id,
            seller: convSeller,
            lastMessage: conv.lastMessage,
            updatedAt: conv.updatedAt,
            unreadCount: unreadCount,
            order: conv.order
        });
    }

    // Get comprehensive stats for sidebar
    const stats = await getDashboardStats(req.user._id);

    res.render('page/UserDashboard/userMessage', {
        title: 'Messages - Velvra',
        user: req.user,
        conversations: conversationsWithDetails,
        currentConversation: {
            _id: conversation._id,
            seller: seller,
            messages: messages,
            order: orderDetails
        },
        stats: stats,
        currentConversationId: conversation._id
    });
}));

// API endpoint to send a message
router.post('/messages/:conversationId/send', isLoggedIn, asyncWrap(async (req, res) => {
    const { content } = req.body;
    const conversationId = req.params.conversationId;

    if (!content || !content.trim()) {
        throw new AppError('Message content is required', 400);
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new AppError('Conversation not found', 404);
    }

    const isParticipant = conversation.participants.some(p => p.id.equals(req.user._id) && p.model === 'User');
    if (!isParticipant) {
        throw new AppError('Access denied', 403);
    }

    // Get the seller participant
    const sellerParticipant = conversation.participants.find(p => p.model === 'Seller');

    // Create the message
    const message = await Message.create({
        conversationId: conversationId,
        sender: req.user._id,
        senderModel: 'User',
        recipient: sellerParticipant.id,
        recipientModel: 'Seller',
        order: conversation.order,
        content: content.trim()
    });

    // Update conversation's last message
    conversation.lastMessage = content.trim();
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender details for response
    await message.populate('sender', 'firstName lastName');

    res.json({
        success: true,
        message: message
    });
}));

// API endpoint to mark messages as read
router.post('/messages/:conversationId/read', isLoggedIn, asyncWrap(async (req, res) => {
    const conversationId = req.params.conversationId;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new AppError('Conversation not found', 404);
    }

    const isParticipant = conversation.participants.some(p => p.id.equals(req.user._id) && p.model === 'User');
    if (!isParticipant) {
        throw new AppError('Access denied', 403);
    }

    // Mark all unread messages as read
    await Message.updateMany(
        {
            conversationId: conversationId,
            recipient: req.user._id,
            recipientModel: 'User',
            isRead: false
        },
        { isRead: true }
    );

    res.json({ success: true });
}));

// API endpoint to get conversation messages
router.get('/messages/:conversationId/messages', isLoggedIn, asyncWrap(async (req, res) => {
    const conversationId = req.params.conversationId;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new AppError('Conversation not found', 404);
    }

    const isParticipant = conversation.participants.some(p => p.id.equals(req.user._id) && p.model === 'User');
    if (!isParticipant) {
        throw new AppError('Access denied', 403);
    }

    // Get messages
    const messages = await Message.find({ conversationId: conversationId })
        .populate('sender', 'firstName lastName')
        .sort({ createdAt: 1 });

    res.json({ success: true, messages: messages });
}));

// Report Issue (dynamic)
router.get('/report-issue', isLoggedIn, asyncWrap(async (req, res) => {
    const userOrders = await Order.find({ user: req.user._id })
        .populate('items.product')
        .populate('items.seller')
        .sort({ createdAt: -1 });
    
    // Fetch user's reports for the "My Reports" tab
    const reports = await IssueReport.find({ userId: req.user._id })
        .populate('orderId')
        .sort({ createdAt: -1 });
    
    const stats = await getDashboardStats(req.user._id);
    res.render('page/UserDashboard/userReportIssue', {
        title: 'Report Issues - Velvra',
        user: req.user,
        stats,
        userOrders,
        reports, // Add reports to template context
        messages: {
            error: req.flash('error'),
            success: req.flash('success')
        },
        currentPage: 'report-issue'
    });
}));

// Settings (dynamic)
router.get('/settings', isLoggedIn, asyncWrap(async (req, res) => {
    const stats = await getDashboardStats(req.user._id);
    
    // Get user with addresses populated
    const user = await User.findById(req.user._id);
    
    // Find default address
    const defaultAddress = user.addresses.find(addr => addr.defaultShipping) || {};
    
    // Parse date of birth if exists
    let birthMonth = 1, birthDay = 1, birthYear = 1990;
    if (user.dateOfBirth) {
        const dob = new Date(user.dateOfBirth);
        birthMonth = dob.getMonth() + 1;
        birthDay = dob.getDate();
        birthYear = dob.getFullYear();
    }
    
    res.render('page/UserDashboard/userSettings', { 
        title: 'Profile Settings - Velvra',
        user: req.user,
        stats,
        defaultAddress,
        birthMonth,
        birthDay,
        birthYear
    });
}));

// Update Personal Information
router.post('/settings/personal-info', isLoggedIn, require('../controllers/userSettingsController').updatePersonalInfo);

// Update Address
router.post('/settings/address', isLoggedIn, require('../controllers/userSettingsController').updateAddress);

// Update Password
router.post('/settings/password', isLoggedIn, require('../controllers/userSettingsController').updatePassword);

// Get Order Tracking Data
router.get('/orders/:orderId/tracking', isLoggedIn, asyncWrap(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
        .populate('items.product')
        .populate('user');
    
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    
    if (order.user._id.toString() !== req.user._id.toString()) {
        throw new AppError('Access denied', 403);
    }

    // Generate tracking data based on order status and timestamps
    const trackingData = generateTrackingData(order);
    
    res.json({
        success: true,
        tracking: trackingData,
        order: {
            orderNumber: order.orderNumber,
            status: order.orderStatus,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }
    });
}));

// Send Message to Seller
router.post('/orders/:orderId/message', isLoggedIn, asyncWrap(async (req, res) => {
    const { message, sellerId } = req.body;
    const orderId = req.params.orderId;

    if (!message || !sellerId) {
        throw new AppError('Message and seller ID are required', 400);
    }

    // Verify order belongs to user and is not cancelled/returned
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    
    if (order.user.toString() !== req.user._id.toString()) {
        throw new AppError('Access denied', 403);
    }
    
    // Prevent messaging for cancelled or returned orders
    if (order.orderStatus === 'cancelled' || order.orderStatus === 'returned') {
        throw new AppError(`Cannot send messages for ${order.orderStatus} orders. Please contact support if you need assistance.`, 400);
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
        'participants': {
            $all: [
                { $elemMatch: { id: req.user._id, model: 'User' } },
                { $elemMatch: { id: sellerId, model: 'Seller' } }
            ]
        }
    });

    if (conversation) {
        // If conversation exists but doesn't have this order, update it to include the order
        if (!conversation.order || conversation.order.toString() !== orderId) {
            conversation.order = orderId;
        }
        conversation.lastMessage = message;
        conversation.updatedAt = new Date();
        await conversation.save();
    } else {
        conversation = await Conversation.create({
            participants: [
                { id: req.user._id, model: 'User' },
                { id: sellerId, model: 'Seller' }
            ],
            order: orderId,
            lastMessage: message
        });
    }

    // Create message
    const newMessage = await Message.create({
        conversationId: conversation._id,
        sender: req.user._id,
        senderModel: 'User',
        recipient: sellerId,
        recipientModel: 'Seller',
        order: orderId,
        content: message
    });

    res.json({
        success: true,
        message: 'Message sent successfully',
        conversationId: conversation._id
    });
}));

// Get Order Statistics (for filtering)
router.get('/orders/stats', isLoggedIn, asyncWrap(async (req, res) => {
    const orderStats = await Order.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    const stats = {
        total: orderStats.reduce((sum, stat) => sum + stat.count, 0),
        processing: orderStats.find(s => s._id === 'processing')?.count || 0,
        shipped: orderStats.find(s => s._id === 'shipped')?.count || 0,
        delivered: orderStats.find(s => s._id === 'delivered')?.count || 0,
        returned: orderStats.find(s => s._id === 'cancelled')?.count || 0
    };

    res.json({ success: true, stats });
}));

// Helper function to get comprehensive dashboard stats
async function getDashboardStats(userId) {
    try {
        // Get order statistics
        const ordersByStatus = await Order.aggregate([
            { $match: { user: userId } },
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        // Get wishlist count
        const wishlist = await Wishlist.findOne({ user: userId });
        const wishlistCount = wishlist ? wishlist.products.length : 0;

        // Get unread messages count
        const unreadMessagesCount = await Message.countDocuments({
            recipient: userId,
            recipientModel: 'User',
            isRead: false
        });

        // Calculate order statistics
        const stats = {
            totalOrders: ordersByStatus.reduce((sum, s) => sum + s.count, 0),
            processingOrders: ordersByStatus.find(s => s._id === 'processing')?.count || 0,
            shippedOrders: ordersByStatus.find(s => s._id === 'shipped')?.count || 0,
            deliveredOrders: ordersByStatus.find(s => s._id === 'delivered')?.count || 0,
            returnedOrders: ordersByStatus.find(s => s._id === 'cancelled')?.count || 0,
            wishlistCount: wishlistCount,
            unreadMessages: unreadMessagesCount
        };

        return stats;
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return {
            totalOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            returnedOrders: 0,
            wishlistCount: 0,
            unreadMessages: 0
        };
    }
}

// Helper function to generate tracking data
function generateTrackingData(order) {
    const trackingSteps = [
        {
            step: 'Order Placed',
            status: 'completed',
            timestamp: order.createdAt,
            description: 'Order confirmed and payment processed'
        }
    ];

    // Add processing step if order is beyond pending
    if (['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus)) {
        trackingSteps.push({
            step: 'Processing',
            status: order.orderStatus === 'processing' ? 'current' : 'completed',
            timestamp: order.orderStatus === 'processing' ? new Date() : new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000),
            description: 'Order is being prepared for shipment'
        });
    }

    // Add shipped step if order is shipped or delivered
    if (['shipped', 'delivered'].includes(order.orderStatus)) {
        trackingSteps.push({
            step: 'Shipped',
            status: order.orderStatus === 'shipped' ? 'current' : 'completed',
            timestamp: order.orderStatus === 'shipped' ? new Date() : new Date(order.createdAt.getTime() + 48 * 60 * 60 * 1000),
            description: 'Order has been shipped and is on its way'
        });
    }

    // Add delivered step if order is delivered
    if (order.orderStatus === 'delivered') {
        trackingSteps.push({
            step: 'Delivered',
            status: 'completed',
            timestamp: new Date(order.updatedAt),
            description: 'Order has been successfully delivered'
        });
    }

    // Add cancelled step if order is cancelled
    if (order.orderStatus === 'cancelled') {
        trackingSteps.push({
            step: 'Order Cancelled',
            status: 'cancelled',
            timestamp: new Date(order.updatedAt),
            description: 'Order has been cancelled'
        });
    }

    return trackingSteps;
}

// Test route to check sellers
router.get('/test-sellers', isLoggedIn, asyncWrap(async (req, res) => {
    const Seller = mongoose.model('Seller');
    const sellers = await Seller.find().limit(5);
    console.log('Found sellers:', sellers.length);
    sellers.forEach(seller => {
        console.log('Seller:', seller._id, seller.brandName);
    });
    res.json({ success: true, sellers: sellers.map(s => ({ id: s._id, name: s.brandName })) });
}));

// Cancel Order Route
router.put('/orders/:orderId/cancel', isLoggedIn, asyncWrap(async (req, res) => {
    const orderId = req.params.orderId;
    
    // Find the order and verify ownership
    const order = await Order.findById(orderId)
        .populate('items.product')
        .populate('items.seller');
    
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    
    // Verify order belongs to the user
    if (order.user.toString() !== req.user._id.toString()) {
        throw new AppError('Access denied', 403);
    }
    
    // Check if order can be cancelled (only pending or processing)
    if (!['pending', 'processing'].includes(order.orderStatus)) {
        throw new AppError(`Cannot cancel order with status: ${order.orderStatus}`, 400);
    }
    
    // Update order status to cancelled
    order.orderStatus = 'cancelled';
    order.updatedAt = new Date();
    
    // Restore inventory for cancelled items
    for (const item of order.items) {
        const productDoc = await require('../models/product').findById(item.product);
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
    
    // Add cancellation metadata
    if (!order.metadata) {
        order.metadata = {};
    }
    order.metadata.cancelledAt = new Date();
    order.metadata.cancelledBy = req.user._id;
    order.metadata.cancellationReason = 'User requested cancellation';
    
    await order.save();
    
    // TODO: Here you could add logic to:
    // 1. Restore inventory for cancelled items
    // 2. Process refund if payment was made
    // 3. Notify sellers about cancellation
    // 4. Send confirmation email to user
    
    console.log(`Order ${order.orderNumber} cancelled by user ${req.user._id}`);
    
    res.json({ 
        success: true, 
        message: 'Order cancelled successfully',
        orderId: order._id,
        orderNumber: order.orderNumber,
        newStatus: 'cancelled'
    });
}));

// Test route to check order structure
router.get('/test-order/:orderId', isLoggedIn, asyncWrap(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
        .populate('items.product')
        .populate('items.seller');
    
    if (!order) {
        throw new AppError('Order not found', 404);
    }
    
    console.log('Order found:', order._id);
    console.log('Order items:', order.items.length);
    
    order.items.forEach((item, index) => {
        console.log(`Item ${index}:`, {
            product: item.product?.name || 'No product',
            seller: item.seller?.brandName || 'No seller',
            sellerId: item.seller?._id || item.seller || 'No seller ID'
        });
    });
    
    res.json({ 
        success: true, 
        orderId: order._id,
        items: order.items.map(item => ({
            product: item.product?.name || 'No product',
            seller: item.seller?.brandName || 'No seller',
            sellerId: item.seller?._id || item.seller || 'No seller ID'
        }))
    });
}));

// Mobile Notifications Page
router.get('/notifications', isLoggedIn, asyncWrap(async (req, res) => {
    const stats = await getDashboardStats(req.user._id);
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);
    const unreadNotificationCount = notifications.filter(n => !n.isRead).length;
    res.render('page/UserDashboard/userNotifications', {
        title: 'Notifications - Velvra',
        user: req.user,
        stats,
        notifications,
        unreadNotificationCount
    });
}));

module.exports = router;