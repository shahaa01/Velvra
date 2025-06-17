const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

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

module.exports = mongoose.model('User', userSchema);