const mongoose = require('mongoose')

const favouriteSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            trim: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        productnndtId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductNongNghiepDoThi',
        },
        productctgdId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductConTrungGiaDung',
        },
        productType: {
            type: String,
            enum: ['Product', 'ProductNongNghiepDoThi', 'ProductConTrungGiaDung'],
            require: true,
        },
        createdAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

favouriteSchema.pre('save', function (next) {
    const productFields = [this.productId, this.productctgdId, this.productnndtId].filter(Boolean)
    if (productFields.length !== 1) {
        return next(new Error('Exactly one product reference must be provided'));
    }
    next();
});

favouriteSchema.index({ userId: 1, productId: 1 }, { sparse: true });
favouriteSchema.index({ userId: 1, productnndtId: 1 }, { sparse: true });
favouriteSchema.index({ userId: 1, productctgdId: 1 }, { sparse: true });
favouriteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Favourite', favouriteSchema)

// const mongoose = require('mongoose')

// const favouriteSchema = new mongoose.Schema(
//     {
//         userId: {
//             type: String,
//             trim: true,
//         },
//         productId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Product',
//         },
//         createdAt: { type: Date, default: Date.now }
//     },
//     { timestamps: true }
// );

// favouriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

// favouriteSchema.index({ userId: 1, createdAt: -1 });
// favouriteSchema.index({ productId: 1 });

// module.exports = mongoose.model('Favourite', favouriteSchema)