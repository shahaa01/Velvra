const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Fuse = require('fuse.js');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Enhanced fuzzy search options with better typo tolerance
const fuseOptions = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.4, // Increased tolerance for typos (0 = exact, 1 = match anything)
    location: 0,
    distance: 100,
    minMatchCharLength: 2,
    useExtendedSearch: true,
    ignoreLocation: true, // Search anywhere in the string
    keys: [
        { name: 'name', weight: 0.4 },
        { name: 'brand', weight: 0.3 },
        { name: 'category', weight: 0.2 },
        { name: 'tags', weight: 0.1 },
        { name: 'description', weight: 0.1 }
    ]
};

// Common variations and synonyms
const wordVariations = {
    'shirt': ['shirts', 'tshirt', 't-shirt', 'tee', 'top', 'blouse'],
    'shirts': ['shirt', 'tshirt', 't-shirt', 'tee', 'top', 'blouse'],
    'bag': ['bags', 'handbag', 'purse', 'backpack', 'tote', 'clutch'],
    'bags': ['bag', 'handbag', 'purse', 'backpack', 'tote', 'clutch'],
    'sweater': ['sweaters', 'jumper', 'pullover', 'cardigan', 'knitwear'],
    'sweaters': ['sweater', 'jumper', 'pullover', 'cardigan', 'knitwear'],
    'pant': ['pants', 'trousers', 'jeans', 'bottoms'],
    'pants': ['pant', 'trousers', 'jeans', 'bottoms'],
    'shoe': ['shoes', 'footwear', 'sneakers', 'boots', 'sandals'],
    'shoes': ['shoe', 'footwear', 'sneakers', 'boots', 'sandals'],
    'jacket': ['jackets', 'coat', 'blazer', 'outerwear'],
    'jackets': ['jacket', 'coat', 'blazer', 'outerwear'],
    'dress': ['dresses', 'gown', 'frock'],
    'dresses': ['dress', 'gown', 'frock'],
    'man': ['men', 'mens', "men's", 'male', 'gentleman'],
    'men': ['man', 'mens', "men's", 'male', 'gentleman'],
    'woman': ['women', 'womens', "women's", 'female', 'lady'],
    'women': ['woman', 'womens', "women's", 'female', 'lady'],
    'cloth': ['clothes', 'clothing', 'apparel', 'garment', 'wear'],
    'clothes': ['cloth', 'clothing', 'apparel', 'garment', 'wear'],
    'clothing': ['cloth', 'clothes', 'apparel', 'garment', 'wear']
};

// Stop words to remove from queries
const stopWords = new Set([
    'show', 'me', 'get', 'find', 'search', 'for', 'the', 'a', 'an', 
    'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'can', 'will', 'just', 'should', 'now', 'want', 'looking'
]);

// Function to stem words (basic implementation)
function stemWord(word) {
    // Remove common suffixes
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'ness', 'ment', 'ful', 'less', 'ize', 'ise'];
    let stemmed = word.toLowerCase();
    
    for (const suffix of suffixes) {
        if (stemmed.endsWith(suffix) && stemmed.length > suffix.length + 2) {
            return stemmed.slice(0, -suffix.length);
        }
    }
    
    // Handle special cases
    if (stemmed.endsWith('s') && stemmed.length > 3 && !stemmed.endsWith('ss')) {
        return stemmed.slice(0, -1);
    }
    
    return stemmed;
}

// Enhanced query parser with NLP-like features
function parseSearchQuery(query) {
    // Convert to lowercase and split into words
    const originalWords = query.toLowerCase()
        .replace(/[^\w\s-]/g, ' ') // Replace special chars with spaces
        .split(/\s+/)
        .filter(word => word.length > 0);
    
    const keywords = new Set();
    const searchTerms = new Set();
    
    // Process each word
    originalWords.forEach(word => {
        // Skip stop words
        if (stopWords.has(word)) return;
        
        // Add the original word
        searchTerms.add(word);
        keywords.add(word);
        
        // Add stemmed version
        const stemmed = stemWord(word);
        if (stemmed !== word) {
            searchTerms.add(stemmed);
        }
        
        // Add variations and synonyms
        if (wordVariations[word]) {
            wordVariations[word].forEach(variant => {
                searchTerms.add(variant);
                keywords.add(variant);
            });
        }
        
        // Check if the stemmed word has variations
        if (wordVariations[stemmed]) {
            wordVariations[stemmed].forEach(variant => {
                searchTerms.add(variant);
                keywords.add(variant);
            });
        }
    });
    
    // Add the full query as well (for phrase matching)
    if (query.trim().length > 0) {
        searchTerms.add(query.toLowerCase().trim());
    }
    
    return {
        original: query,
        keywords: Array.from(keywords),
        searchTerms: Array.from(searchTerms),
        hasMultipleWords: originalWords.length > 1
    };
}

