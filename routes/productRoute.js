const express = require('express');
const router = express.Router();
const Product = require('../models/product');

router.route('/:id')
    .get(async (req, res) => {
        try {
            const reqProduct = await Product.findById(req.params.id);
            const similarProduct = await Product.find({category: reqProduct.category, tags: {$in : reqProduct.tags}});
            if (!reqProduct) {
                console.error('Product not found:', req.params.id);
                return res.status(404).render('error', {message: 'Product not found'});
            }
            res.render('page/individualProduct', {
                title: "Premium " + reqProduct.name + " | Velvra",
                product: reqProduct,
                similarProducts: similarProduct
            });
        } catch (error) {
            console.error(error);
            res.status(500).render('error', {message: 'Internal Server Error'});
        }
    }); 

module.exports = router;