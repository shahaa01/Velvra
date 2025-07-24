const Joi = require('joi');

const mobileSignupSchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(50)
        .optional()
        .allow('')
        .trim(),
    lastName: Joi.string()
        .min(2)
        .max(50)
        .optional()
        .allow('')
        .trim(),
    email: Joi.string()
        .email()
        .required()
        .trim()
        .lowercase(),
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long'
        })
});

const mobileLoginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .trim()
        .lowercase(),
    password: Joi.string()
        .required()
});

const mobileGoogleAuthSchema = Joi.object({
    idToken: Joi.string().required(),
    googleId: Joi.string().required(),
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().optional().allow(''),
    picture: Joi.string().uri().optional()
});

const mobileProfileUpdateSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional().allow(''),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    gender: Joi.string().valid('Male', 'Female', 'Prefer not to say').optional()
});

module.exports = {
    mobileSignupSchema,
    mobileLoginSchema,
    mobileGoogleAuthSchema,
    mobileProfileUpdateSchema
}; 