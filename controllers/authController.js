require('dotenv').config({ path: './config-dev.env' });
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const SetAppError = require('./../utils/errorConfig');
const Email = require('./../utils/email');

// create / verify token
const signToken = (id) => {
  return jwt.sign({ id }, Buffer.from(process.env.JWT_SECRET, 'base64'), {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const verifyToken = (token) => {
  return jwt.verify(token, Buffer.from(process.env.JWT_SECRET, 'base64'));
};

// Create and Send Token
const createSendToken = (user, statusCode, res) => {
  // info: Trying to send / create a token
  // sign token based on user id
  const token = signToken(user._id);

  // set the actual token
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 1000 * 60 * 60 * 24
    ),
    httpOnly: true, // allow to access token only from server
    secure: req.headers['x-forwarded-proto'] === 'https' || req.secure
  });

  // remove the password from the output (json)
  user.password = undefined;

  // return the status & token & user
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// SIGN UP
exports.signup = catchAsync(async (req, res, next) => {
  // info: Signin
  const { name, email, password, passwordConfirm } = req.body;
  try {
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm
    });

    const url = `${req.protocol}://${req.get('host')}/me`;

    // Log User and send JWT
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return next(
        new SetAppError('Email already in use. Please login instead.', 400)
      );
    }
    next(error);
  }
});

// LOG IN / OUT
exports.login = catchAsync(async (req, res, next) => {
  // info: Login
  const { email, password } = req.body;

  // 1. check if email and password exist
  if (!email || !password)
    return next(
      new SetAppError(
        'The email and password fields are required. Try your email and password.',
        400
      )
    );

  // 2. check if user exist && password is correct
  const newUser = await User.findOne({ email }).select('+password');
  if (!newUser || !(await newUser.checkPassword(password, newUser.password))) {
    return next(
      new SetAppError(
        'Password or email invalid. Try login with your email and password.',
        400
      )
    );
  }

  // if all right, sign new token
  createSendToken(newUser, 200, res);
});
exports.logout = (req, res) => {
  // info: here we just set the 'jwt' which is the token to the value of something less meaningful, just to immediately after use logedout so that the user will not be able to access the token after it's logedout
  res.cookie('jwt', 'logedout', {
    expires: new Date(Date.now() - 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success'
  });
};

// PROTECTION - so we check every user that wants to get access to content on the website (we check if user have the token or not)
exports.protect = catchAsync(async (req, res, next) => {
  // info: Checking the user token

  // 1. Getting token and check if it's there
  // console.log('HEADERS:', req.headers);
  let token;
  // console.log('req:', req);
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // console.log('token is present. all secured.');
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // console.log('cookie is present. all secured.');
    token = req.cookies.jwt;
  }

  // console.log('TOKEN:', token);
  if (!token) {
    return next(
      new SetAppError(
        'You are not logged in! Please log in to get access.',
        401
      )
    );
  }

  try {
    // 2. Verification token
    const decoded = verifyToken(token);

    // 3. Check if user still exists
    const verifiedUser = await User.findById(decoded.id);

    if (!verifiedUser) {
      return next(
        new SetAppError(
          'The user belonging to this token does not longer exist.',
          401
        )
      );
    }

    // 4. Check if user changed password after the token was issued
    if (verifiedUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new SetAppError('The password was changed. Try login again.', 401)
      );
    }

    // ACCESS TO PROTECTED ROUTE
    req.user = verifiedUser;
    res.locals.user = verifiedUser;
    req.requestTimestamp = new Date(Date.now());

    next();
  } catch (err) {
    return next(new SetAppError('Invalid login, please login again.', 401));
  }
});

