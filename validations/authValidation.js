const Joi = require('joi');

const signupSchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .trim(),
    lastName: Joi.string()
        .min(2)
        .max(50)
        .optional()
        .allow('')
        .trim()
        .custom((value, helpers) => {
            // If lastName is provided, it must be at least 2 characters
            if (value && value.length > 0 && value.length < 2) {
                return helpers.error('any.invalid');
            }
            return value;
        }, 'lastName validation')
        .messages({
            'any.invalid': 'Last name must be at least 2 characters long'
        }),
    email: Joi.string()
        .email()
        .required()
        .trim()
        .lowercase(),
    password: Joi.string()
        .min(8)
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
        .message('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character')
});

const loginSchema = Joi.object({
    username: Joi.string()
        .email()
        .required()
        .trim()
        .lowercase(),
    password: Joi.string()
        .required()
});

module.exports = {
    signupSchema,
    loginSchema
}; 