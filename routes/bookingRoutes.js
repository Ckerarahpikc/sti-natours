const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'leader'));

router
  .route('/')
  .get(bookingController.getBookings)
  .post(bookingController.createBooking);
router
  .route('/:id')
  .get(bookingController.getBookingById)
  .patch(bookingController.updateBookingById)
  .delete(bookingController.deleteBookingById);

module.exports = router;
