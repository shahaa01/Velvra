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
    required: false,
    trim: true,
    validate: {
      validator: function(value) {
        if (value && value.length > 0 && value.length < 2) {
          return false;
        }
        return true;
      },
      message: 'Last name must be at least 2 characters long'
    },
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
  // Google OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  googleProfile: {
    picture: String,
    locale: String,
    verified_email: Boolean
  },
  // Authentication method
  authMethod: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  addresses: [addressSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'seller', 'admin'],
    default: 'user',
  },
  // Dual-role fields
  isSeller: {
    type: Boolean,
    default: false
  },
  activeMode: {
    type: String,
    enum: ['buyer', 'seller'],
    default: 'buyer'
  },
  sellerProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    default: null
  },
});

// Apply passport-local-mongoose plugin with email as username field
userSchema.plugin(passportLocalMongoose, { 
  usernameField: 'email',
  usernameUnique: true,
  usernameLowerCase: true,
  // Disable username field for Google OAuth users
  usernameQueryFields: ['email', 'googleId']
});

// Pre-save middleware to ensure username is always set and sync isSeller
userSchema.pre('save', function(next) {
  // If username is not set or is null, set it to email
  if (!this.username || this.username === null) {
    this.username = this.email;
  }
  // Sync isSeller with role === 'seller'
  this.isSeller = this.role === 'seller';
  next();
});

// Static method to find or create Google user
userSchema.statics.findOrCreateGoogleUser = async function(profile, req) {
  try {
    // First, try to find user by Google ID
    let user = await this.findOne({ googleId: profile.id });
    
    if (user) {
      return { user, isNew: false };
    }
    
    // If not found by Google ID, try to find by email
    user = await this.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // User exists but doesn't have Google ID, link the accounts
      user.googleId = profile.id;
      user.googleProfile = {
        picture: profile.photos[0]?.value,
        locale: profile._json.locale,
        verified_email: profile._json.email_verified
      };
      user.authMethod = 'google';
      // Ensure username is set
      if (!user.username) {
        user.username = user.email;
      }
      await user.save();
      return { user, isNew: false };
    }
    
    // Create new user
    const newUser = new this({
      googleId: profile.id,
      firstName: profile.name.givenName || profile.displayName.split(' ')[0] || 'User',
      lastName: profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ') || '',
      email: profile.emails[0].value,
      googleProfile: {
        picture: profile.photos[0]?.value,
        locale: profile._json.locale,
        verified_email: profile._json.email_verified
      },
      authMethod: 'google',
      // Explicitly set username to email
      username: profile.emails[0].value
    });
    
    await newUser.save();
    return { user: newUser, isNew: true };
  } catch (error) {
    console.error('Error in findOrCreateGoogleUser:', error);
    throw error;
  }
};

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