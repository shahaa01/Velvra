const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Wishlist = require('../models/wishlist');
const Order = require('../models/order'); // <-- Add this import at the top
const { isLoggedIn } = require('../middlewares/authMiddleware');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Pagination configuration
const ITEMS_PER_PAGE = 12;

const renderShop = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;
    
    // Get total count of products
    const totalProducts = await Product.countDocuments({});
    
    // Get products for current page
    const products = await Product.find({})
        .skip(skip)
        .limit(ITEMS_PER_PAGE)
        .sort({ createdAt: -1 }); // Sort by newest first
    
    // Debug: Log the first product to see its structure
    if (products.length > 0) {
        console.log('First product structure:', JSON.stringify(products[0], null, 2));
        
        // Debug sale percentage calculation for the first product
        const firstProduct = products[0];
        if (firstProduct.variants && Array.isArray(firstProduct.variants)) {
            console.log('First product variants:', firstProduct.variants);
            
            // Find variants with sale percentage > 0
            const variantsWithSale = firstProduct.variants.filter(v => 
                (v.salePercentage && parseInt(v.salePercentage) > 0) || 
                (v.salePrice !== null && v.salePrice !== undefined && v.salePrice < v.price)
            );
            console.log('Variants with sale:', variantsWithSale);
            
            if (variantsWithSale.length > 0) {
                // Show highest sale percentage
                const highestSalePercentageVariant = variantsWithSale.reduce((highest, current) => {
                    const currentPercentage = parseInt(current.salePercentage) || 0;
                    const highestPercentage = parseInt(highest.salePercentage) || 0;
                    return currentPercentage > highestPercentage ? current : highest;
                });
                const calculatedSalePercentage = parseInt(highestSalePercentageVariant.salePercentage) || 0;
                console.log('Calculated sale percentage:', calculatedSalePercentage);
                console.log('Highest sale percentage variant:', highestSalePercentageVariant);
            }
        }
    }
    
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
    
    // Price filter - updated for variant structure
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        andConditions.push({
            variants: {
                $elemMatch: {
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
                }
            }
        });
    }
    
    // Category filter (using tags)
    if (filters.categories && filters.categories.length > 0) {
        andConditions.push({ tags: { $in: filters.categories } });
    }
    
    // Color filter - improved to search by both name and hex code
    if (filters.colors && filters.colors.length > 0) {
        // Create an array of color conditions for each filter color
        const colorConditions = filters.colors.map(filterColor => {
            // Handle combined format: "ColorName|#HexCode1,#HexCode2,...|SimilarColor1,SimilarColor2,..." or just "ColorName"
            const parts = filterColor.split('|');
            const colorName = parts[0];
            const hexCodes = parts[1] ? parts[1].split(',') : [];
            const similarColors = parts[2] ? parts[2].split(',') : [];
            
            const conditions = [
                { 'colors.name': { $regex: new RegExp(colorName, 'i') } } // Case-insensitive name match
            ];
            
            // Add hex code conditions if available
            if (hexCodes.length > 0) {
                const hexConditions = hexCodes.map(hexCode => ({
                    'colors.hex': { $regex: new RegExp(hexCode.trim(), 'i') }
                }));
                conditions.push(...hexConditions);
            }
            
            // Add similar color name conditions if available
            if (similarColors.length > 0) {
                const similarColorConditions = similarColors.map(similarColor => ({
                    'colors.name': { $regex: new RegExp(similarColor.trim(), 'i') }
                }));
                conditions.push(...similarColorConditions);
            }
            
            return { $or: conditions };
        });
        
        // Add all color conditions with $or
        andConditions.push({ $or: colorConditions });
    }
    
    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
        andConditions.push({ brand: { $in: filters.brands } });
    }
    
    // Size filter - updated for variant structure
    if (filters.sizes && filters.sizes.length > 0) {
        andConditions.push({
            variants: {
                $elemMatch: {
                    size: { $in: filters.sizes }
                }
            }
        });
    }
    
    // Discount filter - updated for variant structure to check maximum salePercentage
    if (filters.discounts && filters.discounts.length > 0) {
        const discountConditions = filters.discounts.map(discount => {
            const discountValue = parseInt(discount);
            if (!isNaN(discountValue)) {
                return {
                    $expr: {
                        $gte: [
                            { $max: "$variants.salePercentage" },
                            discountValue
                        ]
                    }
                };
            }
            return null;
        }).filter(condition => condition !== null);
        
        if (discountConditions.length > 0) {
            andConditions.push({ $or: discountConditions });
        }
    }
    
    // Specific category (men/women) - case-insensitive
    if (filters.category) {
        andConditions.push({ category: { $regex: new RegExp('^' + filters.category + '$', 'i') } });
    }
    
    // If there are conditions, combine them with $and
    if (andConditions.length > 0) {
        return { $and: andConditions };
    } else {
        return {};
    }
};

