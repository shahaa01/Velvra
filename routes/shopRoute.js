const express = require('express');
const router = express.Router();
const Product = require('../models/product');

// Pagination configuration
const ITEMS_PER_PAGE = 12;

const renderShop = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * ITEMS_PER_PAGE;
        
        // Get total count of products
        const totalProducts = await Product.countDocuments({});
        
        // Get products for current page
        const products = await Product.find({})
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .sort({ createdAt: -1 }); // Sort by newest first
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        const hasMore = page < totalPages;
        const startItem = skip + 1;
        const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
        
        res.render('page/shop', {
            title: "Premium Collections | Velvra",
            heroTitle: "Premium",
            heroDescription: "Discover our meticulously curated selection of premium fashion. Each piece reflects timeless elegance, exceptional craftsmanship, and modern sophistication—designed to elevate every wardrobe.",
            products: products,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalProducts: totalProducts,
                hasMore: hasMore,
                startItem: startItem,
                endItem: endItem,
                itemsPerPage: ITEMS_PER_PAGE
            }
        });
    } catch (error) {
        console.error('Error loading shop page:', error);
        res.status(500).render('error', { message: 'Error loading products' });
    }
};

// API endpoint for loading more products
router.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * ITEMS_PER_PAGE;
        
        // Get total count of products
        const totalProducts = await Product.countDocuments({});
        
        // Get products for current page
        const products = await Product.find({})
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .sort({ createdAt: -1 });
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        const hasMore = page < totalPages;
        const startItem = skip + 1;
        const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
        
        res.json({
            products: products,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalProducts: totalProducts,
                hasMore: hasMore,
                startItem: startItem,
                endItem: endItem,
                itemsPerPage: ITEMS_PER_PAGE
            }
        });
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).json({ error: 'Error loading products' });
    }
});

router.route('/')
    .get(renderShop);

router.route('/unisex')
    .get(renderShop);

router.route('/men')
    .get(async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * ITEMS_PER_PAGE;
            
            // Get total count of men's products
            const totalProducts = await Product.countDocuments({category: 'men'});
            
            // Get products for current page
            const products = await Product.find({category: 'men'})
                .skip(skip)
                .limit(ITEMS_PER_PAGE)
                .sort({ createdAt: -1 });
            
            // Calculate pagination info
            const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
            const hasMore = page < totalPages;
            const startItem = skip + 1;
            const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
            
            res.render('page/shop', {
                title: "Men's Collection | Velvra", 
                heroDescription: "Discover our meticulously curated selection of premium menswear. Each piece embodies timeless elegance, exceptional craftsmanship, and contemporary sophistication.",
                heroTitle: "Men's", 
                products: products,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalProducts: totalProducts,
                    hasMore: hasMore,
                    startItem: startItem,
                    endItem: endItem,
                    itemsPerPage: ITEMS_PER_PAGE
                }
            });
        } catch (error) {
            console.error('Error loading men\'s shop page:', error);
            res.status(500).render('error', { message: 'Error loading products' });
        }
    });

router.route('/women')
    .get(async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * ITEMS_PER_PAGE;
            
            // Get total count of women's products
            const totalProducts = await Product.countDocuments({category: 'women'});
            
            // Get products for current page
            const products = await Product.find({category: 'women'})
                .skip(skip)
                .limit(ITEMS_PER_PAGE)
                .sort({ createdAt: -1 });
            
            // Calculate pagination info
            const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
            const hasMore = page < totalPages;
            const startItem = skip + 1;
            const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
            
            res.render('page/shop', {
                title: "Women's Collection | Velvra",
                heroDescription: "Explore our meticulously curated collection of premium womenswear. Every piece embodies timeless elegance, refined craftsmanship, and modern femininity designed to empower and inspire.", 
                heroTitle: "Women's",
                products: products,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalProducts: totalProducts,
                    hasMore: hasMore,
                    startItem: startItem,
                    endItem: endItem,
                    itemsPerPage: ITEMS_PER_PAGE
                }
            });
        } catch (error) {
            console.error('Error loading women\'s shop page:', error);
            res.status(500).render('error', { message: 'Error loading products' });
        }
    });

module.exports = router;