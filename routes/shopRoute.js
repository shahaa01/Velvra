const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Wishlist = require('../models/wishlist');

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
        
        let wishlistProductIds = [];
        if (req.user) {
            const wishlist = await Wishlist.findOne({ user: req.user._id });
            wishlistProductIds = wishlist ? wishlist.products.map(id => id.toString()) : [];
        }
        res.render('page/shop', {
            title: "Premium Collections | Velvra",
            heroTitle: "Premium",
            heroDescription: "Discover our meticulously curated selection of premium fashion. Each piece reflects timeless elegance, exceptional craftsmanship, and modern sophistication—designed to elevate every wardrobe.",
            products: products,
            wishlistProductIds,
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

// Helper function to build filter query
// const buildFilterQuery = (filters) => {
//     const andConditions = [];
    
//     // Price filter
//     if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
//         andConditions.push({
//             $or: [
//                 {
//                     salePrice: {
//                         $gte: filters.minPrice || 0,
//                         $lte: filters.maxPrice || Number.MAX_VALUE
//                     }
//                 },
//                 {
//                     salePrice: { $exists: false }, // For products without a salePrice
//                     price: {
//                         $gte: filters.minPrice || 0,
//                         $lte: filters.maxPrice || Number.MAX_VALUE
//                     }
//                 }
//             ]
//         });
//     }
    
//     // Category filter (using tags)
//     if (filters.categories && filters.categories.length > 0) {
//         andConditions.push({ tags: { $in: filters.categories } });
//     }
    
//     // Color filter
//     if (filters.colors && filters.colors.length > 0) {
//         andConditions.push({ 'colors.name': { $in: filters.colors } });
//     }
    
//     // Brand filter
//     if (filters.brands && filters.brands.length > 0) {
//         andConditions.push({ brand: { $in: filters.brands } });
//     }
    
//     // Size filter
//     if (filters.sizes && filters.sizes.length > 0) {
//         andConditions.push({ sizes: { $in: filters.sizes } });
//     }
    
//     // Discount filter
//     if (filters.discounts && filters.discounts.length > 0) {
//         const discountConditions = filters.discounts.map(discount => {
//             const discountValue = parseInt(discount);
//             // Only add condition if discountValue is a valid number
//             if (!isNaN(discountValue)) {
//                 return { sale: true, salePercentage: { $gte: discountValue } };
//             }
//             return null; // Return null for invalid values
//         }).filter(condition => condition !== null); // Filter out nulls
        
//         if (discountConditions.length > 0) {
//             // Combine all discount conditions with an OR, and then push as one AND condition
//             andConditions.push({ $or: discountConditions });
//         }
//     }
    
//     // Specific category (men/women)
//     if (filters.category) {
//         andConditions.push({ category: filters.category });
//     }
    
//     // If there are conditions, combine them with $and
//     if (andConditions.length > 0) {
//         return { $and: andConditions };
//     } else {
//         // If no filters, return an empty query (matches all documents)
//         return {};
//     }
// };

// Add this function after the buildFilterQuery function in shopRoute.js

// Helper function to handle search queries
const handleSearchQuery = (searchQuery) => {
    if (!searchQuery) return null;
    
    // Create regex for partial matching
    const searchRegex = new RegExp(searchQuery.split(' ').join('|'), 'i');
    
    return {
        $or: [
            { name: searchRegex },
            { brand: searchRegex },
            { category: searchRegex },
            { tags: { $in: [searchRegex] } },
            { description: searchRegex }
        ]
    };
};

// Update the existing buildFilterQuery function to include search
const buildFilterQuery = (filters, searchQuery) => {
    const andConditions = [];
    
    // Add search conditions if search query exists
    const searchConditions = handleSearchQuery(searchQuery);
    if (searchConditions) {
        andConditions.push(searchConditions);
    }
    
    // ... rest of your existing filter conditions (price, category, etc.)
    // Keep all your existing filter code here
    
    // Price filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        andConditions.push({
            $or: [
                {
                    salePrice: {
                        $gte: filters.minPrice || 0,
                        $lte: filters.maxPrice || Number.MAX_VALUE
                    }
                },
                {
                    salePrice: { $exists: false },
                    price: {
                        $gte: filters.minPrice || 0,
                        $lte: filters.maxPrice || Number.MAX_VALUE
                    }
                }
            ]
        });
    }
    
    // Category filter (using tags)
    if (filters.categories && filters.categories.length > 0) {
        andConditions.push({ tags: { $in: filters.categories } });
    }
    
    // Color filter
    if (filters.colors && filters.colors.length > 0) {
        andConditions.push({ 'colors.name': { $in: filters.colors } });
    }
    
    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
        andConditions.push({ brand: { $in: filters.brands } });
    }
    
    // Size filter
    if (filters.sizes && filters.sizes.length > 0) {
        andConditions.push({ sizes: { $in: filters.sizes } });
    }
    
    // Discount filter
    if (filters.discounts && filters.discounts.length > 0) {
        const discountConditions = filters.discounts.map(discount => {
            const discountValue = parseInt(discount);
            if (!isNaN(discountValue)) {
                return { sale: true, salePercentage: { $gte: discountValue } };
            }
            return null;
        }).filter(condition => condition !== null);
        
        if (discountConditions.length > 0) {
            andConditions.push({ $or: discountConditions });
        }
    }
    
    // Specific category (men/women)
    if (filters.category) {
        andConditions.push({ category: filters.category });
    }
    
    // If there are conditions, combine them with $and
    if (andConditions.length > 0) {
        return { $and: andConditions };
    } else {
        return {};
    }
};

