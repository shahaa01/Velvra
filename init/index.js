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
    product.seller = new mongoose.Types.ObjectId('68531b04ebbacff2e2905f9a');
    product.price = Math.floor(Math.random() * (10000 - 300 + 1)) + 300;
  
    // Update each color with random stock (inStock will be set by pre-save)
    product.colors = product.colors.map(color => {
      const stock = Math.floor(Math.random() * 11); // between 0 and 10
      return {
        ...color,
        stock,
        inStock: stock > 0  // <- temporarily added to pass validation, overwritten in hook
      };
    });
  
    const newProduct = new Product(product);
    await newProduct.save();
  }
  
}