const User = require('../models/user');
const bcrypt = require('bcrypt');

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
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            req.flash('error', 'Username and password are required');
            return res.redirect('/admin/login');
        }

        // Check admin credentials
        if (username !== ADMIN_USERNAME) {
            req.flash('error', 'Invalid admin credentials');
            return res.redirect('/admin/login');
        }

        if (password !== ADMIN_PASSWORD) {
            req.flash('error', 'Invalid admin credentials');
            return res.redirect('/admin/login');
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
                req.flash('error', 'Login failed. Please try again.');
                return res.redirect('/admin/login');
            }

            // Set session to expire when browser closes (no persistent login)
            req.session.cookie.maxAge = null;
            req.session.cookie.expires = false;
            
            console.log(`Admin logged in: ${adminUser.username}`);
            res.redirect('/admin/dashboard');
        });

    } catch (error) {
        console.error('Admin login error:', error);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect('/admin/login');
    }
};

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
        req.flash('error', 'Please log in to access the admin panel');
        return res.redirect('/admin/login');
    }

    if (req.user.role !== 'admin') {
        req.flash('error', 'Access denied. Admin privileges required.');
        return res.redirect('/home');
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