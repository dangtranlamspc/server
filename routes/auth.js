const express = require('express')
const router = express.Router();
const authController = require('../controllers/user');
const {protect} = require('../middleware/auth.middleware')


router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/change-password', protect, authController.changePassword);
router.get('/verify', authController.verifyAccount);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout',protect, authController.logout)
router.post('/refresh-token',protect, authController.refreshToken);


router.get('/', authController.getUsers);
router.post('/', authController.createUser);
router.put('/:id', authController.updateUser);
router.delete('/:id', authController.deleteUser);


module.exports = router;