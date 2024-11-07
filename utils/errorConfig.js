class SetAppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
// const newError = new SetAppError('qwertyuiopasdfghjklzxcvbnm', 100);
// console.log(newError);

module.exports = SetAppError;
