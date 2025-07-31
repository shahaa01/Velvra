const Joi = require('joi');

const sellerSchema = Joi.object({
  brandName: Joi.string().min(2).max(100).required(),
  instagram: Joi.string().allow('').max(100),
  contactPerson: Joi.string().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(/^9\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits and start with 9',
      'string.empty': 'Phone number is required'
    }),
  email: Joi.string().email().required(),
  businessType: Joi.string().valid('boutique', 'instagram', 'both', 'brand', 'designer').required(),
  ownerName: Joi.string().min(2).max(100).required(),
  panVatNumber: Joi.string()
    .pattern(/^\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'PAN/VAT number must be exactly 9 digits',
      'string.empty': 'PAN/VAT number is required'
    }),
  location: Joi.string().valid('kathmandu', 'pokhara').required(),
  city: Joi.string().min(2).max(100).required(),
  message: Joi.string().allow('').max(1000),
});

// Schema for updating seller settings (excludes panVatDocument and panVatNumber)
const sellerUpdateSchema = Joi.object({
  brandName: Joi.string().min(2).max(100).required(),
  instagram: Joi.string().allow('').max(100),
  contactPerson: Joi.string().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(/^9\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits and start with 9',
      'string.empty': 'Phone number is required'
    }),
  email: Joi.string().email().required(),
  businessType: Joi.string().valid('boutique', 'instagram', 'both', 'brand', 'designer').required(),
  ownerName: Joi.string().min(2).max(100).required(),
  location: Joi.string().valid('kathmandu', 'pokhara').required(),
  city: Joi.string().min(2).max(100).required(),
  message: Joi.string().allow('').max(1000),
});

module.exports = { sellerSchema, sellerUpdateSchema }; 