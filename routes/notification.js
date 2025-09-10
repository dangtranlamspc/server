const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification')

router.get('/', notificationController.getNotification);
router.put('/:id/read', notificationController.readNotification);
router.put('/read-all', notificationController.allReadNotification);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;