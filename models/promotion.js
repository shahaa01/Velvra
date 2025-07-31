// const mongoose = require('mongoose');

// const promotionSchema = new mongoose.Schema({
//     // Basic Information
//     code: {
//         type: String,
//         required: true,
//         unique: true,
//         uppercase: true,
//         trim: true,
//         validate: {
//             validator: function(v) {
//                 return /^[A-Z0-9]+$/.test(v);
//             },
//             message: 'Coupon code must contain only uppercase letters and numbers'
//         }
//     },
//     description: {
//         type: String,
//         required: true,
//         trim: true,
//         maxlength: 200
//     },
    
//     // Discount Configuration
//     type: {
//         type: String,
//         required: true,
//         enum: ['percentage', 'fixed', 'bogo', 'free-shipping'],
//         default: 'percentage'
//     },
//     value: {
//         type: Number,
//         required: true,
//         min: 0,
//         validate: {
//             validator: function(v) {
//                 if (this.type === 'percentage' && (v < 0 || v > 100)) {
//                     return false;
//                 }
//                 return true;
//             },
//             message: 'Percentage discount must be between 0 and 100'
//         }
//     },
//     minPurchase: {
//         type: Number,
//         default: 0,
//         min: 0
//     },
    
//     // Usage Limits
//     totalLimit: {
//         type: Number,
//         min: 1,
//         default: null // null means unlimited
//     },
//     customerLimit: {
//         type: Number,
//         min: 1,
//         default: 1
//     },
    
//     // Validity Period
//     startDate: {
//         type: Date,
//         required: true
//     },
//     endDate: {
//         type: Date,
//         required: true,
//         validate: {
//             validator: function(v) {
//                 return v > this.startDate;
//             },
//             message: 'End date must be after start date'
//         }
//     },
    
//     // Application Scope
//     applyTo: {
//         type: String,
//         required: true,
//         enum: ['all', 'category', 'products'],
//         default: 'all'
//     },
//     categories: [{
//         type: String,
//         trim: true
//     }],
//     products: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Product'
//     }],
    
//     // Seller Information
//     seller: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Seller',
//         required: true
//     },
    
//     // Status Management
//     status: {
//         type: String,
//         enum: ['active', 'scheduled', 'expired', 'paused'],
//         default: 'scheduled'
//     },
    
//     // Usage Tracking
//     usageCount: {
//         type: Number,
//         default: 0,
//         min: 0
//     },
//     revenue: {
//         type: Number,
//         default: 0,
//         min: 0
//     },
    
//     // Customer Usage Tracking
//     customerUsage: [{
//         customer: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User'
//         },
//         usageCount: {
//             type: Number,
//             default: 0
//         },
//         lastUsed: {
//             type: Date,
//             default: Date.now
//         }
//     }],
    
//     // Metadata
//     isActive: {
//         type: Boolean,
//         default: true
//     }
// }, {
//     timestamps: true
// });

// // Indexes for better performance
// promotionSchema.index({ seller: 1 });
// promotionSchema.index({ status: 1 });
// promotionSchema.index({ startDate: 1, endDate: 1 });
// promotionSchema.index({ isActive: 1 });

// // Pre-save middleware to set status based on dates
// promotionSchema.pre('save', function(next) {
//     const now = new Date();
    
//     if (this.startDate > now) {
//         this.status = 'scheduled';
//     } else if (this.endDate < now) {
//         this.status = 'expired';
//     } else if (this.status === 'scheduled' && this.startDate <= now) {
//         this.status = 'active';
//     }
    
//     next();
// });

// // Virtual for current status (dynamically calculated)
// promotionSchema.virtual('currentStatus').get(function() {
//     const now = new Date();
    
//     if (this.status === 'paused') {
//         return 'paused';
//     }
    
//     if (this.endDate < now) {
//         return 'expired';
//     }
    
//     if (this.startDate > now) {
//         return 'scheduled';
//     }
    
//     return 'active';
// });

// // Ensure virtuals are included when converting to JSON
// promotionSchema.set('toJSON', { virtuals: true });
// promotionSchema.set('toObject', { virtuals: true });

