const User = require('../models/user');
const passport = require('passport');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');
const { generateToken } = require('../utils/jwtUtils');

// Mobile signup endpoint
const mobileSignup = asyncWrap(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // Create new user using passport-local-mongoose (same as web app)
  const user = await User.register(new User({
    email,
    firstName: firstName || email.split('@')[0], // Use email prefix as firstName if not provided
    lastName: lastName || '',
    username: email // Ensure username is set
  }), password);

  // Generate JWT token
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName || '',
        authMethod: user.authMethod,
        role: user.role,
        isSeller: user.isSeller
      },
      token
    }
  });
});

// Mobile login endpoint
const mobileLogin = asyncWrap(async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt for email:', email);

  // Find user
  const user = await User.findOne({ email });
  console.log('User found:', user ? 'Yes' : 'No');
  
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password using passport-local-mongoose
  const isValidPassword = await user.authenticate(password);
  console.log('Password valid:', isValidPassword);
  
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  console.log('Authentication successful for user:', user._id);

  // Generate JWT token
  const token = generateToken(user);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName || '',
        authMethod: user.authMethod,
        role: user.role,
        isSeller: user.isSeller,
        phone: user.phone,
        googleProfile: user.googleProfile
      },
      token
    }
  });
});

// Mobile Google OAuth endpoint
const mobileGoogleAuth = asyncWrap(async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) {
    throw new AppError('Google ID token is required', 400);
  }

  // For mobile apps, we'll need to verify the ID token on the backend
  // This is a simplified implementation - in production, you should verify the token with Google
  try {
    // For now, we'll assume the token is valid and contains user info
    // In production, you should verify this token with Google's API
    const googleUser = {
      id: req.body.googleId,
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      picture: req.body.picture
    };

    // Find or create user
    const result = await User.findOrCreateGoogleUser({
      id: googleUser.id,
      emails: [{ value: googleUser.email }],
      name: {
        givenName: googleUser.firstName,
        familyName: googleUser.lastName
      },
      photos: [{ value: googleUser.picture }],
      _json: {
        locale: 'en',
        email_verified: true
      }
    });

    // Generate JWT token
    const token = generateToken(result.user);

    res.json({
      success: true,
      message: result.isNew ? 'User created successfully' : 'Login successful',
      data: {
        user: {
          id: result.user._id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName || '',
          authMethod: result.user.authMethod,
          role: result.user.role,
          isSeller: result.user.isSeller,
          phone: result.user.phone,
          googleProfile: result.user.googleProfile
        },
        token,
        isNewUser: result.isNew
      }
    });
  } catch (error) {
    throw new AppError('Google authentication failed', 401);
  }
});

// Mobile Google OAuth callback (for web-based OAuth flow)
const mobileGoogleCallback = asyncWrap(async (req, res) => {
  // This endpoint would be used if the mobile app opens a web view for Google OAuth
  // For now, we'll redirect to a success page with the token
  res.json({
    success: true,
    message: 'Google authentication successful',
    data: {
      token: req.body.token,
      user: req.body.user
    }
  });
});

// Get user profile
const mobileGetProfile = asyncWrap(async (req, res) => {
  const user = req.user;
  
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName || '',
        phone: user.phone,
        authMethod: user.authMethod,
        role: user.role,
        isSeller: user.isSeller,
        googleProfile: user.googleProfile,
        addresses: user.addresses
      }
    }
  });
});

// Update user profile
const mobileUpdateProfile = asyncWrap(async (req, res) => {
  const { firstName, lastName, phone, gender } = req.body;
  const user = req.user;

  // Update allowed fields
  if (firstName) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (gender) user.gender = gender;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName || '',
        phone: user.phone,
        gender: user.gender,
        authMethod: user.authMethod,
        role: user.role,
        isSeller: user.isSeller,
        googleProfile: user.googleProfile
      }
    }
  });
});

// Mobile logout
const mobileLogout = asyncWrap(async (req, res) => {
  // For JWT-based authentication, logout is handled client-side by removing the token
  // But we can implement server-side token blacklisting if needed
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Refresh token endpoint
const mobileRefreshToken = asyncWrap(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  // In a more secure implementation, you would validate the refresh token
  // For now, we'll assume the user is authenticated via the JWT middleware
  const user = req.user;
  
  if (!user) {
    throw new AppError('User not found', 401);
  }

  // Generate new access token
  const newToken = generateToken(user);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token: newToken
    }
  });
});

module.exports = {
  mobileSignup,
  mobileLogin,
  mobileGoogleAuth,
  mobileGoogleCallback,
  mobileGetProfile,
  mobileUpdateProfile,
  mobileLogout,
  mobileRefreshToken
}; 