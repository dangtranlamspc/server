const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification')
const {protect, isAdmin} = require("../middleware/auth.middleware");

// router.get('/', notificationController.getNotification);
// router.patch('/:id/read', notificationController.readNotification);
// router.patch('/read-all', notificationController.allReadNotification);
// router.delete('/:id', notificationController.deleteNotification);

router.post('/register-token', protect, notificationController.registerToken);
router.post('/unregister-token', protect, notificationController.unregisterToken);

// Get notifications
router.get('/', protect, notificationController.getNotification);
router.put('/:notificationId/read', protect, notificationController.markAsRead);
router.put('/read-all', protect, notificationController.markAllAsRead);

// Admin routes
router.post('/test', protect, isAdmin, notificationController.sendTestNotification);

module.exports = router;