const express = require('express');
const router = express.Router();
const User = require('../models/user');
const addressSchema = require('../validations/address');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Add new address
router.post('/add', isLoggedIn, asyncWrap(async (req, res) => {
  // Validate address data
  const { error, value } = addressSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check for duplicate address
  const isDuplicate = user.addresses.some(addr => 
    addr.street === value.street &&
    addr.city === value.city &&
    addr.state === value.state &&
    addr.postalCode === value.postalCode
  );

  if (isDuplicate) {
    throw new AppError('This address already exists', 400);
  }

  // Add the address
  await user.addAddress(value);

  // Get updated user with addresses
  const updatedUser = await User.findById(req.user._id);
  
  res.json({
    message: 'Address added successfully',
    addresses: updatedUser.addresses
  });
}));

// Get user's addresses
router.get('/', isLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ addresses: user.addresses });
}));

// Get single address
router.get('/:addressId', isLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }

  res.json({ address });
}));

// Update address
router.put('/:addressId', isLoggedIn, asyncWrap(async (req, res) => {
  // Validate address data
  const { error, value } = addressSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }

  // If setting as default, unset other defaults
  if (value.defaultShipping) {
    user.addresses.forEach(addr => {
      addr.defaultShipping = false;
    });
  }

  // Update address fields
  Object.assign(address, value);
  await user.save();

  res.json({
    message: 'Address updated successfully',
    addresses: user.addresses
  });
}));

// Set default address
router.put('/:addressId/default', isLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }

  // Unset default on all addresses
  user.addresses.forEach(addr => {
    addr.defaultShipping = false;
  });

  // Set the selected address as default
  address.defaultShipping = true;
  await user.save();

  res.json({
    message: 'Default address updated successfully',
    addresses: user.addresses
  });
}));

module.exports = router; 