// Update the /api/products route to handle all filter parameters
router.get('/api/products', asyncWrap(async (req, res) => {
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
        // --- Best Selling Sort ---
        if (req.query.sort === 'best-selling') {
            // 1. Aggregate order data to get total sold per product
            const salesAgg = await Order.aggregate([
                { $unwind: '$items' },
                { $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' }
                }},
                { $sort: { totalSold: -1 } }
            ]);
            const bestSellingIds = salesAgg.map(r => r._id.toString());
            // 2. Fetch all products matching filters
            let filteredProducts = await Product.find(query);
            // 3. Sort filtered products by best-selling order
            filteredProducts.sort((a, b) => {
                const aIdx = bestSellingIds.indexOf(a._id.toString());
                const bIdx = bestSellingIds.indexOf(b._id.toString());
                if (aIdx === -1 && bIdx === -1) return 0;
                if (aIdx === -1) return 1;
                if (bIdx === -1) return -1;
                return aIdx - bIdx;
            });
            // 4. Paginate
            const totalProducts = filteredProducts.length;
            const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
            const hasMore = page < totalPages;
            const startItem = totalProducts > 0 ? skip + 1 : 0;
            const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
            const products = filteredProducts.slice(skip, skip + ITEMS_PER_PAGE);
            return res.json({
                products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProducts,
                    hasMore,
                    startItem,
                    endItem,
                    itemsPerPage: ITEMS_PER_PAGE
                }
            });
        }
        // --- Price Sorting (Aggregation) - Updated for variant structure ---
        if (req.query.sort === 'price-low' || req.query.sort === 'price-high') {
            // Use aggregation to sort by effective price from variants
            const sortOrder = req.query.sort === 'price-low' ? 1 : -1;
            const pipeline = [
                { $match: query },
                { $addFields: {
                    effectivePrice: {
                        $let: {
                            vars: {
                                variantsWithSale: {
                                    $filter: {
                                        input: "$variants",
                                        as: "variant",
                                        cond: { 
                                            $and: [
                                                { $ne: ["$$variant.salePrice", null] },
                                                { $lt: ["$$variant.salePrice", "$$variant.price"] }
                                            ]
                                        }
                                    }
                                }
                            },
                            in: {
                                $cond: {
                                    if: { $gt: [{ $size: "$$variantsWithSale" }, 0] },
                                    then: { $min: "$$variantsWithSale.salePrice" },
                                    else: { $min: "$variants.price" }
                                }
                            }
                        }
                    }
                }},
                { $sort: { effectivePrice: sortOrder, createdAt: -1 } },
                { $skip: skip },
                { $limit: ITEMS_PER_PAGE }
            ];
            const products = await Product.aggregate(pipeline);
            const totalProducts = await Product.countDocuments(query);
            const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
            const hasMore = page < totalPages;
            const startItem = totalProducts > 0 ? skip + 1 : 0;
            const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
            return res.json({
                products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProducts,
                    hasMore,
                    startItem,
                    endItem,
                    itemsPerPage: ITEMS_PER_PAGE
                }
            });
        }
        // --- Other Sorts ---
        // Get total count of filtered products
        const totalProducts = await Product.countDocuments(query);
        // Determine sort object
        let sortObj = { createdAt: -1 }; // Default: featured/newest
        if (req.query.sort === 'featured') sortObj = { createdAt: -1 }; // You can customize this if you have a featured field
        if (req.query.sort === 'newest') sortObj = { createdAt: -1 };
        // Get filtered products for current page
        const products = await Product.find(query)
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .sort(sortObj);
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
}));

