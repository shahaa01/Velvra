const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const Wishlist = require('../models/wishlist');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

// Main Dashboard
router.get('/', isLoggedIn, async (req, res) => {
        try {
            const orders = await Order.find({ user: req.user._id })
                .populate('items.product')
                .sort({ createdAt: -1 })
            .limit(5);

        // Calculate stats
            const ordersByStatus = await Order.aggregate([
                { $match: { user: req.user._id } },
                { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
            ]);
        const stats = {
                    activeOrders: ordersByStatus.find(s => s._id === 'processing')?.count || 0,
            deliveredOrders: ordersByStatus.find(s => s._id === 'delivered')?.count || 0,
            // Add more as needed
        };

        res.render('page/UserDashboard/userDashboard', {
            title: 'Dashboard - Velvra',
            user: req.user,
            orders,
            stats
        });
        } catch (error) {
            res.status(500).render('error', { error: 'Failed to load dashboard' });
        }
    });

// Orders List
router.get('/orders', isLoggedIn, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.render('page/UserDashboard/userOrders', {
            title: 'My Orders - Velvra',
            user: req.user,
            orders
        });
    } catch (error) {
        res.status(500).render('error', { error: 'Failed to load orders' });
    }
});

// Order Details (for Track Order, etc.)
router.get('/orders/:orderId', isLoggedIn, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('items.product')
            .populate('user');
        if (!order) {
            return res.status(404).render('error', { error: 'Order not found' });
        }
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', { error: 'Access denied' });
        }
        res.render('page/UserDashboard/orderDetails', { 
            title: 'Order Details - Velvra',
            order, 
            user: req.user
        });
    } catch (error) {
        res.status(500).render('error', { error: 'Failed to load order details' });
    }
});

// Order History
router.get('/order-history', isLoggedIn, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.render('page/UserDashboard/orderHistory', { 
            title: 'Order History - Velvra',
            orders, 
            user: req.user
        });
    } catch (error) {
        res.status(500).render('error', { error: 'Failed to load order history' });
    }
});

// Wishlist
router.get('/wishlist', isLoggedIn, async (req, res) => {
    try {
        let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user._id, products: [] });
        }
        res.render('page/UserDashboard/userWishlist', { 
            title: 'My Wishlist - Velvra',
            user: req.user, 
            wishlist
        });
    } catch (error) {
        res.status(500).render('error', { error: 'Failed to load wishlist' });
    }
});

// Messages (Inbox)
router.get('/messages', isLoggedIn, async (req, res) => {
    try {
        // If order and seller are provided, find or create the conversation
        if (req.query.order && req.query.seller) {
            const orderId = req.query.order;
            const sellerId = req.query.seller;
            // Find existing conversation
            let conversation = await Conversation.findOne({
                'participants': {
                    $all: [
                        { $elemMatch: { id: req.user._id, model: 'User' } },
                        { $elemMatch: { id: sellerId, model: 'Seller' } }
                    ]
                },
                order: orderId
            });
            if (!conversation) {
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
        // Find all conversations where user is a participant
        const conversations = await Conversation.find({
            'participants.id': req.user._id,
            'participants.model': 'User'
        }).sort({ updatedAt: -1 });
        // For each conversation, get the latest message
        const messagesByConversation = {};
        for (const convo of conversations) {
            messagesByConversation[convo._id] = await Message.find({ conversationId: convo._id })
                .sort({ createdAt: 1 });
        }
        res.render('page/UserDashboard/userMessage', {
            title: 'Messages - Velvra',
            user: req.user,
            conversations,
            messagesByConversation
        });
    } catch (error) {
        res.status(500).render('error', { error: 'Failed to load messages' });
    }
});

// Single Conversation
router.get('/messages/:conversationId', isLoggedIn, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!conversation) return res.status(404).render('error', { error: 'Conversation not found' });
        // Check user is a participant
        const isParticipant = conversation.participants.some(p => p.id.equals(req.user._id) && p.model === 'User');
        if (!isParticipant) return res.status(403).render('error', { error: 'Access denied' });
        const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
        res.render('page/UserDashboard/userMessage', {
            title: 'Messages - Velvra',
            user: req.user,
            conversations: [conversation],
            messagesByConversation: { [conversation._id]: messages },
            conversationId: conversation._id
        });
    } catch (error) {
        res.status(500).render('error', { error: 'Failed to load conversation' });
    }
});

// Report Issue (placeholder)
router.get('/report-issue', isLoggedIn, (req, res) => {
    res.render('page/UserDashboard/userReportIssue', { 
        title: 'Report Issues - Velvra',
        user: req.user
    });
});

// Settings (placeholder)
router.get('/settings', isLoggedIn, (req, res) => {
    res.render('page/UserDashboard/userSettings', { 
        title: 'Profile Settings - Velvra',
        user: req.user
    });
});

module.exports = router;