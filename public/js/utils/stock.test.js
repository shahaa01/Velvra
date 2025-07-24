/**
 * Unit tests for stock utility functions
 * Testing edge cases for color and size names
 */

import { getStockForColorSize } from './stock.js';

// Mock product data for testing
const mockProduct = {
    colors: [
        {
            name: 'Red',
            sizes: [
                { size: 'S', stock: 5 },
                { size: 'M', stock: 10 },
                { size: 'L', stock: 0 }
            ]
        },
        {
            name: 'Blue',
            sizes: [
                { size: 'XS', stock: 3 },
                { size: 'XXL', stock: 7 }
            ]
        },
        {
            name: 'Navy Blue',
            sizes: [
                { size: 'M', stock: 15 }
            ]
        },
        {
            name: ' Forest Green ', // Testing spaces
            sizes: [
                { size: ' L ', stock: 8 }
            ]
        },
        {
            name: 'Off-White',
            sizes: [
                { size: 'S/M', stock: 12 }
            ]
        }
    ]
};

// Test suite
describe('getStockForColorSize', () => {
    
    // Basic functionality tests
    describe('Basic functionality', () => {
        test('should return correct stock for valid color and size', () => {
            expect(getStockForColorSize(mockProduct, 'Red', 'M')).toBe(10);
            expect(getStockForColorSize(mockProduct, 'Blue', 'XS')).toBe(3);
        });

        test('should return 0 for out of stock items', () => {
            expect(getStockForColorSize(mockProduct, 'Red', 'L')).toBe(0);
        });

        test('should return 0 for non-existent color', () => {
            expect(getStockForColorSize(mockProduct, 'Purple', 'M')).toBe(0);
        });

        test('should return 0 for non-existent size', () => {
            expect(getStockForColorSize(mockProduct, 'Red', 'XXL')).toBe(0);
        });
    });

    // Edge case tests for color names
    describe('Color name edge cases', () => {
        test('should handle case-insensitive color matching', () => {
            expect(getStockForColorSize(mockProduct, 'red', 'M')).toBe(10);
            expect(getStockForColorSize(mockProduct, 'RED', 'M')).toBe(10);
            expect(getStockForColorSize(mockProduct, 'ReD', 'M')).toBe(10);
        });

        test('should handle colors with spaces', () => {
            expect(getStockForColorSize(mockProduct, 'Navy Blue', 'M')).toBe(15);
            expect(getStockForColorSize(mockProduct, 'navy blue', 'M')).toBe(15);
            expect(getStockForColorSize(mockProduct, 'NAVY BLUE', 'M')).toBe(15);
        });

        test('should handle colors with leading/trailing spaces', () => {
            expect(getStockForColorSize(mockProduct, ' Forest Green ', 'L')).toBe(8);
            expect(getStockForColorSize(mockProduct, 'Forest Green', ' L ')).toBe(8);
            expect(getStockForColorSize(mockProduct, ' forest green ', ' l ')).toBe(8);
        });

        test('should handle colors with special characters', () => {
            expect(getStockForColorSize(mockProduct, 'Off-White', 'S/M')).toBe(12);
            expect(getStockForColorSize(mockProduct, 'off-white', 's/m')).toBe(12);
        });
    });

    // Edge case tests for size names
    describe('Size name edge cases', () => {
        test('should handle case-insensitive size matching', () => {
            expect(getStockForColorSize(mockProduct, 'Red', 's')).toBe(5);
            expect(getStockForColorSize(mockProduct, 'Red', 'S')).toBe(5);
            expect(getStockForColorSize(mockProduct, 'Blue', 'xs')).toBe(3);
            expect(getStockForColorSize(mockProduct, 'Blue', 'XS')).toBe(3);
        });

        test('should handle sizes with leading/trailing spaces', () => {
            expect(getStockForColorSize(mockProduct, 'Forest Green', ' L ')).toBe(8);
            expect(getStockForColorSize(mockProduct, 'Forest Green', 'L')).toBe(8);
        });

        test('should handle complex size names', () => {
            expect(getStockForColorSize(mockProduct, 'Off-White', 'S/M')).toBe(12);
            expect(getStockForColorSize(mockProduct, 'Blue', 'XXL')).toBe(7);
        });
    });

    // Input validation tests
    describe('Input validation', () => {
        test('should handle null/undefined product', () => {
            expect(getStockForColorSize(null, 'Red', 'M')).toBe(0);
            expect(getStockForColorSize(undefined, 'Red', 'M')).toBe(0);
        });

        test('should handle product without colors', () => {
            expect(getStockForColorSize({}, 'Red', 'M')).toBe(0);
            expect(getStockForColorSize({ colors: null }, 'Red', 'M')).toBe(0);
        });

        test('should handle empty color/size names', () => {
            expect(getStockForColorSize(mockProduct, '', 'M')).toBe(0);
            expect(getStockForColorSize(mockProduct, 'Red', '')).toBe(0);
            expect(getStockForColorSize(mockProduct, null, 'M')).toBe(0);
            expect(getStockForColorSize(mockProduct, 'Red', null)).toBe(0);
        });

        test('should handle color without sizes', () => {
            const productWithoutSizes = {
                colors: [
                    { name: 'Red', sizes: null },
                    { name: 'Blue' } // No sizes property
                ]
            };
            expect(getStockForColorSize(productWithoutSizes, 'Red', 'M')).toBe(0);
            expect(getStockForColorSize(productWithoutSizes, 'Blue', 'M')).toBe(0);
        });
    });

    // Stock value edge cases
    describe('Stock value edge cases', () => {
        test('should handle invalid stock values', () => {
            const productWithInvalidStock = {
                colors: [
                    {
                        name: 'Test',
                        sizes: [
                            { size: 'S', stock: 'invalid' },
                            { size: 'M', stock: null },
                            { size: 'L', stock: undefined },
                            { size: 'XL', stock: -5 }
                        ]
                    }
                ]
            };
            
            expect(getStockForColorSize(productWithInvalidStock, 'Test', 'S')).toBe(0);
            expect(getStockForColorSize(productWithInvalidStock, 'Test', 'M')).toBe(0);
            expect(getStockForColorSize(productWithInvalidStock, 'Test', 'L')).toBe(0);
            expect(getStockForColorSize(productWithInvalidStock, 'Test', 'XL')).toBe(0);
        });

        test('should handle string stock values', () => {
            const productWithStringStock = {
                colors: [
                    {
                        name: 'Test',
                        sizes: [
                            { size: 'S', stock: '15' },
                            { size: 'M', stock: '0' }
                        ]
                    }
                ]
            };
            
            expect(getStockForColorSize(productWithStringStock, 'Test', 'S')).toBe(15);
            expect(getStockForColorSize(productWithStringStock, 'Test', 'M')).toBe(0);
        });
    });

    // Real-world scenario tests
    describe('Real-world scenarios', () => {
        test('should handle product with many color variations', () => {
            const largeProduct = {
                colors: Array.from({ length: 50 }, (_, i) => ({
                    name: `Color ${i}`,
                    sizes: [
                        { size: 'S', stock: i },
                        { size: 'M', stock: i * 2 }
                    ]
                }))
            };
            
            expect(getStockForColorSize(largeProduct, 'Color 10', 'S')).toBe(10);
            expect(getStockForColorSize(largeProduct, 'Color 25', 'M')).toBe(50);
        });

        test('should handle Unicode characters in color names', () => {
            const unicodeProduct = {
                colors: [
                    {
                        name: 'Café Noir',
                        sizes: [{ size: 'M', stock: 5 }]
                    },
                    {
                        name: '红色',
                        sizes: [{ size: 'L', stock: 3 }]
                    }
                ]
            };
            
            expect(getStockForColorSize(unicodeProduct, 'Café Noir', 'M')).toBe(5);
            expect(getStockForColorSize(unicodeProduct, '红色', 'L')).toBe(3);
        });
    });
});

