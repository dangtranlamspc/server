const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    productType: {
        type: String,
        enum: ['Product', 'ProductNongNghiepDoThi', 'ProductConTrungGiaDung'],
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        maxLength: 1000
    },
    images: [{
        url: String,
        imageId: String,
    }],
    helpfulCount: {
        type: Number,
        default: 0,
    },
    helpfulBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replies: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    isEdited: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    }
}, {
    timestamps: true
});

reviewSchema.index({ userId: 1, productId: 1, productType: 1 }, { unique: true });

reviewSchema.statics.calculateAverageRating = async function (productId) {

    const result = await this.aggregate([
        {
            $match: {
                productId: mongoose.Types.ObjectId.createFromHexString(productId),
                productType: productType,
                status: 'approved'
            }
        },
        {
            $group: {
                _id: '$productId',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    return result[0] || { averageRating: 0, totalReviews: 0 };
};

module.exports = mongoose.model('Review', reviewSchema)

