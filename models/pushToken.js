const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true,
        unique: true,
    },
    pushToken: {
        type: String,
        require: true,
    },
    deviceInfo: {
        platform: {
            type: String,
            enum: ['ios', 'android'],
            required: true
        },
        deviceName: String,
        osVersion: String,
        deviceModel: String
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true
})

pushTokenSchema.index({ userId: 1, pushToken: 1 });
pushTokenSchema.index({ pushToken: 1 });


module.exports = mongoose.model('PushToken', pushTokenSchema);