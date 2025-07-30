const Promotion = require('../models/promotion');

// Middleware to update promotion statuses based on current time
const updatePromotionStatuses = async (req, res, next) => {
    try {
        const now = new Date();
        
        // Update scheduled promotions that should now be active
        await Promotion.updateMany(
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
        await Promotion.updateMany(
            {
                status: 'active',
                endDate: { $lt: now }
            },
            {
                $set: { status: 'expired' }
            }
        );

        // Update scheduled promotions that should now be expired
        await Promotion.updateMany(
            {
                status: 'scheduled',
                endDate: { $lt: now }
            },
            {
                $set: { status: 'expired' }
            }
        );

        next();
    } catch (error) {
        console.error('Error updating promotion statuses:', error);
        next(); // Continue even if status update fails
    }
};

module.exports = updatePromotionStatuses; 