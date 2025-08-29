const express = require('express');
const favouriteController = require('../controllers/favourite');
const {protect} = require("../middleware/auth.middleware");


const router = express.Router();

router.get("/",protect, favouriteController.getFavourites);
router.post("/toggle",protect, favouriteController.toggleFavourite);
router.get("/check/:productId", favouriteController.checkFavourite);
router.get("/count",protect, favouriteController.countFavourites);

module.exports = router;