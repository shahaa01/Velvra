const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

exports.removeBackground = async (req, res) => {
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
    const editedName = origName.replace(/^(image|images)-/, 'edited-');
    const editedPath = path.join(__dirname, '../uploads', editedName);
    fs.writeFileSync(editedPath, response.data);

    // Optionally delete the uploaded temp file
    fs.unlinkSync(imagePath);

    res.json({ newImageUrl: `/uploads/${editedName}` });
  } catch (error) {
    console.error('Error calling Python service:', error.message);
    res.status(500).send('Failed to remove background.');
  }
};

exports.deleteImages = (req, res) => {
  const { originalUrl, editedUrl } = req.body;
  let errors = [];

  function deleteFile(url) {
    if (!url) return;
    // Remove leading slash if present
    const filePath = path.join(__dirname, '..', url.replace(/^\//, ''));
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
};

exports.saveEditedImage = (req, res) => {
  // Expects: req.body.originalUrl, file (edited image)
  const { originalUrl } = req.body;
  if (!req.file || !originalUrl) {
    return res.status(400).json({ error: 'Missing file or originalUrl' });
  }
  // Use original filename as base for edited image
  const origName = path.basename(originalUrl);
  const editedName = origName.replace(/^(image|images)-/, 'edited-');
  const editedPath = path.join(__dirname, '../uploads', editedName);
  // Move uploaded file to correct name (overwrite if exists)
  fs.renameSync(req.file.path, editedPath);
  res.json({ editedUrl: `/uploads/${editedName}` });
};

exports.deleteEditedImage = (req, res) => {
  // Expects: req.body.editedUrl
  const { editedUrl } = req.body;
  if (!editedUrl) return res.json({ success: true });
  const filePath = path.join(__dirname, '..', editedUrl.replace(/^\//, ''));
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return res.json({ success: true });
    } catch (err) {
      return res.json({ success: false, error: err.message });
    }
  }
  res.json({ success: true });
};
