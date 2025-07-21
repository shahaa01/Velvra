const { boolean } = require('joi');
const mongoose = require('mongoose');

// New schema for size-stock under each color
const sizeStockSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 }
});

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },      // e.g., "Red"
  hex: { type: String, required: true },       // e.g., "#FF0000"
  sizes: [sizeStockSchema]                     // Array of { size, stock }
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

  // Optionally keep top-level sizes for UI, but not for stock logic
  sizes: {
    type: [mongoose.Schema.Types.Mixed],
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

  // Review summary fields
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Remove color-level stock/inStock logic in pre-save
productSchema.pre('save', function (next) {
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
