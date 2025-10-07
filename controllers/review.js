const Review = require('../models/review')
const mongoose = require('mongoose')

const PRODUCT_MODELS = {
    'Product': require('../models/product'),
    'ProductNongNghiepDoThi': require('../models/nndt/nndt'),
    'ProductConTrungGiaDung': require('../models/ctgd/ctgs')
};

const getProductModel = (productType) => {
    const model = PRODUCT_MODELS[productType];
    if (!model) {
        throw new Error(`Loại sản phẩm "${productType}" không hợp lệ. Các loại hợp lệ : ${Object.keys(PRODUCT_MODELS).join(', ')}`);
    }
    return model;
};

exports.createReview = async (req, res) => {
    try {
        const { productId, productType, rating, comment, images } = req.body;

        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - User ID not found'
            });
        }

        // Validate productType
        if (!productType || !PRODUCT_MODELS[productType]) {
            return res.status(400).json({
                success: false,
                error: `Loại sản phẩm không hợp lệ. Các loại hợp lệ: ${Object.keys(PRODUCT_MODELS).join(', ')}`
            });
        }

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Đánh giá phải từ 1 đến 5 sao'
            });
        }

        // Validate comment
        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Vui lòng nhập nội dung đánh giá'
            });
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                error: 'ID sản phẩm không hợp lệ'
            });
        }

        // Kiểm tra đã review chưa
        const existingReview = await Review.findOne({ 
            userId, 
            productId: mongoose.Types.ObjectId.createFromHexString(productId),
            productType
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: 'Bạn đã đánh giá sản phẩm này rồi'
            });
        }

        // Lấy model tương ứng với productType
        const ProductModel = getProductModel(productType);

        // Kiểm tra sản phẩm có tồn tại không
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: `Không tìm thấy sản phẩm`
            });
        }

        // Format images nếu có
        const formattedImages = images && Array.isArray(images) 
            ? images.map(img => {
                if (typeof img === 'string') {
                    return { url: img, imageId: '' };
                }
                return img;
            })
            : [];

        // Tạo review mới
        const review = new Review({
            productId: mongoose.Types.ObjectId.createFromHexString(productId),
            productType,
            userId,
            rating,
            comment: comment.trim(),
            images: formattedImages,
            status: 'approved' // Hoặc 'pending' nếu cần duyệt
        });

        await review.save();

        // Tính toán lại rating trung bình cho sản phẩm
        const stats = await Review.calculateAverageRating(productId);
        
        await ProductModel.findByIdAndUpdate(productId, {
            average_rating: stats.averageRating,
            rating_count: stats.totalReviews,
        });

        // Populate thông tin user
        await review.populate('userId', 'name avatar');

        res.status(201).json({
            success: true,
            data: review,
            message: 'Đánh giá đã được gửi thành công',
        });
    } catch (error) {
        console.error('Create Review Error:', error);
        
        // Xử lý lỗi duplicate key (đã review rồi)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Bạn đã đánh giá sản phẩm này rồi'
            });
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Không thể tạo đánh giá'
        });
    }
}

exports.getProductReview = async (req, res) => {
    try {
        const { productId, productType } = req.params;
        const { page = 1, limit = 10, rating, sort = 'newest' } = req.query;

        // Validate productType
        if (!PRODUCT_MODELS[productType]) {
            return res.status(400).json({
                success: false,
                error: 'Loại sản phẩm không hợp lệ'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                error: 'ID sản phẩm không hợp lệ'
            });
        }

        const query = {
            productId: mongoose.Types.ObjectId.createFromHexString(productId),
            productType,
            status: 'approved'
        };

        // Lọc theo rating nếu có
        if (rating) {
            query.rating = parseInt(rating);
        }

        // Xác định sort order
        let sortOption = { createdAt: -1 }; // Mặc định: mới nhất
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'highest') {
            sortOption = { rating: -1, createdAt: -1 };
        } else if (sort === 'lowest') {
            sortOption = { rating: 1, createdAt: -1 };
        } else if (sort === 'helpful') {
            sortOption = { helpfulCount: -1, createdAt: -1 };
        }

        const reviews = await Review.find(query)
            .populate('userId', 'name avatar')
            .populate('replies.userId', 'name avatar')
            .sort(sortOption)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Review.countDocuments(query);

        res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: parseInt(page),
                perPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get Reviews Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể lấy đánh giá'
        });
    }
}

exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment, images } = req.body;
        const userId = req.user._id;

        const review = await Review.findOne({ _id: reviewId, userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa'
            });
        }

        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        if (images) review.images = images;
        review.isEdited = true;

        await review.save();

        const ProductModel = getProductModel(review.productType);
        const stats = await Review.calculateAverageRating(review.productId);

        await ProductModel.findByIdAndUpdate(review.productId, {
            average_rating: stats.averageRating,
            rating_count: stats.totalReview,
        });

        await review.populate('userId', 'name avatar');
        await review.populate('replies.userId', 'name avatar');

        res.json({
            success: true,
            data: review,
            message: 'Đánh giá đã được cập nhật',
        });
    } catch (error) {
        console.error('Update Review Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể cập nhật đánh giá'
        });
    }
}

exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findByIdAndDelete({ _id: reviewId, userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy đánh giá hoặc bạn không có quyền xoá'
            });
        }

        const productId = review.productId.toString();
        const productType = review.productType;

        await review.deleteOne();

        const ProductModel = getProductModel(productType);
        const stats = await Review.calculateAverageRating(productId);
        await ProductModel.findByIdAndUpdate(productId, {
            average_rating: stats.averageRating,
            rating_count: stats.totalReviews
        });

        res.json({
            success: true,
            message: 'Đánh giá của bạn đã xoá'
        });

    } catch (error) {
        console.error('Delete Review Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể xóa đánh giá'
        });
    }
}

exports.markHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy đánh giá'
            });
        }

        const alreadyMarked = review.helpfulBy.includes(userId);

        if (alreadyMarked) {
            review.helpfulBy = review.helpfulBy.filter(id => !id.equals(userId));
            review.helpfulCount = Math.max(0, review.helpfulCount - 1)
        } else {
            review.helpfulBy.push(userId);
            review.helpfulCount += 1;
        }

        await review.save();

        res.json({
            success: true,
            data: {
                helpfulCount: review.helpfulCount,
                isHelpful: !alreadyMarked
            },
            message: alreadyMarked ? 'Đã bỏ hữu ích' : 'Đã đánh dấu hữu ich'
        });
    } catch (error) {
        console.error('Mark Helpful Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể thực hiện'
        });
    }
}

exports.getRatingStats = async (req, res) => {
    try {
        const { productId, productType } = req.params;

        if (!PRODUCT_MODELS[productType]) {
            return res.status(400).json({
                success: false,
                error: 'Loại sản phẩm không hợp lệ'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                error: 'ID sản phẩm không hợp lệ'
            });
        }

        const stats = await Review.calculateAverageRating(productId);

        // Đếm số lượng review theo từng mức sao
        const ratingBreakdown = await Review.aggregate([
            {
                $match: {
                    productId: mongoose.Types.ObjectId.createFromHexString(productId),
                    productType: productType,
                    status: 'approved'
                }
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: -1 }
            }
        ]);

        // Format breakdown thành object dễ đọc
        const breakdown = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };

        ratingBreakdown.forEach(item => {
            breakdown[item._id] = item.count;
        });

        // Tính phần trăm cho mỗi mức sao
        const percentages = {};
        Object.keys(breakdown).forEach(star => {
            percentages[star] = stats.totalReviews > 0
                ? Math.round((breakdown[star] / stats.totalReviews) * 100)
                : 0;
        });

        res.status(200).json({
            success: true,
            data: {
                averageRating: stats.averageRating,
                totalReviews: stats.totalReviews,
                breakdown,
                percentages
            }
        });
    } catch (error) {
        console.error('Get Rating Stats Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể lấy thống kê'
        });
    }
};

exports.replyReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { comment } = req.body;
        const userId = req.user._id;

        // Check if user is admin/shop owner
        if (!req.user.isAdmin && !req.user.isShopOwner) {
            return res.status(403).json({
                success: false,
                error: 'Bạn không có quyền trả lời đánh giá'
            });
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy đánh giá'
            });
        }

        review.replies.push({
            userId,
            comment
        });

        await review.save();
        await review.populate('replies.userId', 'name avatar');

        res.json({
            success: true,
            data: review,
            message: 'Đã trả lời đánh giá'
        });

    } catch (error) {
        console.error('Reply Review Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể trả lời đánh giá'
        });
    }
}

exports.getUserReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Review.find({ userId })
            .populate('productId', 'name images')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Review.countDocuments({ userId });

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('Get User Reviews Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể lấy đánh giá'
        });
    }
}