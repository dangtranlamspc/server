const mongoose = require('mongoose')

const favouriteSchema = new mongoose.Schema(
    {
        userId: {
            // type : mongoose.Schema.Types.ObjectId, 
            // ref : 'User',
            type: String,
            trim: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        productnndtId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductNongNghiepDoThi',
            required: true,
        },
        productctgdId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductConTrungGiaDung',
            required: true,
        },
        createdAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

favouriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

favouriteSchema.index({ userId: 1, createdAt: -1 });
favouriteSchema.index({ productId: 1 });

module.exports = mongoose.model('Favourite', favouriteSchema)