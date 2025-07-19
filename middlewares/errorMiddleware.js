const AppError = require('../utils/AppError');

// Handle 404 errors - Page Not Found
const handleNotFound = (req, res, next) => {
  const error = new AppError(`Page not found - ${req.originalUrl}`, 404);
  next(error);
};

// Handle AppError and generic errors
const handleError = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user ? req.user._id : 'Not logged in'
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join('. ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again.';
    error = new AppError(message, 401);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large. Please upload a smaller file.';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files. Please upload fewer files.';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field.';
    error = new AppError(message, 400);
  }

  // Default error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.message = 'Something went wrong!';
  }

  // Determine if request expects JSON
  const isAPIRequest = req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json');

  if (isAPIRequest) {
    // Send JSON response for API requests
    return res.status(error.statusCode).json({
      status: error.status || 'error',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    // Send flash message and redirect for regular requests
    req.flash('error', error.message);
    
    // Redirect to appropriate page based on error type
    if (error.statusCode === 401) {
      return res.redirect('/auth/login');
    } else if (error.statusCode === 403) {
      return res.redirect('/home');
    } else if (error.statusCode === 404) {
      return res.status(404).render('error/404', {
        title: 'Page Not Found',
        user: req.user,
        error: error
      });
    } else {
      return res.redirect('back');
    }
  }
};

// Development error handler (more detailed)
const handleDevError = (err, req, res, next) => {
  const isAPIRequest = req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json');

  if (isAPIRequest) {
    return res.status(err.statusCode || 500).json({
      status: err.status || 'error',
      message: err.message,
      stack: err.stack,
      error: err
    });
  } else {
    // For development, show error page with details
    return res.status(err.statusCode || 500).render('error/dev-error', {
      title: 'Error',
      user: req.user,
      error: err
    });
  }
};

module.exports = {
  handleNotFound,
  handleError,
  handleDevError
}; 