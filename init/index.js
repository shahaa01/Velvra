const products = require('./data');
const Product = require('../models/product');
const Seller = require('../models/Seller');
const User = require('../models/user');
const mongoose = require('mongoose');
const path = require('path');

// Load .env from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.MONGO_ATLAS_URL;

main().then(() => console.log('Database connected successfully🚀')).catch(err => console.log('Database connection error:',err.message));

async function main() {
  await mongoose.connect(dbUrl);

  // Ensure indexes for all models
  await Promise.all([
    Product.ensureIndexes(),
    User.ensureIndexes(),
    Seller.ensureIndexes(),
    require('../models/Review').ensureIndexes(),
    require('../models/order').ensureIndexes(),
    require('../models/notification').ensureIndexes(),
    require('../models/cart').ensureIndexes(),
    require('../models/wishlist').ensureIndexes(),
    require('../models/conversation').ensureIndexes(),
    require('../models/issueReport').ensureIndexes(),
    require('../models/message').ensureIndexes(),
  ]);

  // Delete all data from all collections
  await Promise.all([
    Product.deleteMany({}),
    User.deleteMany({}),
    Seller.deleteMany({}),
    require('../models/Review').deleteMany({}),
    require('../models/order').deleteMany({}),
    require('../models/notification').deleteMany({}),
    require('../models/cart').deleteMany({}),
    require('../models/wishlist').deleteMany({}),
    require('../models/conversation').deleteMany({}),
    require('../models/issueReport').deleteMany({}),
    require('../models/message').deleteMany({}),
  ]);
  console.log('🗑️  Cleared all collections');

  // Step 1: Find existing seller user (or create if doesn't exist)
  let testUser = await User.findOne({ email: 'sweshah@velvra.com' });
  if (!testUser) {
    // Create user with password using User.register()
    testUser = new User({
      firstName: 'Swechha',
      lastName: 'Regmi',
      email: 'sweshah@velvra.com',
      role: 'seller',
      isSeller: true,
      activeMode: 'seller'
    });
    
    // Register the user with a password
    await User.register(testUser, 'Password123!');
    console.log('✅ Created test user:', testUser._id);
    console.log('🔑 Login credentials: sweshah@velvra.com / Password123!');
  } else {
    console.log('✅ Found existing test user:', testUser._id);
  }

  // Step 2: Find existing seller (or create if doesn't exist)
  let testSeller = await Seller.findOne({ user: testUser._id });
  if (!testSeller) {
    testSeller = new Seller({
      user: testUser._id,
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
      message: 'Divaa seller for seed data'
    });
    await testSeller.save();
    console.log('✅ Created test seller:', testSeller._id);
  } else {
    console.log('✅ Found existing test seller:', testSeller._id);
  }

  // Step 3: Clear existing products and create new ones
  await Product.deleteMany({});
  console.log('🗑️  Cleared existing products');

  // Step 4: Create products linked to the seller
  for (let product of products) {
    // Remove any existing seller field to avoid conflicts
    delete product.seller;
    product.seller = testSeller._id; // Use the real seller ID
    product.price = Math.floor(Math.random() * (10000 - 300 + 1)) + 300;

    // Define available sizes for this product
    const availableSizes = product.sizes || ['S', 'M', 'L', 'XL'];

    // For each color, generate a sizes array with random stock
    product.colors = product.colors.map(color => {
      return {
        ...color,
        sizes: availableSizes.map(size => ({
          size,
          stock: Math.floor(Math.random() * 11) // between 0 and 10
        }))
      };
    });

    // Log for debugging
    console.log('📦 Saving product:', product.name, 'with seller:', product.seller);

    const newProduct = new Product(product);
    try {
      await newProduct.save();
      console.log('✅ Saved product:', product.name);
    } catch (err) {
      console.error('❌ Error saving product:', product.name, err);
    }
  }
  
  console.log('\n🎉 Seed data completed successfully!');
  console.log('👤 Test User ID:', testUser._id);
  console.log('🏪 Test Seller ID:', testSeller._id);
  console.log('📊 Total products created:', products.length);
}