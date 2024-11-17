const mongoose = require('mongoose');

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const SetAppError = require('../utils/errorConfig');

exports.alert = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking') {
    res.locals.alert =
      "Your booking was successfull! Please check your email for configuration. If your booking doesn't appear here immediately, don't come back, this is just a scam.";
  }
  next();
};

exports.getOverview = catchAsync(async (req, res) => {
  // info: here I want to add a simple mark (that they've purchased) on those tours that user bought
  let userBookings;
  let setOfPurchasedTours;
  let purchasedTours;

  //1. first get all tours
  const tours = await Tour.find();

  if (res.locals.user) {
    //2. then get all the bookings on the current user and populate the 'tour' on them
    userBookings = await Booking.find({ user: res.locals.user._id }).populate(
      'tour'
    );

    //3. then create a set with all the tour ids found from user bookings
    setOfPurchasedTours = new Set(
      userBookings.map((booking) => booking.tour._id.toString())
    );

    //4. finaly create and add each of the tour a field named 'purchased' if they've actualy bought that tour (so if the current tour id is equal to one of those that we've found on 'setOfPurchasedTours')
    purchasedTours = tours.map((tour) => ({
      ...tour.toObject(),
      purchased: setOfPurchasedTours.has(tour._id.toString())
    }));
  }

  res.status(200).render('overview', {
    title: 'All Tours',
    tours: res.locals.user ? purchasedTours : tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // info: here I want not to only render the current tour but also to remove the section to book the respective tour if the user already did
  let userBookings;
  let isThisTourPurchased;

  // 1. get the data for the requested tour (including reviews and guides)
  const { tourName } = req.params;
  const tour = await Tour.findOne({ slug: tourName }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new SetAppError("Can't find that tour name.", 404));
  }

  if (res.locals.user) {
    // info: if the user already booked this tour
    // 2. find all the tours user have booked, and find there a tour
    userBookings = await Booking.find({ user: res.locals.user._id }).populate(
      'tour'
    );
    isThisTourPurchased = userBookings.some(
      (userTour) => userTour.tour._id.toString() === tour.id
    );
  }

  res.status(200).render('tour', {
    // 3. send the template to the tour page
    title: tour.name,
    tour,
    isThisTourPurchased
  });
});

exports.login = catchAsync(async (req, res) => {
  res.status(200).render('loginTemplate', {
    title: 'Login'
  });
});

exports.signup = catchAsync(async (req, res) => {
  res.status(200).render('signupTemplate', {
    title: 'SignUp'
  });
});

exports.getUserBookings = catchAsync(async (req, res, next) => {
  //1. find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  //2. find tours with the returned ids
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('accountContent/userBookings', {
    title: 'My Tours',
    tours
  });
});

exports.getUserReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({
    user: new mongoose.Types.ObjectId(`${req.user.id}`)
  }).populate({
    path: 'tour',
    select: 'name'
  });

  res.status(200).render('accountContent/reviewsTemplate', {
    title: 'My Reviews',
    reviews
  });
});

exports.userAccount = (req, res) => {
  res.status(200).render('accountContent/accountSettings', {
    title: 'My Account',
    user: res.locals.user
  });
};

exports.getManageToursPage = (req, res, next) => {
  res.status(200).render('accountContent/manageTours', {
    title: 'Manage Tours'
  });
};
