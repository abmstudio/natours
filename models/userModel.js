// 134. Password Reset Functionality
const crypto = require('crypto');

// 124. Modelling Users
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Pleas tell us your name!'],
        trim: true,
        minlength: [3, 'User name must have more or equal then 3 characters'],
        maxlength: [32, 'User name must have less or equal then 32 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    // 133. Authorization: User Roles and Permission
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false // 129. Logging in Users (ukrycie pola we wszystkich wynikach wyszukiwania)
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        // 126. Managing Password
        validate: {
            // This only works on CREATE and SAVE!!!
            validator: function(el) {
                return el === this.password;
            },
            message: 'Password are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    // 139 Deleting the Current User
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

// 126. Managing Password
userSchema.pre('save', async function(next) {
    // jeżeli hasło nie jest modyfikowane
    // przejdz do nastepnej funkcji middleware
    if (!this.isModified('password')) return next();

    // Hash the password with coast of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;

    next();
});

// 136. Password Reset Functionality: Setting New Password
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// 139 Deleting the Current User
// zostaną uwzględnieni tylko użytkownicy z active != false
// również nie zalogują się z active != false
userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
    next();
});

// 129. Logging in Users
userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// 131. Protecting Tour Routes Part 2
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }

    // False means not changed
    return false;
};

// 134. Password Reset Functionality
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minut

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
