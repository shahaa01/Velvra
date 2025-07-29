const mongoose = require('mongoose');
const path = require('path');

// Load .env from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.MONGO_ATLAS_URL;
const Product = require('../models/product');

async function migrateMoreDetails() {
  try {
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to database');

    // First, let's see what products we have with "other" fields
    const productsWithOtherFields = await Product.find({
      $or: [
        { 'moreDetails.fabricOther': { $exists: true, $ne: null } },
        { 'moreDetails.numItemsCustom': { $exists: true, $ne: null } },
        { 'moreDetails.packageContainsOther': { $exists: true, $ne: null } }
      ]
    });

    console.log(`📦 Found ${productsWithOtherFields.length} products with "other" fields`);

    if (productsWithOtherFields.length > 0) {
      console.log('Products with "other" fields:');
      productsWithOtherFields.forEach(p => {
        console.log(`  - ${p.name}: ${JSON.stringify(p.moreDetails)}`);
      });
    }

    // Use direct MongoDB operations to migrate the data
    let migratedCount = 0;

    // Migrate fabricOther to fabric
    const fabricResult = await Product.updateMany(
      { 'moreDetails.fabricOther': { $exists: true, $ne: null } },
      [
        {
          $set: {
            'moreDetails.fabric': '$moreDetails.fabricOther'
          }
        },
        {
          $unset: 'moreDetails.fabricOther'
        }
      ]
    );
    migratedCount += fabricResult.modifiedCount;
    console.log(`  - Migrated ${fabricResult.modifiedCount} products with fabricOther`);

    // Migrate numItemsCustom to numItems
    const numItemsResult = await Product.updateMany(
      { 'moreDetails.numItemsCustom': { $exists: true, $ne: null } },
      [
        {
          $set: {
            'moreDetails.numItems': '$moreDetails.numItemsCustom'
          }
        },
        {
          $unset: 'moreDetails.numItemsCustom'
        }
      ]
    );
    migratedCount += numItemsResult.modifiedCount;
    console.log(`  - Migrated ${numItemsResult.modifiedCount} products with numItemsCustom`);

    // Migrate packageContainsOther to packageContains
    const packageResult = await Product.updateMany(
      { 'moreDetails.packageContainsOther': { $exists: true, $ne: null } },
      [
        {
          $set: {
            'moreDetails.packageContains': '$moreDetails.packageContainsOther'
          }
        },
        {
          $unset: 'moreDetails.packageContainsOther'
        }
      ]
    );
    migratedCount += packageResult.modifiedCount;
    console.log(`  - Migrated ${packageResult.modifiedCount} products with packageContainsOther`);

    console.log(`✅ Successfully migrated ${migratedCount} products using direct MongoDB operations`);

    // Verify the migration
    const remainingProducts = await Product.find({
      $or: [
        { 'moreDetails.fabricOther': { $exists: true } },
        { 'moreDetails.numItemsCustom': { $exists: true } },
        { 'moreDetails.packageContainsOther': { $exists: true } }
      ]
    });

    if (remainingProducts.length === 0) {
      console.log('✅ Migration completed successfully! No products with "other" fields remain.');
    } else {
      console.log(`⚠️  Warning: ${remainingProducts.length} products still have "other" fields`);
      console.log('Remaining products:');
      remainingProducts.forEach(p => {
        console.log(`  - ${p.name}: ${JSON.stringify(p.moreDetails)}`);
      });
    }

    // Show some migrated products to verify
    const sampleProducts = await Product.find({}).limit(3);
    console.log('\n📋 Sample products after migration:');
    sampleProducts.forEach(p => {
      console.log(`  - ${p.name}: ${JSON.stringify(p.moreDetails)}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

migrateMoreDetails(); 