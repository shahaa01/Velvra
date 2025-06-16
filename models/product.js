const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },    // e.g., "Black"
  hex: { type: String, required: true },     // e.g., "#000000"
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String },             // Optional detailed description
  price: { type: Number, required: true },
  salePrice: { type: Number },               // Optional
  sale: { type: Boolean, default: false },
  salePercentage: { type: Number, default: 0 },

  images: {
    type: [String],
    required: true,
    validate: [(val) => val.length >= 1, 'At least one image is required']
  },

  colors: [colorSchema],

  sizes: {
    type: [String],
    enum: ['XS', 'S', 'M', 'L', 'XL'],
    default: ['S', 'M', 'L']
  },

  category: { type: String, required: true },    // e.g., "men", "women", etc.
  tags: [String],                                // e.g., ["t-shirt", "streetwear"]


  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
