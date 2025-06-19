const { signupSchema, loginSchema } = require('../validations/authValidation');

// Middleware to check if user is authenticated
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'You must be logged in to access this page');
    res.redirect('/auth/login');
};

// Middleware to check if user is not authenticated
const isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/home');
};

// Middleware to validate signup data
const validateSignup = (req, res, next) => {
    const { error } = signupSchema.validate(req.body);
    if (error) {
        req.flash('error', error.details[0].message);
        return res.redirect('/auth/signup');
    }
    next();
};

// Middleware to validate login data
const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        req.flash('error', error.details[0].message);
        return res.redirect('/auth/login');
    }
    next();
};

module.exports = {
    isLoggedIn,
    isNotLoggedIn,
    validateSignup,
    validateLogin
}; 