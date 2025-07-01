const mongoose = require('mongoose');
const Order = require('./models/order');
const User = require('./models/user');
const Product = require('./models/product');
const Seller = require('./models/Seller');

async function createTestOrders() {
    try {
        // Connect to database
        await mongoose.connect('mongodb://127.0.0.1:27017/velvra');
        console.log('Connected to database');

        // Get a test user
        const user = await User.findOne();
        if (!user) {
            console.log('No users found. Please create a user first.');
            return;
        }

        // Get a test seller
        const seller = await Seller.findOne();
        if (!seller) {
            console.log('No sellers found. Please create a seller first.');
            return;
        }

        // Get some products
        const products = await Product.find({ seller: seller._id }).limit(3);
        if (products.length === 0) {
            console.log('No products found for this seller. Please create products first.');
            return;
        }

        // Create sample orders
        const sampleOrders = [
            {
                user: user._id,
                items: [
                    {
                        product: products[0]._id,
                        seller: seller._id,
                        quantity: 2,
                        size: 'M',
                        color: 'Blue',
                        price: products[0].price,
                        totalPrice: products[0].price * 2
                    }
                ],
                shippingAddress: {
                    name: 'John Doe',
                    phone: '+1234567890',
                    street: '123 Main St',
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001'
                },
                paymentMethod: 'cod',
                paymentStatus: 'completed',
                orderStatus: 'pending',
                subtotal: products[0].price * 2,
                shippingCost: 10,
                discount: 0,
                total: products[0].price * 2 + 10,
                notes: 'Please deliver in the morning',
                priority: 'high'
            },
            {
                user: user._id,
                items: [
                    {
                        product: products[1] ? products[1]._id : products[0]._id,
                        seller: seller._id,
                        quantity: 1,
                        size: 'L',
                        color: 'Black',
                        price: products[1] ? products[1].price : products[0].price,
                        totalPrice: products[1] ? products[1].price : products[0].price
                    }
                ],
                shippingAddress: {
                    name: 'Jane Smith',
                    phone: '+1234567891',
                    street: '456 Oak Ave',
                    city: 'Los Angeles',
                    state: 'CA',
                    postalCode: '90001'
                },
                paymentMethod: 'esewa',
                paymentStatus: 'completed',
                orderStatus: 'processing',
                subtotal: products[1] ? products[1].price : products[0].price,
                shippingCost: 15,
                discount: 5,
                total: (products[1] ? products[1].price : products[0].price) + 15 - 5,
                priority: 'medium'
            },
            {
                user: user._id,
                items: [
                    {
                        product: products[2] ? products[2]._id : products[0]._id,
                        seller: seller._id,
                        quantity: 3,
                        size: 'S',
                        color: 'Red',
                        price: products[2] ? products[2].price : products[0].price,
                        totalPrice: (products[2] ? products[2].price : products[0].price) * 3
                    }
                ],
                shippingAddress: {
                    name: 'Mike Johnson',
                    phone: '+1234567892',
                    street: '789 Pine St',
                    city: 'Chicago',
                    state: 'IL',
                    postalCode: '60601'
                },
                paymentMethod: 'khalti',
                paymentStatus: 'completed',
                orderStatus: 'shipped',
                subtotal: (products[2] ? products[2].price : products[0].price) * 3,
                shippingCost: 12,
                discount: 0,
                total: (products[2] ? products[2].price : products[0].price) * 3 + 12,
                trackingNumber: 'TRK123456789',
                priority: 'low'
            },
            {
                user: user._id,
                items: [
                    {
                        product: products[0]._id,
                        seller: seller._id,
                        quantity: 1,
                        size: 'XL',
                        color: 'White',
                        price: products[0].price,
                        totalPrice: products[0].price
                    }
                ],
                shippingAddress: {
                    name: 'Sarah Wilson',
                    phone: '+1234567893',
                    street: '321 Elm St',
                    city: 'Houston',
                    state: 'TX',
                    postalCode: '77001'
                },
                paymentMethod: 'ime',
                paymentStatus: 'completed',
                orderStatus: 'delivered',
                subtotal: products[0].price,
                shippingCost: 8,
                discount: 0,
                total: products[0].price + 8,
                deliveryDate: new Date(),
                trackingNumber: 'TRK987654321',
                priority: 'low'
            }
        ];

        // Clear existing test orders
        await Order.deleteMany({ user: user._id });
        console.log('Cleared existing test orders');

        // Insert new orders
        const createdOrders = await Order.insertMany(sampleOrders);
        console.log(`Created ${createdOrders.length} test orders:`);
        
        createdOrders.forEach((order, index) => {
            console.log(`${index + 1}. Order ${order.orderNumber} - Status: ${order.orderStatus} - Total: $${order.total}`);
        });

        console.log('Test orders created successfully!');
        console.log('You can now test the seller dashboard at: http://localhost:8080/seller-dashboard/orders');

    } catch (error) {
        console.error('Error creating test orders:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

createTestOrders(); 