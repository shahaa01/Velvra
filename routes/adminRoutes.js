const express = require('express');
const router = express.Router();
const { checkAdminAccess, isAdmin } = require('../middlewares/adminMiddleware');
const { 
    showAdminLogin, 
    adminLogin, 
    adminLogout, 
    requireAdminAuth, 
    preventAdminLoginAccess 
} = require('../controllers/adminController');
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Seller = require('../models/Seller');
const Cart = require('../models/cart');

// Admin login routes (no authentication required)
router.get('/login', preventAdminLoginAccess, showAdminLogin);
router.post('/login', preventAdminLoginAccess, adminLogin);
router.get('/logout', adminLogout);

// Apply admin middleware to all protected routes
router.use(requireAdminAuth);

// Admin Dashboard Home
router.get('/dashboard', async (req, res) => {
    try {
        // Get dashboard statistics
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalSellers = await User.countDocuments({ role: 'seller' });
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        // Calculate total revenue from completed orders
        const revenueResult = await Order.aggregate([
            { $match: { orderStatus: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        
        // Get recent orders with user details
        const recentOrders = await Order.find()
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(5);
        
        // Get top sellers by revenue
        const topSellers = await Order.aggregate([
            { $match: { orderStatus: 'delivered' } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $lookup: {
                    from: 'sellers',
                    localField: 'product.seller',
                    foreignField: '_id',
                    as: 'seller'
                }
            },
            { $unwind: '$seller' },
            {
                $group: {
                    _id: '$seller._id',
                    brandName: { $first: '$seller.brandName' },
                    totalSales: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.totalPrice' }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 }
        ]);
        
        // Get weekly revenue data (last 7 days)
        const weeklyRevenue = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));
            
            const dayRevenue = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfDay, $lte: endOfDay },
                        orderStatus: 'delivered'
                    }
                },
                { $group: { _id: null, revenue: { $sum: '$total' } } }
            ]);
            
            weeklyRevenue.push({
                date: startOfDay.toISOString().split('T')[0],
                revenue: dayRevenue.length > 0 ? dayRevenue[0].revenue : 0
            });
        }
        
        // Get category statistics
        const categoryStats = await Product.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ]);

        res.render('admin/AdminDashboard', {
            title: 'Admin Dashboard',
            totalUsers,
            totalSellers,
            totalProducts,
            totalOrders,
            totalRevenue,
            recentOrders,
            topSellers,
            weeklyRevenue,
            categoryStats,
            adminUser: req.user
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        req.flash('error', 'Error loading dashboard data');
        res.redirect('/admin/dashboard');
    }
});

// User Management
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        // Get users with pagination
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        // Get total counts for statistics
        const totalUsers = await User.countDocuments({ role: 'user' });
        const activeUsers = await User.countDocuments({ role: 'user' }); // All users are considered active for now
        const suspendedUsers = await User.countDocuments({ role: 'user', status: 'suspended' });
        const bannedUsers = await User.countDocuments({ role: 'user', status: 'banned' });
        
        // Get user statistics with order data
        const usersWithStats = await Promise.all(users.map(async (user) => {
            // Get user's order count and total spent
            const userOrders = await Order.find({ user: user._id });
            const orderCount = userOrders.length;
            const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
            
            // Get user's cart total
            const userCart = await Cart.findOne({ user: user._id });
            const cartTotal = userCart ? userCart.total : 0;
            
            // Get user's default address
            const defaultAddress = user.addresses.find(addr => addr.defaultShipping) || user.addresses[0];
            
            return {
                ...user.toObject(),
                orderCount,
                totalSpent,
                cartTotal,
                defaultAddress,
                status: user.status || 'active', // Default status
                verified: user.googleProfile?.verified_email || false
            };
        }));
        
        const totalPages = Math.ceil(totalUsers / limit);

        res.render('admin/AdminUserManagement', {
            title: 'User Management',
            users: usersWithStats,
            currentPage: page,
            totalPages,
            totalUsers,
            activeUsers,
            suspendedUsers,
            bannedUsers,
            adminUser: req.user
        });
    } catch (error) {
        console.error('User management error:', error);
        req.flash('error', 'Error loading users');
        res.redirect('/admin/dashboard');
    }
});

