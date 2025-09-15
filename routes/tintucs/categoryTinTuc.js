const express = require('express')
const router = express.Router()
const categoryTinTucController = require('../../controllers/tintucs/categoryTinTuc')
const {protect , isAdmin} = require('../../middleware/auth.middleware')

router.get('/', categoryTinTucController.getAllCategories)
router.post('/', protect, isAdmin, categoryTinTucController.createCategory)
router.get('/:id',protect, isAdmin, categoryTinTucController.getCategoryById)
router.put('/:id',protect, isAdmin, categoryTinTucController.updateCategory)
router.delete('/:id',protect, isAdmin, categoryTinTucController.deleteCategory)

module.exports = router;