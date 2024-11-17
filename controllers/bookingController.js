const Tour = require('../models/tourModel');
const User = require('../models/userModel');
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
    // success_url: `${req.protocol}://${req.get('host')}/my-tours?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
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
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
            ]
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

// info: temporarly code for local testing
// exports.createBookings = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;
//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;

  console.log('contenthere:', tour, user, price)

  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    console.error('Signature missing in headers!');
    return res
      .status(400)
      .send('No stripe-signature header value was provided.');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_SIGNING_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      createBookingCheckout(session);
    }

    res.status(200).send({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(400).send(`Webhook error: ${err.message}`);
  }
};

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
