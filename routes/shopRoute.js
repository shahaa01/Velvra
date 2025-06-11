const express = require('express');
const router = express.Router();
const Product = require('../models/product');

router.route('/')
    .get(async(req, res) => {
        const reqProduct = await Product.find({});
        console.log(reqProduct);
        res.render('page/shop', {title: "Premium Collections | Velvra", 
        heroDescription: "Discover our meticulously curated selection of premium fashion. Each piece reflects timeless elegance, exceptional craftsmanship, and modern sophistication—designed to elevate every wardrobe.",
        heroTitle: "Premium", 
        products: reqProduct});
    })

router.route('/men')
    .get(async (req, res) => {
        const reqProduct = await Product.find({category: 'men'});
        res.render('page/shop', {title: "Men's Collection | Velvra", 
            heroDescription: "Discover our meticulously curated selection of premium menswear. Each piece embodies timeless elegance, exceptional craftsmanship, and contemporary sophistication.",
            heroTitle: "Men's", 
            products: reqProduct});
    })

router.route('/women')
    .get(async (req, res) => {
        const reqProduct = await Product.find({category: 'women'});
        res.render('page/shop', {title: "Women's Collection | Velvra",
            heroDescription: "Explore our meticulously curated collection of premium womenswear. Every piece embodies timeless elegance, refined craftsmanship, and modern femininity designed to empower and inspire.", 
            heroTitle: "Women's",
            products: reqProduct});
    })


module.exports = router;