const { Expo } = require('expo-server-sdk')
const User = require('../models/user')

class NotificationService {
    constructor() {
        this.expo = new Expo();
    }

    /**
     * Gửi notification đến nhiều users
     * @param {Array} users - Array of user objects
     * @param {Object} notification - Notification data
     */
    async sendNotificationToMultipleUsers(users, notification) {
        const validTokens = users
            .filter(user => user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken))
            .map(user => user.expoPushToken);

        if (validTokens.length === 0) {
            console.log('No valid push tokens found');
            return { success: false, sentCount: 0 };
        }

        const messages = validTokens.map(token => ({
            to: token,
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
            sound: notification.sound || 'default',
            badge: notification.badge || null,
        }));

        let totalSent = 0;

        try {
            // Gửi theo batch để tránh rate limit
            const chunks = this.expo.chunkPushNotifications(messages);

            for (const chunk of chunks) {
                const tickets = await this.expo.sendPushNotificationsAsync(chunk);
                totalSent += tickets.length;
                console.log(`Notification batch sent: ${tickets.length} messages`);
            }

            return { success: true, sentCount: totalSent };
        } catch (error) {
            console.error('Error sending notifications:', error);
            return { success: false, sentCount: totalSent, error: error.message };
        }
    }

    /**
     * Gửi thông báo sản phẩm mới đến tất cả users
     * @param {Object} product - Product object từ MongoDB
     */
    async notifyNewProduct(product) {
        try {
            // Lấy tất cả users có push token và bật notification
            const users = await this.getAllUsersWithPushTokens();

            if (users.length === 0) {
                console.log('No users found to send notification');
                return { success: false, message: 'No users to notify' };
            }

            const notification = {
                title: '🆕 Sản phẩm mới!',
                body: `${product.name} vừa được thêm vào cửa hàng`,
                data: {
                    type: 'new_product',
                    productId: product._id.toString(),
                    screen: 'ProductDetail',
                    product: {
                        id: product._id.toString(),
                        name: product.name,
                        description: product.description,
                        category: product.category,
                        images: product.images,
                        isMoi: product.isMoi,
                    }
                },
                badge: 1,
                sound: 'default',
            };

            const result = await this.sendNotificationToMultipleUsers(users, notification);

            console.log(`New product notification result:`, {
                productName: product.name,
                totalUsers: users.length,
                sentCount: result.sentCount,
                success: result.success
            });

            return result;

        } catch (error) {
            console.error('Error in notifyNewProduct:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Lấy tất cả users có push token từ MongoDB
     * @returns {Promise<Array>} - Array of users
     */
    async getAllUsersWithPushTokens() {
        try {
            const users = await User.find({
                expoPushToken: { $ne: null },
                notificationEnabled: true,
                isActive: true
            }).select('_id expoPushToken name email');

            return users;
        } catch (error) {
            console.error('Error fetching users with push tokens:', error);
            return [];
        }
    }

    /**
     * Lưu push token vào database
     * @param {string} userId - User ID
     * @param {string} token - Expo push token
     */
    async savePushToken(userId, token) {
        try {
            if (!Expo.isExpoPushToken(token)) {
                console.log('Invalid push token format');
                return false;
            }

            await User.findByIdAndUpdate(userId, {
                expoPushToken: token,
                notificationEnabled: true
            });

            console.log(`Push token saved for user ${userId}`);
            return true;
        } catch (error) {
            console.error('Error saving push token:', error);
            return false;
        }
    }

    /**
     * Xóa push token (khi user logout)
     * @param {string} userId - User ID
     */
    async removePushToken(userId) {
        try {
            await User.findByIdAndUpdate(userId, {
                expoPushToken: null
            });

            console.log(`Push token removed for user ${userId}`);
            return true;
        } catch (error) {
            console.error('Error removing push token:', error);
            return false;
        }
    }
}

// Export singleton instance
const notificationService = new NotificationService();

module.exports = {
    NotificationService,
    notificationService,
};