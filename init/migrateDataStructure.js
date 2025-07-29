const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

// Read the current data.js file
const dataPath = path.join(__dirname, 'data.js');
let dataContent = fs.readFileSync(dataPath, 'utf8');

// Extract the products array using eval (safe since we control the file)
const productsMatch = dataContent.match(/const dummyProducts = (\[[\s\S]*?\]);/);
if (!productsMatch) {
    console.error('Could not find dummyProducts array in data.js');
    process.exit(1);
}

// Safely evaluate the products array
const products = eval(productsMatch[1]);

console.log(`Found ${products.length} products to migrate...`);

// Migrate each product
const migratedProducts = products.map(product => {
    const migratedProduct = { ...product };
    
    // Remove top-level price and salePrice
    delete migratedProduct.price;
    delete migratedProduct.salePrice;
    
    // Update colors structure - remove stock from sizes
    if (migratedProduct.colors) {
        migratedProduct.colors = migratedProduct.colors.map(color => ({
            name: color.name,
            hex: color.hex,
            sizes: color.sizes.filter(s => s && typeof s.size === 'string').map(size => size.size), // Only valid size names
            imageUrl: color.imageUrl
        }));
    }
    
    // Create variants from the old structure
    const variants = [];
    if (migratedProduct.colors) {
        migratedProduct.colors.forEach(color => {
            // Find the original color data to get stock information
            const originalColor = product.colors.find(c => c.name === color.name);
            if (originalColor && originalColor.sizes) {
                originalColor.sizes.forEach(sizeData => {
                    if (sizeData && typeof sizeData.size === 'string') {
                        variants.push({
                            color: color.name,
                            size: sizeData.size,
                            price: product.price || 0,
                            salePrice: product.salePrice || null,
                            stock: sizeData.stock || 0,
                            sku: `${(product.name || 'product').replace(/\s+/g, '-').toLowerCase()}-${(color.name || 'color').toLowerCase()}-${(sizeData.size || 'size').toLowerCase()}`,
                            active: true
                        });
                    }
                });
            }
        });
    }
    
    migratedProduct.variants = variants;
    
    // Add required fields for the new model
    migratedProduct.seller = new ObjectId('507f1f77bcf86cd799439011'); // Placeholder seller ID
    migratedProduct.category = migratedProduct.categoryPath ? migratedProduct.categoryPath[0] : 'Fashion';
    migratedProduct.contentScore = 85; // Default content score
    
    return migratedProduct;
});

// Create the new data.js content
const newDataContent = `// WARNING: This file was auto-updated by updateProductImages.js
// MIGRATED: Updated to new variant-based structure (no top-level price/salePrice)
const { ObjectId } = require('mongodb');

const dummyProducts = ${JSON.stringify(migratedProducts, null, 2)};

module.exports = dummyProducts;
`;

// Write the updated content back to data.js
fs.writeFileSync(dataPath, newDataContent);

console.log('✅ Successfully migrated data.js to new structure!');
console.log(`📊 Summary:`);
console.log(`   - Removed top-level price/salePrice from ${products.length} products`);
console.log(`   - Updated colors.sizes to contain only size names (no stock)`);
console.log(`   - Created variants array with price, stock, and SKU for each color-size combination`);
console.log(`   - Total variants created: ${migratedProducts.reduce((sum, p) => sum + p.variants.length, 0)}`);

// Also update the database
console.log('\n🔄 Updating database...');
const mongoose = require('mongoose');
const Product = require('../models/product');

async function updateDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_ATLAS_URL || 'mongodb://localhost:27017/velvra');
        
        // Clear existing products
        await Product.deleteMany({});
        console.log('🗑️  Cleared existing products from database');
        
        // Insert migrated products
        const result = await Product.insertMany(migratedProducts);
        console.log(`✅ Inserted ${result.length} migrated products into database`);
        
        await mongoose.connection.close();
        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Error updating database:', error);
        process.exit(1);
    }
}

updateDatabase(); 