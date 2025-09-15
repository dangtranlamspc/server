const express = require('express');
const router = express.Router();
const upload = require('../../middleware/upload')
const {protect, isAdmin} = require('../../middleware/auth.middleware')
const productCTGDController = require('../../controllers/ctgd/ctgd')
const categoryCTGDController = require('../../controllers/ctgd/categoryCTGD')


router.post('/', protect, upload.array('images', 5), productCTGDController.createProductCTGD);
router.get('/', productCTGDController.getProductCTGDs);
// router.get('/new', productController.getProductNew);
router.get('/new', productCTGDController.getProductNew);
router.get('/:id', productCTGDController.getProductById);
router.put('/:id', upload.array('images',5),protect, isAdmin, productCTGDController.updateProductCTGD);
router.delete('/:id',protect, isAdmin, productCTGDController.deleteProductCTGD);
router.get('/categoryctgd/:categoryCTGDId', productCTGDController.getProductsByCategory);
router.get('/with-favourites', productCTGDController.getProductCTGDsByFavourite);
router.get('/categoryCTGD', categoryCTGDController.getAllCategories);


module.exports = router;