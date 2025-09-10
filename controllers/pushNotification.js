const User = require('../models/notification')
const PushNotificationService = require('../utils/pushNotification');

class NotificationController {
  // Đăng ký push token
  async registerToken(req, res) {
    try {
      const { userId, token, device } = req.body;

      if (!token || !PushNotificationService.isValidPushToken(token)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid push token'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Kiểm tra xem token đã tồn tại chưa
      const existingToken = user.pushTokens.find(t => t.token === token);
      
      if (!existingToken) {
        user.pushTokens.push({
          token,
          device: device || 'unknown'
        });
        await user.save();
      }

      res.json({
        success: true,
        message: 'Push token registered successfully'
      });
    } catch (error) {
      console.error('Error registering push token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Xóa push token
  async removeToken(req, res) {
    try {
      const { userId, token } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      user.pushTokens = user.pushTokens.filter(t => t.token !== token);
      await user.save();

      res.json({
        success: true,
        message: 'Push token removed successfully'
      });
    } catch (error) {
      console.error('Error removing push token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Gửi notification đến user cụ thể
  async sendToUser(req, res) {
    try {
      const { userId, title, body, data } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.pushTokens.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No push tokens found for user'
        });
      }

      const tokens = user.pushTokens.map(t => t.token);
      const tickets = await PushNotificationService.sendToMultipleTokens(
        tokens, 
        title, 
        body, 
        data
      );

      res.json({
        success: true,
        message: 'Notifications sent successfully',
        tickets
      });
    } catch (error) {
      console.error('Error sending notification to user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification'
      });
    }
  }

  // Gửi notification đến nhiều user
  async sendToMultipleUsers(req, res) {
    try {
      const { userIds, title, body, data } = req.body;

      const users = await User.find({ _id: { $in: userIds } });
      const allTokens = users.reduce((tokens, user) => {
        const userTokens = user.pushTokens.map(t => t.token);
        return [...tokens, ...userTokens];
      }, []);

      if (allTokens.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No push tokens found for specified users'
        });
      }

      const tickets = await PushNotificationService.sendToMultipleTokens(
        allTokens, 
        title, 
        body, 
        data
      );

      res.json({
        success: true,
        message: 'Notifications sent successfully',
        sentTo: allTokens.length,
        tickets
      });
    } catch (error) {
      console.error('Error sending notifications to multiple users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notifications'
      });
    }
  }

  // Broadcast đến tất cả user
  async broadcast(req, res) {
    try {
      const { title, body, data } = req.body;

      const users = await User.find({ 
        pushTokens: { $exists: true, $not: { $size: 0 } } 
      });

      const allTokens = users.reduce((tokens, user) => {
        const userTokens = user.pushTokens.map(t => t.token);
        return [...tokens, ...userTokens];
      }, []);

      if (allTokens.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No push tokens found'
        });
      }

      const tickets = await PushNotificationService.sendToMultipleTokens(
        allTokens, 
        title, 
        body, 
        data
      );

      res.json({
        success: true,
        message: 'Broadcast sent successfully',
        sentTo: allTokens.length,
        tickets
      });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to broadcast notification'
      });
    }
  }

  // Test gửi notification
  async testNotification(req, res) {
    try {
      const { token } = req.body;

      if (!token || !PushNotificationService.isValidPushToken(token)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid push token'
        });
      }

      const ticket = await PushNotificationService.sendToToken(
        token,
        'Test Notification',
        'This is a test notification from your app!',
        { type: 'test' }
      );

      res.json({
        success: true,
        message: 'Test notification sent successfully',
        ticket
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification'
      });
    }
  }
}

module.exports = new NotificationController();