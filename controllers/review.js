const Review = require('../models/review')
const Product = require('../models/product')
const mongoose = require('mongoose')

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

        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                error: 'Bạn đã đánh giá sản phẩm này rồi'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Không tìm thấy sản phẩm'
            });
        }

        const review = new Review({
            productId,
            productType,
            userId,
            rating,
            comment,
            images: images || []
        });

        await review.save();

        const stats = await Review.calculateAverageRating(productId);
        await Product.findByIdAndUpdate(productId, {
            average_rating: stats.averageRating,
            rating_count: stats.totalReviews,
        });

        await review.populate('userId', 'name avatar');
        res.status(201).json({
            success: true,
            data: review,
            message: 'Dánh giá đã được gửi thành công',
        });
    } catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Không thể tạo đánh giá'
        });
    }
}

exports.getProductReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const {
            page = 1,
            limit = 10,
            rating,
            sortBy = 'createdAt',
            order = 'desc',
        } = req.query;

        const query = {
            productId,
            status: 'approved'
        };

        if (rating) {
            query.rating = parseInt(rating);
        }

        const reviews = await Review.find(query)
            .populate('userId', 'name avatar')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Review.countDocuments(query);

        const ratingDistribution = await Review.aggregate([
            { $match: { productId: mongoose.Types.ObjectId(productId), status: 'approved' } },
            {
                $group: {
                    _id: 'rating',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        const stats = await Review.calculateAverageRating(productId);

        res.json({
            success: true,
            data: {
                reviews,
                stats: {
                    averageRating: stats.averageRating,
                    totalReview: stats.totalReview,
                    distribution: ratingDistribution
                },
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        })
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

        const stats = await Review.calculateAverageRating(review.productId);
        await Product.findByIdAndUpdate(review.productId, {
            average_rating: stats.averageRating,
            rating_count: stats.totalReview,
        });

        await review.populate('userId', 'name avatar');

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

        const stats = await Review.calculateAverageRating(review.productId);
        await Product.findByIdAndUpdate(review.productId, {
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