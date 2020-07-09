// 210.
// 215.
const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
    .get('/', bookingController.getAllBookings)
    .post(bookingController.createBooking);

router
    .get('/:id', authController.protect, bookingController.getBooking)
    .patch(authController.restrictTo('admin'), bookingController.updateBooking)
    .delete(
        authController.restrictTo('admin'),
        bookingController.deleteBooking
    );

module.exports = router;
