const Joi = require('joi');

// Personal Information Update Schema
const personalInfoSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).allow(''),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).allow(''),
  birthMonth: Joi.number().min(1).max(12).allow(''),
  birthDay: Joi.number().min(1).max(31).allow(''),
  birthYear: Joi.number().min(1900).max(new Date().getFullYear()).allow('')
});

// Address Update Schema
const addressSchema = Joi.object({
  street: Joi.string().min(5).max(200).required(),
  apartment: Joi.string().max(100).allow(''),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  postalCode: Joi.string().pattern(/^[0-9]{5}$/).required(),
  country: Joi.string().default('United States')
});

// Password Change Schema
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one letter and one number'
    }),
  confirmPassword: Joi.valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' })
});

module.exports = {
  personalInfoSchema,
  addressSchema,
  passwordChangeSchema
}; 