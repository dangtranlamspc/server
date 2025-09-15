const express = require('express')
const router = express.Router()
const categoryNNDTController = require('../../controllers/nndt/categorynndt')
const {protect , isAdmin} = require('../../middleware/auth.middleware')

router.get('/', categoryNNDTController.getAllCategories)
router.post('/', protect, isAdmin, categoryNNDTController.createCategory)
router.get('/:id',protect, isAdmin, categoryNNDTController.getCategoryById)
router.put('/:id',protect, isAdmin, categoryNNDTController.updateCategory)
router.delete('/:id',protect, isAdmin, categoryNNDTController.deleteCategory)

module.exports = router;