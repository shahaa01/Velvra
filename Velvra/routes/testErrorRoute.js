const express = require('express');
const router = express.Router();
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Test route for 404 error
router.get('/not-found', (req, res, next) => {
  next(new AppError('This is a test 404 error', 404));
});

// Test route for 400 error
router.get('/bad-request', (req, res, next) => {
  next(new AppError('This is a test 400 error', 400));
});

// Test route for 401 error
router.get('/unauthorized', (req, res, next) => {
  next(new AppError('This is a test 401 error', 401));
});

// Test route for 403 error
router.get('/forbidden', (req, res, next) => {
  next(new AppError('This is a test 403 error', 403));
});

// Test route for 500 error
router.get('/server-error', (req, res, next) => {
  next(new AppError('This is a test 500 error', 500));
});

// Test route for async error
router.get('/async-error', asyncWrap(async (req, res) => {
  throw new AppError('This is a test async error', 500);
}));

// Test route for validation error
router.get('/validation-error', (req, res, next) => {
  const error = new Error('Validation failed');
  error.name = 'ValidationError';
  error.errors = {
    email: { message: 'Email is required' },
    password: { message: 'Password must be at least 8 characters' }
  };
  next(error);
});

// Test route for duplicate key error
router.get('/duplicate-error', (req, res, next) => {
  const error = new Error('Duplicate key error');
  error.code = 11000;
  error.keyValue = { email: 'test@example.com' };
  next(error);
});

// Test route for flash messages
router.get('/flash-test', (req, res) => {
  req.flash('success', 'This is a success message!');
  req.flash('error', 'This is an error message!');
  req.flash('info', 'This is an info message!');
  req.flash('warning', 'This is a warning message!');
  res.redirect('/home');
});

module.exports = router; 