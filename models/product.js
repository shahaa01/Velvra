const { boolean } = require('joi');
const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },      // e.g., "Red"
  hex: { type: String, required: true },       // e.g., "#FF0000"
  stock: { type: Number, required: true },     // e.g., 2
  inStock: { type: Boolean, required: true }   // true if stock > 0
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
    type: [mongoose.Schema.Types.Mixed], // supports both strings (e.g. 'M') and numbers (e.g. 42)
    default: ['S', 'M', 'L', 'XL'],
    validate: {
      validator: function (arr) {
        return Array.isArray(arr) && arr.length > 0;
      },
      message: 'At least one size must be provided.'
    }
  },

  category: { type: String, required: true },    // e.g., "men", "women", etc.
  tags: [String],                                // e.g., ["t-shirt", "streetwear"]

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

//auto set inStock for color variants, and sale and salePrice of each Product
productSchema.pre('save', function (next) {
  // Auto-update inStock for colors
  if (this.colors && Array.isArray(this.colors)) {
    this.colors.forEach((color) => {
      color.inStock = color.stock > 0;
    });
  }

  // Auto-set sale and salePrice
  if (typeof this.salePercentage === 'number' && this.salePercentage > 0) {
    this.sale = true;
    const discountedPrice = this.price - (this.price * this.salePercentage / 100);
    this.salePrice = parseFloat(discountedPrice.toFixed(2));
  } else {
    this.sale = false;
    this.salePrice = undefined; // clear previous salePrice if no sale
  }

  // Auto-update updatedAt timestamp
  this.updatedAt = new Date();

  next();
});


productSchema.index({
  name: 'text',
  brand: 'text',
  description: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Product', productSchema);
