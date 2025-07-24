const Joi = require('joi');

const addressSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please enter a valid 10-digit phone number'
    }),
  
  street: Joi.string()
    .required()
    .messages({
      'string.empty': 'Street address is required'
    }),
  
  city: Joi.string()
    .required()
    .messages({
      'string.empty': 'City is required'
    }),
  
  state: Joi.string()
    .required()
    .messages({
      'string.empty': 'State is required'
    }),
  
  postalCode: Joi.string()
    .pattern(/^[0-9]{5}$/)
    .required()
    .messages({
      'string.empty': 'Postal code is required',
      'string.pattern.base': 'Please enter a valid 5-digit postal code'
    }),
  
  defaultShipping: Joi.boolean()
    .default(false)
});

module.exports = addressSchema; 