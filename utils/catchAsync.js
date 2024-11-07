// this module exports a function that wraps asynchronous route handlers and middleware to handle errors like a humans
module.exports = (fn) => {
  // we basically create a new anonymous function that returns another function with 'req, res, next' as a parameter
  return (req, res, next) => {
    // since the 'fn' is giving us a promise ... we catch it when an 'error' occurs
    fn(req, res, next).catch(next);
  };
};
