const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Fetch notifications (paginated)
router.get('/', isLoggedIn, notificationController.getNotifications);

// Mark a notification as read
router.post('/:id/read', isLoggedIn, notificationController.markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', isLoggedIn, notificationController.markAllAsRead);

module.exports = router; 