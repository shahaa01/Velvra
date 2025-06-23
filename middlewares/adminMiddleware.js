const { isLoggedIn } = require('./authMiddleware');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    // First check if user is logged in
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in to access this page');
        return res.redirect('/auth/login');
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
        req.flash('error', 'Access denied. Admin privileges required.');
        return res.redirect('/home');
    }

    next();
};

// Middleware to check if user is admin or seller
const isAdminOrSeller = (req, res, next) => {
    // First check if user is logged in
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in to access this page');
        return res.redirect('/auth/login');
    }

    // Check if user has admin or seller role
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
        req.flash('error', 'Access denied. Admin or seller privileges required.');
        return res.redirect('/home');
    }

    next();
};

// Middleware to check if user is admin or the owner of the resource
const isAdminOrOwner = (req, res, next) => {
    // First check if user is logged in
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in to access this page');
        return res.redirect('/auth/login');
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
        return next();
    }

    // Check if user is the owner of the resource
    if (req.params.userId && req.params.userId === req.user._id.toString()) {
        return next();
    }

    req.flash('error', 'Access denied. You can only access your own resources.');
    return res.redirect('/home');
};

// Middleware to add admin context to res.locals
const addAdminContext = (req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.isAdmin = req.user.role === 'admin';
        res.locals.isSeller = req.user.role === 'seller';
        res.locals.currentUser = req.user;
    } else {
        res.locals.isAdmin = false;
        res.locals.isSeller = false;
        res.locals.currentUser = null;
    }
    next();
};

// Middleware to check if admin dashboard should be accessible
const checkAdminAccess = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You must be logged in to access the admin dashboard');
        return res.redirect('/admin/login');
    }

    if (req.user.role !== 'admin') {
        req.flash('error', 'Access denied. Admin privileges required.');
        return res.redirect('/home');
    }

    // Add admin-specific data to res.locals
    res.locals.adminUser = req.user;
    res.locals.adminDashboard = true;
    
    next();
};

module.exports = {
    isAdmin,
    isAdminOrSeller,
    isAdminOrOwner,
    addAdminContext,
    checkAdminAccess
}; 