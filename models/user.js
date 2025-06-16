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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8, // Adjust based on password policy
    select: false // Don't send hashed password in queries by default
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);