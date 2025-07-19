const User = require('../models/user');
const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Admin credentials (in production, these should be in environment variables)
const ADMIN_USERNAME = 'shahaa01';
const ADMIN_PASSWORD = 'Sangita@#1020';

// Show admin login page
const showAdminLogin = (req, res) => {
    // If already logged in as admin, redirect to dashboard
    if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }
    
    res.render('admin/adminLogin', {
        title: 'Admin Login',
        error: req.flash('error'),
        success: req.flash('success')
    });
};

// Handle admin login
const adminLogin = asyncWrap(async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        throw new AppError('Username and password are required', 400);
    }

    // Check admin credentials
    if (username !== ADMIN_USERNAME) {
        throw new AppError('Invalid admin credentials', 401);
    }

    if (password !== ADMIN_PASSWORD) {
        throw new AppError('Invalid admin credentials', 401);
    }

    // Find or create admin user
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
        // Create admin user if it doesn't exist
        adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@velvra.com',
            username: ADMIN_USERNAME,
            role: 'admin',
            authMethod: 'local'
        });
        
        // Hash the password (even though we're using hardcoded credentials)
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
        adminUser.password = hashedPassword;
        
        await adminUser.save();
        console.log('Admin user created successfully');
    }

    // Log the admin in
    req.login(adminUser, (err) => {
        if (err) {
            console.error('Admin login error:', err);
            throw new AppError('Login failed. Please try again.', 500);
        }

        // Set session to expire when browser closes (no persistent login)
        req.session.cookie.maxAge = null;
        req.session.cookie.expires = false;
        
        console.log(`Admin logged in: ${adminUser.username}`);
        res.redirect('/admin/dashboard');
    });
});

// Admin logout
const adminLogout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Admin logout error:', err);
        }
        
        // Destroy session completely
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
            
            res.redirect('/admin/login');
        });
    });
};

// Middleware to ensure admin is logged in for protected routes
const requireAdminAuth = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next(new AppError('Please log in to access the admin panel', 401));
    }

    if (req.user.role !== 'admin') {
        return next(new AppError('Access denied. Admin privileges required.', 403));
    }

    next();
};

// Middleware to prevent admin from accessing login page when already logged in
const preventAdminLoginAccess = (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }
    next();
};

module.exports = {
    showAdminLogin,
    adminLogin,
    adminLogout,
    requireAdminAuth,
    preventAdminLoginAccess
}; 