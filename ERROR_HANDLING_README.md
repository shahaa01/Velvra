# 🛡️ Velvra Error Handling System

A robust and elegant error handling system for the Velvra e-commerce platform, designed to provide a premium user experience while maintaining excellent developer experience.

## 🎯 Features

### ✅ **Core Components**
- **AppError Class**: Custom error class with status codes and operational flags
- **asyncWrap Utility**: Wraps async route handlers to catch errors automatically
- **Error Middleware**: Comprehensive error handling for different scenarios
- **Enhanced Flash Messages**: Beautiful, animated flash messages with SweetAlert integration
- **404 Page**: Elegant "Page Not Found" page with search functionality
- **Development Error Page**: Detailed error information for debugging

### ✅ **Error Types Handled**
- **404 Not Found**: Custom 404 page with helpful navigation
- **400 Bad Request**: Validation errors, duplicate keys, file upload issues
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied
- **500 Server Error**: Internal server errors
- **Mongoose Errors**: Cast errors, validation errors, duplicate keys
- **JWT Errors**: Token validation and expiration
- **Multer Errors**: File upload size, count, and format issues

### ✅ **User Experience**
- **Elegant Flash Messages**: Tailwind-styled messages with icons and animations
- **SweetAlert Integration**: Toast notifications for better UX
- **Graceful Fallbacks**: Always provides user-friendly error messages
- **Search Integration**: 404 page includes search functionality
- **Responsive Design**: Works perfectly on all devices

## 🚀 Quick Start

### 1. **Using AppError in Controllers**

```javascript
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Wrap async functions
exports.getProduct = asyncWrap(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  
  res.json(product);
});
```

### 2. **Flash Messages**

```javascript
// In your controller
req.flash('success', 'Product added successfully!');
req.flash('error', 'Something went wrong!');
req.flash('info', 'Please check your email.');
req.flash('warning', 'Your session will expire soon.');

// Messages automatically appear as beautiful toasts
```

### 3. **Error Handling in Routes**

```javascript
// Automatic error handling with asyncWrap
router.get('/products/:id', asyncWrap(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
}));
```

## 📁 File Structure

```
utils/
├── AppError.js              # Custom error class
├── asyncWrap.js             # Async wrapper utility
└── flashMessages.js         # Enhanced flash message utilities

middlewares/
└── errorMiddleware.js       # Error handling middlewares

views/error/
├── 404.ejs                  # Beautiful 404 page
└── dev-error.ejs            # Development error page

routes/
└── testErrorRoute.js        # Test routes for error handling
```

## 🎨 Flash Message Types

### **Success Messages**
- Green background with checkmark icon
- Auto-dismiss after 4 seconds
- SweetAlert toast integration

### **Error Messages**
- Red background with X icon
- Auto-dismiss after 5 seconds
- Detailed error information

### **Info Messages**
- Blue background with info icon
- Auto-dismiss after 4 seconds
- Perfect for mode switches

### **Warning Messages**
- Yellow background with warning icon
- Auto-dismiss after 5 seconds
- Important but non-critical alerts

## 🔧 Configuration

### **Environment-Based Error Handling**

```javascript
// In app.js
if (process.env.NODE_ENV === 'development') {
  app.use(handleDevError);  // Detailed error pages
} else {
  app.use(handleError);     // User-friendly errors
}
```

### **Flash Message Styling**

```javascript
// Customize in utils/flashMessages.js
const baseClasses = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
};
```

## 🧪 Testing the System

### **Test Routes (Development Only)**

Visit these URLs to test different error scenarios:

- `/test-error/not-found` - 404 error
- `/test-error/bad-request` - 400 error
- `/test-error/unauthorized` - 401 error
- `/test-error/forbidden` - 403 error
- `/test-error/server-error` - 500 error
- `/test-error/async-error` - Async error handling
- `/test-error/validation-error` - Mongoose validation error
- `/test-error/duplicate-error` - Duplicate key error
- `/test-error/flash-test` - Flash message test

### **Manual Testing**

1. **404 Errors**: Visit any non-existent route
2. **Flash Messages**: Use the flash-test route
3. **Database Errors**: Try accessing invalid product IDs
4. **Validation Errors**: Submit invalid forms

