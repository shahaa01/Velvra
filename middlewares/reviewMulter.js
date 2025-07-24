const multer = require('multer');
const { getCloudinaryStorage } = require('../utils/cloudinary');

// Use Cloudinary storage for review images
const reviewStorage = getCloudinaryStorage('reviews');

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const reviewMulter = multer({
  storage: reviewStorage,
  fileFilter,
  limits: { files: 5, fileSize: 5 * 1024 * 1024 } // 5 images, 5MB each
});

module.exports = reviewMulter; 