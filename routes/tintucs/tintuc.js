const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload')
const {protect} = require('../../middleware/auth.middleware')
const tintucController = require('../../controllers/tintucs/tintuc')
const categoryTinTucController = require('../../controllers/tintucs/categoryTinTuc')


router.post('/', protect, upload.single('images'), tintucController.creacteTinTuc);
router.get('/', tintucController.getTinTuc);
router.get('/new', tintucController.getNewTinTuc);
router.get('/:id', tintucController.getTinTucById);
router.put('/:id', upload.single('images'), tintucController.updateTinTuc);
router.delete('/:id', protect, tintucController.deleteTinTuc);
router.get('/categoryTinTuc/:categoryTinTucId', tintucController.getTinTucByCategory);
router.get('/categoryTinTuc', categoryTinTucController.getAllCategories);


module.exports = router;