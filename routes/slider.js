const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect, isAdmin } = require('../middleware/auth.middleware');
const sliderController = require('../controllers/slider')


// Tạo slider
router.post('/', upload.single('image'), sliderController.creacteSliders);

// Lấy danh sách sliders
router.get('/', sliderController.getSliders);

// Cập nhật slider
router.put('/:id', upload.single('image'), sliderController.updateSlider);

// Xóa slider
router.delete('/:id', sliderController.deleteSlider);

module.exports = router;