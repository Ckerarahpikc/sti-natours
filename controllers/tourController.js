const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const Tour = require('../models/tourModel');
const User = require('./../models/userModel');
const SetAppError = require('../utils/errorConfig');
const SortTours = require('../utils/sorted-tours');
const catchAsync = require('../utils/catchAsync');

const {
  getAll,
  deleteOne,
  createOne,
  updateOne,
  getOne
} = require('./factoryHandler');

const imageBuffer = multer.memoryStorage();

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
  storage: imageBuffer,
  fileFilter: filterImageType
});

// * middle
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log('files:', req.files.images);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1. IMAGE COVER
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 100 })
    .toFile(path.join(__dirname, `../public/img/tours/${req.body.imageCover}`));

  // 2. IMAGES
  req.body.images = []; // initial setting

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const fileNameImages = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 100 })
        .toFile(path.join(__dirname, `../public/img/tours/${fileNameImages}`));

      req.body.images.push(fileNameImages);
    })
  );

  next();
});
exports.checkUpdatedTour = (req, res, next) => {
  // info: Checking tour emptyness
  // if the body is empty
  if (Object.entries(req.body).length === 0) {
    return res.status(400).json({
      status: 'bad request',
      data: 'Could not found any data to change to.'
    });
  }
  next();
};
exports.aliasTopTours = (req, res, next) => {
  // info: Sorting top 5 queries
  // top five tours
  const bestFive = new SortTours(req.query);
  req.query = bestFive.sortRandom(); // topFive();
  next();
};

// GET =====================================
exports.getAllTours = getAll(Tour);
exports.getTourById = getOne(Tour, [
  { path: 'reviews', select: '-__v' },
  { path: 'guides', select: '_id name role' }
]);
exports.getTourStats = catchAsync(async (req, res, next) => {
  // info: Getting tour statistics
  // it's important to 'await' the aggregate to get the result
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.2 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // uppercase
        numTours: { $sum: 1 }, // this will a 1 for each tour
        totalRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        // TODO: check if you can 'avg' the array here and not only the string (no)
        avgPrice: { $avg: '$price' }
      }
    },
    {
      $sort: { avgPrice: -1 }
    }
    // {
    // $match: { _id: { $ne: 'EASY' } } // all but not 'easy' ones
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
  // info: Getting monthly plan
  const year = req.params.year * 1; // get the year from the query
  const plan = await Tour.aggregate([
    {
      // unwind the array
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        nameTour: { $push: '$name' },
        numToursStarts: { $sum: 1 }
      }
    },
    {
      $addFields: {
        // adding new field 'month'
        month: {
          // concat elements
          $concat: [
            // convert the month number to string
            { $toString: '$_id' },
            ' - ',
            {
              $arrayElemAt: [
                [
                  'January',
                  'February',
                  'March',
                  'April',
                  'May',
                  'June',
                  'July',
                  'August',
                  'September',
                  'Octomber',
                  'November',
                  'December'
                ],
                { $subtract: ['$_id', 1] } // subtract 1 from the index  as it starts with 0
              ]
            }
          ]
        }
      }
    },
    {
      // sort by ascender (id)
      $sort: { _id: 1 }
    },
    {
      // remove the id
      $unset: '_id' // somehow is like $project
    }
    // {
    //   $limit: 5 // only shows 5 (cutting the other)
    // }
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan
    }
  });
});
exports.getTest = catchAsync(async (req, res, next) => {
  // info: Just testing
  const test = await Tour.aggregate([
    // unwind
    {
      $unwind: '$images'
    },

    // match
    // {
    //   $match: {
    //     // images: {
    //     //   $size: 3
    //     // }
    //     // ratingsAverage: {
    //     //   $gte: 4.7,
    //     //   $lte: 5
    //     // }
    //   }
    // },

    // group
    {
      $group: {
        _id: '$name',
        image: { $push: '$images' },
        price: { $first: '$price' },
        name: { $first: '$name' }
      }
    },

    // addFields
    // {
    //   $addFields: {}
    // },

    // project
    {
      $project: {
        _id: 0,
        name: 1,
        price: 1,
        amountImages: {
          $cond: {
            if: { $isArray: '$image' },
            then: { $size: '$image' },
            else: 0
          }
        }
      }
    },
    {
      $sort: {
        price: -1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      test
    }
  });
});
exports.getUserTours = catchAsync(async (req, res, next) => {
  // info: Getting some user tours
  const { id } = req.params;
  const tours = await Tour.find({ guides: { $in: id } }).select('-guides');
  if (tours.length < 1)
    return next(new SetAppError('There is not tours for this user.', 100));

  const user = await User.findById(id);
  const userTours = {
    ...user.toObject(),
    tours
  };

  res.status(200).json({
    status: 'Successfully retrieved tours',
    data: {
      user: userTours
    }
  });
});
// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/200/center/-80,25/unit/km
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, lnglat, unit } = req.params;
  const [lng, lat] = lnglat.split(',');

  if (!lat || !lng) {
    return next(
      SetAppError(
        "Please include longitude and latitude or else I'm gonna kill everyone U ever loved ;)",
        400
      )
    );
  }

  // calculate the radius
  const radius = unit === 'km' ? distance / 6378.1 : distance / 3963.2;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] }
    }
  });

  res.status(200).json({
    results: tours.length,
    data: {
      tours
    }
  });
});
exports.getDistances = catchAsync(async (req, res, next) => {
  const { lnglat, unit } = req.params;
  const [lng, lat] = lnglat.split(',');

  if (!lat || !lng) {
    return next(
      SetAppError(
        "Please include longitude and latitude or else I'm gonna kill everyone U ever loved ;)",
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
        distanceMultiplier:
          unit === 'mi' || unit === 'km'
            ? unit === 'mi'
              ? 0.000621371
              : 0.001
            : 0
      }
    },
    {
      $project: {
        name: 1,
        distance: { $concat: [{ $toString: { $round: '$distance' } }, unit] }
      }
    }
  ]);

  res.status(200).json({
    distances: distances.length,
    data: {
      distances
    }
  });
});

// POST =====================================
exports.createTour = createOne(Tour);

// PATCH =====================================
exports.updateTour = updateOne(Tour);

// DELETE =====================================
exports.deleteTour = deleteOne(Tour);
