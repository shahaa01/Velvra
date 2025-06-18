const flash = require('connect-flash');
const Cart = require('../models/cart');

module.exports.localStore = async (req, res, next) => {
    res.locals.numberOfCartItems = await Cart.findOne({user: req.user._id}, {items : 1});
    console.log(res.locals.numberOfCartItems);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
}