// 154. Creating and Getting Reviews
const Review = require('./../models/reviewModel');
// 160. Bulding Handler Factory Functions
const factory = require('./handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15065544#questions/8728268
exports.checkIfAuthor = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(
            new AppError(`No document found with that ID:${req.params.id}`, 404)
        );
    }

    if (req.user.role !== 'admin' && review.user.id !== req.user.id) {
        return next(new AppError(`You can't edit someone's else review.`, 403));
    }

    next();
});

// 161. Factory Functions: Update and Create
exports.setTourUserIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;

    req.body.user = req.user.id; // https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15065538#questions/9143084

    next();
};
// 162. Factory Functions: Reading
exports.getAllReviews = factory.getAll(Review);
// 162. Factory Functions: Reading
exports.getReview = factory.getOne(Review);
// 161. Factory Functions: Update and Create
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
// 160. Bulding Handler Factory Functions: Delete
exports.deleteReview = factory.deleteOne(Review);

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//     // 159. Implementing Simple Nested Routes
//     let filter = {};
//     if (req.params.tourId) filter = { tour: req.params.tourId };

//     const reviews = await Review.find(filter);
//     console.log(reviews);

//     // Można też tak (jeżeli jest wykorzystywana klasa APIFeatues)
//     // if (req.params.tourId) req.query = { tour: req.params.tourId };

//     // const features = new APIFeatures(Review.find(), req.query)
//     //     .filter()
//     //     .sort()
//     //     .limitFields()
//     //     .pagination();

//     // const reviews = await features.query;

//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         requestAt: req.requestTime,
//         results: reviews.length,
//         data: {
//             reviews
//         }
//     });
// });

// Refactoring in 162. Factory Functions: Reading
// exports.getReview = catchAsync(async (req, res, next) => {
//     const review = await Review.findById(req.params.id);

//     if (!review) {
//         return next(
//             new AppError(`No review found with that ID: ${req.params.id}`, 404)
//         );
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             review
//         }
//     });
// });

// Replace in 161.
// exports.createReview = catchAsync(async (req, res, next) => {
//     // 157. Implementing Simple Nested Routes
//     if (!req.body.tour) req.body.tour = req.params.tourId;
//     if (!req.body.user) req.body.user = req.user.id;

//     const newReview = await Review.create(req.body);

//     res.status(201).json({
//         status: 'success',
//         data: {
//             review: newReview
//         }
//     });
// });
