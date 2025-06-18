const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Cart = require('../models/cart');
const { isLoggedIn } = require('../middlewares/authMiddleware');

router.route('/')
    .get(isLoggedIn, async(req, res) => {
        try {
            // Get user's orders with populated product details
            const orders = await Order.find({ user: req.user._id })
                .populate('items.product')
                .sort({ createdAt: -1 })
                .limit(5); // Get latest 5 orders for dashboard

            // Get user's cart for wishlist/cart info
            const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

            // Calculate dashboard statistics
            const totalOrders = await Order.countDocuments({ user: req.user._id });
            const totalSpent = await Order.aggregate([
                { $match: { user: req.user._id } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);

            // Get orders by status
            const ordersByStatus = await Order.aggregate([
                { $match: { user: req.user._id } },
                { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
            ]);

            // Get this month's spending
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const thisMonthSpending = await Order.aggregate([
                { 
                    $match: { 
                        user: req.user._id,
                        createdAt: { $gte: startOfMonth }
                    }
                },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);

            // Generate notifications based on order status
            const notifications = [];
            
            // Add notifications for recent orders
            orders.forEach(order => {
                const orderDate = new Date(order.createdAt);
                const now = new Date();
                const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff <= 7) { // Only show notifications for orders from last 7 days
                    let message = '';
                    let type = 'order';
                    
                    switch(order.orderStatus) {
                        case 'pending':
                            message = `Order #${order.orderNumber} has been placed and is pending confirmation`;
                            break;
                        case 'confirmed':
                            message = `Order #${order.orderNumber} has been confirmed and is being processed`;
                            break;
                        case 'processing':
                            message = `Order #${order.orderNumber} is being processed and prepared for shipping`;
                            break;
                        case 'shipped':
                            message = `Order #${order.orderNumber} has been shipped and is on its way to you`;
                            break;
                        case 'delivered':
                            message = `Order #${order.orderNumber} has been delivered! Please rate your experience`;
                            break;
                        case 'cancelled':
                            message = `Order #${order.orderNumber} has been cancelled`;
                            type = 'cancelled';
                            break;
                    }
                    
                    if (message) {
                        notifications.push({
                            id: order._id,
                            message: message,
                            type: type,
                            orderId: order._id,
                            orderNumber: order.orderNumber,
                            orderStatus: order.orderStatus,
                            createdAt: order.createdAt,
                            isRead: false,
                            daysAgo: daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Yesterday' : `${daysDiff} days ago`
                        });
                    }
                }
            });

            // Sort notifications by date (newest first)
            notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Get unread count
            const unreadCount = notifications.filter(n => !n.isRead).length;

            // Format the data
            const dashboardData = {
                user: req.user,
                orders: orders,
                cart: cart,
                notifications: notifications,
                unreadCount: unreadCount,
                stats: {
                    totalOrders: totalOrders,
                    totalSpent: totalSpent[0]?.total || 0,
                    thisMonthSpent: thisMonthSpending[0]?.total || 0,
                    activeOrders: ordersByStatus.find(s => s._id === 'processing')?.count || 0,
                    shippedOrders: ordersByStatus.find(s => s._id === 'shipped')?.count || 0,
                    deliveredOrders: ordersByStatus.find(s => s._id === 'delivered')?.count || 0
                }
            };

            res.render('page/userDashboard', dashboardData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            res.status(500).render('error', { error: 'Failed to load dashboard' });
        }
    });

// Get all orders for the user
router.get('/orders', isLoggedIn, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.render('page/orderHistory', { orders, user: req.user });
    } catch (error) {
        console.error('Error loading orders:', error);
        res.status(500).render('error', { error: 'Failed to load orders' });
    }
});

// Get specific order details
router.get('/orders/:orderId', isLoggedIn, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('items.product')
            .populate('user');

        if (!order) {
            return res.status(404).render('error', { error: 'Order not found' });
        }

        // Check if the order belongs to the current user
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', { error: 'Access denied' });
        }

        res.render('page/orderDetails', { order });
    } catch (error) {
        console.error('Error loading order:', error);
        res.status(500).render('error', { error: 'Failed to load order' });
    }
});

// Mark notification as read
router.post('/notifications/:notificationId/read', isLoggedIn, async (req, res) => {
    try {
        // In a real app, you'd store notifications in a separate collection
        // For now, we'll just return success
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

module.exports = router;