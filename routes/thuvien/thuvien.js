const express = require('express');
const router = express.Router();
const {protect} = require('../../middleware/auth.middleware')
const thuvienController = require('../../controllers/thuvien/thuvien')
const categoryThuVienController = require('../../controllers/thuvien/categoryThuVien')


router.post('/', protect, thuvienController.creacteThuVien);
router.get('/', thuvienController.getThuVien);
router.get('/new', thuvienController.getNewThuVien);
router.get('/:id', thuvienController.getThuVienById);
router.put('/:id', thuvienController.updateThuVien);
router.delete('/:id', protect, thuvienController.deleteThuVien);
router.get('/categoryThuVien/:categoryThuVienId', thuvienController.getThuVienByCategoryThuVien);
router.get('/categoriesThuVien', categoryThuVienController.getAllCategoriesThuVien);


module.exports = router;