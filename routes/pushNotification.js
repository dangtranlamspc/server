const pushNotificationController = require('../controllers/pushNotification');
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth.middleware')

router.post('/save-token', protect, pushNotificationController.savePushToken);

// Lấy push tokens của user
router.get('/tokens', protect, pushNotificationController.getUserPushTokens);

// Xóa push token
router.delete('/remove-token', protect, pushNotificationController.deletePushToken);


module.exports = router;