const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
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
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
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


module.exports = mongoose.model('Product', productSchema)