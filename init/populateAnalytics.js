const mongoose = require('mongoose');
const Analytics = require('../models/analytics');
const Product = require('../models/product');
const Seller = require('../models/Seller');
const Order = require('../models/order');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/velvra', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const actions = ['view', 'click', 'add_to_cart', 'checkout', 'purchase'];

async function populateAnalytics() {
    try {
        console.log('Starting analytics data population...');

        // Get all sellers and their products
        const sellers = await Seller.find();
        
        for (const seller of sellers) {
            const products = await Product.find({ seller: seller._id });
            
            if (products.length === 0) continue;

            console.log(`Populating analytics for seller: ${seller.businessName}`);

            // Generate analytics data for the last 30 days
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                // Generate random number of interactions per day
                const dailyInteractions = Math.floor(Math.random() * 50) + 10;
                
                for (let i = 0; i < dailyInteractions; i++) {
                    const product = products[Math.floor(Math.random() * products.length)];
                    const action = actions[Math.floor(Math.random() * actions.length)];
                    
                    // Create timestamp within the day
                    const timestamp = new Date(d.getTime() + Math.random() * 24 * 60 * 60 * 1000);
                    
                    const analytics = new Analytics({
                        product: product._id,
                        seller: seller._id,
                        action,
                        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        timestamp,
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        ipAddress: '127.0.0.1',
                        referrer: 'https://velvra.com'
                    });

                    await analytics.save();
                }
            }

            console.log(`Completed analytics for seller: ${seller.businessName}`);
        }

        console.log('Analytics data population completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error populating analytics data:', error);
        process.exit(1);
    }
}

// Run the population
populateAnalytics(); 