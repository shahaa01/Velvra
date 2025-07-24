const Notification = require('../models/notification');

async function notificationHeaderData(req, res, next) {
  if (req.user) {
    try {
      const [notifications, unreadNotificationCount] = await Promise.all([
        Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10),
        Notification.countDocuments({ user: req.user._id, isRead: false })
      ]);
      res.locals.notifications = notifications;
      res.locals.unreadNotificationCount = unreadNotificationCount;
    } catch (err) {
      res.locals.notifications = [];
      res.locals.unreadNotificationCount = 0;
    }
  } else {
    res.locals.notifications = [];
    res.locals.unreadNotificationCount = 0;
  }
  next();
}

module.exports = { notificationHeaderData }; 