const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const SetAppError = require('../utils/errorConfig');
const {
  getOne,
  getAll,
  deleteOne,
  updateOne,
  createOne
} = require('../controllers/factoryHandler');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. get the current booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. create checkout session - this is the object that contains all stuff and info about what we want to sell
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: ['https://ibb.co/XxwkJCX']
          },
          unit_amount: tour.price * 100 // expected to be in cents
        },
        quantity: 1
      }
    ],
    mode: 'payment' // required in newer versions
  });

  // 3. create session as response
  res.status(200).json({
    status: 'success',
    data: {
      session
    }
  });
});

exports.createBookings = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.getBookings = getAll(Booking);
exports.createBooking = createOne(
  Booking,
  'tour',
  'user',
  'price',
  'createdAt',
  'paid'
);
exports.getBookingById = getOne(Booking);
exports.updateBookingById = updateOne(
  Booking,
  'tour',
  'user',
  'createAt',
  'paid'
); // info: I didn't include 'price' cuz there is no point, the user will still see the original price of the product, and also the session was already processed which means the user paid for it already ;0
exports.deleteBookingById = deleteOne(Booking);
