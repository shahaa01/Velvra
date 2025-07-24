const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { removeBackground, deleteImages, saveEditedImage, deleteEditedImage } = require('../controllers/imageController');

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
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
const upload = multer({ storage });
const uploadEdit = multer({ storage });

// POST /images/upload (multiple images)
router.post('/upload', upload.array('images', 7), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }
  const filePaths = req.files.map(file => `/uploads/${file.filename}`);
  res.json({ message: 'Files uploaded successfully!', files: filePaths });
});

// POST /images/remove-bg (single image)
router.post('/remove-bg', upload.single('image'), removeBackground);

// POST /images/delete (delete original and bg-removed)
router.post('/delete', deleteImages);

// POST /images/save-edit (save/overwrite edited image)
router.post('/save-edit', uploadEdit.single('image'), saveEditedImage);
// POST /images/delete-edit (delete edited image)
router.post('/delete-edit', deleteEditedImage);

module.exports = router;
