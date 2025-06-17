const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// Address Schema
const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    match: [/^[0-9]{5}$/, 'Please enter a valid 5-digit postal code']
  },
  defaultShipping: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Define schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    unique: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email']
  },
  addresses: [addressSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Apply passport-local-mongoose plugin with email as username field
userSchema.plugin(passportLocalMongoose, { 
  usernameField: 'email',
  usernameUnique: true,
  usernameLowerCase: true
});

// Method to add a new address
userSchema.methods.addAddress = async function(addressData) {
  // If this is the first address, set it as default
  if (this.addresses.length === 0) {
    addressData.defaultShipping = true;
  }
  
  // If new address is set as default, unset default on other addresses
  if (addressData.defaultShipping) {
    this.addresses.forEach(address => {
      address.defaultShipping = false;
    });
  }
  
  this.addresses.push(addressData);
  return this.save();
};

module.exports = mongoose.model('User', userSchema);