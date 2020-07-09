const fs = require('fs');
// 199. Configuring Multer
const multer = require('multer');
// 200. Resizing Images
const sharp = require('sharp');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
// 160. Bulding Handler Factory Functions
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
    const newObject = {};

    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) {
            newObject[el] = obj[el];
        }
    });

    return newObject;
};

// Function for deleting photos, after uploading a new one.
// https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15087356#questions/8996718
const deleteUserPhoto = async (path, photo) => {
    if (photo.startsWith('default')) return;

    const file = `${__dirname}/../${path}/${photo}`;

    await fs.unlink(file, err => {
        if (err) return;

        console.log(`File ${path}/${photo} has been deleted from the server.`);
    });
};

// Zapisuje pliki w folderze o nazwie = id użytkownila
// Dynamically change multer destination folder
// https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15087348#questions/8209384
// const mkdirp = require('mkdirp')
//
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const path = `/images/${req.user._id}/`
//     mkdirp(path, err => {
//         if (err) return cb(err)
//         else cb(null, path)
//     });
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.fieldname + '-' + Date.now())
//   }
// })
// const upload = multer({ storage: storage })

// 199. Configuring Multer
// Refactoring in 201 Resizing Images
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         // user-user_id-timestamp.jpeg
//         // user-39ad9485cf4f-1324348347.jpeg
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

// 201. Resizing Images
const multerStorage = multer.memoryStorage();

// 199. Configuring Multer
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only image.', 400), false);
    }
};

// 199. Configuring Multer
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// 199. Configuring Multer
exports.uploadUserPhoto = upload.single('photo');

// 201. Resizing Images
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    if (req.file.size > process.env.MAX_IMAGE_UPLOAD_SIZE) {
        return next(
            new AppError(
                'Image too large, you can upload files up to 1 MB',
                413
            )
        );
    }

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

// 163. Adding a /me endpoint
// funkcja middleware przypisująca id zalogowanego użytkownika
// id o które będziemy pytać
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;

    next();
};

// 138
exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        );
    }
    // 2) Filtered out unwanted fields name
    const filteredBody = filterObj(req.body, 'name', 'email'); // pola dozwolona do aktualizcji

    // 200. Saving Image Name to Datebase
    if (req.file) filteredBody.photo = req.file.filename;

    // 3) If uploading new photo, delete the old one from the server.
    if (req.file) await deleteUserPhoto('public/img/users', req.user.photo);

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        data: updatedUser
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined! Please use /signup instead'
    });
};

// 162. Factory Functions: Reading
exports.getAllUsers = factory.getAll(User);
// 160., 162.,162.
exports.getUser = factory.getOne(User);
// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

// Refactoring in 162.
// exports.getAllUsers = catchAsync(async (req, res) => {
//     const users = await User.find();

//     res.status(200).json({
//         status: 'success',
//         results: users.length,
//         data: {
//             users
//         }
//     });
// });
