// MongoDB driver
const mongoose = require('mongoose');
// Slugify
const slugify = require('slugify');

// Validator
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [
                40,
                'A tour name must have less or equal then 40 characters'
            ],
            minlength: [
                10,
                'A tour name must have more or equal then 10 characters'
            ]
            // validate: [
            //     validator.isAlpha,
            //     'Tour name must only containe characters'
            // ]
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: ['easy', 'medium', 'difficult'],
            message: 'Dificulty is either: easy, medium, difficulty'
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be above 1.0'],
            max: [5, 'Rating must be below 5.0'],
            // 169. Preventing Duplicate Reviews
            set: val => Math.round(val * 10) / 10
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour must have a price']
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function(val) {
                    // this only points to current doc on NEW document create
                    return val < this.price;
                },
                message: 'Discount price ({VALUE}) shoud be below regular price'
            }
        },
        summary: {
            type: String,
            required: [true, 'A tour must have a description'],
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover image']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false // nie będzie pobierane do wyświetlania
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            // 149 Moddeling Locations (Geospatial Data)
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],
        // 150. Modeling Tour Guides: Embedding
        // to było wykorzystane do demonstracji
        // guides: Array

        // 151. Modeling Tour Guides: Child Referencing
        guides: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            }
        ]
    },
    // Schema Options Object
    {
        // Add virtual property to output
        toJSON: { virtuals: true },
        // Add virtual property to object
        toObject: { virtuals: true }
    }
);

// 166. Improving Read Performance with Indexes
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// 170. Geospatial Queries: Finding Tours Within Radius
tourSchema.index({ startLocation: '2dsphere' });

// Virtual Fields
// używamy gdy przeliczamy wartosci np zamieniamy dni na tygodnie, mile na km itp
// virtualne właściwości nie moge stanowić częsci zapytania gdyż fizycznie nie zajduja sie w DB
// Używamy regularnej funcji gdyż arrow function zmienia this!
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});

// 156. Virtual Populate: Tours and Reviews
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

//////////////////////////////////
// Mongoose Document Middleware

// tzw Pre Save Hook / Pre Save Middleware
// zawsze musi znaleźć się next()
// kolejność wykonywania zgodnie z kolejnością definicji (kodu)
// wykona się przed save() and create() ale nie przed insertMany, update, itd...!
tourSchema.pre('save', function(next) {
    // this wskazuje na aktualnie przetwarzany dokument
    // console.log(this);

    // definiowana właściwośc musi znajdować się w Schema
    // jezeli nie ma w Schema nie zostanie dodana
    this.slug = slugify(this.name, { lower: true });
    next();
});

// 150. Modeling Tour Guides: Embedding
// Wstawia obiekt User do dokumentu Tour
// w tym przypadku nie jest to jednak dobre rozwiązanie
// np. jeżeli przewodnik (guide) zmieni adres email to nie będzie to miało
// odzwierciedlenia w dokumencie Tour (chyba że to zostanie jakoś zaimplementowane)
// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// tourSchema.pre('save', function(next) {
//     console.log('Will save document...');
//     next();
// });

// // wykona sie po ostatnim .pre()
// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// });

//////////////////////////////////
// Mongoose Query Middleware
// słowo kluczowe 'find'
// wykona się przed wykonaniem query tym samym definiując
// ze w wynikach nie bedzie dokumnetów secretTour: true
// wyrazenie regularne /^find/ jedna funkcja obsluguje find, findOne, findById...
tourSchema.pre(/^find/, function(next) {
    // this wskazuje na query object
    // chce by przy wyświetlaniu nie były brane pod uwagę dokumnety z secretTour równym true
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();

    next();
});

// 152. Populating tour guides
// dla wszystkich zapytań find... automatycznie pobiera dane użytkowników
// na podstawie referencji przechowywanych w guides (przewodnicy)
tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides', // gdzie przechowywane są referencje
        select: '-__v -passwordChangedAt' // których pól nie pobierać
    });

    next();
});

// tourSchema.post(/^find/, function(docs, next) {
//     /// this wskazuje na query object
//     console.log(`Query took: ${Date.now() - this.start} miliseconds`);
//     //console.log(docs);

//     next();
// });

//////////////////////////////////
// Mongoose Aggregation Middleware
// Comment in 171. Geospatial Aggregation: Calculating Distances
// funkcja aggregująca getDistances nie może wykonywać się po
// żadnej innej funkcji agregującej

// tourSchema.pre('aggregate', function(next) {
//     // this wskazuje aktualny aggregation object
//     // console.log(this.pipeline());

//     // secretTour:true nie będzie brany pod uwagę równiez w wynikach zagregowanych
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//     console.log(this.pipeline());

//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
