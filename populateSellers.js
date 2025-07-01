const mongoose = require('mongoose');
const Seller = require('./models/Seller');
const User = require('./models/user');
const Product = require('./models/product');
const Order = require('./models/order');

const { faker } = require('@faker-js/faker');

const businessTypes = ['boutique', 'instagram', 'both', 'brand', 'designer'];
const locations = ['kathmandu', 'pokhara'];

async function createRandomSeller(productName, idx) {
    // Create a user for the seller
    const email = `seller${idx}_${Date.now()}@velvra.com`;
    const user = new User({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email,
        role: 'seller'
    });
    await User.register(user, 'testpassword123');

    // Generate a valid phone number: '9' + 9 digits
    const phone = '9' + faker.string.numeric({ length: 9, allowLeadingZeros: true });

    // Create a seller
    const seller = new Seller({
        user: user._id,
        brandName: faker.company.name() + ' ' + productName.split(' ')[0],
        contactPerson: faker.person.fullName(),
        phone: phone,
        email,
        businessType: faker.helpers.arrayElement(businessTypes),
        ownerName: faker.person.fullName(),
        panVatNumber: faker.number.int({ min: 100000000, max: 999999999 }),
        panVatDocument: '/uploads/test-document.pdf',
        location: faker.helpers.arrayElement(locations),
        city: faker.location.city(),
        message: `Seller for ${productName}`
    });
    await seller.save();
    return seller;
}

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/velvra');
    console.log('Connected to database');

    const products = await Product.find();
    console.log(`Found ${products.length} products.`);

    // Map of productId to sellerId
    const productSellerMap = {};

    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const seller = await createRandomSeller(product.name, i);
        product.seller = seller._id;
        await product.save();
        productSellerMap[product._id.toString()] = seller._id;
        console.log(`Assigned seller ${seller.brandName} to product ${product.name}`);
    }

    // Update orders
    const orders = await Order.find();
    let updatedOrders = 0;
    for (const order of orders) {
        let changed = false;
        for (const item of order.items) {
            if (item.product) {
                const sellerId = productSellerMap[item.product.toString()];
                if (sellerId) {
                    item.seller = sellerId;
                    changed = true;
                }
            }
        }
        if (changed) {
            await order.save();
            updatedOrders++;
        }
    }
    console.log(`Updated ${updatedOrders} orders with correct seller info.`);

    await mongoose.disconnect();
    console.log('Done!');
}

main().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
}); 