const express = require('express')
const router = express.Router()
const categoryCTGDController = require('../../controllers/ctgd/categoryCTGD')
const {protect , isAdmin} = require('../../middleware/auth.middleware')

router.get('/', categoryCTGDController.getAllCategories)
router.post('/', protect, isAdmin, categoryCTGDController.createCategory)
router.get('/:id',protect, isAdmin, categoryCTGDController.getCategoryById)
router.put('/:id',protect, isAdmin, categoryCTGDController.updateCategory)
router.delete('/:id',protect, isAdmin, categoryCTGDController.deleteCategory)

module.exports = router;