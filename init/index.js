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
  for(let product of products) {
    product.seller = new mongoose.Types.ObjectId('68531b04ebbacff2e2905f9a');
    product.stock = Math.floor(Math.random() * 11);
    if(product.stock > 0) {
      product.inStock = true;
    } else {
      product.inStock = false;
    }
    const newProduct = new Product(product);
    await newProduct.save();
    }
}