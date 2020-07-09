// 136. Password Reset Functionality: Setting New Password
const crypto = require('crypto');
// 131.
const { promisify } = require('util');
// 128. Signing up Users
const jwt = require('jsonwebtoken');
// 125. Creating New User
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// 135. Sending Email with Nodemiler
// Refactoring in 206. Email Templates with Pug: Welcome Email
const Email = require('./../utils/email');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// 137. Update The Current User: Password (refactoring)
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    // 141 Sending JWT via Cookie
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from the output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token, // 128. Signing up Users
        data: {
            user
        }
    });
};

// Register new user
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    //- 206. Email Templates with Pug
    const url = `${req.protocol}://${req.get('host')}`;
    await new Email(newUser, url).sendWelcome();

    // 137. Update The Current User: Password (refactoring)
    createSendToken(newUser, 201, res);
});

// 129. Logging in Users
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exist && pasword is correct
    const user = await User.findOne({ email }).select('+password'); // ponieważ w modelu wyłaczyliśmy pobieranie pola password musimy je w tym momencie włączyć

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3) If everything ok send token to client
    // 137. Update The Current User: Password (refactoring)
    createSendToken(user, 200, res);
});

// 130. Protecting Tour Routes Part 1
exports.protect = catchAsync(async (req, res, next) => {
    // 130. Protecting Tour Routes Part 1
    // 1) Getting token and check of it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt && req.cookies.jwt !== 'loggedout') {
        // 188. Logging in Users with Our API - Part 1
        // https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15065672#questions/7738096
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(
            new AppError(
                'Your are not logged in! Please log in to get access',
                401
            )
        );
    }

    // 131. Protecting Tour Routes Part 2
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 131. Protecting Tour Routes Part 2
    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError(
                'The user belonging to this user does not longer exists',
                401
            )
        );
    }

    // 131. Protecting Tour Routes Part 2
    // 4) Check if user changed password after the token issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
            new AppError(
                'User recently changed password! Please log in again.',
                401
            )
        );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// 188. Logging in Users with our API - Part 2
// Only for render pages, no shows any errors!
// Refactoring in 191. (tutaj nie ma być catchAsync)
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            // w szablonie pug jest dostęp do res.local
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }

    next();
};

// 191. Logging Out Users
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ status: 'success' });
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ex. ['admin', 'lead-guide]
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action',
                    403
                )
            );
        }

        next();
    };
};

// 134. Password Reset Functionality
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with email address.', 404));
    }

    // 2) Generated the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 207. Sending Password Reset Email
    // 3) Send it to user email
    try {
        const resetURL = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/users/resetPassword/${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError(
                'There was an error sending the email. Try again later!',
                500
            )
        );
    }
});

// 136. Password Reset Functionality: Setting New Password
exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based in the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2) if token has not expired, and thre is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 3) Update changePasswordAt property for the user
    // 4) Log the user in send JWT
    // 137. Update The Current User: Password (refactoring)
    createSendToken(user, 200, res);
});

// 137. Updating The Current User: Password
exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    // 2) Check if POSTed current password is correct
    if (
        !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
        return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) if so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});