// Add new API endpoint for sale products (AJAX)
router.get('/api/products/sale', asyncWrap(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * ITEMS_PER_PAGE;
        // Build query for sale products - updated for variant structure
        const query = {
            variants: {
                $elemMatch: {
                    salePrice: { $exists: true, $ne: null },
                    salePercentage: { $gt: 0 }
                }
            }
        };
        // Optionally add filters (price, categories, colors, brands, discounts, sizes)
        if (req.query.minPrice || req.query.maxPrice) {
            query.variants = {
                $elemMatch: {
                    ...query.variants.$elemMatch,
                    $or: [
                        {
                            salePrice: {
                                $gte: req.query.minPrice ? parseInt(req.query.minPrice) : 0,
                                $lte: req.query.maxPrice ? parseInt(req.query.maxPrice) : Number.MAX_VALUE
                            }
                        },
                        {
                            salePrice: { $exists: false },
                            price: {
                                $gte: req.query.minPrice ? parseInt(req.query.minPrice) : 0,
                                $lte: req.query.maxPrice ? parseInt(req.query.maxPrice) : Number.MAX_VALUE
                            }
                        }
                    ]
                }
            };
        }
        if (req.query.categories) query.tags = { $in: req.query.categories.split(',') };
        if (req.query.colors) query['colors.name'] = { $in: req.query.colors.split(',') };
        if (req.query.brands) query.brand = { $in: req.query.brands.split(',') };
        if (req.query.discounts) {
            const discounts = req.query.discounts.split(',').map(Number).filter(n => !isNaN(n));
            if (discounts.length > 0) {
                // Use aggregation to check maximum salePercentage across all variants
                const pipeline = [
                    { $match: query },
                    { $addFields: {
                        maxSalePercentage: { $max: "$variants.salePercentage" }
                    }},
                    { $match: {
                        maxSalePercentage: { $gte: Math.min(...discounts) }
                    }},
                    { $skip: skip },
                    { $limit: ITEMS_PER_PAGE }
                ];
                const products = await Product.aggregate(pipeline);
                const totalProducts = await Product.countDocuments(query);
                const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
                const hasMore = page < totalPages;
                const startItem = totalProducts > 0 ? skip + 1 : 0;
                const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
                return res.json({
                    products,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalProducts,
                        hasMore,
                        startItem,
                        endItem,
                        itemsPerPage: ITEMS_PER_PAGE
                    }
                });
            }
        }
        if (req.query.sizes) query.variants = {
            $elemMatch: {
                ...query.variants.$elemMatch,
                size: { $in: req.query.sizes.split(',') }
            }
        };
        // Sorting - use aggregation for price sorting
        let sortObj = { createdAt: -1 }; // Default sort
        if (req.query.sort === 'price-low' || req.query.sort === 'price-high') {
            // Use aggregation for price sorting
            const sortOrder = req.query.sort === 'price-low' ? 1 : -1;
            const pipeline = [
                { $match: query },
                { $addFields: {
                    effectivePrice: {
                        $min: {
                            $map: {
                                input: "$variants",
                                as: "variant",
                                in: { $ifNull: ["$$variant.salePrice", "$$variant.price"] }
                            }
                        }
                    }
                }},
                { $sort: { effectivePrice: sortOrder, createdAt: -1 } },
                { $skip: skip },
                { $limit: ITEMS_PER_PAGE }
            ];
            const products = await Product.aggregate(pipeline);
            const totalProducts = await Product.countDocuments(query);
            const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
            const hasMore = page < totalPages;
            const startItem = totalProducts > 0 ? skip + 1 : 0;
            const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
            return res.json({
                products,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProducts,
                    hasMore,
                    startItem,
                    endItem,
                    itemsPerPage: ITEMS_PER_PAGE
                }
            });
        }
        // Get total count of sale products
        const totalProducts = await Product.countDocuments(query);
        // Get sale products for current page, sorted
        const products = await Product.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(ITEMS_PER_PAGE);
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
}));

router.route('/')
    .get(renderShop);

router.route('/unicategory')
    .get(renderShop);

router.route('/men')
    .get(asyncWrap(async (req, res) => {
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
        
        // Add men filter - check if first element of categoryPath is "men" (case-insensitive)
        query['categoryPath.0'] = { $regex: new RegExp('^men$', 'i') };

        // Debug: Log the query and results
        console.log('Men route query:', JSON.stringify(query, null, 2));
        const totalProducts = await Product.countDocuments(query);
        console.log('Total men products found:', totalProducts);
        
        // Get filtered products for current page with sorting
        const products = await Product.find(query)
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .sort({ 
                contentScore: -1, 
                averageRating: -1, 
                salePercentage: -1, 
                createdAt: -1 
            });
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        const hasMore = page < totalPages;
        const startItem = totalProducts > 0 ? skip + 1 : 0;
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
    }));

router.route('/women')
    .get(asyncWrap(async (req, res) => {
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
        
        // Add women filter - check if first element of categoryPath is "women" (case-insensitive)
        query['categoryPath.0'] = { $regex: new RegExp('^women$', 'i') };

        // Get total count of filtered products
        const totalProducts = await Product.countDocuments(query);
        
        // Get filtered products for current page with sorting
        const products = await Product.find(query)
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .sort({ 
                contentScore: -1, 
                averageRating: -1, 
                salePercentage: -1, 
                createdAt: -1 
            });
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        const hasMore = page < totalPages;
        const startItem = totalProducts > 0 ? skip + 1 : 0;
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
    }));

