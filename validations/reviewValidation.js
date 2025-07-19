const Joi = require('joi');

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(5).max(1000).required(),
  reviewerName: Joi.string().min(2).max(50).required(),
  images: Joi.array().items(Joi.string()).max(5).optional()
});

module.exports = { reviewSchema }; 