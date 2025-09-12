// services/notificationService.js
const { Expo } = require('expo-server-sdk');

// Tạo một instance mới của Expo SDK
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN, // Tùy chọn
  useFcmV1: true // Sử dụng FCM v1 API
});

// Model để lưu push tokens của users
const PushToken = require('../models/pushToken') // Bạn cần tạo model này

const notificationService = {
  // Lưu push token khi user đăng nhập từ mobile
  async savePushToken(userId, pushToken) {
    try {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return { success: false, error: 'Invalid push token' };
      }

      await PushToken.findOneAndUpdate(
        { userId },
        { pushToken, isActive: true, updatedAt: new Date() },
        { upsert: true }
      );

      return { success: true, message: 'Push token saved successfully' };
    } catch (error) {
      console.error('Error saving push token:', error);
      return { success: false, error: error.message };
    }
  },

  // Gửi thông báo sản phẩm mới
  async notifyNewProduct(product) {
    try {
      // Lấy tất cả push tokens active
      const activeTokens = await PushToken.find({ isActive: true });
      
      if (activeTokens.length === 0) {
        return { success: true, message: 'No active push tokens found' };
      }

      // Tạo messages để gửi
      const messages = [];
      for (const tokenDoc of activeTokens) {
        if (!Expo.isExpoPushToken(tokenDoc.pushToken)) {
          console.error(`Push token ${tokenDoc.pushToken} is not valid`);
          continue;
        }

        messages.push({
          to: tokenDoc.pushToken,
          sound: 'default',
          title: '🎉 Sản phẩm mới!',
          body: `${product.name} - ${product.description?.substring(0, 50) || 'Khám phá ngay!'}`,
          data: {
            productId: product._id,
            productName: product.name,
            category: product.category,
            type: 'new_product'
          },
          categoryId: 'new_product',
          priority: 'high'
        });
      }

      if (messages.length === 0) {
        return { success: true, message: 'No valid push tokens to send to' };
      }

      // Chia messages thành chunks để gửi
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }

      // Xử lý receipts sau (tùy chọn)
      setTimeout(() => {
        this.handlePushReceipts(tickets);
      }, 15000);

      return {
        success: true,
        message: `Sent notifications to ${messages.length} devices`,
        tickets
      };

    } catch (error) {
      console.error('Error sending notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // Xử lý receipts để kiểm tra trạng thái gửi
  async handlePushReceipts(tickets) {
    const receiptIds = tickets
      .filter(ticket => ticket.id)
      .map(ticket => ticket.id);

    if (receiptIds.length === 0) return;

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    
    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          
          if (receipt.status === 'error') {
            console.error(`Error sending notification: ${receipt.message}`);
            
            if (receipt.details && receipt.details.error) {
              // Token không hợp lệ, xóa khỏi database
              if (receipt.details.error === 'DeviceNotRegistered') {
                await PushToken.deleteOne({ pushToken: receipt.details.expoPushToken });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching receipts:', error);
      }
    }
  },

  // Gửi thông báo custom
  async sendCustomNotification(userIds, title, body, data = {}) {
    try {
      const tokens = await PushToken.find({
        userId: { $in: userIds },
        isActive: true
      });

      if (tokens.length === 0) {
        return { success: true, message: 'No active tokens found for specified users' };
      }

      const messages = tokens
        .filter(token => Expo.isExpoPushToken(token.pushToken))
        .map(token => ({
          to: token.pushToken,
          sound: 'default',
          title,
          body,
          data,
          priority: 'high'
        }));

      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      return {
        success: true,
        message: `Sent to ${messages.length} devices`,
        tickets
      };

    } catch (error) {
      console.error('Error sending custom notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Xóa push token khi user logout
  async removePushToken(userId) {
    try {
      await PushToken.findOneAndUpdate(
        { userId },
        { isActive: false }
      );
      return { success: true, message: 'Push token deactivated' };
    } catch (error) {
      console.error('Error removing push token:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = notificationService;