const Favourite = require('../models/favourite');
const Product = require('../models/product');

// exports.getFavourites = async (req, res) => {
//     try {
//         const { page = 1, limit = 10, sortBy = 'createAt', sortOrder = 'desc', productType } = req.query;

//         const skip = (page - 1) * parseInt(limit);
//         const sortOption = {};
//         sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

//         const favorites = await Favourite.find({ userId: req.user.id })
//             .populate({
//                 path: 'productId',
//                 match: { isActive: true }
//             })
//             .sort(sortOption)
//             .skip(skip)
//             .limit(parseInt(limit));

//         const validFavourites = favorites.filter(fav => fav.productId);

//         const favoriteProducts = validFavourites.map(fav => ({
//             ...fav.productId.toObject(),
//             favouriteId: fav._id,
//             favouriteAt: fav.createdAt,
//             isFavourite: true,

//         }));

//         const totalFavourites = await Favourite.countDocuments({ userId: req.user.id });

//         res.json({
//             products: favoriteProducts,
//             pagination: {
//                 page: parseInt(page),
//                 limit: parseInt(limit),
//                 total: totalFavourites,
//                 pages: Math.ceil(totalFavourites / limit)
//             }
//         });
//     } catch (error) {
//         console.error('Get favourites error:', error);
//         res.status(500).json({
//             message: 'Failed to fetch favourite products',
//             error: error.message
//         });
//     }
// }

exports.getFavourites = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', productType } = req.query;

        const skip = (page - 1) * parseInt(limit);
        const sortOption = {};
        sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Build query filter
        const query = { userId: req.user.id };
        if (productType) {
            query.productType = productType;
        }

        const favorites = await Favourite.find(query)
            .populate({
                path: 'productId',
                match: { isActive: true }
            })
            .populate({
                path: 'productnndtId',
                match: { isActive: true }
            })
            .populate({
                path: 'productctgdId',
                match: { isActive: true }
            })
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        // Filter valid favourites and map to products
        const favoriteProducts = favorites
            .map(fav => {
                let product = null;
                let productData = null;

                if (fav.productId) {
                    product = fav.productId;
                    productData = { ...fav.productId.toObject(), productType: 'Product' };
                } else if (fav.productnndtId) {
                    product = fav.productnndtId;
                    productData = { ...fav.productnndtId.toObject(), productType: 'ProductNongNghiepDoThi' };
                } else if (fav.productctgdId) {
                    product = fav.productctgdId;
                    productData = { ...fav.productctgdId.toObject(), productType: 'ProductConTrungGiaDung' };
                }

                if (product) {
                    return {
                        ...productData,
                        favouriteId: fav._id,
                        favouriteAt: fav.createdAt,
                        isFavourite: true,
                    };
                }
                return null;
            })
            .filter(Boolean); // Remove null values

        const totalFavourites = await Favourite.countDocuments(query);

        res.json({
            products: favoriteProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalFavourites,
                pages: Math.ceil(totalFavourites / limit)
            }
        });
    } catch (error) {
        console.error('Get favourites error:', error);
        res.status(500).json({
            message: 'Failed to fetch favourite products',
            error: error.message
        });
    }
};


// exports.toggleFavourite = async (req, res) => {
//     try {
//         const { productId } = req.body;

//         if (!productId) {
//             return res.status(400).json({
//                 message: 'Product Id is required',
//                 error: 'VALIDATION_ERROR'
//             });
//         }

//         const product = await Product.findById(productId);
//         if (!product || !product.isActive) {
//             return res.status(400).json({
//                 message: 'Product is not found or inactive',
//                 error: 'Product not fount'
//             });
//         }

//         const existingFavourite = await Favourite.findOne({
//             userId: req.user.id,
//             productId: productId
//         });

//         if (existingFavourite) {
//             await Favourite.findByIdAndDelete(existingFavourite._id);
//             res.json({
//                 message: 'Removed from favourites',
//                 isFavourite: false,
//                 action: 'removed'
//             })
//         } else {
//             const favourite = new Favourite({
//                 userId: req.user.id,
//                 productId: productId
//             });
//             await favourite.save();
//             res.json({
//                 message: 'Added to favourites',
//                 isFavourite: true,
//                 action: 'added',
//                 favouriteId: favourite._id,
//             });
//         }
//     } catch (error) {
//         console.error('Toggle favourite error:', error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({
//                 message: 'Invalid product ID',
//                 error: 'INVALID_ID'
//             });
//         }
//         res.status(500).json({
//             message: 'Failed to toggle favourite',
//             error: error.message
//         });
//     }
// }

// Backend - sửa lại toggle endpoint
exports.toggleFavourite = async (req, res) => {
    try {
        const { productId, productnndtId, productctgdId, productType } = req.body;
        const userId = req.user.id;

        // Tìm existing favourite
        const existingFavourite = await Favourite.findOne({
            userId,
            ...(productId && { productId }),
            ...(productnndtId && { productnndtId }),
            ...(productctgdId && { productctgdId })
        });

        if (existingFavourite) {
            // Remove từ favourites
            await Favourite.findByIdAndDelete(existingFavourite._id);
            res.json({
                message: 'Removed from favourites successfully',
                isFavourite: false,
                action: 'removed'
            });
        } else {
            // Add to favourites
            const favouriteData = {
                userId,
                productType,
                createdAt: new Date()
            };

            if (productId) favouriteData.productId = productId;
            if (productnndtId) favouriteData.productnndtId = productnndtId;
            if (productctgdId) favouriteData.productctgdId = productctgdId;

            const favourite = new Favourite(favouriteData);
            await favourite.save();

            res.json({
                message: 'Added to favourites successfully',
                isFavourite: true,
                action: 'added',
                favouriteId: favourite._id
            });
        }
    } catch (error) {
        console.error('Toggle favourite error:', error);
        res.status(500).json({
            message: 'Failed to toggle favourite',
            error: error.message
        });
    }
};

exports.countFavourites = async (req, res) => {
    try {
        const count = await Favourite.countDocuments({ userId: req.user.id });
        res.json({
            success: true,
            count,
        });
    } catch (error) {
        console.error('Get favourite count error:', error);
        res.status(500).json({
            message: 'Failed to get favourite count',
            error: error.message
        });
    }
}

exports.checkFavourite = async (req, res) => {
    if (!req.user || (!req.user.userId && !req.user.id)) {
        return res.status(401).json({
            message: 'Authentication required. Please login.',
            error: 'UNAUTHORIZED'
        });
    }
    try {
        const { productId } = req.params;

        const favourite = await Favourite.findOne({
            userId: req.user.userId || req.user.id,
            productId: productId

        });

        res.json({
            isFavourite: !!favourite,
            favouriteId: favourite?._id || null,
            favouritedAt: favourite?.createdAt || null
        })
    } catch (error) {
        console.error('Check favourite error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid product ID',
                error: 'INVALID_ID'
            });
        }
        res.status(500).json({
            message: 'Failed to check favourite status',
            error: error.message
        });
    }
}