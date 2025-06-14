const express = require('express');
const PORT = 8080;
const app = express();
const path = require('path');
const ejs = require('ejs');
const ejsMate = require('ejs-mate');    
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const Product = require('./models/product');


// Serve static file from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate); 
// Set the views directory
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));

const products = [
  {
    name: "Oversized Graphic Tee",
    brand: "Velvra Originals",
    price: 60,
    sale: true,
    salePrice: 45,
    salePercentage: 25,
    images: "https://media.boohoo.com/i/boohoo/amm04764_charcoal_xl/male-charcoal-oversized-worldwide-graphic-overdye-t-shirt/?w=900&qlt=default&fmt.jp2.qlt=70&fmt=auto&sm=fit",
    colors: [
      { name: "Black", hex: "#000000" },
      { name: "Ivory", hex: "#F8F8F8" }
    ],
    sizes: ["S", "M", "L", "XL"],
    category: "men",
    tags: ["t-shirt", "oversized", "graphic"],
    createdAt: new Date()
  },
  {
    name: "Slim Fit Linen Shirt",
    brand: "Velvra Luxe",
    price: 95,
    sale: false,
    salePrice: null,
    salePercentage: null,
    images:  "https://imagescdn.simons.ca/images/16407-219645-14-A1_2/short-sleeve-solid-pure-linen-shirt-b-comfort-fit-b.jpg?__=12",
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Sand", hex: "#ECD9C6" }
    ],
    sizes: ["S", "M", "L"],
    category: "men",
    tags: ["shirt", "linen", "casual"],
    createdAt: new Date()
  },
  {
    name: "Wool-Blend Overcoat",
    brand: "Velvra Atelier",
    price: 280,
    sale: false,
    salePrice: null,
    salePercentage: null,
    images: 
      "https://media.very.co.uk/i/very/W81Y5_SQ1_0000000003_NATURAL_MDf?$pdp_300x400_x2$&fmt=jpg",
 
    colors: [
      { name: "Camel", hex: "#C2B280" },
      { name: "Grey", hex: "#A9A9A9" }
    ],
    sizes: ["M", "L", "XL"],
    category: "men",
    tags: ["overcoat", "wool", "outerwear"],
    createdAt: new Date()
  },
  {
    name: "Cashmere Knit Sweater",
    brand: "Velvra Luxe",
    price: 180,
    sale: true,
    salePrice: 150,
    salePercentage: 17,
    images: 
      "https://cdn.thewirecutter.com/wp-content/media/2023/12/cashmeresweaters-2048px-0995-3x2-1.jpg?auto=webp&quality=75&crop=4:3,smart&width=1024",
    colors: [
      { name: "Oat", hex: "#F1E6D6" },
      { name: "Moss", hex: "#8A9A5B" }
    ],
    sizes: ["S", "M", "L"],
    category: "men",
    tags: ["knitwear", "cashmere", "sweater"],
    createdAt: new Date()
  }
];


main().then(() => console.log('Database connected successfully🚀')).catch(err => console.log('Database connection error:',err.message));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/velvra');
  await Product.ensureIndexes();
}

//routes
app.use('/home', require('./routes/indexRoute'));
app.use('/auth', require('./routes/authRoute'));
app.use('/shop', require('./routes/shopRoute'));
app.use('/product', require('./routes/productRoute'));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