router.route('/kids')
    .get(asyncWrap(async (req, res) => {
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
            category: 'kids' // Hardcode category for this route
        };

        // Build query based on ALL filters
        const query = buildFilterQuery(filters);
        
        // Add kids filter - check if first element of categoryPath is "kids" (case-insensitive)
        query['categoryPath.0'] = { $regex: new RegExp('^kids$', 'i') };

        // Debug: Log the query and results
        console.log('Kids route query:', JSON.stringify(query, null, 2));
        const totalProducts = await Product.countDocuments(query);
        console.log('Total kids products found:', totalProducts);
        
        // Get filtered products for current page with sorting
        const products = await Product.find(query)
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .sort({ 
                contentScore: -1, 
                averageRating: -1, 
                salePercentage: -1, 
                createdAt: -1 
            });
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        const hasMore = page < totalPages;
        const startItem = totalProducts > 0 ? skip + 1 : 0;
        const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
        
        res.render('page/shop', {
            title: "Kids Collection | Velvra", 
            heroDescription: "Discover our carefully curated selection of premium kids' fashion. Each piece combines comfort, style, and durability to keep your little ones looking adorable and feeling great.",
            heroTitle: "Kids", 
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
    }));

// Add new route for unisex products
router.route('/unisex')
    .get(asyncWrap(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * ITEMS_PER_PAGE;
        
        // Parse all filters from query parameters
        const filters = {
            minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
            categories: req.query.categories ? req.query.categories.split(',') : [],
            colors: req.query.colors ? req.query.colors.split(',') : [],
            brands: req.query.brands ? req.query.brands.split(',') : [],
            discounts: (req.query.discounts && req.query.discounts !== '') ? req.query.discounts.split(',') : [],
            sizes: req.query.sizes ? req.query.sizes.split(',') : [],
            category: 'unisex'
        };

        // Build query based on ALL filters
        const query = buildFilterQuery(filters);
        
        // Add unisex filter - check if first element of categoryPath is "unisex" (case-insensitive)
        query['categoryPath.0'] = { $regex: new RegExp('^unisex$', 'i') };

        // Get total count of filtered products
        const totalProducts = await Product.countDocuments(query);
        
        // Get filtered products for current page with sorting
        const products = await Product.find(query)
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .sort({ 
                contentScore: -1, 
                averageRating: -1, 
                salePercentage: -1, 
                createdAt: -1 
            });
        
        // Calculate pagination info
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        const hasMore = page < totalPages;
        const startItem = totalProducts > 0 ? skip + 1 : 0;
        const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);
        
        res.render('page/shop', {
            title: "Unisex Collection | Velvra",
            heroDescription: "Discover our versatile unisex collection designed for everyone. Each piece transcends traditional gender boundaries with contemporary style and universal appeal.",
            heroTitle: "Unisex",
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
    }));

// Add new route for sale products
router.route('/sale')
    .get(asyncWrap(async (req, res) => {
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
        res.render('page/shop', {
            title: "Sale Items | Velvra",
            heroTitle: "Sale",
            heroDescription: "Discover our exclusive sale items with the best discounts. Shop now to get amazing deals on premium fashion pieces.",
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
    }));

// ===== WISHLIST ROUTES =====

// All wishlist endpoints below operate on productId only, not variant or stock. Users can wishlist any product regardless of stock status.
// Check if product is in wishlist
router.get('/wishlist/check/:productId', isLoggedIn, asyncWrap(async (req, res) => {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const isInWishlist = wishlist ? wishlist.products.map(id => id.toString()).includes(productId) : false;
    res.json({ success: true, isInWishlist });
}));

// Add product to wishlist
router.post('/wishlist/add', isLoggedIn, asyncWrap(async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        throw new AppError('Product ID is required', 400);
    }
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
        wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }
    // Check if product is already in wishlist
    if (wishlist.products.some(id => id.toString() === productId)) {
        throw new AppError('Product already in wishlist', 400);
    }
    // Add product to wishlist
    wishlist.products.push(productId);
    await wishlist.save();
    return res.json({ 
        success: true, 
        message: 'Product added to wishlist',
        wishlistCount: wishlist.products.length
    });
}));

// Remove product from wishlist
router.delete('/wishlist/remove', isLoggedIn, asyncWrap(async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
        throw new AppError('Product ID is required', 400);
    }
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
        throw new AppError('Wishlist not found', 404);
    }
    // Remove product from wishlist only if present
    const initialLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    if (wishlist.products.length === initialLength) {
        throw new AppError('Product not in wishlist', 400);
    }
    await wishlist.save();
    return res.json({ 
        success: true, 
        message: 'Product removed from wishlist',
        wishlistCount: wishlist.products.length
    });
}));

// Get wishlist count
router.get('/wishlist/count', isLoggedIn, asyncWrap(async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const count = wishlist ? wishlist.products.length : 0;
    res.json({ success: true, count });
}));

// API endpoint to get current user's wishlist product IDs
router.get('/api/user/wishlist-ids', isLoggedIn, asyncWrap(async (req, res) => {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const productIds = wishlist ? wishlist.products.map(id => id.toString()) : [];
    res.json({ success: true, productIds });
}));

module.exports = router;