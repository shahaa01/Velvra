const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    enum: ['view', 'click', 'add_to_cart', 'checkout', 'purchase'],
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ipAddress: String,
  referrer: String
}, {
  timestamps: true
});

// Indexes for efficient querying
analyticsSchema.index({ product: 1, action: 1, timestamp: -1 });
analyticsSchema.index({ seller: 1, action: 1, timestamp: -1 });
analyticsSchema.index({ sessionId: 1, timestamp: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema); 