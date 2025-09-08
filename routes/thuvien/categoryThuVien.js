const express = require('express')
const router = express.Router()
const {protect , isAdmin} = require('../../middleware/auth.middleware')
const categoryThuVienController = require('../../controllers/thuvien/categoryThuVien')


router.get('/', categoryThuVienController.getAllCategoriesThuVien)
router.post('/', protect, isAdmin, categoryThuVienController.createCategoryThuVien)
router.get('/:id',protect, isAdmin, categoryThuVienController.getCategoryThuVienById)
router.put('/:id',protect, isAdmin, categoryThuVienController.updateCategoryThuVien)
router.delete('/:id',protect, isAdmin, categoryThuVienController.deleteCategoryThuVien)

module.exports = router;
