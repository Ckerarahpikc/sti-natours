const SetAppError = require('../utils/errorConfig');

// ^ HANDLING ERRORS
const handleCastError = (err) => {
  console.log('ERROR:', err);
  // assigning something incorect
  const message = `Invalid ${err.path} setted to the value ${err.value}.`;
  return new SetAppError(message, 400);
};
const handleDuplicationError = (err) => {
  console.log('ERROR:', err);
  // assigning something that is already in use
  const message = `Duplication error. What you want to add right now is already there.`;

  return new SetAppError(message, 400);
};
const handleValidationError = (err) => {
  console.log('ERROR:', err);
  // assigning something incorect once or multiple times faling by validation
  // const errorMessages = Object.values(err.errors).map((el) => el.message);

  // const fullMessage = `Error on assinging values. ${errorMessages.join(' ')}`;
  return new SetAppError(err.message, 400);
};
const handleJWTError = (err) => {
  console.log('ERROR:', err);
  // some invalid token errors
  const fullMessage = `Token error, try log in again. Message: ${err.message}`;
  return new SetAppError(fullMessage, 401);
};

// ^ PROD ERROR - error handler for people
const prodErrConfig = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: 'Something went very wrong.',
      message: err.message
    });
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).render('errorTemplate', {
        title: 'Something went very wrong.',
        message: err.message
      });
    } else {
      res.status(err.statusCode).render('errorTemplate', {
        title: 'Something went very wrong.',
        message: 'Try Again.'
      });
    }
  }
};

// ^ DEV ERROR - error handler for dev
const devErrConfig = (err, req, res) => {
  console.log('ERROR:', err);
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      statusDev: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  } else {
    res.status(err.statusCode).render('errorTemplate', {
      title: 'Something went wrong.',
      msg: err.message
    });
  }
};

// ^ SEND ERRORS BASED ON ENVIRONMENT STATE
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    devErrConfig(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Ensure we are copying all properties
    // To not rewrite the initial error parameter, we make a copy
    let error = {
      message: err.message,
      statusCode: err.statusCode,
      status: err.status,
      isOperational: err.isOperational,
      path: err.path,
      value: err.value,
      stack: err.stack
    };

    if (err.name === 'CastError') error = handleCastError(error);
    if (err.name === 'ValidationError') error = handleValidationError(error);
    if (err.code === 11000) error = handleDuplicationError(error);
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError')
      error = handleJWTError(error);

    prodErrConfig(error, req, res);
  }
};
