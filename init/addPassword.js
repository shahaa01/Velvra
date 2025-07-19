const User = require('../models/user');
const mongoose = require('mongoose');
const path = require('path');

// Load .env from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.MONGO_ATLAS_URL;

async function addPassword() {
  try {
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to database');

    // Find the user
    const user = await User.findOne({ email: 'sweshah@velvra.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Set a new password
    await user.setPassword('password123');
    await user.save();
    
    console.log('✅ Password added successfully!');
    console.log('🔑 Login credentials: sweshah@velvra.com / password123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addPassword(); 