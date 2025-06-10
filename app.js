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



// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate); 
// Set the views directory
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'));


//routes
app.use('/home', require('./routes/indexRoute'));
app.use('/auth', require('./routes/authRoute'));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

