const Review = require('./../models/reviewModel');
const {
  deleteOne,
  getAll,
  updateOne,
  createOne,
  getOne
} = require('./../controllers/factoryHandler');

// ^ middleware
exports.settingLocalIds = (req, res, next) => {
  // we can set the id to the body, otherwise it will get the params tourId from the query string
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // if so, then take the parameter from the req(created on 'protect' controller)
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// ^ GET =====================================
exports.getAllReviews = getAll(Review);
exports.getReviewById = getOne(Review);

// ^ POST =====================================
exports.createNewReview = createOne(Review);

// ^ PATCH =====================================
exports.updateReview = updateOne(Review, 'review', 'rating');

// ^ DELETE =====================================
exports.deleteReview = deleteOne(Review);
