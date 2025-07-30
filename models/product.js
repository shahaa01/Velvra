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
  salePrice: { type: Number },
  salePercentage: { type: Number, default: 0 },
  stock: { type: Number, required: true },
  sku: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { _id: false });

const moreDetailsSchema = new mongoose.Schema({
  fabric: String,
  fashionTrend: String,
  fit: String,
  length: String,
  multipack: String,
  neckType: String,
  numItems: String,
  occasion: String,
  packageContains: String,
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
  sizes: [String],                             // Array of size names only (stock is in variants)
  imageUrl: { type: String }                   // Cloudinary URL for color swatch (optional)
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  // description: { type: String },             // Optional detailed description
  // Note: price and salePrice are now handled at variant level only
  sale: { type: Boolean, default: false },   // Calculated in pre-save based on variants
  salePercentage: { type: Number, default: 0 }, // Calculated in pre-save based on variants

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

  // View count tracking
  viewCount: {
    type: Number,
    default: 0
  },

  // Cart count tracking (number of users who have this product in their cart)
  cartCount: {
    type: Number,
    default: 0
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  contentScore: { type: Number, default: 0, required: true }
});

// Pre-save hook: calculate salePercentage and sale boolean from variants, and set category from categoryPath
productSchema.pre('save', function (next) {
  // Calculate sale and salePercentage based on variants
  if (this.variants && this.variants.length > 0) {
    const variantsWithSale = this.variants.filter(v => v.salePrice && v.salePrice < v.price);
    if (variantsWithSale.length > 0) {
      this.sale = true;
      // Calculate average sale percentage across all variants with sales
      const totalDiscount = variantsWithSale.reduce((sum, v) => {
        return sum + ((v.price - v.salePrice) / v.price * 100);
      }, 0);
      this.salePercentage = Math.round(totalDiscount / variantsWithSale.length);
      
      // Calculate salePercentage for each variant
      this.variants.forEach(variant => {
        if (variant.salePrice && variant.salePrice < variant.price) {
          variant.salePercentage = Math.round(((variant.price - variant.salePrice) / variant.price) * 100);
        } else {
          variant.salePercentage = 0;
        }
      });
    } else {
      this.sale = false;
      this.salePercentage = 0;
      // Set salePercentage to 0 for all variants
      this.variants.forEach(variant => {
        variant.salePercentage = 0;
      });
    }
  } else {
    this.sale = false;
    this.salePercentage = 0;
  }

  // Filter out 'Fashion' from categoryPath and update it
  if (Array.isArray(this.categoryPath) && this.categoryPath.length > 0) {
    this.categoryPath = this.categoryPath.filter(tag => tag !== 'Fashion');
  }

  // Set category to first element of categoryPath if provided (only if not already set)
  if (!this.category && Array.isArray(this.categoryPath) && this.categoryPath.length > 0) {
    this.category = this.categoryPath[0];
  }
  
  // Set tags to copy of categoryPath (only if not already set)
  if ((!this.tags || this.tags.length === 0) && Array.isArray(this.categoryPath) && this.categoryPath.length > 0) {
    this.tags = [...this.categoryPath];
  }

  // Auto-update updatedAt timestamp
  this.updatedAt = new Date();

  next();
});

// Instance method to get best price information
productSchema.methods.getBestPriceInfo = function() {
  if (!this.variants || this.variants.length === 0) {
    return {
      displayPrice: 0,
      originalPrice: 0,
      salePercentage: 0,
      hasSale: false
    };
  }

  // Find variants with sale prices (salePrice exists, is not null, and is less than price)
  const variantsWithSale = this.variants.filter(v => 
    v.salePrice !== null && v.salePrice !== undefined && v.salePrice < v.price
  );
  
  if (variantsWithSale.length > 0) {
    // Show lowest sale price
    const lowestSaleVariant = variantsWithSale.reduce((lowest, current) => 
      current.salePrice < lowest.salePrice ? current : lowest
    );
    
    // Show highest sale percentage
    const highestSalePercentageVariant = variantsWithSale.reduce((highest, current) => 
      (current.salePercentage || 0) > (highest.salePercentage || 0) ? current : highest
    );
    
    return {
      displayPrice: lowestSaleVariant.salePrice || 0,
      originalPrice: lowestSaleVariant.price || 0,
      salePercentage: highestSalePercentageVariant.salePercentage || 0,
      hasSale: true
    };
  } else {
    // No sale prices, show lowest regular price
    const lowestPriceVariant = this.variants.reduce((lowest, current) => 
      (current.price || 0) < (lowest.price || 0) ? current : lowest
    );
    
    return {
      displayPrice: lowestPriceVariant.price || 0,
      originalPrice: lowestPriceVariant.price || 0,
      salePercentage: 0,
      hasSale: false
    };
  }
};


productSchema.index({
  name: 'text',
  brand: 'text',
  description: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Product', productSchema);
