const mongoose = require('mongoose');

const SellerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brandName: { type: String, required: true, trim: true },
  instagram: { type: String, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  phone: { 
    type: Number, 
    required: true, 
    validate: {
      validator: function(v) {
        return /^9\d{9}$/.test(String(v));
      },
      message: 'Phone number must be exactly 10 digits and start with 9.'
    }
  },
  email: { type: String, required: true, trim: true, lowercase: true },
  businessType: { type: String, required: true, enum: ['boutique', 'instagram', 'both', 'brand', 'designer'] },
  ownerName: { type: String, required: true, trim: true },
  panVatNumber: { 
    type: Number, 
    required: true, 
    validate: {
      validator: function(v) {
        return /^\d{9}$/.test(String(v));
      },
      message: 'PAN/VAT number must be exactly 9 digits.'
    }
  },
  panVatDocument: { type: String, required: true }, // store file path or URL
  location: { type: String, required: true, enum: ['kathmandu', 'pokhara'] },
  city: { type: String, required: true, trim: true },
  message: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Seller', SellerSchema); 