const express = require('express');
const compression = require('compression');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const sanitizeMongo = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

require('dotenv').config({ path: './config-dev.env' });

const globalErrorHandler = require('./controllers/globalErrorController');
const sanitizeBodyWithWhitelist = require('./security/sanitizeInput');
const securityMiddleware = require('./security/securityMiddlewareSetup');

//  ================ importing routes ================
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

// set engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, '/public')));

// ====================== middlewares (security) ======================
// Set security HTTP headers (helmet)
app.use(securityMiddleware);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same API (express-rate-limit)
const limit = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "You've reached the rate limit. Try again after 1h."
});
app.use('/api', limit);

// Sanitization against NoSQL query injection (express-mongo-sanitize)
app.use(sanitizeMongo());

// Sanitization against XSS attacks (xss)
app.use(sanitizeBodyWithWhitelist);

// Prevent query pullution
app.use(
  hpp({
    whitelist: [
      'duration',
      'difficulty',
      'maxGroupSize',
      'ratingsAverage',
      'ratingsQuantity',
      'price'
    ]
  })
);

// Compresser
app.use(compression());

// ==================  middlewares (parsing) ==================
// Body parser, reading data from body into req.body
app.use(
  express.json({
    limit: '50kb',
    verify: (req, res, buf, encoding) => {
      if (buf[0] !== 0x7b && buf[0] !== 0x5b) {
        throw new Error('Invalid JSON format.');
      }
    }
  })
);
// Cookie parser, reading the req.cookie
app.use(cookieParser());

// ==================== routes ====================
app.use((req, res, next) => {
  // req.requestTime = new Date().toISOString();
  // console.log('COOKIES:', req.cookies);

  // note: to be able to use 'req.ip' u need to set 'app.enable('trust proxy')' firstly
  // console.log('request ip:', req.ip);
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/reviews', reviewsRouter);

// ? the .all(route, cb) should be after all routes, if the routers that is above this one will be found, this .all() will never be executed, so it's important to place this code right after all the routes
// app.all('*', (req, res, next) => {
// const err = new Error(`Can't find ${req.originalUrl} on the server.`);
// err.status = 'fail';
// err.statusCode = 404;

// next(err);
//   next(new SetAppError(`Can't find ${req.originalUrl} on the server.`, 404));
// });
// app.all('*', (req, res, next) => {
//   next(new SetAppError(`Can't find ${req.originalUrl} on the server.`, 404));
// });

// middleware error handle function
app.use(globalErrorHandler); // this will catch all the error on the app that occurs above (very useful)

module.exports = app;
