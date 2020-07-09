const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
// 191. Logging Out Users
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// 164. Adding Missing Authentication and Authorization
// Protect all routes after this middleware
router.use(authController.protect);

// 137. Updating the Current User: Password
router.patch('/updateMyPassword', authController.updatePassword);

// 163. Adding a /me endpoint
router.get('/me', userController.getMe, userController.getUser);

// 138 Update the Current User Data
// 199. Configuring Multer
router.patch(
    '/updateMe',
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);
// 139 Delete the Current User
router.delete('/deleteMe', userController.deleteMe);

// 164. Adding Missing Authentication and Authorization
// Protect and restricted to admin all routes after this middleware
router.use(authController.restrictTo('admin'));

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;
