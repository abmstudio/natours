const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
// 157. Implementing Simple Nested Routes
// Refactoring in 158. Nested Routes with Express
// const reviewController = require('./../controllers/reviewController');
// 158. Nested Routes with Express
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// 157. Implementing Simple Nested Routes
// POST /tour/234adf34343/reviews
// GET /tour/234adf34343/reviews
// GET /tour/234adf34343/reviews/9884533
// Refactoring in 158. Nested Routes in Express
// router
//     .route('/:tourId/reviews')
//     .post(
//         authController.protect,
//         authController.restrictTo('user'),
//         reviewController.createReview
//     );

// 158. Nested Routes in Express
// redirect to reviewRouter
router.use('/:tourId/reviews', reviewRouter);

router
    .route('/top-cheapest')
    .get(tourController.aliasTopCheapestTours, tourController.getAllTours);

router
    .route('/top-tours')
    .get(
        tourController.aliasTopCheapestTours,
        tourController.aliasTopTours,
        tourController.getAllTours
    );

router.route('/tour-stats').get(tourController.getTourStats);
router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        tourController.getMonthlyPlan
    );

// 170. Geospatial Queries: Finding Tours Within Radius
// one way
// tours-within?distance=233&center=-40,45&unit=mi
// but this way:
// tours-within/233/center/-40,45/unit/mi
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

// 171. Geospatial Aggregation: Calculating Distance
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
    .route('/')
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.createTour
    );

router
    .route('/:id')
    .get(tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.uploadTourImages,
        tourController.resizeTourImages,
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        tourController.deleteTour
    );

module.exports = router;
