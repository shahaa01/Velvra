const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const sellerController = require('../controllers/sellerController');
// const Seller = require('../models/seller');

router.route('/')
    .get(sellerController.renderSellerForm)
    .post(
        isLoggedIn,
        // Validation and sanitization
        [
            body('brandName').trim().notEmpty().withMessage('Brand name is required'),
            body('instagram').optional({ checkFalsy: true }).trim().escape(),
            body('contactPerson').trim().notEmpty().withMessage('Contact person name is required'),
            body('phone')
                .notEmpty().withMessage('Phone number is required')
                .isLength({ min: 10, max: 10 }).withMessage('Phone number must be exactly 10 digits')
                .matches(/^9\d{9}$/).withMessage('Phone number must be exactly 10 digits and start with 9'),
            body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address').normalizeEmail(),
            body('businessType').trim().notEmpty().withMessage('Business type is required').isIn(['boutique','instagram','both','brand','designer']),
            body('ownerName').trim().notEmpty().withMessage("Owner's legal name is required"),
            body('panVatNumber')
                .notEmpty().withMessage('PAN/VAT number is required')
                .isLength({ min: 9, max: 9 }).withMessage('PAN/VAT number must be exactly 9 digits')
                .matches(/^\d{9}$/).withMessage('PAN/VAT number must be exactly 9 digits'),
            // panVatDocument handled in controller (file upload)
            body('location').trim().notEmpty().withMessage('Location is required').isIn(['kathmandu','pokhara']),
            body('city').trim().notEmpty().withMessage('City/Area is required'),
            body('message').optional({ checkFalsy: true }).trim().escape(),
        ],
        sellerController.handleSellerRegistration
    );

router.get('/dashboard', isLoggedIn, sellerController.getSellerDashboard);

module.exports = router