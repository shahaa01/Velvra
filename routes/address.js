const express = require('express');
const router = express.Router();
const User = require('../models/user');
const addressSchema = require('../validations/address');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// Add new address
router.post('/add', isLoggedIn, async (req, res) => {
  try {
    // Validate address data
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for duplicate address
    const isDuplicate = user.addresses.some(addr => 
      addr.street === value.street &&
      addr.city === value.city &&
      addr.state === value.state &&
      addr.postalCode === value.postalCode
    );

    if (isDuplicate) {
      return res.status(400).json({ error: 'This address already exists' });
    }

    // Add the address
    await user.addAddress(value);

    // Get updated user with addresses
    const updatedUser = await User.findById(req.user._id);
    
    res.json({
      message: 'Address added successfully',
      addresses: updatedUser.addresses
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// Get user's addresses
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ addresses: user.addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// Get single address
router.get('/:addressId', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ address });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
});

// Update address
router.put('/:addressId', isLoggedIn, async (req, res) => {
  try {
    // Validate address data
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
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
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// Set default address
router.put('/:addressId/default', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
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
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

module.exports = router; 