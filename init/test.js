const products = require('./data');
const Product = require('../models/product');
const mongoose = require('mongoose');
const Seller = require('../models/Seller');


main().then(() => console.log('Database connected successfully🚀')).catch(err => console.log('Database connection error:',err.message));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/velvra');
  await Seller.ensureIndexes();

  const seller = await Seller.find({});
  console.log(seller);
  
}