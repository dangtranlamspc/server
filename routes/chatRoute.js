const express = require('express')
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/send', chatController.sendMessage);
router.get('/history/:userId', chatController.getHistory);
router.get('/conversation/:conversationId', chatController.getConversation);
router.delete('/conversation/:conversationId', chatController.deleteConversation);
router.delete('/history/:userId', chatController.clearHistory);

module.exports = router;