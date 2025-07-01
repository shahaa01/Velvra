const mongoose = require('mongoose');
const Seller = require('./models/Seller');
const Product = require('./models/product');
const Order = require('./models/order');

async function updateToRajeshShah() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/velvra');
        console.log('Connected to database');

        // Find Rajesh Shah's seller record
        const rajeshShah = await Seller.findOne({ 
            $or: [
                { brandName: 'Rajesh Shah' },
                { ownerName: 'Rajesh Kumar Sah' },
                { contactPerson: { $regex: /Rajesh/, $options: 'i' } }
            ]
        });

        if (!rajeshShah) {
            console.log('Rajesh Shah not found in sellers collection. Available sellers:');
            const allSellers = await Seller.find({}, 'brandName ownerName contactPerson');
            allSellers.forEach(seller => {
                console.log(`- ${seller.brandName} (Owner: ${seller.ownerName}, Contact: ${seller.contactPerson})`);
            });
            return;
        }

        console.log(`Found Rajesh Shah: ${rajeshShah.brandName} (ID: ${rajeshShah._id})`);
        console.log(`Owner: ${rajeshShah.ownerName}`);
        console.log(`Contact: ${rajeshShah.contactPerson}`);

        // Update all products to use Rajesh Shah's seller ID
        const updateResult = await Product.updateMany(
            {}, 
            { seller: rajeshShah._id }
        );

        console.log(`Updated ${updateResult.modifiedCount} products to use Rajesh Shah's seller ID`);

        // Update all orders to use Rajesh Shah's seller ID for all items
        const orders = await Order.find();
        let updatedOrders = 0;
        
        for (const order of orders) {
            let changed = false;
            for (const item of order.items) {
                item.seller = rajeshShah._id;
                changed = true;
            }
            if (changed) {
                await order.save();
                updatedOrders++;
            }
        }

        console.log(`Updated ${updatedOrders} orders to use Rajesh Shah's seller ID for all items`);

        // Verify the changes
        const productCount = await Product.countDocuments({ seller: rajeshShah._id });
        console.log(`Total products now using Rajesh Shah's seller ID: ${productCount}`);

        await mongoose.disconnect();
        console.log('Done!');

    } catch (error) {
        console.error('Script failed:', error);
    }
}

updateToRajeshShah(); 