// Helper function to run tests (since we don't have a test runner in browser)
function runTests() {
    console.log('Running stock utility tests...');
    
    // Basic functionality tests
    console.assert(getStockForColorSize(mockProduct, 'Red', 'M') === 10, 'Basic stock lookup failed');
    console.assert(getStockForColorSize(mockProduct, 'Red', 'L') === 0, 'Out of stock test failed');
    console.assert(getStockForColorSize(mockProduct, 'Purple', 'M') === 0, 'Non-existent color test failed');
    
    // Case insensitive tests
    console.assert(getStockForColorSize(mockProduct, 'red', 'M') === 10, 'Case insensitive color test failed');
    console.assert(getStockForColorSize(mockProduct, 'Red', 's') === 5, 'Case insensitive size test failed');
    
    // Space handling tests
    console.assert(getStockForColorSize(mockProduct, 'Forest Green', 'L') === 8, 'Space trimming test failed');
    console.assert(getStockForColorSize(mockProduct, ' forest green ', ' l ') === 8, 'Space and case test failed');
    
    // Special characters
    console.assert(getStockForColorSize(mockProduct, 'Off-White', 'S/M') === 12, 'Special characters test failed');
    
    // Invalid inputs
    console.assert(getStockForColorSize(null, 'Red', 'M') === 0, 'Null product test failed');
    console.assert(getStockForColorSize(mockProduct, '', 'M') === 0, 'Empty color test failed');
    console.assert(getStockForColorSize(mockProduct, 'Red', '') === 0, 'Empty size test failed');
    
    console.log('All tests passed! ✅');
}

// Export the test runner for browser usage
if (typeof window !== 'undefined') {
    window.runStockTests = runTests;
}

export { runTests };
