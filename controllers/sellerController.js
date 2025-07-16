const Seller = require('../models/Seller');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const { sellerSchema } = require('../validations/sellerValidation');
const Product = require('../models/product');
const Order = require('../models/order');

// Render the seller form page
exports.renderSellerForm = (req, res) => {
  res.render('page/seller', { errors: req.flash('error'), old: req.flash('old')[0] || {} });
};

// Handle seller registration POST
exports.handleSellerRegistration = async (req, res) => {
  try {
    // Joi validation
    const joiData = { ...req.body };
    // Convert file fields to string for Joi (phone, panVatNumber)
    joiData.phone = String(joiData.phone);
    joiData.panVatNumber = String(joiData.panVatNumber);
    const { error: joiError } = sellerSchema.validate(joiData, { abortEarly: false });
    if (joiError) {
      req.flash('error', joiError.details.map(e => e.message));
      req.flash('old', req.body);
      return res.redirect('/seller');
    }

    // Validate fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg));
      req.flash('old', req.body);
      return res.redirect('/seller');
    }

    // Handle file upload (panVatDocument)
    if (!req.files || !req.files.panVatDocument) {
      req.flash('error', 'PAN/VAT registration document is required');
      req.flash('old', req.body);
      return res.redirect('/seller');
    }
    const file = req.files.panVatDocument;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.mimetype)) {
      req.flash('error', 'Invalid file type for PAN/VAT document');
      req.flash('old', req.body);
      return res.redirect('/seller');
    }
    if (file.size > 5 * 1024 * 1024) {
      req.flash('error', 'PAN/VAT document must be less than 5MB');
      req.flash('old', req.body);
      return res.redirect('/seller');
    }
    // Save file
    const uploadDir = path.join(__dirname, '../public/uploads/panvat');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    await file.mv(filePath);
    const fileUrl = `/uploads/panvat/${fileName}`;

    // Save seller data
    const seller = new Seller({
      user: req.user._id,
      brandName: req.body.brandName,
      instagram: req.body.instagram,
      contactPerson: req.body.contactPerson,
      phone: req.body.phone,
      email: req.body.email,
      businessType: req.body.businessType,
      ownerName: req.body.ownerName,
      panVatNumber: req.body.panVatNumber,
      panVatDocument: fileUrl,
      location: req.body.location,
      city: req.body.city,
      message: req.body.message
    });
    await seller.save();

    // Update user role
    await User.findByIdAndUpdate(req.user._id, { role: 'seller' });

    // Redirect to seller dashboard
    res.redirect('/seller/dashboard');
  } catch (err) {
    console.error('Seller registration error:', err);
    req.flash('error', 'An error occurred while processing your application. Please try again.');
    req.flash('old', req.body);
    res.redirect('/seller');
  }
};

// Seller Dashboard - Dynamic Data
exports.getSellerDashboard = async (req, res) => {
  try {
    // Find the seller for the logged-in user
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return res.redirect('/seller');

    // Redirect to the new seller dashboard
    res.redirect('/seller-dashboard');
  } catch (err) {
    console.error('Seller dashboard error:', err);
    res.redirect('/seller');
  }
}; 