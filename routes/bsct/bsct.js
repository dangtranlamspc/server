const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload')
const {protect} = require('../../middleware/auth.middleware')
const bsctController = require('../../controllers/bsct/bsct')
const categoryBSCTController = require('../../controllers/bsct/categoryBSCT')


router.post('/', protect, upload.single('images'), bsctController.creacteBlogBSCT);
router.get('/', bsctController.getBlogsBSCT);
router.get('/new', bsctController.getNewPostBSCT);
router.get('/:id', bsctController.getBlogsBSCTById);
router.put('/:id', upload.single('images'), bsctController.updateBlogBSCT);
router.delete('/:id', protect, bsctController.deleteBlogBSCT);
router.get('/categoryBSCT/:categoryBSCTId', bsctController.getBSCTByCategoryBSCT);
router.get('/categoriesBSCT', categoryBSCTController.getAllCategoriesBSCT);


module.exports = router;