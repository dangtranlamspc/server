const mongoose = require('mongoose')

const productCTGDSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    average_rating: {
        type: Number,
        default: 4.5
    },
    rating_count: {
        type: Number,
        default: "0"
    },
    images: [
        {
            url: { type: String },
            imageId: { type: String }, // Cloudinary public_id
        },
    ],
    categoryctgd: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoryConTrungGiaDung',
        required: true,
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


module.exports = mongoose.model('ProductConTrungGiaDung', productCTGDSchema)