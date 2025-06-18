const flash = require('connect-flash');
const Cart = require('../models/cart');

module.exports.localStore = async (req, res, next) => {
    if (req.user && req.user._id) {
        res.locals.numberOfCartItems = await Cart.findOne({user: req.user._id}, {items : 1});
        res.locals.userRole = req.user.role;
    } else {
        res.locals.numberOfCartItems = { items: [] };
    }
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
}