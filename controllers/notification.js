const Notification = require('../models/notification')
//get
exports.getNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const {page = 1, limit = 20, filter = 'all'} = req.query;

        let query = {
            $or: [
                {userId : userId},
                {userId : null}
            ]
        };

        if (filter === 'unread') {
            query.isRead = false;
        } else if (filter === 'read') {
            query.isRead = true;
        }

        const notification = await Notification.find(query)
            .sort({createdAt : -1})
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean()

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            ...query,
            isRead : false
        });

        res.json({
            success : true,
            data : notification,
            pagination : {
                page : parseInt(page),
                limit : parseInt(limit),
                total,
                pages : Math.ceil(total / limit)
            },
            unreadCount
        });
    } catch (error) {
        res.status(500).json({success : false , message : error.message})
    }
}
//put
exports.readNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const notification = await Notification.findOneAndUpdate(
            {
                _id : req.params.id,
                $or : [{userId : userId} , {userId : null}]
            },
            {isRead : true, updateAt : new Date()},
            {new: true}
        );

        if (!notification) {
            return res.status(404).json({success : false, message : 'Notification not found'});
        }

        res.json({success : true, data : notification});
    } catch (error) {
        res.status(500).json({success : false , message : error.message})
    }
}

//put
exports.allReadNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.updateMany(
            {
                $or : [{userId : userId}, {userId : null}],
                isRead : true
            },
            {isRead : true, updateAt : new Date()}
        );
        res.json({success : true, message : 'All notification marked as read'})
    } catch (error) {
        res.status(500).json({success : false , message : error.message})
    }
}

//delete
exports.deleteNotification = async (req,res) => {
    try {
        const userId = req.user.id;
        const notification = await Notification.findOneAndDelete({
            _id : req.params.id,
            userId : userId
        });

        if (!notification) {
            return res.status(404).json({success : false , message : 'Notification not found'});
        }

        res.json({success : true, message : 'Notification deleted'});
    } catch (error) {
        res.status(500).json({success : false , message : error.message})
    }
}