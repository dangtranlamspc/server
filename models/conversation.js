const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        require: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const conversationSchema = new mongoose.Schema({
    userId: {
        type: String,
        require: true,
        index: true,
    },
    messages: [messageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updateAt: {
        type: Date,
        default: Date.now,
    }
});

conversationSchema.pre('save', function (next) {
    this.updateAt = new Date();
    next()
});

module.exports = mongoose.model('Conversation', conversationSchema);