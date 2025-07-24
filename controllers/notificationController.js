const Notification = require('../models/notification');
const AppError = require('../utils/AppError');
const asyncWrap = require('../utils/asyncWrap');

// Fetch notifications for a user (paginated)
exports.getNotifications = asyncWrap(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false })
  ]);

  res.json({
    success: true,
    notifications,
    total,
    unreadCount
  });
});

// Mark a notification as read
exports.markAsRead = asyncWrap(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  
  res.json({ success: true, notification });
});

// Mark all notifications as read
exports.markAllAsRead = asyncWrap(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false }, 
    { isRead: true }
  );
  
  res.json({ success: true });
}); 