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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/user');
const { isLoggedIn } = require('./middlewares/authMiddleware');
const { localStore } = require('./middlewares/index');
const swal = require('sweetalert2');
const fileUpload = require('express-fileupload');
const { addAdminContext } = require('./middlewares/adminMiddleware');
const http = require('http');
const socketio = require('socket.io');
const Message = require('./models/message');
const Conversation = require('./models/conversation');

const Product = require('./models/product');
const authRoutes = require('./routes/authRoute');
const productRoutes = require('./routes/productRoute');
const cartRoutes = require('./routes/cartRoute');
const addressRoutes = require('./routes/address');
const { notificationHeaderData } = require('./middlewares/notificationMiddleware');

// Session configuration
const sessionConfig = {
    store: MongoStore.create({
        mongoUrl: 'mongodb://127.0.0.1:27017/velvra',
        touchAfter: 24 * 3600 // time period in seconds
    }),
    secret: process.env.SECRET || 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production', // Only use secure in production
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
};

// Serve static file from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate); 
app.set('views', path.join(__dirname, 'views'));

// Session and Passport setup (must come before routes that use isLoggedIn)
app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize()); 
app.use(passport.session());

// Flash locals middleware (must come after session/flash and before routes)
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  next();
});

// Local Strategy
passport.use(new LocalStrategy(User.authenticate()));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8080/auth/google/callback",
    scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google profile received:', {
            id: profile.id,
            email: profile.emails[0]?.value,
            name: profile.displayName
        });

        // Find or create user using the static method
        const result = await User.findOrCreateGoogleUser(profile);
        console.log('User found/created:', result.user._id, result.user.email, 'isNew:', result.isNew);
        
        // Set session flag for new users
        if (result.isNew) {
            // We need to set this in the session, but we don't have access to req here
            // So we'll pass it through the user object
            result.user.isNewGoogleUser = true;
        }
        
        return done(null, result.user);
    } catch (error) {
        console.error('Google OAuth strategy error:', error);
        return done(error, null);
    }
}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(localStore);
app.use(addAdminContext);

app.post('/toggle-mode', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.isSeller) {
      req.flash('error', 'Not a seller account.');
      return res.redirect('/dashboard');
    }
    user.activeMode = user.activeMode === 'buyer' ? 'seller' : 'buyer';
    await user.save();
    req.user.activeMode = user.activeMode; // update session
    const modeText = user.activeMode === 'buyer' ? 'Buyer' : 'Seller';
    req.flash('info', `Switched to ${modeText} mode successfully.`);
    if (user.activeMode === 'seller') {
      res.redirect('/seller-dashboard');
    } else {
      res.redirect('/dashboard');
    }
  } catch (err) {
    req.flash('error', 'Failed to toggle mode.');
    res.redirect('/dashboard');
  }
});

main().then(() => console.log('Database connected successfully🚀')).catch(err => console.log('Database connection error:',err.message));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/velvra');
    await Product.ensureIndexes();
}

//routes
app.use('/home', require('./routes/indexRoute'));
app.use('/auth', authRoutes);
app.use('/shop', require('./routes/shopRoute'));
app.use('/product', productRoutes);
app.use('/seller', require('./routes/sellerRoute'));
app.use('/seller-dashboard', require('./routes/sellerDashboard'));
app.use('/cart', cartRoutes);
app.use('/address', addressRoutes);
app.use('/payment', require('./routes/paymentRoutes'));
app.use('/dashboard', isLoggedIn, notificationHeaderData, require('./routes/dashboard'));
app.use('/search', require('./routes/searchRoute'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/api/notifications', require('./routes/notificationRoute'));
app.use('/dashboard', require('./routes/reportIssueRoute')); // Mount at /dashboard instead of /

const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

// Socket.IO real-time messaging logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('joinConversation', (conversationId) => {
        socket.join(conversationId);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});