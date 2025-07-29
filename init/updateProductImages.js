const fs = require('fs');
const path = require('path');
const axios = require('axios');
const util = require('util');
const readline = require('readline');
const vm = require('vm');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const DATA_PATH = path.join(__dirname, 'data.js');
const API_BASE = 'http://localhost:8080/api/fetch-image/';

async function fetchImages(query, count = 3) {
  try {
    const res = await axios.get(`${API_BASE}${encodeURIComponent(query)}`);
    if (res.data && res.data.success && Array.isArray(res.data.images)) {
      return res.data.images.slice(0, count);
    }
    return [];
  } catch (err) {
    console.error(`Error fetching images for query "${query}":`, err.message);
    return [];
  }
}

async function main() {
  // Confirm overwrite
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await new Promise(resolve => {
    rl.question('This will OVERWRITE data.js with new image links. Continue? (yes/no): ', answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
  if (!confirm) {
    console.log('Aborted.');
    process.exit(0);
  }

  // Read and evaluate data.js
  const code = await readFile(DATA_PATH, 'utf8');
  const sandbox = { module: {}, require, ObjectId: () => null };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  let products = sandbox.module.exports;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`Updating product: ${product.name}`);
    // Update images array
    const images = await fetchImages(product.name, 3);
    if (images.length === 3) {
      product.images = images;
    } else {
      console.warn(`  Could not fetch 3 images for product: ${product.name}`);
    }
    // Update each color's imageUrl
    if (Array.isArray(product.colors)) {
      for (let j = 0; j < product.colors.length; j++) {
        const color = product.colors[j];
        const colorQuery = `${product.name} ${color.name}`;
        const colorImages = await fetchImages(colorQuery, 1);
        if (colorImages.length > 0) {
          color.imageUrl = colorImages[0];
        } else {
          console.warn(`  Could not fetch image for color: ${color.name} of product: ${product.name}`);
        }
      }
    }
  }

  // Write back to data.js
  const warning = '// WARNING: This file was auto-updated by updateProductImages.js\n';
  const output = `${warning}const { ObjectId } = require('mongodb');\n\nconst dummyProducts = ${JSON.stringify(products, null, 2)};\n\nmodule.exports = dummyProducts;\n`;
  await writeFile(DATA_PATH, output, 'utf8');
  console.log('data.js updated successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 