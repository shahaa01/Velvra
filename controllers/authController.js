const User = require('../models/user');

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
const signup = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        console.log('Signup attempt:', { email, firstName, lastName, password });
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already registered');
            return res.redirect('/auth/signup');
        }

        // Create new user with passport-local-mongoose
        const user = await User.register(new User({
            email,
            firstName,
            lastName
        }), password);

        console.log('User registered successfully:', user._id);

        // Log the user in after successful registration
        req.login(user, (err) => {
            if (err) {
                console.error('Login after registration error:', err);
                req.flash('error', 'Error during login after registration');
                return res.redirect('/auth/login');
            }
            req.flash('success', 'Welcome to Velvra!');
            res.redirect('/home');
        });
    } catch (error) {
        console.error('Signup error:', error);
        req.flash('error', error.message || 'Error during registration');
        res.redirect('/auth/signup');
    }
};

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
            req.flash('error', 'Error during logout');
            return res.redirect('/home');
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/home');
    });
};

// Get current user info
const getCurrentUser = (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
    });
};

module.exports = {
    renderSignup,
    renderLogin,
    signup,
    login,
    logout,
    getCurrentUser
}; 