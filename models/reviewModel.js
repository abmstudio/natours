// 153. Modeling Reviews: Parent Referencing
const mongoose = require('mongoose');
// 167. Calculating Average Rating on Tours - Part 1
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            trim: true,
            required: [true, 'Review can not be empty!'],
            maxlength: [
                1024,
                'A review must have less or equal then 1024 characters'
            ],
            minlength: [
                16,
                'A review must have more or equal then 32 characters'
            ]
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour.']
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user.']
        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// 155. Populating Reviews
reviewSchema.pre(/^find/, function(next) {
    // Refactoring in 156. Virtual Populate: Tours and Review
    // w tym przypadku nie potrzebujemy populate dla własciwości tour
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // });

    // 156. Virtual Populate: Tours and Review
    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next();
});

// 169. Peventing Duplicate Reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// 167. Calculating Average Rating on Tours - Part 1
// static methods
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            // select documents WHERE tour = tourId
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    // console.log(stats);

    // stats is an array e.g. [{_id: 123asd34, nRating: 5, avgRating: 3}] because stats[0]
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

// 167. Calculating Average Rating on Tours - Part 1
reviewSchema.post('save', function() {
    // this points to current review
    this.constructor.calcAverageRatings(this.tour);
});

// 168. Calculating Average Rating on Tours - Part 2
// w przypadku aktualizacji lub usunięcia review
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne();
    // console.log(this.r);

    next();
});

// 168. Calculating Average Rating on Tours - Part 2
reviewSchema.post(/^findOneAnd/, async function() {
    // await this.findOne(); does NOT work here, query has alredy executed
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
