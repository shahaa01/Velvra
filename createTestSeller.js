const mongoose = require('mongoose');
const Seller = require('./models/Seller');
const User = require('./models/user');

async function createTestSeller() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/velvra');
        console.log('Connected to database');
        
        // Check if seller already exists
        const existingSeller = await Seller.findOne({ brandName: 'Velvra Store' });
        if (existingSeller) {
            console.log('Test seller already exists:', existingSeller._id);
            return existingSeller._id;
        }
        
        // First, create a test user for the seller
        let testUser = await User.findOne({ email: 'store@velvra.com' });
        if (!testUser) {
            testUser = new User({
                firstName: 'Velvra',
                lastName: 'Store',
                email: 'store@velvra.com',
                role: 'seller'
            });
            await User.register(testUser, 'testpassword123');
            console.log('Test user created:', testUser._id);
        } else {
            console.log('Test user already exists:', testUser._id);
        }
        
        // Create test seller with all required fields
        const testSeller = new Seller({
            user: testUser._id,
            brandName: 'Velvra Store',
            contactPerson: 'Store Manager',
            phone: 9876543210,
            email: 'store@velvra.com',
            businessType: 'brand',
            ownerName: 'Velvra Store Owner',
            panVatNumber: 123456789,
            panVatDocument: '/uploads/test-document.pdf',
            location: 'kathmandu',
            city: 'Kathmandu',
            message: 'Official Velvra store for all your fashion needs'
        });
        
        await testSeller.save();
        console.log('Test seller created:', testSeller._id);
        return testSeller._id;
        
    } catch (error) {
        console.error('Error creating test seller:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the function
createTestSeller().then(sellerId => {
    console.log('Test seller ID:', sellerId);
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
}); 