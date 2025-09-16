const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload')
const {protect, isAdmin} = require('../../middleware/auth.middleware')
const productNNDTController = require('../../controllers/nndt/nndt')
const categoryNNDTController = require('../../controllers/nndt/categorynndt')


router.post('/', protect, upload.array('images', 5), productNNDTController.createProductNNDT);
router.get('/', productNNDTController.getProductNNDTs);
// router.get('/new', productController.getProductNew);
router.get('/new', productNNDTController.getProductNew);
router.get('/:id', productNNDTController.getProductById);
router.put('/:id', upload.array('images',5),protect, isAdmin, productNNDTController.updateProductNNDT);
router.delete('/:id',protect, isAdmin, productNNDTController.deleteProductNNDT);
router.get('/categorynndt/:categoryNNDTId', productNNDTController.getProductsByCategory);
router.get('/with-favourites', productNNDTController.getProductNNDTsByFavourite);
router.get('/categoryNNDT', categoryNNDTController.getAllCategories);


module.exports = router;