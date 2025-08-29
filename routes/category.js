const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/category')
const {protect , isAdmin} = require('../middleware/auth.middleware')

router.get('/', categoryController.getAllCategories)
router.post('/', protect, isAdmin, categoryController.createCategory)
router.get('/:id',protect, isAdmin, categoryController.getCategoryById)
router.put('/:id',protect, isAdmin, categoryController.updateCategory)
router.delete('/:id',protect, isAdmin, categoryController.deleteCategory)

module.exports = router;