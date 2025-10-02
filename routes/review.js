const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');
const { protect } = require('../middleware/auth.middleware')


router.get('/product/:productId', reviewController.getProductReview)
router.post('/',protect, reviewController.createReview)
router.put('/:reviewId', protect, reviewController.updateReview)
router.delete(':/reviewId', protect, reviewController.deleteReview)
router.post('/:reviewId/reply', protect, reviewController.replyReview)
router.post('/:reviewId/helpful', protect, reviewController.markHelpful)
router.get('/user/me', protect, reviewController.getUserReview)


module.exports = router;