// Get search suggestions
router.get('/suggestions', asyncWrap(async (req, res) => {
    const query = req.query.q;
    if (!query || query.length < 2) {
        return res.json({ suggestions: [] });
    }

    // Parse the query with enhanced parser
    const parsedQuery = parseSearchQuery(query);
    
    // Fetch products for fuzzy search
    const products = await Product.find({}).limit(200).lean();
    
    // Create Fuse instance with lenient settings for suggestions
    const suggestFuseOptions = {
        ...fuseOptions,
        threshold: 0.6, // More lenient for suggestions
        includeScore: true,
        includeMatches: true
    };
    
    const fuse = new Fuse(products, suggestFuseOptions);
    
    // Search with all search terms
    const allResults = [];
    parsedQuery.searchTerms.forEach(term => {
        const results = fuse.search(term);
        allResults.push(...results);
    });
    
    // Deduplicate and sort by score
    const uniqueResults = new Map();
    allResults.forEach(result => {
        const id = result.item._id.toString();
        if (!uniqueResults.has(id) || uniqueResults.get(id).score > result.score) {
            uniqueResults.set(id, result);
        }
    });
    
    // Convert to array and sort
    const sortedResults = Array.from(uniqueResults.values())
        .sort((a, b) => a.score - b.score)
        .slice(0, 8);
    
    // Format suggestions
    const suggestions = sortedResults.map(result => {
        const product = result.item;
        return {
            id: product._id,
            title: product.name,
            type: 'product',
            brand: product.brand,
            category: product.category,
            price: product.salePrice || product.price,
            matches: result.matches || []
        };
    });

    // Add category suggestions based on keywords
    const categories = ['men', 'women', 'sweater', 'jacket', 'shirt', 'pants', 'accessories', 'bags', 'shoes'];
    
    parsedQuery.keywords.forEach(keyword => {
            categories.forEach(category => {
                if (category.includes(keyword) || keyword.includes(category)) {
                    suggestions.push({
                        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Collection`,
                        type: 'category',
                        category: category
                    });
                }
            });
        });

        // Remove duplicate suggestions
        const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
            index === self.findIndex((s) => s.title === suggestion.title)
        );

        res.json({ suggestions: uniqueSuggestions.slice(0, 8) });
}));

// Main search endpoint
router.get('/products', asyncWrap(async (req, res) => {
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const ITEMS_PER_PAGE = 12;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    if (!searchQuery) {
        return res.redirect('/shop');
    }

        // Parse query with enhanced parser
        const parsedQuery = parseSearchQuery(searchQuery);
        
        // Fetch all products
        const allProducts = await Product.find({}).lean();
        
        // Create Fuse instance
        const fuse = new Fuse(allProducts, fuseOptions);
        
        // Perform searches with all search terms
        const allResults = [];
        
        // Search with each term
        parsedQuery.searchTerms.forEach(term => {
            const results = fuse.search(term);
            results.forEach(result => {
                // Add term relevance
                result.searchTerm = term;
                allResults.push(result);
            });
        });
        
        // If it's a multi-word query, also search for partial matches
        if (parsedQuery.hasMultipleWords) {
            parsedQuery.keywords.forEach(keyword => {
                const keywordResults = fuse.search(`'${keyword}`); // Prefix search
                keywordResults.forEach(result => {
                    result.searchTerm = keyword;
                    result.score = result.score * 1.2; // Slightly penalize partial matches
                    allResults.push(result);
                });
            });
        }
        
        // Score and deduplicate results
        const productScores = new Map();
        
        allResults.forEach(result => {
            const id = result.item._id.toString();
            const currentScore = productScores.get(id) || { score: Infinity, item: result.item, matches: [] };
            
            // Better score = lower number
            if (result.score < currentScore.score) {
                currentScore.score = result.score;
            }
            
            // Accumulate matches
            if (result.matches) {
                currentScore.matches.push(...result.matches);
            }
            
            productScores.set(id, currentScore);
        });
        
        // Convert to array and sort by score
        let finalResults = Array.from(productScores.values())
            .sort((a, b) => a.score - b.score);
        
        // If no results with fuzzy search, try regex fallback
        if (finalResults.length === 0) {
            const regexPattern = parsedQuery.keywords
                .map(term => `(?=.*${term})`)
                .join('|');
            
            const regexResults = allProducts.filter(product => {
                const searchText = `${product.name} ${product.brand} ${product.category} ${(product.tags || []).join(' ')} ${product.description || ''}`.toLowerCase();
                
                return parsedQuery.keywords.some(keyword => 
                    searchText.includes(keyword.toLowerCase())
                );
            });
            
            finalResults = regexResults.map(item => ({
                item,
                score: 0.5
            }));
        }
        
        // Apply pagination
        const totalProducts = finalResults.length;
        const paginatedResults = finalResults.slice(skip, skip + ITEMS_PER_PAGE);
        const products = paginatedResults.map(result => result.item);

        // Calculate pagination
        const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
        const hasMore = page < totalPages;
        const startItem = totalProducts > 0 ? skip + 1 : 0;
        const endItem = Math.min(skip + ITEMS_PER_PAGE, totalProducts);

        res.render('page/shop', {
            title: `Search Results for "${searchQuery}" | Velvra`,
            products: products,
            isSearch: true,
            searchQuery: searchQuery,
            hasResults: products.length > 0,
            totalProducts: totalProducts,
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

// API endpoint for filtered search results (for AJAX calls)
router.get('/api/products', asyncWrap(async (req, res) => {
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const ITEMS_PER_PAGE = 12;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    if (!searchQuery) {
        throw new AppError('Search query required', 400);
    }

        // Parse query with enhanced parser
        const parsedQuery = parseSearchQuery(searchQuery);
        
        // Fetch all products
        const allProducts = await Product.find({}).lean();
        
        // Create Fuse instance
        const fuse = new Fuse(allProducts, fuseOptions);
        
        // Perform searches with all search terms
        const allResults = [];
        
        parsedQuery.searchTerms.forEach(term => {
            const results = fuse.search(term);
            allResults.push(...results);
        });
        
        // Score and deduplicate
        const productScores = new Map();
        
        allResults.forEach(result => {
            const id = result.item._id.toString();
            const current = productScores.get(id) || { score: Infinity, item: result.item };
            
            if (result.score < current.score) {
                current.score = result.score;
            }
            
            productScores.set(id, current);
        });
        
        // Convert to array and sort
        let finalResults = Array.from(productScores.values())
            .sort((a, b) => a.score - b.score);
        
        // Apply additional filters if provided
        if (req.query.minPrice || req.query.maxPrice) {
            const minPrice = parseInt(req.query.minPrice) || 0;
            const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_VALUE;
            finalResults = finalResults.filter(result => {
                const price = result.item.salePrice || result.item.price;
                return price >= minPrice && price <= maxPrice;
            });
        }
        
        if (req.query.colors) {
            const colors = req.query.colors.split(',');
            finalResults = finalResults.filter(result => 
                result.item.colors?.some(color => colors.includes(color.name))
            );
        }
        
        if (req.query.brands) {
            const brands = req.query.brands.split(',');
            finalResults = finalResults.filter(result => 
                brands.includes(result.item.brand)
            );
        }
        
        if (req.query.sizes) {
            const sizes = req.query.sizes.split(',');
            finalResults = finalResults.filter(result => 
                result.item.sizes?.some(size => sizes.includes(size))
            );
        }

        // Pagination
        const totalProducts = finalResults.length;
        const paginatedResults = finalResults.slice(skip, skip + ITEMS_PER_PAGE);
        const products = paginatedResults.map(result => result.item);

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

module.exports = router;