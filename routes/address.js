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

  // Check address limit (maximum 3 addresses)
  if (user.addresses && user.addresses.length >= 3) {
    throw new AppError('You can only have a maximum of 3 addresses. Please delete an existing address before adding a new one.', 400);
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

  // Ensure addresses array exists
  if (!user.addresses) {
    user.addresses = [];
    await user.save();
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

// Delete address
router.delete('/:addressId', isLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    throw new AppError('Address not found', 404);
  }

  // Don't allow deletion if it's the only address
  if (user.addresses.length === 1) {
    throw new AppError('You must have at least one address. Please add another address before deleting this one.', 400);
  }

  // If deleting the default address, set the first remaining address as default
  if (address.defaultShipping) {
    const remainingAddresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addressId);
    if (remainingAddresses.length > 0) {
      remainingAddresses[0].defaultShipping = true;
    }
  }

  // Remove the address
  user.addresses.pull(req.params.addressId);
  await user.save();

  res.json({
    message: 'Address deleted successfully',
    addresses: user.addresses
  });
}));

module.exports = router; 