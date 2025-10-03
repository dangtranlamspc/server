const admin = require('firebase-admin');
const DeviceToken = require('../models/deviceToken');
const Product = require('../models/product');
const Notification = require('../models/notification');
const Favourite = require('../models/favourite');
const mongoose = require('mongoose')


if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

class NotificationService {
    async sendToUser(userId, notification) {
        try {
            const devices = await DeviceToken.find({
                userId: new mongoose.Types.ObjectId(userId),
                isActive: true,
            });

            if (devices.length === 0) {
                console.log(`No active devices for user ${userId}`);
                return { success: true, sentCount: 0 }
            };

            const tokens = devices.map(d => d.token);

            const notificationDoc = new Notification({
                userId,
                title: notification.title,
                message: notification.body,
                type: notification.type,
                priority: notification.priority || 'medium',
                actionUrl: notification.actionUrl,
                relatedId: notification.relatedId,
                relatedType: notification.relatedType,
            });
            await notificationDoc.save();

            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: {
                    notificationId: notificationDoc._id.toString(),
                    type: notification.type,
                    actionUrl: notification.actionUrl || '',
                    relatedId: notification.relatedId || '',
                    relatedType: notification.relatedType || '',
                },
                tokens: tokens,
            };

            const response = await admin.messaging().sendMulticast(message);

            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });

                await DeviceToken.updateMany(
                    {
                        token: { $in: failedTokens }
                    },
                    { isActive: false }
                )

                return {
                    success: true,
                    sentCount: response.successCount,
                    failureCount: response.failureCount
                };
            }
        } catch (error) {
            console.error('Send notification error:', error);
            throw error;
        }
    }

    async sendToUsers(userIds, notification) {
        try {
            const results = await Promise.all(
                userIds.map(userId => this.sendToUser(userId, notification))
            );

            const totalSent = results.reduce((sum, r) => sum + r.sentCount, 0);
            const totalFailed = results.reduce((sum, r) => sum + r.failedCount, 0);

            return {
                success: true,
                sentCount: totalSent,
                failedCount: totalFailed,
                userCount: userIds.length,
            };
        } catch (error) {
            console.error('Send to users error:', error);
            throw error;
        }
    }

    async sendToAll(notification) {
        try {
            // Get all active devices
            const devices = await DeviceToken.find({ isActive: true });

            if (devices.length === 0) {
                return { success: true, sentCount: 0 };
            }

            // Group tokens in batches of 500 (FCM limit)
            const batchSize = 500;
            const batches = [];

            for (let i = 0; i < devices.length; i += batchSize) {
                batches.push(devices.slice(i, i + batchSize));
            }

            let totalSuccess = 0;
            let totalFailure = 0;

            // Send to each batch
            for (const batch of batches) {
                const tokens = batch.map(d => d.token);
                const userIds = [...new Set(batch.map(d => d.userId.toString()))];

                // Create notification records
                await Notification.insertMany(
                    userIds.map(userId => ({
                        userId,
                        title: notification.title,
                        body: notification.body,
                        type: notification.type,
                        data: notification.data || {}
                    }))
                );

                const message = {
                    notification: {
                        title: notification.title,
                        body: notification.body
                    },
                    data: {
                        type: notification.type,
                        ...notification.data
                    },
                    tokens: tokens
                };

                const response = await admin.messaging().sendMulticast(message);
                totalSuccess += response.successCount;
                totalFailure += response.failureCount;
            }

            return {
                success: true,
                sentCount: totalSuccess,
                failedCount: totalFailure,
                totalDevices: devices.length
            };

        } catch (error) {
            console.error('Send to all error:', error);
            throw error;
        }
    }

    async notifyNewReview(productId, reviewerId, productName) {
        try {

            const product = await Product.findById(productId).populate('creatorId');

            if (!product || !product.creatorId) return;

            const ownerId = product.creatorId._id;

            if (ownerId.toString() === reviewerId.toString()) return;

            await this.sendToUser(ownerId, {
                title: 'Đánh giá mới',
                body: `Sản phẩm "${productName}" vừa nhận được đánh giá mới`,
                type: 'product',
                priority: 'medium',
                actionUrl: `/review/${productId}`,
                relatedId: productId.toString(),
                relatedType: 'product'
            });

        } catch (error) {
            console.error('Notify new review error:', error);
        }
    }

    async notifyNewProduct(productId, productName) {
        try {
            await this.sendToAll({
                title: 'Sản phẩm mới',
                body: `Sản phẩm mới "${productName}" vừa được thêm`,
                type: 'product',
                priority: 'low',
                actionUrl: `/product/${productId}`,
                relatedId: productId.toString(),
                relatedType: 'product'
            })

        } catch (error) {
            console.error('Notify new product error:', error);
        }
    }
}

module.exports = new NotificationService();