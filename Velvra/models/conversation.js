const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  model: {
    type: String,
    enum: ['User', 'Seller'],
    required: true
  }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  participants: [participantSchema],
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  lastMessage: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema); 