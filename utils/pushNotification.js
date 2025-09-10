const { Expo } = require('expo-server-sdk');

// Tạo instance Expo
const expo = new Expo();

class PushNotificationService {
  constructor() {
    this.expo = expo;
  }

  // Kiểm tra token hợp lệ
  isValidPushToken(token) {
    return Expo.isExpoPushToken(token);
  }

  // Gửi notification đến một token
  async sendToToken(token, title, body, data = {}) {
    try {
      if (!this.isValidPushToken(token)) {
        throw new Error('Invalid push token');
      }

      const message = {
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        // Tùy chỉnh thêm
        badge: 1,
        priority: 'high'
      };

      const ticket = await this.expo.sendPushNotificationsAsync([message]);
      return ticket[0];
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  // Gửi notification đến nhiều token
  async sendToMultipleTokens(tokens, title, body, data = {}) {
    try {
      const validTokens = tokens.filter(token => this.isValidPushToken(token));
      
      if (validTokens.length === 0) {
        throw new Error('No valid push tokens');
      }

      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        badge: 1,
        priority: 'high'
      }));

      // Chia nhỏ messages thành chunks (Expo giới hạn 100 messages/request)
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      return tickets;
    } catch (error) {
      console.error('Error sending push notifications:', error);
      throw error;
    }
  }

  // Xử lý receipt để kiểm tra delivery status
  async handleReceipts(tickets) {
    try {
      const receiptIds = tickets
        .filter(ticket => ticket.id)
        .map(ticket => ticket.id);

      if (receiptIds.length === 0) return [];

      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
      const receipts = [];

      for (const chunk of receiptIdChunks) {
        const receiptChunk = await this.expo.getPushNotificationReceiptsAsync(chunk);
        receipts.push(receiptChunk);
      }

      return receipts;
    } catch (error) {
      console.error('Error handling receipts:', error);
      throw error;
    }
  }
}

module.exports = new PushNotificationService();