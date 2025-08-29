const express = require('express')
const router = express.Router()
const categoryBSCTController = require('../../controllers/bsct/categoryBSCT')
const {protect , isAdmin} = require('../../middleware/auth.middleware')

router.get('/', categoryBSCTController.getAllCategoriesBSCT)
router.post('/', protect, isAdmin, categoryBSCTController.createCategoryBSCT)
router.get('/:id',protect, isAdmin, categoryBSCTController.getCategoryBSCTById)
router.put('/:id',protect, isAdmin, categoryBSCTController.updateCategoryBSCT)
router.delete('/:id',protect, isAdmin, categoryBSCTController.deleteCategoryBSCT)

module.exports = router;