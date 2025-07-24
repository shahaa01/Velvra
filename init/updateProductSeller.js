const Product = require('../models/product');
const Seller = require('../models/Seller');
const mongoose = require('mongoose');
const path = require('path');

// Load .env from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.MONGO_ATLAS_URL;

async function updateProductSeller() {
  try {
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to database');

    // Find the seller
    const seller = await Seller.findOne({ email: 'sweshah@velvra.com' });
    
    if (!seller) {
      console.log('❌ Seller not found. Please run createSellerUser.js first.');
      return;
    }

    console.log('✅ Found seller:', seller._id);

    // Update all products to use this seller
    const result = await Product.updateMany(
      {}, // Update all products
      { seller: seller._id }
    );

    console.log(`✅ Updated ${result.modifiedCount} products to use seller: ${seller._id}`);

    // Verify the update
    const productCount = await Product.countDocuments({ seller: seller._id });
    console.log(`📊 Total products now associated with seller: ${productCount}`);

    // Show some sample products
    const sampleProducts = await Product.find({ seller: seller._id }).limit(3);
    console.log('\n📦 Sample products:');
    sampleProducts.forEach(product => {
      console.log(`   - ${product.name} (ID: ${product._id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateProductSeller(); 