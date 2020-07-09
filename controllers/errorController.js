const AppError = require('./../utils/appError');

// obsługa błędnego identyfikatora dokumnetu
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;

    return new AppError(message, 400);
};

// obsługa zduplikowanej nazwy
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];

    const message = `Duplicate field value ${value}. Pleas use another value!`;

    return new AppError(message, 400);
};

// Obsługa błędów walidacji
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid input data. ${errors.join('. ')}`;

    return new AppError(message, 400);
};

// 131. Protecting Tour Routes - Part 2
// Obsługa błedów tokena
const handleJWTError = () =>
    new AppError('Invalid token. Pleas log in again', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired! Please log in again', 401);

const sendErrorDev = (err, res, req) => {
    // 192. Rendering Error Pages
    // API
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: `😈  ${err.message}`,
            error: err,
            stack: err.stack
        });
    }
    // RENDERED WEBSITE
    console.log('😈 ERROR:', err);

    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        meta: {
            description: 'Something went wrong!'
        },
        msg: err.message
    });
};

const sendErrorProd = (err, res, req) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: `😈  ${err.message}`
            });
        }
        // Programming or other unknow error: dont't leak error details
        // 1) Log error
        console.log('😈 ERROR:', err);

        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }

    // RENDERED WEBSITE
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            meta: {
                description: 'Something went wrong!'
            },
            msg: err.message
        });
    }
    // Programming or other unknow error: dont't leak error details
    // 1) Log error
    console.log('😈 ERROR:', err);

    // 2) Send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        meta: {
            description: 'Something went wrong!'
        },
        msg: 'Please try again later.'
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res, req);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;

        // TODO
        // add logs to database

        if (error.name === 'CastError') {
            error = handleCastErrorDB(error);
        }
        if (error.code === 11000) {
            error = handleDuplicateFieldsDB(error);
        }

        if (error.name === 'ValidationError') {
            error = handleValidationErrorDB(error);
        }

        if (error.name === 'JsonWebTokenError') {
            error = handleJWTError();
        }

        if (error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        }

        sendErrorProd(error, res, req);
    }
};
