const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');
const { protect } = require('../middleware/auth.middleware')


router.get('/:productType/:productId/stats', reviewController.getRatingStats);
router.get('/:productType/:productId', reviewController.getProductReview);

// Protected routes (require authentication)
router.post('/',protect, reviewController.createReview);
router.put('/:reviewId', protect, reviewController.updateReview);
router.delete('/:reviewId', protect, reviewController.deleteReview);
router.post('/:reviewId/helpful', protect, reviewController.markHelpful);
router.post('/:reviewId/reply', protect, reviewController.replyReview);
router.get('/user/me', protect, reviewController.getUserReview);


module.exports = router;
