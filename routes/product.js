const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload')
const { protect, isAdmin } = require('../middleware/auth.middleware')
const productController = require('../controllers/product')
const categoryController = require('../controllers/category')


router.post('/', protect, upload.array('images', 5), productController.createProduct);
router.get('/', productController.getProducts);
// router.get('/new', productController.getProductNew);
router.get('/new', productController.getProductNew);
router.get('/:id', productController.getProductById);
router.put('/:id', upload.array('images', 5), protect, isAdmin, productController.updateProduct);
router.delete('/:id', protect, isAdmin, productController.deleteProduct);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/with-favourites', productController.getProductsByFavourite);
router.get('/categories', categoryController.getAllCategories);


module.exports = router;