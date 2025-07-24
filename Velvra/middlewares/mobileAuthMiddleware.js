const { mobileSignupSchema, mobileLoginSchema, mobileGoogleAuthSchema, mobileProfileUpdateSchema } = require('../validations/mobileAuthValidation');
const AppError = require('../utils/AppError');

// Mobile validation middleware for signup
const validateMobileSignup = (req, res, next) => {
  const { error } = mobileSignupSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }
  next();
};

// Mobile validation middleware for login
const validateMobileLogin = (req, res, next) => {
  const { error } = mobileLoginSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }
  next();
};

// Mobile validation middleware for Google auth
const validateMobileGoogleAuth = (req, res, next) => {
  const { error } = mobileGoogleAuthSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }
  next();
};

// Mobile validation middleware for profile update
const validateMobileProfileUpdate = (req, res, next) => {
  const { error } = mobileProfileUpdateSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }
  next();
};

module.exports = {
  validateMobileSignup,
  validateMobileLogin,
  validateMobileGoogleAuth,
  validateMobileProfileUpdate
}; 