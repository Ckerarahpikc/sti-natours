const express = require('express');
const reviewsController = require('../controllers/reviewsController');
const authController = require('../controllers/authController');

// note: now to just get the '/:tourId' from the params we actually need to merge them using: Router { mergeParams: Boolean [default: false] }
const router = express.Router({ mergeParams: true });

router.use(authController.protect);
router
  .route('/')
  .get(authController.restrictTo('all'), reviewsController.getAllReviews);
router
  .route('/:id')
  .get(authController.restrictTo('all'), reviewsController.getReviewById)
  .patch(authController.restrictTo('all'), reviewsController.updateReview)
  .delete(authController.restrictTo('all'), reviewsController.deleteReview);
router
  .route('/:tourId')
  .post(
    authController.restrictTo('all'),
    reviewsController.settingLocalIds,
    reviewsController.createNewReview
  );

module.exports = router;
