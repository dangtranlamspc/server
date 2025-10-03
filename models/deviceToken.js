const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true,
        index : true
    },
    token : {
        type : String,
        required : true,
        unique : true
    },
    deviceType : {
        type : String,
        enum : ['ios','android'],
        required : true
    },
    deviceId : {
        type : String,
        required : true,
    },
    isActive : {
        type : Boolean,
        default : true,
    },
    lastUsed : {
        type : Date,
        default : Date.now
    }
}, {
    timestamps : true
});

deviceTokenSchema.index({userId : 1, isActive : 1});
// deviceTokenSchema.index({token : 1});

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);