## 🎯 Best Practices

### **1. Always Use asyncWrap for Async Functions**
```javascript
// ✅ Good
exports.getData = asyncWrap(async (req, res) => {
  const data = await Model.find();
  res.json(data);
});

// ❌ Bad
exports.getData = async (req, res) => {
  try {
    const data = await Model.find();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
```

### **2. Use AppError for Operational Errors**
```javascript
// ✅ Good
if (!user) {
  throw new AppError('User not found', 404);
}

// ❌ Bad
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
```

### **3. Provide Meaningful Error Messages**
```javascript
// ✅ Good
throw new AppError('You can only review products you have purchased', 403);

// ❌ Bad
throw new AppError('Access denied', 403);
```

### **4. Use Appropriate Flash Message Types**
```javascript
// ✅ Good
req.flash('success', 'Order placed successfully!');
req.flash('info', 'Switched to seller mode');
req.flash('warning', 'Your cart will expire in 30 minutes');
req.flash('error', 'Payment failed. Please try again.');

// ❌ Bad
req.flash('success', 'Error occurred'); // Wrong type
```

## 🔒 Security Considerations

### **Error Information Exposure**
- **Development**: Full error details, stack traces
- **Production**: User-friendly messages only
- **API Requests**: JSON error responses
- **Regular Requests**: Flash messages with redirects

### **Error Logging**
- All errors are logged with context
- Includes user information (if available)
- Request details for debugging
- Stack traces in development

## 🚀 Performance

### **Optimizations**
- **Lightweight**: Minimal overhead on request processing
- **Efficient**: Error handling doesn't block normal operations
- **Cached**: Flash messages are session-based
- **Async**: Non-blocking error processing

### **Monitoring**
- Error rates and types are logged
- Performance impact is minimal
- Memory usage is optimized

## 🎨 Customization

### **Styling Flash Messages**
```css
/* Customize in your CSS */
.flash-message {
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### **Custom Error Pages**
```javascript
// Create custom error pages in views/error/
// 404.ejs, 500.ejs, maintenance.ejs, etc.
```

### **SweetAlert Configuration**
```javascript
// Customize in utils/flashMessages.js
const swalToastConfig = {
  success: {
    timer: 3000,
    position: 'top-end',
    // ... more options
  }
};
```

## 📚 Integration Examples

### **With Express Routes**
```javascript
const router = express.Router();
const asyncWrap = require('../utils/asyncWrap');
const AppError = require('../utils/AppError');

router.get('/products/:id', asyncWrap(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  res.json(product);
}));
```

### **With Controllers**
```javascript
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

exports.createProduct = asyncWrap(async (req, res) => {
  const { name, price } = req.body;
  
  if (!name || !price) {
    throw new AppError('Name and price are required', 400);
  }
  
  const product = await Product.create({ name, price });
  req.flash('success', 'Product created successfully!');
  res.redirect('/products');
});
```

### **With Middleware**
```javascript
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};
```

## 🎉 Benefits

### **For Users**
- ✅ **Elegant Error Pages**: Beautiful 404 and error pages
- ✅ **Clear Feedback**: Understandable error messages
- ✅ **Helpful Navigation**: Search and navigation options
- ✅ **Consistent Experience**: Uniform error handling across the app

### **For Developers**
- ✅ **Easy Implementation**: Simple asyncWrap and AppError usage
- ✅ **Comprehensive Coverage**: Handles all common error scenarios
- ✅ **Debugging Support**: Detailed error information in development
- ✅ **Maintainable Code**: Clean, consistent error handling patterns

### **For Business**
- ✅ **Professional Appearance**: Premium error pages enhance brand
- ✅ **User Retention**: Better UX reduces bounce rates
- ✅ **Support Efficiency**: Clear error messages reduce support tickets
- ✅ **SEO Friendly**: Proper 404 pages help with search rankings

---

**🎯 The Velvra Error Handling System provides a robust, elegant, and user-friendly approach to managing errors across your e-commerce platform. It ensures that users always have a premium experience, even when things go wrong.** 