const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// 188. Logging in Users with Our API - Part 1
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
// 154. Creating and Getting Reviews
const reviewRouter = require('./routes/reviewRoutes');
const userRouter = require('./routes/userRoutes');
// 210. Integrating Stripe
const bookingRouter = require('./routes/bookingRoutes');
// 180. Setting up the Project Structure
const viewRouter = require('./routes/viewRoutes');

// Start express app
const app = express();

// 175. Setting Up Pug in Express
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARE
// Serving static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// 143 Setting Security HTTP Headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
    // Logging request
    app.use(morgan('dev'));
}

// 142 Implementing Rate Limiting
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
});
app.use('/api/', limiter);

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
// 194. Updating User Data
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// 188. Logging in Users with Our API - Part 1
app.use(cookieParser());

// 144 Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// 144 Data Sanitization against XSS
app.use(xss());

// 145. Preventing Parameter Pollution
app.use(
    hpp({
        whitelist: [
            'duration',
            'maxGroupSize',
            'ratingsAverage',
            'ratingsQuantity',
            'difficulty',
            'price'
        ]
    })
);

// Test middleware function
app.use((req, res, next) => {
    // dodaje właściwośc requestTime do obiektu req
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);

    next();
});

// 3) ROUTERS
// Mounting multiple routers
// 180. Setting up the Project Structure
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