// Update the /api/products route to handle all filter parameters
router.get('/api/products', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * ITEMS_PER_PAGE;
        
        // Parse filters from query parameters
        const filters = {
            minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
            categories: req.query.categories ? req.query.categories.split(',') : [],
            colors: req.query.colors ? req.query.colors.split(',') : [],
            brands: req.query.brands ? req.query.brands.split(',') : [],
            discounts: (req.query.discounts && req.query.discounts !== '') ? req.query.discounts.split(',') : [],
            sizes: req.query.sizes ? req.query.sizes.split(',') : [],
            category: req.query.category // for men/women specific pages
        };
        
        // Build query based on filters
        const query = buildFilterQuery(filters);
        
        // Get total count of filtered products
        const totalProducts = await Product.countDocuments(query);
        
        // Get filtered products for current page
        const products = await Product.find(query)
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .sort({ createdAt: -1 });
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        const hasMore = page < totalPages;
        const startItem = totalProducts > 0 ? skip + 1 : 0;
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

router.route('/unicategory')
    .get(renderShop);

router.route('/men')
    .get(async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * ITEMS_PER_PAGE;
            
            // Parse all filters from query parameters, including category
            const filters = {
                minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
                maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
                categories: req.query.categories ? req.query.categories.split(',') : [],
                colors: req.query.colors ? req.query.colors.split(',') : [],
                brands: req.query.brands ? req.query.brands.split(',') : [],
                discounts: (req.query.discounts && req.query.discounts !== '') ? req.query.discounts.split(',') : [],
                sizes: req.query.sizes ? req.query.sizes.split(',') : [],
                category: 'men' // Hardcode category for this route
            };

            // Build query based on ALL filters
            const query = buildFilterQuery(filters);

            // Get total count of filtered products
            const totalProducts = await Product.countDocuments(query);
            
            // Get filtered products for current page
            const products = await Product.find(query)
                .skip(skip)
                .limit(ITEMS_PER_PAGE)
                .sort({ createdAt: -1 });
            
            // Calculate pagination info
            const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
            const hasMore = page < totalPages;
            const startItem = totalProducts > 0 ? skip + 1 : 0;
            const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
            
            // Debug log to check product order
            console.log(products.map(p => ({ name: p.name, salePercentage: p.salePercentage })));
            let wishlistProductIds = [];
            if (req.user) {
                const wishlist = await Wishlist.findOne({ user: req.user._id });
                wishlistProductIds = wishlist ? wishlist.products.map(id => id.toString()) : [];
            }
            res.render('page/shop', {
                title: "Men's Collection | Velvra", 
                heroDescription: "Discover our meticulously curated selection of premium menswear. Each piece embodies timeless elegance, exceptional craftsmanship, and contemporary sophistication.",
                heroTitle: "Men's", 
                products: products,
                wishlistProductIds,
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
            
            // Parse all filters from query parameters, including category
            const filters = {
                minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
                maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
                categories: req.query.categories ? req.query.categories.split(',') : [],
                colors: req.query.colors ? req.query.colors.split(',') : [],
                brands: req.query.brands ? req.query.brands.split(',') : [],
                discounts: (req.query.discounts && req.query.discounts !== '') ? req.query.discounts.split(',') : [],
                sizes: req.query.sizes ? req.query.sizes.split(',') : [],
                category: 'women' // Hardcode category for this route
            };

            // Build query based on ALL filters
            const query = buildFilterQuery(filters);

            // Get total count of filtered products
            const totalProducts = await Product.countDocuments(query);
            
            // Get filtered products for current page
            const products = await Product.find(query)
                .skip(skip)
                .limit(ITEMS_PER_PAGE)
                .sort({ createdAt: -1 });
            
            // Calculate pagination info
            const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
            const hasMore = page < totalPages;
            const startItem = totalProducts > 0 ? skip + 1 : 0;
            const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
            
            let wishlistProductIds = [];
            if (req.user) {
                const wishlist = await Wishlist.findOne({ user: req.user._id });
                wishlistProductIds = wishlist ? wishlist.products.map(id => id.toString()) : [];
            }
            res.render('page/shop', {
                title: "Women's Collection | Velvra",
                heroDescription: "Explore our meticulously curated collection of premium womenswear. Every piece embodies timeless elegance, refined craftsmanship, and modern femininity designed to empower and inspire.", 
                heroTitle: "Women's",
                products: products,
                wishlistProductIds,
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

// Add new route for sale products
router.route('/sale')
    .get(async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * ITEMS_PER_PAGE;
            
            // Build query for sale products
            const query = { 
                sale: true,
                salePercentage: { $exists: true, $ne: null } // Ensure salePercentage exists and is not null
            };
            
            // Get total count of sale products
            const totalProducts = await Product.countDocuments(query);
            
            // Get sale products for current page, sorted by salePercentage
            const products = await Product.find(query)
                .sort({ salePercentage: -1 }) // Sort by salePercentage in descending order
                .skip(skip)
                .limit(ITEMS_PER_PAGE);
            
            // Calculate pagination info
            const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
            const hasMore = page < totalPages;
            const startItem = totalProducts > 0 ? skip + 1 : 0;
            const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
            
            // Debug log to check product order
            console.log(products.map(p => ({ name: p.name, salePercentage: p.salePercentage })));
            let wishlistProductIds = [];
            if (req.user) {
                const wishlist = await Wishlist.findOne({ user: req.user._id });
                wishlistProductIds = wishlist ? wishlist.products.map(id => id.toString()) : [];
            }
            res.render('page/shop', {
                title: "Sale Items | Velvra",
                heroTitle: "Sale",
                heroDescription: "Discover our exclusive sale items with the best discounts. Shop now to get amazing deals on premium fashion pieces.",
                products: products,
                wishlistProductIds,
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
            console.error('Error loading sale products:', error);
            res.status(500).render('error', { message: 'Error loading sale products' });
        }
    });

module.exports = router;