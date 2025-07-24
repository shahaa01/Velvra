const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isLoggedIn } = require('../middlewares/authMiddleware');
const issueReportController = require('../controllers/issueReportController');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/issues'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG images are allowed'), false);
  }
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// POST /report-issue (mounted at /dashboard, so full path is /dashboard/report-issue)
router.post('/report-issue', isLoggedIn, upload.array('photos', 5), issueReportController.createIssueReport);

// GET /my-reports (mounted at /dashboard, so full path is /dashboard/my-reports)
router.get('/my-reports', isLoggedIn, issueReportController.getUserReports);

module.exports = router; 