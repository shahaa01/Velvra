const products = require('./data');
const Product = require('../models/product');
const mongoose = require('mongoose');


main().then(() => console.log('Database connected successfully🚀')).catch(err => console.log('Database connection error:',err.message));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/velvra');
  await Product.ensureIndexes();

  //lets clear the data first - better for testing purpose
  await Product.deleteMany({});

  //lets save all the product in the database
  for (let product of products) {
    // Remove any existing seller field to avoid conflicts
    delete product.seller;
    product.seller = new mongoose.Types.ObjectId('68531b04ebbacff2e2905f9a');
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

    // Optionally remove color-level stock/inStock if present
    // (not needed in new schema)
    // product.colors.forEach(c => { delete c.stock; delete c.inStock; });

    // Log for debugging
    console.log('Saving product:', product.name, 'with seller:', product.seller);

    const newProduct = new Product(product);
    try {
      await newProduct.save();
    } catch (err) {
      console.error('Error saving product:', product.name, err);
    }
  }
  
}