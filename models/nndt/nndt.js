const mongoose = require('mongoose')

const productNNDTSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
    },
    description: {
        type: String,
        require: true,
    },
    average_rating: {
        type: Number,
        default: 4.5
    },
    rating_count: {
        type: Number,
        default: "0"
    },
    images: {
        type: [String],
        require: true,
        default: [],
    },
    categorynndt: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoryNongNghiepDoThi',
        require: true,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isMoi: {
        type: Boolean,
        default: true
    },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true
});


module.exports = mongoose.model('ProductNongNghiepDoThi', productNNDTSchema)