// Product Management
router.get('/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        const products = await Product.find()
            .populate('seller', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('admin/AdminProductManagement', {
            title: 'Product Management',
            products,
            currentPage: page,
            totalPages,
            totalProducts,
            adminUser: req.user
        });
    } catch (error) {
        console.error('Product management error:', error);
        req.flash('error', 'Error loading products');
        res.redirect('/admin/dashboard');
    }
});

// Order Management
router.get('/orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        const orders = await Order.find()
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name brand images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('admin/AdminOrderManagement', {
            title: 'Order Management',
            orders,
            currentPage: page,
            totalPages,
            totalOrders,
            adminUser: req.user
        });
    } catch (error) {
        console.error('Order management error:', error);
        req.flash('error', 'Error loading orders');
        res.redirect('/admin/dashboard');
    }
});

// Inventory Management
router.get('/inventory', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        const products = await Product.find()
            .populate('seller', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        // Calculate inventory statistics
        const lowStockProducts = products.filter(product => 
            product.colors.some(color => color.stock < 5)
        );

        res.render('admin/AdminInventoryManagement', {
            title: 'Inventory Management',
            products,
            lowStockProducts,
            currentPage: page,
            totalPages,
            totalProducts,
            adminUser: req.user
        });
    } catch (error) {
        console.error('Inventory management error:', error);
        req.flash('error', 'Error loading inventory data');
        res.redirect('/admin/dashboard');
    }
});

// Finance and Reports
router.get('/finance', async (req, res) => {
    try {
        // Get financial statistics
        const totalRevenue = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const monthlyRevenue = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { 
                _id: { 
                    year: { $year: '$createdAt' }, 
                    month: { $month: '$createdAt' } 
                }, 
                revenue: { $sum: '$total' },
                count: { $sum: 1 }
            }},
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        const recentOrders = await Order.find({ status: 'completed' })
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(10);

        res.render('admin/AdminFinanceAndReports', {
            title: 'Finance & Reports',
            totalRevenue: totalRevenue[0]?.total || 0,
            monthlyRevenue,
            recentOrders,
            adminUser: req.user
        });
    } catch (error) {
        console.error('Finance reports error:', error);
        req.flash('error', 'Error loading financial data');
        res.redirect('/admin/dashboard');
    }
});

// Promotions Management
router.get('/promotions', async (req, res) => {
    try {
        const products = await Product.find({ sale: true })
            .populate('seller', 'firstName lastName')
            .sort({ salePercentage: -1 });

        res.render('admin/AdminPromotionsManagement', {
            title: 'Promotions Management',
            products,
            adminUser: req.user
        });
    } catch (error) {
        console.error('Promotions management error:', error);
        req.flash('error', 'Error loading promotions data');
        res.redirect('/admin/dashboard');
    }
});

// Complaints Management
router.get('/complaints', async (req, res) => {
    try {
        // This would typically connect to a complaints model
        // For now, we'll show a placeholder
        const complaints = []; // Placeholder for complaints data

        res.render('admin/AdminComplaint', {
            title: 'Complaints Management',
            complaints,
            adminUser: req.user
        });
    } catch (error) {
        console.error('Complaints management error:', error);
        req.flash('error', 'Error loading complaints data');
        res.redirect('/admin/dashboard');
    }
});

// Settings
router.get('/settings', async (req, res) => {
    try {
        res.render('admin/AdminSettings', {
            title: 'Admin Settings',
            adminUser: req.user
        });
    } catch (error) {
        console.error('Settings error:', error);
        req.flash('error', 'Error loading settings');
        res.redirect('/admin/dashboard');
    }
});

router.get('/sellers', async (req, res) => {
    try {
        res.render('admin/sellerManagement', {
            title: 'Seller Management',
            adminUser: req.user
        });
    } catch (error) {
        console.error('Seller management error:', error);
        req.flash('error', 'Error loading seller data');
        res.redirect('/admin/dashboard');
    }
});

// API Routes for AJAX requests

// Update user role
router.put('/users/:userId/role', isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['user', 'seller', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user
router.delete('/users/:userId', isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update product status
router.put('/products/:productId/status', isAdmin, async (req, res) => {
    try {
        const { productId } = req.params;
        const { status } = req.body;

        const product = await Product.findByIdAndUpdate(productId, { status }, { new: true });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error('Update product status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update order status
router.put('/orders/:orderId/status', isAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 