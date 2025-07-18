const User = require('../models/user');
const { personalInfoSchema, addressSchema, passwordChangeSchema } = require('../validations/userSettingsValidation');
const bcrypt = require('bcrypt');

// Update Personal Information
exports.updatePersonalInfo = async (req, res) => {
  try {
    const { error, value } = personalInfoSchema.validate(req.body);
    if (error) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }
      req.flash('error', error.details[0].message);
      return res.redirect('/dashboard/settings');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      req.flash('error', 'User not found');
      return res.redirect('/dashboard/settings');
    }

    // Check if email is being changed and if it's already taken
    if (value.email !== user.email) {
      const existingUser = await User.findOne({ email: value.email });
      if (existingUser) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(400).json({ success: false, message: 'Email is already taken' });
        }
        req.flash('error', 'Email is already taken');
        return res.redirect('/dashboard/settings');
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
  } catch (err) {
    console.error('Update personal info error:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, message: 'Failed to update personal information' });
    }
    req.flash('error', 'Failed to update personal information');
    res.redirect('/dashboard/settings');
  }
};

// Update Address
exports.updateAddress = async (req, res) => {
  try {
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }
      req.flash('error', error.details[0].message);
      return res.redirect('/dashboard/settings');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      req.flash('error', 'User not found');
      return res.redirect('/dashboard/settings');
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
  } catch (err) {
    console.error('Update address error:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, message: 'Failed to update address' });
    }
    req.flash('error', 'Failed to update address');
    res.redirect('/dashboard/settings');
  }
};

// Update Password (Local Strategy Only)
exports.updatePassword = async (req, res) => {
  try {
    // Check if user is using local strategy
    if (req.user.authMethod !== 'local') {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: 'Password change not available for social login users' });
      }
      req.flash('error', 'Password change not available for social login users');
      return res.redirect('/dashboard/settings');
    }

    const { error, value } = passwordChangeSchema.validate(req.body);
    if (error) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }
      req.flash('error', error.details[0].message);
      return res.redirect('/dashboard/settings');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      req.flash('error', 'User not found');
      return res.redirect('/dashboard/settings');
    }

    // Verify current password
    const isMatch = await user.authenticate(value.currentPassword);
    if (!isMatch) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/dashboard/settings');
    }

    // Update password
    await user.setPassword(value.newPassword);
    await user.save();

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: 'Password updated successfully' });
    }
    req.flash('success', 'Password updated successfully');
    res.redirect('/dashboard/settings');
  } catch (err) {
    console.error('Update password error:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, message: 'Failed to update password' });
    }
    req.flash('error', 'Failed to update password');
    res.redirect('/dashboard/settings');
  }
}; 