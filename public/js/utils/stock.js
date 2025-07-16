/**
 * Stock utility functions for product inventory management
 */

/**
 * Get available stock for a specific color and size combination
 * @param {Object} product - The product object containing colors and sizes
 * @param {string} colorName - The name of the color variant
 * @param {string} sizeName - The name of the size variant
 * @returns {number} Available stock count (0 if not found)
 */
export function getStockForColorSize(product, colorName, sizeName) {
    // Input validation
    if (!product || !product.colors) {
        console.warn('Invalid product data: missing product or colors array');
        return 0;
    }
    
    if (!colorName || !sizeName) {
        console.warn('Invalid input: colorName and sizeName are required');
        return 0;
    }
    
    // Normalize color name for comparison (handles edge cases)
    const normalizedColorName = colorName.trim();
    
    // Find the color variant (case-insensitive search for edge cases)
    const color = product.colors.find(c => 
        c.name && c.name.trim().toLowerCase() === normalizedColorName.toLowerCase()
    );
    
    if (!color || !color.sizes) {
        console.warn(`Color '${colorName}' not found or has no sizes`);
        return 0;
    }
    
    // Normalize size name for comparison (handles edge cases)
    const normalizedSizeName = sizeName.trim();
    
    // Find the size variant (case-insensitive search for edge cases)
    const sizeObj = color.sizes.find(s => 
        s.size && s.size.trim().toLowerCase() === normalizedSizeName.toLowerCase()
    );
    
    if (!sizeObj) {
        console.warn(`Size '${sizeName}' not found for color '${colorName}'`);
        return 0;
    }
    
    // Return stock, ensuring it's a valid number
    const stock = parseInt(sizeObj.stock, 10);
    return isNaN(stock) ? 0 : Math.max(0, stock);
}
