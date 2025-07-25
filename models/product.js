const { boolean } = require('joi');
const mongoose = require('mongoose');

// New schema for size-stock under each color
const sizeStockSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 }
});

// Add missing schemas for sizeChart, variants, and moreDetails
const sizeChartSchema = new mongoose.Schema({
  size: { type: String, required: true },
  bodyPart: { type: String, required: true },
  unit: { type: String, required: true },
  value: { type: Number, required: true }
}, { _id: false });

const variantCombinationSchema = new mongoose.Schema({
  color: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  specialPrice: { type: Number },
  stock: { type: Number, required: true },
  sku: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { _id: false });

const moreDetailsSchema = new mongoose.Schema({
  fabric: String,
  fabricOther: String,
  fashionTrend: String,
  fit: String,
  length: String,
  multipack: String,
  neckType: String,
  numItems: String,
  numItemsCustom: String,
  occasion: String,
  packageContains: String,
  packageContainsOther: String,
  pattern: String,
  printPatternType: String,
  sleeveLength: String,
  sleeveStyling: String,
  washCare: String,
  weaveType: String,
  transparency: String,
  surfaceStyling: String,
  closureType: String,
  lining: String
}, { _id: false });

const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },      // e.g., "Red"
  hex: { type: String, required: true },       // e.g., "#FF0000"
  sizes: [sizeStockSchema],                    // Array of { size, stock }
  imageUrl: { type: String }                   // Cloudinary URL for color swatch (optional)
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  // description: { type: String },             // Optional detailed description
  price: { type: Number, required: true },
  salePrice: { type: Number },               // Provided by the page ("Price after discount")
  sale: { type: Boolean, default: false },   // Calculated in pre-save
  salePercentage: { type: Number, default: 0 }, // Calculated in pre-save

  images: {
    type: [String],
    required: true,
    validate: [(val) => val.length >= 1, 'At least one image is required']
  },

  colors: [colorSchema], // Each color: { name, hex, sizes: [{ size, stock }], imageUrl }

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

  // New: categoryPath (array of strings for full path)
  categoryPath: {
    type: [String],
    required: false, // For backward compatibility; should be required for new docs
    default: undefined
  },
  // category: last element of categoryPath (set in pre-save)
  category: { type: String, required: true },    // e.g., "dresses"
  tags: [String],                                // e.g., ["t-shirt", "streetwear"]

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },

  // --- New fields for full product info ---
  sizeChart: [sizeChartSchema],
  variants: [variantCombinationSchema],
  highlights: [{ type: String }],
  moreDetails: moreDetailsSchema,

  // Review summary fields
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },

  description: { type: String }, // HTML

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook: calculate salePercentage and sale boolean from price and salePrice, and set category from categoryPath
productSchema.pre('save', function (next) {
  // If salePrice is provided and less than price, calculate salePercentage and set sale boolean
  if (typeof this.salePrice === 'number' && typeof this.price === 'number' && this.salePrice < this.price) {
    this.sale = true;
    this.salePercentage = Math.round(100 * (this.price - this.salePrice) / this.price);
  } else {
    this.sale = false;
    this.salePercentage = 0;
  }

  // Set category to last element of categoryPath if provided
  if (Array.isArray(this.categoryPath) && this.categoryPath.length > 0) {
    this.category = this.categoryPath[this.categoryPath.length - 1];
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
