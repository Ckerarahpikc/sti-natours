// tour routes config
const express = require('express');
const authController = require('./../controllers/authController');
const tourController = require('./../controllers/tourController');

// import reivews router for nesting routes
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// note: simple nested routes
// POST /tour/fd8fu39lsjdf/reviews
// GET /tour/fd8fu39lsjdf/reviews
// GET /tour/fd8fu39lsjdf/reviews/fasldkfj8984utl3j
// note: use nested routes using express advanced feature (since we create new review on the tourRoute it's a little bit messy leoneli)
// note: so we basically saying that: if there is a route like this (ex: /:tourId/reviews) then use 'reviewRouter' (like in app.js file)
router.use(
  '/:tourId/reviews',
  authController.protect,
  authController.restrictTo('all')
);

// middleware
// router.param('id', tourController.checkId);

// & tours API
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('co-leader', 'leader', 'admin'),
    tourController.getMonthlyPlan
  );
router.route('/get-test').get(tourController.getTest);

router
  .route('/random-query')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/tours-within/:distance/center/:lnglat/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:lnglat/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  // however we want to allow to create tour only if he has the rights for that and it's authenticated
  .post(
    authController.protect,
    authController.restrictTo('leader', 'admin'),
    tourController.checkUpdatedTour,
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTourById)
  // update/delete it's gonna be protected as well
  .patch(
    authController.protect,
    authController.restrictTo('leader', 'admin'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('leader', 'admin'),
    tourController.deleteTour
  );

module.exports = router;
