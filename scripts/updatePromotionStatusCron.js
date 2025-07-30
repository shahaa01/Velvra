#!/usr/bin/env node

const mongoose = require('mongoose');
const Promotion = require('../models/promotion');
require('dotenv').config();

const dbUrl = process.env.MONGO_ATLAS_URL;

async function updatePromotionStatusesCron() {
    try {
        await mongoose.connect(dbUrl);
        console.log(`[${new Date().toISOString()}] Connected to database`);

        const now = new Date();
        
        // Update scheduled promotions that should now be active
        const scheduledToActive = await Promotion.updateMany(
            {
                status: 'scheduled',
                startDate: { $lte: now },
                endDate: { $gt: now }
            },
            {
                $set: { status: 'active' }
            }
        );

        // Update active promotions that should now be expired
        const activeToExpired = await Promotion.updateMany(
            {
                status: 'active',
                endDate: { $lt: now }
            },
            {
                $set: { status: 'expired' }
            }
        );

        // Update scheduled promotions that should now be expired
        const scheduledToExpired = await Promotion.updateMany(
            {
                status: 'scheduled',
                endDate: { $lt: now }
            },
            {
                $set: { status: 'expired' }
            }
        );

        const totalUpdates = scheduledToActive.modifiedCount + activeToExpired.modifiedCount + scheduledToExpired.modifiedCount;
        
        if (totalUpdates > 0) {
            console.log(`[${new Date().toISOString()}] Promotion status updates completed:`);
            console.log(`  - Scheduled to Active: ${scheduledToActive.modifiedCount}`);
            console.log(`  - Active to Expired: ${activeToExpired.modifiedCount}`);
            console.log(`  - Scheduled to Expired: ${scheduledToExpired.modifiedCount}`);
        } else {
            console.log(`[${new Date().toISOString()}] No promotion status updates needed`);
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error updating promotion statuses:`, error);
    } finally {
        await mongoose.disconnect();
        console.log(`[${new Date().toISOString()}] Disconnected from database`);
    }
}

// Run the update
updatePromotionStatusesCron(); 