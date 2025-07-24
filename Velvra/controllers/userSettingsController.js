const User = require('../models/user');
const { personalInfoSchema, addressSchema, passwordChangeSchema } = require('../validations/userSettingsValidation');
const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Update Personal Information
exports.updatePersonalInfo = asyncWrap(async (req, res) => {
  const { error, value } = personalInfoSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if email is being changed and if it's already taken
  if (value.email !== user.email) {
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      throw new AppError('Email is already taken', 400);
    }
  }

  // Update user fields
  user.firstName = value.firstName;
  user.lastName = value.lastName || '';
  user.email = value.email;
  user.phone = value.phone || '';

  // Handle date of birth if provided
  if (value.birthMonth && value.birthDay && value.birthYear) {
    user.dateOfBirth = new Date(value.birthYear, value.birthMonth - 1, value.birthDay);
  }

  await user.save();

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, message: 'Personal information updated successfully' });
  }
  
  req.flash('success', 'Personal information updated successfully');
  res.redirect('/dashboard/settings');
});

// Update Address
exports.updateAddress = asyncWrap(async (req, res) => {
  const { error, value } = addressSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Find default address or create new one
  let defaultAddress = user.addresses.find(addr => addr.defaultShipping);
  
  if (defaultAddress) {
    // Update existing default address
    defaultAddress.street = value.street;
    defaultAddress.city = value.city;
    defaultAddress.state = value.state;
    defaultAddress.postalCode = value.postalCode;
    defaultAddress.country = value.country || 'United States';
    if (value.apartment) {
      defaultAddress.apartment = value.apartment;
    }
  } else {
    // Create new default address
    const newAddress = {
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone || '',
      street: value.street,
      city: value.city,
      state: value.state,
      postalCode: value.postalCode,
      country: value.country || 'United States',
      defaultShipping: true
    };
    if (value.apartment) {
      newAddress.apartment = value.apartment;
    }
    user.addresses.push(newAddress);
  }

  await user.save();

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, message: 'Address updated successfully' });
  }
  
  req.flash('success', 'Address updated successfully');
  res.redirect('/dashboard/settings');
});

// Update Password (Local Strategy Only)
exports.updatePassword = asyncWrap(async (req, res) => {
  // Check if user is using local strategy
  if (req.user.authMethod !== 'local') {
    throw new AppError('Password change not available for social login users', 400);
  }

  const { error, value } = passwordChangeSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isMatch = await user.authenticate(value.currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  await user.setPassword(value.newPassword);
  await user.save();

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, message: 'Password updated successfully' });
  }
  
  req.flash('success', 'Password updated successfully');
  res.redirect('/dashboard/settings');
}); 