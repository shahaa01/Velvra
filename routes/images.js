const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { cloudinary, getCloudinaryStorage } = require('../utils/cloudinary');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Add these two lines for the new route
const memoryStorage = multer.memoryStorage();
const uploadToMemory = multer({ storage: memoryStorage });

const router = express.Router();

// Multer storage config for product images
// const productImageStorage = multer.diskStorage({ ... });
// const uploadProductImages = multer({ storage: productImageStorage });
const cloudinaryProductStorage = getCloudinaryStorage('products');
const uploadProductImages = multer({ storage: cloudinaryProductStorage });
const uploadSingleProductImage = multer({ storage: cloudinaryProductStorage });

// POST /images/upload (for product images)
router.post('/images/upload', uploadProductImages.array('images', 7), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files were uploaded.' });
  }
  // Return Cloudinary URLs
  const filePaths = req.files.map(file => file.path || file.secure_url || file.url);
  res.json({ message: 'Files uploaded successfully!', files: filePaths });
});

// POST /images/remove-bg (remove background from a single image)
router.post('/images/remove-bg', uploadSingleProductImage.single('image'), async (req, res) => {
  console.log('--- /images/remove-bg DEBUG ---');
  console.log('req.file:', req.file);
  console.log('req.body.originalUrl:', req.body.originalUrl);
  if (!req.file && !req.body.originalUrl) {
    return res.status(400).send('No image file provided.');
  }
  let imagePath = null;
  let tempFile = null;
  const pythonServiceUrl = 'http://localhost:5001/remove-bg';
  try {
    // If req.file exists
    if (req.file && req.file.path) {
      if (req.file.path.startsWith('http')) {
        // Download the Cloudinary URL to a temp file
        console.log('Downloading req.file.path from Cloudinary URL:', req.file.path);
        const response = await axios.get(req.file.path, { responseType: 'arraybuffer' });
        tempFile = path.join(os.tmpdir(), `cloudinary-dl-${uuidv4()}.jpg`);
        fs.writeFileSync(tempFile, response.data);
        imagePath = tempFile;
      } else {
        // Local file path
        imagePath = req.file.path;
      }
    } else if (req.body.originalUrl && req.body.originalUrl.startsWith('http')) {
      // No file, but originalUrl is a Cloudinary URL
      console.log('Downloading image from Cloudinary URL:', req.body.originalUrl);
      const response = await axios.get(req.body.originalUrl, { responseType: 'arraybuffer' });
      tempFile = path.join(os.tmpdir(), `cloudinary-dl-${uuidv4()}.jpg`);
      fs.writeFileSync(tempFile, response.data);
      imagePath = tempFile;
    }
    if (!imagePath) {
      console.error('No image file or downloadable URL provided.');
      return res.status(400).send('No image file or downloadable URL provided.');
    }
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    const response = await axios.post(pythonServiceUrl, formData, {
      headers: formData.getHeaders(),
      responseType: 'arraybuffer',
    });
    // Upload the background-removed image buffer to Cloudinary
    const buffer = Buffer.from(response.data, 'binary');
    const origName = path.basename(req.body.originalUrl || req.file?.originalname || imagePath);
    cloudinary.uploader.upload_stream({
      folder: 'products',
      public_id: `edited-${origName.replace(/\.[^.]+$/, '')}`,
      overwrite: true,
      resource_type: 'image',
      format: 'png',
    }, (error, result) => {
      // Clean up temp and uploaded files
      if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).send('Failed to upload to Cloudinary.');
      }
      res.json({ newImageUrl: result.secure_url });
    }).end(buffer);
  } catch (error) {
    if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    console.error('Error calling Python service or downloading image:', error.message);
    res.status(500).send('Failed to remove background.');
  }
});

// POST /images/save-edit (save/overwrite edited image)
router.post('/images/save-edit', uploadSingleProductImage.single('image'), (req, res) => {
  const { originalUrl } = req.body;
  if (!req.file || !originalUrl) {
    return res.status(400).json({ error: 'Missing file or originalUrl' });
  }
  // Cloudinary Multer storage puts the URL in file.path or file.secure_url
  const editedUrl = req.file.path || req.file.secure_url || req.file.url;
  res.json({ editedUrl });
});

// POST /images/delete (delete original and edited images)
router.post('/images/delete', async (req, res) => {
  const { originalUrl, editedUrl } = req.body;
  let errors = [];
  const urls = [originalUrl, editedUrl];
  const cloudinaryBase = 'res.cloudinary.com';
  async function deleteCloudinary(url) {
    if (!url) return;
    try {
      // Extract public ID from Cloudinary URL
      const matches = url.match(/\/upload\/v\d+\/(.+?)(\.[a-zA-Z0-9]+)?(\?|$)/);
      if (matches && matches[1]) {
        const publicId = matches[1];
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      }
    } catch (err) {
      errors.push(`Failed to delete Cloudinary image ${url}: ${err.message}`);
    }
  }
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
  for (const url of urls) {
    if (url && url.includes(cloudinaryBase)) {
      await deleteCloudinary(url);
    } else {
      deleteFile(url);
    }
  }
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

// images.js

// ... (all existing routes)

// ADD THIS NEW ROUTE
// This dedicated route handles uploading and overwriting a single color variant image.
router.post('/images/upload-color-variant', uploadToMemory.single('image'), async (req, res) => {
  if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
  }

  const { public_id_to_overwrite } = req.body;

  try {
      const uploadOptions = {
          folder: 'products',
          resource_type: 'image',
          // If a public_id is provided, Cloudinary will overwrite the existing image.
          // If it's undefined, Cloudinary will generate a new unique public_id.
          public_id: public_id_to_overwrite,
          overwrite: !!public_id_to_overwrite, // Force overwrite only if a public_id is specified
          invalidate: true
      };

      // Upload the image buffer from memory directly to Cloudinary
      cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
          if (error) {
              console.error('Cloudinary upload error:', error);
              return res.status(500).json({ error: 'Failed to upload to Cloudinary.' });
          }
          // Return both the URL and the public_id for future overwrites
          res.json({
              imageUrl: result.secure_url,
              publicId: result.public_id
          });
      }).end(req.file.buffer);

  } catch (error) {
      console.error('Error processing color variant image:', error.message);
      res.status(500).send('Failed to process image.');
  }
});


module.exports = router;