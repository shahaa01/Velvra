const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['order', 'promo', 'style-tip', 'stock', 'campaign'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String }, // e.g., /dashboard/orders/123
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema); 