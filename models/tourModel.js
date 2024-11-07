const { model, Schema } = require('mongoose');
const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');

// specify our schema for the data and also doing some validation
const tourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name.'], // Validator
      maxlength: [40, 'A tour name must have less or equal to 40 characters.'],
      minlength: [5, 'A tour name must have more or equal to 10 characters.'] // max/minlength work only for Strings | Validator
      // validate: [validator.isAlpha, 'Name must contain only letters.']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is ether: easy, medium or difficult'
      } // this is only for strings | Validator
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0.'],
      max: [5, 'Rating must be below 5.0.'], // min/max - working with numbers, dates | Validator
      set: (val) => Math.round(val * 10) / 10 // 4.66666 > 46.6666 > 46 > 4.6
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      default: 2000,
      // this only points to current doc on NEW document creation
      validate: {
        validator: function (val) {
          return val <= 3000;
        },
        message:
          "The {VALUE}$ price for the tour is too big, no one's gonna buy it."
      }
    },
    priceDiscount: {
      type: Number
      // this only points to current doc on NEW document creation
      // validate: {
      //   validator: function (val) {
      //     return this.price > val;
      //   },
      //   message: "The 'discountPrice' must be lower than the actual price."
      // }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary description.']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover image.']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now()
    },
    startDates: [Date],
    secretParameter: {
      // the parameter will stil appear in the postman because we have it in our schema, but not in the compass DB where the actual data is saved
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: { type: [Number] },
      adress: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: { type: [Number] },
        adress: String,
        description: String,
        day: Number
      }
    ],
    guides: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// info: INDEXING - helps to query data very quickly by allowing MongoDB to search using pointers to the respective documents, rather than scanning the entire collection, also we can specify the unique indexes which can prevent duplication
// note: Indexing also requires additional space, which can become an issue when querying large amounts of data. (so be afraid)
tourSchema.index({ price: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// tourSchema.virtual('MDL').get(function () {
//   return this.price * 17.68;
// });

// & Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// & Query Middleware
tourSchema.pre(/^find/, function (next) {
  // info: this will match to all of the methods that use 'find' and the beginning (e.g. findById, findOneAndUpdate, ...)
  // info: tourSchema.pre('find', function (next) { this will be working only for the 'find'
  this.find({ secretParameter: { $ne: true } });
  // this.start = Date.now();

  // this.populate({
  //   path: 'guides',
  //   select: '-__v'
  // });

  next();
});
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });

  next();
});

// & Aggregation Middleware
// info: this thing we do when we want to add some additional stage 'operators' into most of the functions at once, so we do it with 'pre-hook' to the 'aggregate' pipeline, so it would fire on 'aggregate' method
// tourSchema.pre('aggregate', function (next) {
//   // exclude the 'secretParameter' form all of the aggregation method that we use in our controllers
//   this.pipeline().unshift({
//     $match: {
//       secretParameter: {
//         $ne: true
//       }
//     }
//   });

//   // this is the pipeline that we just set/change
//   console.log(this.pipeline());
//   next();
// });

tourSchema.pre('aggregate', function (next) {
  // const pipeline = this.pipeline();
  // info: remove the id from the aggregate before it saves to db
  // pipeline.push({
  //   $addFields: {
  //     name: '$_id'
  //   }
  // });
  // pipeline.push({
  //   $project: {
  //     name: 1,
  //     imageCount: 1,
  //     images: 1,
  //     _id: 0
  //   }
  // });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });

  next();
});

// & Document Middleware: runs before .save() and .create(), but not before .insertMany(), .findAndUpdate(), find()
// 'save' - hook;
// info: Pre-Hooks: useful for data validation, transformation or setting the default values
// tourSchema.pre('save', async function (next) {
//   // slug
//   this.slug = slugify(this.name, { lower: true });

//   // map guides
//   if (Array.isArray(this.guides)) {
//     const guidesPromises = this.guides.map(async (id) => {
//       return await User.findById(id);
//     });
//     this.guides = await Promise.all(guidesPromises);
//   }

//   next(); // this will call the next middleware
// });

// & we can use multiple middleware with the 'save' hook
// tourSchema.pre('save', function (next) {
//   console.log('About to save doc...');
//   next();
// });

// & Document Middleware: runs after all the middleware functions have completed
// info: Post-Hooks: useful for logging, sending notifications, or cleaning up resources
tourSchema.post('save', (doc) => {
  // get not only the next but also the document that was just saved to the DB
  // console.log('name:', doc.name);
});

// info: Error-Handling Middleware: Handles errors that occur during the execution of pre- or post-hooks. Provides a way to catch and manage errors.
tourSchema.post('save', function (error, doc) {
  // access to 'doc'
  // handle error if something is bad => next(error);
});

// create modal for the schema
const Tour = model('Tour', tourSchema);

module.exports = Tour;
