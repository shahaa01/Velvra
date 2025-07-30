const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

async function clearAllAddresses() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/velvra');
        console.log('Connected to MongoDB');

        // Clear all addresses for all users
        const result = await User.updateMany(
            {},
            { $set: { addresses: [] } }
        );

        console.log(`Cleared addresses for ${result.modifiedCount} users`);
        console.log('All addresses have been deleted successfully!');

    } catch (error) {
        console.error('Error clearing addresses:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script
clearAllAddresses(); 