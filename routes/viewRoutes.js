const express = require('express');
const router = express.Router();

const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

router.route('/me').get(authController.protect, viewController.userAccount);
router
  .route('/my-tours')
  .get(authController.protect, viewController.getUserBookings);
router
  .route('/my-reviews')
  .get(authController.protect, viewController.getUserReviews);

router
  .route('/manage-tours')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    viewController.getManageToursPage
  );

// info: cheking if the user is logged in (doens't return any errors)
router.use(authController.isLoggedIn);

// info: view routes
router.route('/').get(viewController.getOverview);
router.route('/tour/:tourName').get(viewController.getTour);

// info: authentication routes
router.route('/login').get(viewController.login);
router.route('/signup').get(viewController.signup);

module.exports = router;
