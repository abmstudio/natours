const mongoose = require('mongoose');
// 160. Bulding Handler Factory Functions: Delete
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.getAll = Model =>
    catchAsync(async (req, res, next) => {
        // To allow for nested GET reviews on tour
        if (req.params.tourId) req.query = { tour: req.params.tourId };

        // EXECUTE QUERY
        const features = new APIFeatures(Model.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .pagination();

        // 166. Improving Read Performance with Indexes
        // const doc = await features.query.explain();
        const doc = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            requestAt: req.requestTime,
            results: doc.length,
            data: {
                data: doc
            }
        });
    });

exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(
                new AppError(
                    `No document found with that ID:${req.params.id}`,
                    404
                )
            );
        }
        res.status(204).json({
            status: 'success',
            data: null
        });
    });

// 161. Factory Functions: Update and Create
exports.updateOne = Model =>
    catchAsync(async (req, res, next) => {
        // wyszukiwanie na podstawie id lub slug
        const isObjectId = mongoose.Types.ObjectId.isValid;
        const options = {
            new: true, // return the modifed document
            runValidators: true
        };

        let query;
        if (isObjectId(req.params.id)) {
            query = Model.findByIdAndUpdate(req.params.id, req.body, options);
        } else {
            query = Model.findOneAndUpdate(
                { slug: req.params.id },
                req.body,
                options
            );
        }

        const doc = await query;

        if (!doc) {
            return next(
                new AppError(
                    `No document found with that ID:${req.params.id}`,
                    404
                )
            );
        }

        res.status(200).json({
            status: 'success',
            data: {
                // [Model.collection.collectionName]: doc
                data: doc
            }
        });
    });

// 161. Factory Functions: Update and Create
exports.createOne = Model =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body); // odwołuje się bezpośrednio do klasy modelu

        // status 201 = created
        res.status(201).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });

// 162. Factory Functions: Readings
exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {
        // wyszukiwanie na podstawie id lub slug
        const isObjectId = mongoose.Types.ObjectId.isValid;
        let query;
        if (isObjectId(req.params.id)) {
            query = Model.findById(req.params.id);
        } else {
            query = Model.findOne({ slug: req.params.id });
        }

        if (popOptions) query = query.populate(popOptions);

        const doc = await query;

        if (!doc) {
            return next(
                new AppError(
                    `No document found with that ID:${req.params.id}`,
                    404
                )
            );
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });
