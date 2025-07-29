const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    size: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [cartItemSchema],
    total: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Method to calculate total
cartSchema.methods.calculateTotal = async function() {
    try {
        let total = 0;
        // Populate products if not already populated
        if (!this.items[0]?.product?.variants) {
            await this.populate('items.product');
        }
        
        for (const item of this.items) {
            if (item.product) {
                // Find the variant for this item's color and size
                const variant = item.product.variants.find(v => 
                    v.color === item.color && v.size === item.size
                );
                if (variant) {
                    // Use salePrice if available, otherwise use regular price
                    const itemPrice = variant.salePrice || variant.price;
                    if (itemPrice) {
                        total += itemPrice * item.quantity;
                    }
                }
            }
        }
        this.total = total;
        return total;
    } catch (error) {
        console.error('Error calculating cart total:', error);
        this.total = 0;
        return 0;
    }
};

// Calculate total before saving
cartSchema.pre('save', async function(next) {
    try {
        await this.calculateTotal();
        next();
    } catch (error) {
        console.error('Error in pre-save hook:', error);
        next(error);
    }
});

module.exports = mongoose.model('Cart', cartSchema); 