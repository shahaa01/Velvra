const User = require('../models/user');
const passport = require('passport');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Render signup page
const renderSignup = (req, res) => {
    res.render('page/signup', {
        title: 'Sign Up',
        user: req.user
    });
};

// Render login page
const renderLogin = (req, res) => {
    res.render('page/login', {
        title: 'Login',
        user: req.user
    });
};

// Handle user registration
const signup = asyncWrap(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    console.log('Signup attempt:', { email, firstName, lastName, password });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    // Create new user with passport-local-mongoose
    const user = await User.register(new User({
        email,
        firstName,
        lastName: lastName || '' // Provide fallback for empty lastName
    }), password);

    console.log('User registered successfully:', user._id);

    // Log the user in after successful registration
    req.login(user, (err) => {
        if (err) {
            console.error('Login after registration error:', err);
            throw new AppError('Error during login after registration', 500);
        }
        req.flash('success', 'Welcome to Velvra!');
        res.redirect('/home');
    });
});

// Handle user login
const login = (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = req.session.returnTo || '/home';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

// Handle user logout
const logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            throw new AppError('Error during logout', 500);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/home');
    });
};

// Google OAuth authentication
const googleAuth = (req, res) => {
    console.log('Google OAuth initiated');
    console.log('Environment variables check:', {
        clientID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/auth/google/callback'
    });
    
    // Store the intended destination for after Google auth
    if (req.query.redirect) {
        req.session.returnTo = req.query.redirect;
    }
    
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })(req, res);
};

// Google OAuth callback
const googleCallback = (req, res) => {
    console.log('Google OAuth callback received');
    console.log('Query params:', req.query);
    console.log('User object:', req.user);
    
    passport.authenticate('google', { 
        failureRedirect: '/auth/login',
        failureFlash: 'Google authentication failed. Please try again.'
    })(req, res, (err) => {
        if (err) {
            console.error('Google OAuth callback error:', err);
            throw new AppError(`Google authentication error: ${err.message}`, 500);
        }
        
        try {
            console.log('Google OAuth successful, user:', req.user);
            
            // Check if this is a new user by looking at the user object flag
            const isNewUser = req.user.isNewGoogleUser;
            
            if (isNewUser) {
                req.flash('success', `Welcome to Velvra, ${req.user.firstName}! Your account has been created successfully.`);
                // Clear the flag after using it
                delete req.user.isNewGoogleUser;
            } else {
                req.flash('success', `Welcome back, ${req.user.firstName}!`);
            }
            
            // Redirect to the intended destination or home
            const redirectUrl = req.session.returnTo || '/home';
            delete req.session.returnTo;
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Google callback processing error:', error);
            throw new AppError('Error during Google authentication', 500);
        }
    });
};

// Get current user info
const getCurrentUser = (req, res) => {
    if (!req.user) {
        throw new AppError('Not authenticated', 401);
    }
    res.json({
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName || '', // Provide fallback for empty lastName
        authMethod: req.user.authMethod,
        googleProfile: req.user.googleProfile
    });
};

module.exports = {
    renderSignup,
    renderLogin,
    signup,
    login,
    logout,
    googleAuth,
    googleCallback,
    getCurrentUser
}; 