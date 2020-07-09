// 154. Creating and Getting Reviews
const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// 158. Nested Routes in Express
const router = express.Router({ mergeParams: true });

// 164. Adding Missing Authentication and Authorization
// Protect all routes after this middleware
router.use(authController.protect);

// POST /tour/234adf34343/reviews
// POST /reviews
router
    .route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview
    );

router
    .route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('admin', 'user'),
        reviewController.checkIfAuthor,
        reviewController.updateReview
    )
    .delete(
        authController.restrictTo('admin', 'user'),
        reviewController.checkIfAuthor,
        reviewController.deleteReview
    );

module.exports = router;
