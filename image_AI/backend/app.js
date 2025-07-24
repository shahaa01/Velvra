// backend/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const imagesRouter = require('./routes/images');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as the view engine and configure views/static paths
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Serve static files (uploaded and processed images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Image routes
app.use('/images', imagesRouter);

// Render the main upload page at root
app.get('/', (req, res) => {
  res.render('index');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
