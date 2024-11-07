const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const catchAsync = require('../utils/catchAsync');
const filterBody = require('./../utils/fileBodyRquiredFieldsOnly');
const User = require('./../models/userModel');
const {
  deleteOne,
  createOne,
  getOne,
  getAll
} = require('./../controllers/factoryHandler');
const SetAppError = require('../utils/errorConfig');

// const avatarsStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dest = path.join(__dirname, '../public/img/users');
//     cb(null, dest);
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });
// note: use 'memoryStorage' to got buffer which can be then resize and more (req.file.buffer now is available to use)
const avatarsBuffer = multer.memoryStorage();

// note: check/filter the type of the input image
const filterImageType = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error("This is not an image. Just don't."));
  }
};

// configure multer
const upload = multer({
  storage: avatarsBuffer,
  fileFilter: filterImageType
});

// middleware
exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(100, 100)
    .toFormat('jpeg')
    .jpeg({ quality: 100 })
    .toFile(path.join(__dirname, `../public/img/users/${req.file.filename}`));

  next();
});

// GET =====================================
exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// POST =====================================
exports.createUser = createOne(User);

// PATCH =====================================
exports.getImage = upload.single('photo');
exports.updateUserActivityData = catchAsync(async (req, res, next) => {
  const { role, active } = req.body;

  // 1. sanitize/filter/check body
  const requiredFieldsOnly = filterBody(req.body, 'role', 'active');
  if (Object.keys(requiredFieldsOnly).length === 0) {
    return next(new SetAppError("You didn't include any fields to change."));
  }

  // 2. current user
  const currentUser = await User.findById(req.user.id);

  // 3. logic
  if (currentUser.role === 'leader' && role === 'admin') {
    return next(new SetAppError("You can't do this."));
  }

  // 4. if all right
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    requiredFieldsOnly,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(201).json({
    status: 'Successfully updated user.',
    data: {
      updatedUser
    }
  });
});
exports.updateMe = catchAsync(async (req, res, next) => {
  try {
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400
        )
      );
    }

    const filteredBody = filterBody(req.body, 'name', 'email');
    // note: 'req.file' is now the our 'multer.diskStorage()' we set before, so we have both (destination and filename)
    req.file && (filteredBody.photo = req.file.filename);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        runValidators: true,
        new: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        updatedUser
      }
    });
  } catch (err) {
    return next(new SetAppError(err, 400));
  }
});

// DELETE =====================================
exports.deleteUser = deleteOne(User);
exports.deleteCurrentUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);

  res.status(204).json({
    status: 'Successfully deleted current user.',
    data: null
  });
});
// & Delete current user (make it inactive)
exports.disableMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
