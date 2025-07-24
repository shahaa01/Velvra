const User = require('../models/user');
const Seller = require('../models/Seller');
const mongoose = require('mongoose');
const path = require('path');

// Load .env from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.MONGO_ATLAS_URL;

async function createSellerUser() {
  try {
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to database');

    // Check if user already exists
    let user = await User.findOne({ email: 'sweshah@velvra.com' });
    
    if (user) {
      console.log('❌ User already exists. Deleting to recreate...');
      await User.findByIdAndDelete(user._id);
      await Seller.findOneAndDelete({ user: user._id });
    }

    // Create new user with proper password
    const newUser = new User({
      firstName: 'Swechha',
      lastName: 'Regmi',
      email: 'sweshah@velvra.com',
      role: 'seller',
      isSeller: true,
      activeMode: 'seller'
    });

    // Register with a valid password
    await User.register(newUser, 'Password123!');
    
    console.log('✅ User created successfully:', newUser._id);

    // Create seller profile
    const seller = new Seller({
      user: newUser._id,
      brandName: 'Divaa',
      instagram: '@divaa',
      contactPerson: 'Swechha Regmi',
      phone: 9876543210,
      email: 'sweshah@velvra.com',
      businessType: 'brand',
      ownerName: 'Swechha Regmi',
      panVatNumber: 123456789,
      panVatDocument: '/uploads/panvat/divaa-document.pdf',
      location: 'kathmandu',
      city: 'Kathmandu',
      message: 'Divaa seller for testing'
    });

    await seller.save();
    console.log('✅ Seller profile created:', seller._id);
    
    console.log('\n🎉 Login credentials:');
    console.log('📧 Email: sweshah@velvra.com');
    console.log('🔑 Password: Password123!');
    console.log('👤 User ID:', newUser._id);
    console.log('🏪 Seller ID:', seller._id);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSellerUser(); 