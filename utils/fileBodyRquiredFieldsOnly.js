// NOTE: Here I'm gonna create 'a filter' which will allow users to change only the 'name' and 'email' (so we do not want the user to change sensitivity data, e.g. 'role', 'password')
const SetAppError = require('./errorConfig');
const filterBody = (body, ...allowedFields) => {
  if (typeof body !== 'object' && body === null) {
    throw new SetAppError('Invalid body format.', 400);
  }

  let res = {};
  Object.keys(body).forEach((el) => {
    if (allowedFields.includes(el)) {
      if (
        typeof body[el] === 'object' &&
        body[el] !== null &&
        !Array.isArray(body[el])
      ) {
        res[el] = JSON.stringify(body[el]);
      } else {
        res[el] = body[el];
      }
    } else {
      throw new SetAppError(
        `Unexpected field, re-check fields. Fuck you protein powder.`,
        400
      );
    }
  });
  return res;
};

module.exports = filterBody;
