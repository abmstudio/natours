const { mkdir } = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
// 160. Bulding Handler Factory Functions
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

// Implementation in AWS S3
// https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15087360#questions/8512756

// 203. Uploading Multiple Images: Tours
// 201. Resizing Images
const multerStorage = multer.memoryStorage();

// 203. Uploading Multiple Images: Tours
// 199. Configuring Multer
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only image.', 400), false);
    }
};

// 203. Uploading Multiple Images: Tours
// 199. Configuring Multer
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// 203. Uploading Multiple Images: Tours
// upload.single('image') req.file
// upload.array('images', 5) req.files
// upload.fields([{},{},{}]) req.files
exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

// 204. Processing Multiple Images
exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    const dir = `public/img/tours/${req.params.id}`;

    mkdir(dir, { recursive: true }, err => {
        if (err) throw err;
    });

    // 1) Cover image
    req.body.imageCover = `cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`${dir}/${req.body.imageCover}`);

    // 2) Images
    req.body.images = [];

    // 204. Processing Multiple Images
    // !!! time: 10:30s
    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i +
                1}.jpeg`;

            await sharp(req.files.images[i].buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`${dir}/${filename}`);

            req.body.images.push(filename);
        })
    );

    console.log(req.body.images);
    next();
});

exports.aliasTopCheapestTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = 'price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

    next();
};

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

    next();
};

// 162. Factory Functions: Reading
exports.getAllTours = factory.getAll(Tour);
// 162. Factory Functions: Reading
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// 161. Factory Functions: Update and Create
exports.updateTour = factory.updateOne(Tour);
// 161. Factory Functions: Update and Create
exports.createTour = factory.createOne(Tour);
// 160. Bulding Handler Factory Functions: Delete
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    // https://docs.mongodb.com/manual/aggregation/
    const stats = await Tour.aggregate([
        {
            $match: {
                // select documents WHERE ratingsAverage >= 4
                ratingsAverage: {
                    $gte: 4
                }
            }
        },
        {
            $group: {
                //_id: null, // wszystkie dokumenty
                //_id: '$difficulty', // pogrupowane wg pola difficulty
                // _id: '$ratingsAverage', // pogrupowane wg pola ratingsAverage
                _id: { $toUpper: '$difficulty' }, // pogrupowane wg pola difficulty
                numTours: {
                    $sum: 1
                },
                numRatings: {
                    $sum: '$ratingsQuantity'
                },
                avgRating: {
                    $avg: '$ratingsAverage'
                },
                avgPrice: {
                    $avg: '$price'
                },
                minPrice: {
                    $min: '$price'
                },
                maxPrice: {
                    $max: '$price'
                }
            }
        },
        {
            $sort: {
                // 1 = ASC
                avgPrice: 1
            }
        }
        // {
        //     $match: {
        //         _id: {
        //             $ne: 'EASY'
        //         }
        //     }
        // }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    // Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        {
            // startDates zawiera tablice dat
            // rozwiewam dokumnety by dla kazdej daty był osobny dokument
            $unwind: '$startDates'
        },
        {
            // wybieram tylko te dokumnty któr są w przedziale
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                // grupuje wg miesiąca
                _id: {
                    $month: '$startDates'
                },
                // zliczam ile w miesiącu
                numToursStarts: {
                    $sum: 1
                },
                // tworzę tablicę z nazwami
                tours: {
                    $push: {
                        id: '$_id',
                        name: '$name',
                        stardDate: '$startDates'
                    }
                }
            }
        },
        {
            // dodaje pole o nazwie month i wartości z pola $_id
            $addFields: { month: '$_id' }
        },
        {
            // ukrywam pole _id
            $project: {
                _id: 0
            }
        },
        {
            // Sortowanie
            $sort: {
                month: 1
            }
        },
        {
            // Paginacja
            $skip: skip
        },
        {
            // Limit rezultatów
            $limit: limit
        }
    ]);

    res.status(200).json({
        status: 'success',
        results: plan.length,
        data: {
            plan
        }
    });
});

// 170. Geospatial Queries: Finding Tours Within Radius
// /tours-within/:distance/center/:latlng/unit/:unit
// tours-within/233/center/-40,45/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    // mongodb wymaga radius w formacie radians
    // https://docs.mongodb.com/manual/reference/operator/query/centerSphere/
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format: lat,lng',
                400
            )
        );
    }

    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        requestAt: req.requestTime,
        data: {
            data: tours
        }
    });
});

// 171. Geospatial Aggregation: Calculating Distance
// '/distances/:latlng/unit/:unit'
exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        next(
            new AppError(
                'Please provide latitude and longitude in the format: lat,lng',
                400
            )
        );
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        requestAt: req.requestTime,
        data: {
            data: distances
        }
    });
});

// exports.getAllTours = catchAsync(async (req, res, next) => {
//     // EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .pagination();

//     const tours = await features.query;

//     // SEND RESPONSE
//     res.status(200).json({
//         status: 'success',
//         requestAt: req.requestTime,
//         results: tours.length,
//         data: {
//             tours
//         }
//     });
// });

// Get Single Tour
// Refactoring in 162.
// exports.getTour = catchAsync(async (req, res, next) => {
// Refactoring in 152.
// findById() is shorthand of Tour.findOne({ _id: req.params.id})
// const tour = await Tour.findById(req.params.id);

// 152. Populating Tour Gides
// na podstawie referencji przechowywanych w guides (przewodnicy)
// pobierze dane użytkowników
// const tour = await Tour.findById(req.params.id).populate({
//     path: 'guides', // gdzie przechowywane są referencje
//     select: '-__v -passwordChangedAt' // których pól nie pobierać
// });

// Refactoring in 152
// przeniesiona do query middleware i tam załatwia sprawę dla wszystkich query /^find/
// const tour = await Tour.findById(req.params.id);

// 156. Virtual Populate: Tours and Review
//     const tour = await Tour.findById(req.params.id).populate('reviews');

//     if (!tour) {
//         return next(
//             new AppError(`No tour found with that ID:${req.params.id}`, 404)
//         );
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });
// });

// Refactoring in 161.
// exports.createTour = catchAsync(async (req, res, next) => {
//     const newTour = await Tour.create(req.body); // odwołuje się bezpośrednio do klasy modelu

//     // status 201 = created
//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newTour
//         }
//     });
// });

// Refactoring in 161.
// exports.updateTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//         new: true, // return the modifed document
//         runValidators: true
//     });

//     if (!tour) {
//         return next(
//             new AppError(`No tour found with that ID:${req.params.id}`, 404)
//         );
//     }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour
//         }
//     });
// });

// Refactoring in 160.
// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//         return next(
//             new AppError(`No tour found with that ID:${req.params.id}`, 404)
//         );
//     }
//     res.status(204).json({
//         status: 'success',
//         data: null
//     });
// });