// // Static method to get active promotions for a seller
// promotionSchema.statics.getActivePromotions = function(sellerId) {
//     const now = new Date();
//     return this.find({
//         seller: sellerId,
//         isActive: true,
//         status: { $in: ['active', 'scheduled'] },
//         startDate: { $lte: now },
//         endDate: { $gte: now },
//         $or: [
//             { totalLimit: null },
//             { usageCount: { $lt: '$totalLimit' } }
//         ]
//     }).populate('products');
// };

// // Static method to validate and apply a promotion
// promotionSchema.statics.validatePromotion = async function(code, userId, cartTotal, sellerId) {
//     const now = new Date();
    
//     const promotion = await this.findOne({
//         code: code.toUpperCase(),
//         seller: sellerId,
//         isActive: true,
//         status: 'active',
//         startDate: { $lte: now },
//         endDate: { $gte: now }
//     });
    
//     if (!promotion) {
//         return { valid: false, message: 'Invalid or expired promotion code' };
//     }
    
//     // Check total usage limit
//     if (promotion.totalLimit && promotion.usageCount >= promotion.totalLimit) {
//         return { valid: false, message: 'Promotion usage limit reached' };
//     }
    
//     // Check minimum purchase
//     if (cartTotal < promotion.minPurchase) {
//         return { valid: false, message: `Minimum purchase of Rs. ${promotion.minPurchase} required` };
//     }
    
//     // Check customer usage limit
//     const customerUsage = promotion.customerUsage.find(cu => cu.customer.toString() === userId.toString());
//     if (customerUsage && customerUsage.usageCount >= promotion.customerLimit) {
//         return { valid: false, message: 'You have already used this promotion maximum times' };
//     }
    
//     return { valid: true, promotion };
// };

// // Instance method to calculate discount
// promotionSchema.methods.calculateDiscount = function(subtotal) {
//     if (subtotal < this.minPurchase) {
//         return 0;
//     }
    
//     switch (this.type) {
//         case 'percentage':
//             return (subtotal * this.value) / 100;
//         case 'fixed':
//             return Math.min(this.value, subtotal);
//         case 'bogo':
//             // Buy One Get One logic - 50% off second item
//             return (subtotal * this.value) / 100;
//         case 'free-shipping':
//             return 0; // Shipping cost will be handled separately
//         default:
//             return 0;
//     }
// };

// // Instance method to record usage
// promotionSchema.methods.recordUsage = async function(userId, orderAmount) {
//     this.usageCount += 1;
//     this.revenue += orderAmount;
    
//     // Update customer usage
//     const customerUsageIndex = this.customerUsage.findIndex(cu => cu.customer.toString() === userId.toString());
//     if (customerUsageIndex >= 0) {
//         this.customerUsage[customerUsageIndex].usageCount += 1;
//         this.customerUsage[customerUsageIndex].lastUsed = new Date();
//     } else {
//         this.customerUsage.push({
//             customer: userId,
//             usageCount: 1,
//             lastUsed: new Date()
//         });
//     }
    
//     await this.save();
// };

// // Virtual for discount display
// promotionSchema.virtual('discountDisplay').get(function() {
//     switch (this.type) {
//         case 'percentage':
//             return `${this.value}% OFF`;
//         case 'fixed':
//             return `Rs. ${this.value} OFF`;
//         case 'bogo':
//             return `BOGO ${this.value}% OFF`;
//         case 'free-shipping':
//             return 'FREE SHIPPING';
//         default:
//             return '';
//     }
// });

// // Virtual for usage percentage
// promotionSchema.virtual('usagePercentage').get(function() {
//     if (!this.totalLimit) return 0;
//     return (this.usageCount / this.totalLimit) * 100;
// });

// // Virtual for days remaining
// promotionSchema.virtual('daysRemaining').get(function() {
//     const now = new Date();
//     const end = new Date(this.endDate);
//     const diffTime = end - now;
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return Math.max(0, diffDays);
// });

// // Ensure virtuals are included in JSON
// promotionSchema.set('toJSON', { virtuals: true });
// promotionSchema.set('toObject', { virtuals: true });

// module.exports = mongoose.model('Promotion', promotionSchema); 