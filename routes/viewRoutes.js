// 180. Setting up the Project Structure
const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

// 189. Logging in Users With Our API - Part 2
// funkcja middleware sprawdzająca czy zalogowany użytkownik
// używana tylko do renderowania strony dla zalogowanego
// refactor in 193
// router.use(authController.isLoggedIn);

// 187. Building the Login Screen
router.get('/auth/login', viewsController.getLoginForm);
router.get('/auth/signup', viewsController.getSignUpForm);

// 175. Setting Up Pug in Express
// 213. Creating New Booking on Checkout Success
router.get(
    '/',
    bookingController.createBookingCheckout,
    authController.isLoggedIn,
    viewsController.getOverview
);

router.get('/overview', authController.isLoggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/toursmap', authController.isLoggedIn, viewsController.getTours);

// 193. Building the User Account Page
router.get('/me', authController.protect, viewsController.getAccount);
// 214.
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.get('/my-reviews', authController.protect, viewsController.getMyReviews);

// 194. Updating User Data
router.post(
    '/submit-user-data',
    authController.protect,
    viewsController.updateUserData
);

module.exports = router;
