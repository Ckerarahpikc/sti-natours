const { Schema, model } = require('mongoose');

const bookingSchema = new Schema({
  tour: {
    type: Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Boooking must belong to a Tour!']
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Boooking must belong to a User!']
  },
  price: {
    type: Number,
    require: [true, 'Bookings must have a price.']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: { type: Boolean, default: true }
});

bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: 'name'
  }).populate({ path: 'user', select: '-__v' });
  next();
});

const Booking = model('Booking', bookingSchema);
module.exports = Booking;
