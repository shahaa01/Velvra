const Seller = require('../models/Seller');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const { sellerSchema } = require('../validations/sellerValidation');
const Product = require('../models/product');
const Order = require('../models/order');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Render the seller form page
exports.renderSellerForm = (req, res) => {
  res.render('page/seller', { errors: req.flash('error'), old: req.flash('old')[0] || {} });
};

// Handle seller registration POST
exports.handleSellerRegistration = asyncWrap(async (req, res) => {
  // Joi validation
  const joiData = { ...req.body };
  // Convert file fields to string for Joi (phone, panVatNumber)
  joiData.phone = String(joiData.phone);
  joiData.panVatNumber = String(joiData.panVatNumber);
  const { error: joiError } = sellerSchema.validate(joiData, { abortEarly: false });
  if (joiError) {
    throw new AppError(joiError.details.map(e => e.message).join(', '), 400);
  }

  // Validate fields
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array().map(e => e.msg).join(', '), 400);
  }

  // Handle file upload (panVatDocument)
  if (!req.files || !req.files.panVatDocument) {
    throw new AppError('PAN/VAT registration document is required', 400);
  }
  
  const file = req.files.panVatDocument;
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError('Invalid file type for PAN/VAT document', 400);
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new AppError('PAN/VAT document must be less than 5MB', 400);
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

  req.flash('success', 'Seller registration completed successfully!');
  res.redirect('/seller-dashboard');
});

// Seller Dashboard - Dynamic Data
exports.getSellerDashboard = asyncWrap(async (req, res) => {
  // Find the seller for the logged-in user
  const seller = await Seller.findOne({ user: req.user._id });
  if (!seller) {
    throw new AppError('Seller profile not found. Please complete your registration.', 404);
  }

  // Redirect to the new seller dashboard
  res.redirect('/seller-dashboard');
}); 