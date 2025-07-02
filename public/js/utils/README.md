# Stock Utility Module

This module contains shared utility functions for managing product stock across the VELVRA e-commerce platform.

## Files

- `stock.js` - Main utility module with stock-related functions
- `stock.test.js` - Comprehensive unit tests for the stock functions
- `test-runner.html` - Browser-based test runner for manual testing

## Functions

### `getStockForColorSize(product, colorName, sizeName)`

Gets the available stock for a specific color and size combination.

**Parameters:**
- `product` (Object) - The product object containing colors and sizes
- `colorName` (string) - The name of the color variant
- `sizeName` (string) - The name of the size variant

**Returns:**
- `number` - Available stock count (0 if not found)

**Features:**
- Case-insensitive color and size matching
- Handles leading/trailing spaces in names
- Supports special characters and Unicode
- Input validation with graceful error handling
- Returns 0 for invalid inputs or missing data

**Example:**
```javascript
import { getStockForColorSize } from './utils/stock.js';

const product = {
    colors: [
        {
            name: 'Red',
            sizes: [
                { size: 'M', stock: 10 },
                { size: 'L', stock: 5 }
            ]
        }
    ]
};

const stock = getStockForColorSize(product, 'red', 'M'); // Returns 10
const outOfStock = getStockForColorSize(product, 'Red', 'XL'); // Returns 0
```

## Edge Cases Handled

### Color Names
- Case variations: `'Red'`, `'red'`, `'RED'`
- Spaces: `'Navy Blue'`, `' Forest Green '`
- Special characters: `'Off-White'`, `'Café Noir'`
- Unicode: `'红色'` (Chinese characters)

### Size Names
- Case variations: `'S'`, `'s'`, `'XL'`, `'xl'`
- Complex sizes: `'S/M'`, `'XXL'`
- Spaces: `' L '`, `'One Size '`

### Input Validation
- Null/undefined product objects
- Missing colors array
- Empty color/size names
- Invalid stock values (strings, negative numbers)

## Testing

### Running Tests in Browser

1. Open `test-runner.html` in a web browser
2. Click "Run Tests" to execute all test suites
3. View results with pass/fail indicators

### Test Coverage

The test suite includes:

- **Basic Functionality**: Valid inputs, out of stock, non-existent items
- **Color Edge Cases**: Case sensitivity, spaces, special characters, Unicode
- **Size Edge Cases**: Case sensitivity, complex size names
- **Input Validation**: Null/undefined inputs, malformed data
- **Stock Value Edge Cases**: Invalid stock values, string conversion

### Test Suites

1. **Basic Functionality** (4 tests)
2. **Color Name Edge Cases** (5 tests)  
3. **Size Name Edge Cases** (3 tests)
4. **Input Validation** (3 tests)
5. **Stock Value Edge Cases** (2 tests)

**Total: 17 tests covering various scenarios**

## Integration

This module is currently imported in:

- `individualPage.js` - Product page stock checking
- `cartPage.js` - Cart quantity validation
- `paymentSummary.js` - Checkout stock verification

## Migration Notes

The function was previously implemented individually in each file. This centralization:

1. **Reduces code duplication** - Single source of truth
2. **Improves maintainability** - Updates only needed in one place
3. **Enhances reliability** - Comprehensive testing and edge case handling
4. **Ensures consistency** - All files use the same logic

## Browser Compatibility

- Requires ES6 module support
- Uses modern JavaScript features (arrow functions, template literals)
- Tested in modern browsers (Chrome, Firefox, Safari, Edge)

## Performance

- Lightweight implementation (~2KB)
- O(n) complexity for color/size lookup
- Optimized for typical product catalogs (< 50 color variants)
- No external dependencies
