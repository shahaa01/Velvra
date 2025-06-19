const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn, validateSignup, validateLogin } = require('../middlewares/authMiddleware');
const { renderSignup, renderLogin, signup, login, logout, googleAuth, googleCallback, getCurrentUser } = require('../controllers/authController');

// Signup routes
router.route('/signup')
    .get(isNotLoggedIn, renderSignup)
    .post(isNotLoggedIn, validateSignup, signup);

// Login routes
router.route('/login')
    .get(isNotLoggedIn, renderLogin)
    .post(isNotLoggedIn, validateLogin, passport.authenticate('local', {
        failureFlash: true,
        failureRedirect: '/auth/login',
        keepSessionInfo: true
    }), login);

// Google OAuth routes
router.get('/google', isNotLoggedIn, googleAuth);
router.get('/google/callback', isNotLoggedIn, googleCallback);

// Logout route
router.get('/logout', isLoggedIn, logout);

// Get current user info
router.get('/me', isLoggedIn, getCurrentUser);

module.exports = router;