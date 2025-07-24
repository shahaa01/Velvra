const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();

// Multer storage config for product images
const productImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadProductImages = multer({ storage: productImageStorage });
const uploadSingleProductImage = multer({ storage: productImageStorage });

// POST /images/upload (for product images)
router.post('/images/upload', uploadProductImages.array('images', 7), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }
  // Return file paths relative to /public
  const filePaths = req.files.map(file => `/uploads/products/${file.filename}`);
  res.json({ message: 'Files uploaded successfully!', files: filePaths });
});

// POST /images/remove-bg (remove background from a single image)
router.post('/images/remove-bg', uploadSingleProductImage.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No image file provided.');
  }
  const imagePath = req.file.path;
  const pythonServiceUrl = 'http://localhost:5001/remove-bg';
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    const response = await axios.post(pythonServiceUrl, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
    });
    // Save the background-removed image as the edited version (overwrite if exists)
    const origName = path.basename(req.body.originalUrl || req.file.originalname || imagePath);
    const editedName = origName.replace(/^(image|images|products)-/, 'edited-');
    const editedPath = path.join(__dirname, '../public/uploads/products', editedName);
    fs.writeFileSync(editedPath, response.data);
    // Optionally delete the uploaded temp file
    fs.unlinkSync(imagePath);
    res.json({ newImageUrl: `/uploads/products/${editedName}` });
  } catch (error) {
    console.error('Error calling Python service:', error.message);
    res.status(500).send('Failed to remove background.');
  }
});

// POST /images/save-edit (save/overwrite edited image)
router.post('/images/save-edit', uploadSingleProductImage.single('image'), (req, res) => {
  const { originalUrl } = req.body;
  if (!req.file || !originalUrl) {
    return res.status(400).json({ error: 'Missing file or originalUrl' });
  }
  const path = require('path');
  const fs = require('fs');
  // Use original filename as base for edited image
  const origName = path.basename(originalUrl);
  const editedName = origName.replace(/^(image|images|products)-/, 'edited-');
  const editedPath = path.join(__dirname, '../public/uploads/products', editedName);
  // Move uploaded file to correct name (overwrite if exists)
  fs.renameSync(req.file.path, editedPath);
  res.json({ editedUrl: `/uploads/products/${editedName}` });
});

// POST /images/delete (delete original and edited images)
router.post('/images/delete', (req, res) => {
  const { originalUrl, editedUrl } = req.body;
  let errors = [];

  function deleteFile(url) {
    if (!url) return;
    // Remove leading slash if present
    const filePath = path.join(__dirname, '../public', url.replace(/^\/?/, ''));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        errors.push(`Failed to delete ${filePath}: ${err.message}`);
      }
    }
  }

  deleteFile(originalUrl);
  deleteFile(editedUrl);

  if (errors.length > 0) {
    return res.json({ success: false, error: errors.join('; ') });
  }
  res.json({ success: true });
});

// POST /images/delete-edit (delete only the edited image)
router.post('/images/delete-edit', (req, res) => {
  const { editedUrl } = req.body;
  if (!editedUrl) return res.json({ success: true });
  const path = require('path');
  const fs = require('fs');
  const filePath = path.join(__dirname, '../public', editedUrl.replace(/^\//, ''));
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return res.json({ success: true });
    } catch (err) {
      return res.json({ success: false, error: err.message });
    }
  }
  res.json({ success: true });
});

module.exports = router; 