const mongoose = require('mongoose');
const Promotion = require('../models/promotion');
const Seller = require('../models/Seller');
const User = require('../models/user');
require('dotenv').config();

const dbUrl = process.env.MONGO_ATLAS_URL;

async function createSamplePromotions() {
    try {
        await mongoose.connect(dbUrl);
        console.log('Connected to database');

        // Find a seller to associate promotions with
        const seller = await Seller.findOne();
        if (!seller) {
            console.log('No seller found. Please create a seller first.');
            return;
        }

        console.log(`Creating promotions for seller: ${seller.businessName}`);

        // Sample promotions data
        const samplePromotions = [
            {
                code: 'SUMMER24',
                description: 'Summer Sale - 25% off all items',
                type: 'percentage',
                value: 25,
                minPurchase: 1000,
                totalLimit: 1000,
                customerLimit: 1,
                startDate: new Date('2024-03-15T00:00:00.000Z'),
                endDate: new Date('2024-04-15T23:59:59.000Z'),
                applyTo: 'all',
                seller: seller._id,
                status: 'active'
            },
            {
                code: 'WELCOME10',
                description: 'New Customer - 10% off first order',
                type: 'percentage',
                value: 10,
                minPurchase: 0,
                totalLimit: null, // unlimited
                customerLimit: 1,
                startDate: new Date('2024-01-01T00:00:00.000Z'),
                endDate: new Date('2024-12-31T23:59:59.000Z'),
                applyTo: 'all',
                seller: seller._id,
                status: 'active'
            },
            {
                code: 'FREESHIP50',
                description: 'Free shipping on orders over Rs. 1000',
                type: 'free-shipping',
                value: 0,
                minPurchase: 1000,
                totalLimit: 500,
                customerLimit: 3,
                startDate: new Date('2024-03-01T00:00:00.000Z'),
                endDate: new Date('2024-03-31T23:59:59.000Z'),
                applyTo: 'all',
                seller: seller._id,
                status: 'active'
            },
            {
                code: 'BOGO2024',
                description: 'Buy One Get One 50% off',
                type: 'bogo',
                value: 50,
                minPurchase: 0,
                totalLimit: 200,
                customerLimit: 2,
                startDate: new Date('2024-04-01T00:00:00.000Z'),
                endDate: new Date('2024-04-07T23:59:59.000Z'),
                applyTo: 'all',
                seller: seller._id,
                status: 'scheduled'
            },
            {
                code: 'WINTER20',
                description: 'Winter clearance - 20% off',
                type: 'percentage',
                value: 20,
                minPurchase: 500,
                totalLimit: 1500,
                customerLimit: null, // unlimited per customer
                startDate: new Date('2024-01-15T00:00:00.000Z'),
                endDate: new Date('2024-02-28T23:59:59.000Z'),
                applyTo: 'all',
                seller: seller._id,
                status: 'expired'
            },
            {
                code: 'FLAT500',
                description: 'Flat Rs. 500 off on orders above Rs. 2000',
                type: 'fixed',
                value: 500,
                minPurchase: 2000,
                totalLimit: 1000,
                customerLimit: 1,
                startDate: new Date('2024-03-20T00:00:00.000Z'),
                endDate: new Date('2024-04-20T23:59:59.000Z'),
                applyTo: 'all',
                seller: seller._id,
                status: 'active'
            }
        ];

        // Clear existing promotions for this seller
        await Promotion.deleteMany({ seller: seller._id });
        console.log('Cleared existing promotions');

        // Create new promotions
        const createdPromotions = await Promotion.insertMany(samplePromotions);
        console.log(`Created ${createdPromotions.length} sample promotions:`);
        
        createdPromotions.forEach(promo => {
            console.log(`- ${promo.code}: ${promo.description} (${promo.status})`);
        });

        console.log('\nSample promotions created successfully!');
        console.log('You can now test the promotion system in the seller dashboard.');

    } catch (error) {
        console.error('Error creating sample promotions:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

// Run the script
createSamplePromotions(); 