const mongoose = require('mongoose')

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true,
    },
    videoId: {
        type: String,
        require: true,
    },
    categoryThuVien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoryThuVien',
        require: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isMoi: {
        type: Boolean,
        default: false,
    },
    
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true
});

module.exports = mongoose.model('ThuVien', videoSchema)