const mongoose = require('mongoose');

const issueReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  category: {
    type: String,
    enum: ['Damaged', 'Wrong Item', 'Missing', 'Quality', 'Shipping', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  photos: [{ type: String }], // file paths
  preferredResolution: { type: String },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IssueReport', issueReportSchema); 