const express = require('express');
const router = express.Router();
const passport = require('passport');
const { validateMobileSignup, validateMobileLogin, validateMobileGoogleAuth, validateMobileProfileUpdate } = require('../middlewares/mobileAuthMiddleware');
const { authenticateJWT } = require('../middlewares/jwtMiddleware');
const { 
  mobileSignup, 
  mobileLogin, 
  mobileGoogleAuth, 
  mobileGoogleCallback,
  mobileGetProfile,
  mobileUpdateProfile,
  mobileLogout,
  mobileRefreshToken
} = require('../controllers/mobileAuthController');


// Mobile signup endpoint
router.post('/signup', validateMobileSignup, mobileSignup);

// Mobile login endpoint
router.post('/login', validateMobileLogin, mobileLogin);

// Mobile Google OAuth endpoints
router.post('/google', validateMobileGoogleAuth, mobileGoogleAuth);
router.post('/google/callback', mobileGoogleCallback);

// Mobile profile endpoints (protected)
router.get('/profile', authenticateJWT, mobileGetProfile);
router.put('/profile', authenticateJWT, validateMobileProfileUpdate, mobileUpdateProfile);

// Mobile logout endpoint
router.post('/logout', authenticateJWT, mobileLogout);

// Mobile refresh token endpoint
router.post('/refresh', mobileRefreshToken);

module.exports = router; 