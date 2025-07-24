const { verifyToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const User = require('../models/user');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// JWT authentication middleware for mobile app
const authenticateJWT = asyncWrap(async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError('Access token required', 401);
    }

    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);

    // Find user by ID
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401);
    } else if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401);
    }
    throw error;
  }
});

// Optional JWT authentication - doesn't throw error if no token
const optionalJWT = asyncWrap(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next(); // Continue without authentication
    }

    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
});

module.exports = {
  authenticateJWT,
  optionalJWT
}; 