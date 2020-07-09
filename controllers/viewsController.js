const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
// 214. Rendering a User's Booked tour
const Booking = require('./../models/bookingModel');
const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
// 192 Rendering Error Page
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build template

    // 3) Render that template using tour data from 1
    res.status(200).render('overview', {
        title: 'All Tours',
        meta: {
            description: 'Natours - All Tours'
        },
        tours
    });
});

// 183. Building the Tour Page - Part 1
exports.getTour = catchAsync(async (req, res, next) => {
    // 1) Get the data for the requested tour (include reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    // 192. Rendering Error Pages
    if (!tour) {
        return next(new AppError('Ther is no tour that name.', 404));
    }
    // 2) Build template
    // 3) render that template using data from 1
    res.status(200).render('tour', {
        title: `${tour.name} tour`,
        meta: {
            description: tour.summary
        },
        tour,
        map: {
            options: {
                scrollZoom: false
            },
            bounds: {
                padding: {
                    top: 200,
                    bottom: 150,
                    left: 100,
                    right: 100
                },
                duration: 5000
            }
        }
    });
});

exports.getTours = catchAsync(async (req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find(
        {},
        {
            name: 1,
            startLocation: 1,
            duration: 1
        }
    );
    const locations = tours.map(tour => {
        return tour.startLocation;
    });

    // 2) Build template
    // 3) render that template using data from 1
    res.status(200).render('toursmap', {
        title: `Tours map`,
        meta: {
            description: 'Tours map'
        },
        tours: {
            locations
        },
        map: {
            options: {
                scrollZoom: true,
                dupa: true
            }
        }
    });
});

exports.getAccount = catchAsync(async (req, res, next) => {
    res.status(200).render('account', {
        title: 'Your account',
        meta: {
            description: 'Account'
        }
    });
});

// 214. Rendering a User's Booked tour
exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });

    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
        title: 'My Tours',
        meta: {
            description: 'Natours - My Tours'
        },
        tours
    });
});

exports.getMyReviews = catchAsync(async (req, res, next) => {
    // 1) Find all reviews
    const reviews = await Review.find({ user: req.user.id });

    // // 2) Find tours with the returned IDs
    const tourIDs = reviews.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
        title: 'My Reviews',
        meta: {
            description: 'Natours - My Reviews'
        },
        tours,
        reviews
    });
});

// 187. Building the Login Screen
exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account',
        meta: {
            description: 'Login Page'
        }
    });
};

// 187. Building the Login Screen
exports.getSignUpForm = (req, res) => {
    res.status(200).render('signup', {
        title: 'Create your account',
        meta: {
            description: 'Sign Up Page'
        }
    });
};

// 194. Update User Data
exports.updateUserData = catchAsync(async (req, res, next) => {
    const updateUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email
        },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).render('account', {
        title: 'Your account',
        meta: {
            description: 'Account'
        },
        user: updateUser
    });
});