// note: by removing the 'catchAsync' we handle the incoming errors locally and not globally
exports.isLoggedIn = async (req, res, next) => {
  // info: Checking user authentication
  try {
    if (req.cookies.jwt) {
      const decoded = verifyToken(req.cookies.jwt);

      const verifiedUser = await User.findById(decoded.id);

      if (!verifiedUser) {
        return next();
      }

      if (verifiedUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // OTHERWISE THE USER IS LOOGED, SOOOO
      res.locals.user = verifiedUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

// restriction controller - AUTHORIZATION (so basically we give each of the roles to have their specific access to the website)
exports.restrictTo = (...roles) => {
  // roles = arr of roles
  return (req, res, next) => {
    // info: Checking user access
    // if there is only one role and it's equal to 'all' then just skip this (means that all the user are gonna be able to enter this route)
    if (roles.length === 1 && roles[0] === 'all') return next();
    // if [...roles] that the developer set to respective route does not include logged user's role
    if (!roles.includes(req.user.role)) {
      return next(
        new SetAppError("You don't have access to this action.", 403)
      );
    }

    next();
  };
};

// reset token - PASSWORD FORGOT (user will click on the button which will give him the reset token)
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // info: Reset password
  const { email } = req.body;

  //1. get user based on POSTed email
  const userDataEmailBased = await User.findOne({ email });

  if (!userDataEmailBased) {
    return next(new SetAppError('There is no user with this email.', 404));
  }

  //2. generate the random reset token
  const resetToken = userDataEmailBased.createPasswordResetToken();
  await userDataEmailBased.save({ validateBeforeSave: false }); // deactivate the validators before saving the user (because here we don't need them)

  //3. send it to user's email
  try {
    // try
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    // Log User and send JWT
    await new Email(userDataEmailBased, resetUrl).sendRecoveryToken();

    res.status(200).json({
      status: 'success',
      message: 'Message sended to the email.'
    });

    // catch
  } catch (err) {
    // remove the token reset from db
    userDataEmailBased.passwordResetToken = undefined;
    userDataEmailBased.passwordResetExpire = undefined;
    await userDataEmailBased.save({ validateBeforeSave: false }); // save without 'validators'

    return next(
      new SetAppError('Something went very wrong here. Try again later!', 500)
    );
  }
});
// reset token - PASSWORD RESET (now when we have the reset token, we compare it to the one in the DB for the current user and based on that give access to the user to whether reset or not the password)
exports.resetPassword = catchAsync(async (req, res, next) => {
  // get the resetToken from the param of the req, so the 'token'
  const { resetToken } = req.params;
  const { password, passwordConfirm } = req.body; // take the new pass from the body request

  // check if password and passConf match
  if (passwordConfirm !== password) {
    return next(
      new SetAppError("Passwords don't match. Please make sure they are.", 400)
    );
  }

  // check length of password
  if (password.length < 8 || password.length > 30) {
    return next(
      new SetAppError(
        'The length of the password should be at 8 to 30 characters.',
        400
      )
    );
  }

  // decrypt the hashed resetToken from the person
  const hashedPasswordToken = CryptoJS.SHA256(resetToken).toString(
    CryptoJS.enc.Hex
  );

  // find the user with this hashed password in the db (and if it find something then the hashed password is the same as the user has)
  const userReset = await User.findOne({
    passwordResetToken: hashedPasswordToken,
    // the reset expire after 10min (so it should be greater than the time is now)
    passwordResetExpire: { $gt: Date.now() }
  });

  // if the token expired or the token is invalid
  if (!userReset) {
    return next(new SetAppError('The token is invalid or has expired.', 400));
  }
  // reset all properties and save user again
  userReset.password = password;
  userReset.passwordConfirm = passwordConfirm;
  userReset.passwordResetToken = undefined;
  userReset.passwordResetExpire = undefined;
  await userReset.save();

  // sign the user
  createSendToken(userReset, 201, res);
});

// update password - so this is just as usual resetting password, but it don't require reset tokens or email messages, only need to be authenticated
exports.updatePassword = catchAsync(async (req, res, next) => {
  try {
    const { passwordCurrent, password, passwordConfirm } = req.body;

    // 1. find the user
    const user = await User.findById(req.user.id).select('+password');
    // NOTE: User.findOneAndUpdate() will not work as intended.

    // 2. check the password
    if (password !== passwordConfirm) {
      return next(new SetAppError('Passwords are not the same.', 401));
    }
    if (!(await user.checkPassword(passwordCurrent, user.password))) {
      return next(
        new SetAppError('Invalid Password. Try To Restore Your Password.', 401)
      );
    }

    // 3. update password
    user.password = password;
    user.passwordConfirm = password;
    await user.save();

    // 4. log user in, log JWT
    createSendToken(user, 201, res);
  } catch (err) {
    return next(new SetAppError(err, 400));
  }
});
