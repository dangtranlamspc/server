const Notification = require('../models/notification')
const DeviceToken = require('../models/deviceToken');
const notificationService = require('../services/notificationService')

// exports.getNotification = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const {page = 1, limit = 20, filter = 'all'} = req.query;

//         let query = {
//             $or: [
//                 {userId : userId},
//                 {userId : null}
//             ]
//         };

//         if (filter === 'unread') {
//             query.isRead = false;
//         } else if (filter === 'read') {
//             query.isRead = true;
//         }

//         const notification = await Notification.find(query)
//             .sort({createdAt : -1})
//             .limit(limit * 1)
//             .skip((page - 1) * limit)
//             .lean()

//         const total = await Notification.countDocuments(query);
//         const unreadCount = await Notification.countDocuments({
//             ...query,
//             isRead : false
//         });

//         res.json({
//             success : true,
//             data : notification,
//             pagination : {
//                 page : parseInt(page),
//                 limit : parseInt(limit),
//                 total,
//                 pages : Math.ceil(total / limit)
//             },
//             unreadCount
//         });
//     } catch (error) {
//         res.status(500).json({success : false , message : error.message})
//     }
// }
// //put
// exports.readNotification = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const notification = await Notification.findOneAndUpdate(
//             {
//                 _id : req.params.id,
//                 $or : [{userId : userId} , {userId : null}]
//             },
//             {isRead : true, updateAt : new Date()},
//             {new: true}
//         );

//         if (!notification) {
//             return res.status(404).json({success : false, message : 'Notification not found'});
//         }

//         res.json({success : true, data : notification});
//     } catch (error) {
//         res.status(500).json({success : false , message : error.message})
//     }
// }

// //put
// exports.allReadNotification = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         await Notification.updateMany(
//             {
//                 $or : [{userId : userId}, {userId : null}],
//                 isRead : true
//             },
//             {isRead : true, updateAt : new Date()}
//         );
//         res.json({success : true, message : 'All notification marked as read'})
//     } catch (error) {
//         res.status(500).json({success : false , message : error.message})
//     }
// }

// //delete
// exports.deleteNotification = async (req,res) => {
//     try {
//         const userId = req.user.id;
//         const notification = await Notification.findOneAndDelete({
//             _id : req.params.id,
//             userId : userId
//         });

//         if (!notification) {
//             return res.status(404).json({success : false , message : 'Notification not found'});
//         }

//         res.json({success : true, message : 'Notification deleted'});
//     } catch (error) {
//         res.status(500).json({success : false , message : error.message})
//     }
// }



exports.registerToken = async (req, res) => {
    try {
        const { token, deviceType, deviceId } = req.body;
        const userId = req.user._id;

        if (!token || !deviceType || !deviceId) {
            return res.status(400).json({
                success: false,
                error: 'Token, deviceType và deviceId là bắt buộc'
            });
        }

        // Check if token already exists
        let deviceToken = await DeviceToken.findOne({ token });

        if (deviceToken) {
            // Update existing token
            deviceToken.userId = userId;
            deviceToken.deviceType = deviceType;
            deviceToken.deviceId = deviceId;
            deviceToken.isActive = true;
            deviceToken.lastUsed = new Date();
            await deviceToken.save();
        } else {
            // Create new token
            deviceToken = new DeviceToken({
                userId,
                token,
                deviceType,
                deviceId
            });
            await deviceToken.save();
        }

        res.json({
            success: true,
            message: 'Device token đã được đăng ký',
            data: deviceToken
        });

    } catch (error) {
        console.error('Register token error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể đăng ký token'
        });
    }
}


exports.unregisterToken = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user._id;

        await DeviceToken.updateOne(
            { token, userId },
            { isActive: false }
        );

        res.json({
            success: true,
            message: 'Device token đã được hủy'
        });

    } catch (error) {
        console.error('Unregister token error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể hủy token'
        });
    }
}

exports.getNotification = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const query = { userId };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            userId,
            isRead: false
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy thông báo'
            });
        }

        res.json({
            success: true,
            data: notification
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể đánh dấu đã đọc'
        });
    }
}

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({
            success: true,
            message: 'Đã đánh dấu tất cả là đã đọc'
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể đánh dấu'
        });
    }
}

exports.sendTestNotification = async (req, res) => {
    try {
        const { userId, title, message, type, priority, actionUrl, relatedId, relatedType } = req.body;

        const result = await notificationService.sendToUser(userId, {
            title,
            body: message, // message → body for FCM
            type: type || 'system',
            priority: priority || 'medium',
            actionUrl,
            relatedId,
            relatedType
        });

        res.json({
            success: true,
            message: 'Test notification sent',
            data: result
        });

    } catch (error) {
        console.error('Send test notification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
