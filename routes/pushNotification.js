const express = require('express');
const router = express.Router();
const PushNotificationController = require('../controllers/pushNotification')
// const authMiddleware = require('../middleware/auth'); // Nếu có authentication

// Đăng ký push token
router.post('/register-token', PushNotificationController.registerToken);

// Xóa push token
router.delete('/remove-token', PushNotificationController.removeToken);

// Gửi notification đến user cụ thể
router.post('/send-to-user', PushNotificationController.sendToUser);

// Gửi notification đến nhiều user
router.post('/send-to-users', PushNotificationController.sendToMultipleUsers);

// Broadcast notification
router.post('/broadcast', PushNotificationController.broadcast);

// Test notification
router.post('/test', PushNotificationController.testNotification);

module.exports = router;