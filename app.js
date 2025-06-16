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
const dotenv = require('dotenv').config();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');


const Product = require('./models/product');


// Serve static file from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate); 

app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: (7 * 24 * 60 * 60 * 1000)
  }
}));

app.use(flash());
app.use(passport.initialize()); 
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
app.use('/seller', require('./routes/sellerRoute'));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

