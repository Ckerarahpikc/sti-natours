const { Schema, model } = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new Schema(
  {
    review: {
      type: String
    },
    rating: {
      type: Number,
      max: 5,
      min: 1
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour'
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false
  }
);

reviewSchema.index({ user: 1, tour: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: '-__v'
  // }).populate({
  //   path: 'user',
  //   select: '-__v'
  // });

  // populate only user, since I don't want to have a reference for the tour inside my review, only the user that created it
  this.populate({
    path: 'user',
    select: '_id name photo'
  });

  next();
});
// note: the '/^findOneAnd/' will trigger the 'findByIdAndUpdate and findByIdAndDelete' from MongoDB
// note: the '/^findOneAnd/' will trigger the 'findByIdAndUpdate and findByIdAndDelete' from MongoDB
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // note: we use 'this.model' and not just 'this' since we want to query the id of the reivew separately from the original query so that the original query can be executed later when needs without errors
  // note: we use 'this.getFilter()' to get the id from the findOneAnd (e.g. Model.findOneAndUpdate({ _id: 'someId' }, ...)), so applying the filter on the model it's been called and return the specific document
  this.r = await this.model.findOne(this.getFilter());

  // review: so here I just get the find the review with the id that is been passed through whatever it was findOneAndUpdate or Delete, and then get that document to gain the 'tour' id so then I can pass it through the method I've created, huh?
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // note: here we finally call the method using our 'r' document which is our reivew in this case, then using the same document we can find the id of the tour that review have
  await this.r.constructor.calcAverageRating(this.r.tour);
});

reviewSchema.post('save', function () {
  // note: we can call the methods on the schema by using the model of it, like so: Model.staticMethod(), but here we don't have it yet (we don't even define the model yet), so the way we can handle this it's by using the 'this.constructor' instead of 'Model'
  // review: this.constructor.method() - the way to call the method on the model even if the model is not even defined
  this.constructor.calcAverageRating(this.tour);
});

// & Static Methods
reviewSchema.statics.calcAverageRating = async function (tourId) {
  const ratingStatics = await this.aggregate([
    {
      $match: {
        tour: tourId
      }
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (ratingStatics.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: ratingStatics[0].avgRating,
      ratingsQuantity: ratingStatics[0].nRatings
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5
    });
  }
};

const Review = model('Review', reviewSchema);
module.exports = Review;
