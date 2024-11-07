const { Schema, model } = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const { addMinutes } = require('date-fns');

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'User should have a name.'],
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, 'User should have an email.'],
    unique: true, // the email should be unique
    lowercase: true,
    validate: {
      validator: function (val) {
        return validator.isEmail(val);
      },
      message: 'Your email should be a real email.'
    }
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'co-leader', 'leader', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'A user must have a password.'],
    minlength: 8,
    maxlength: 30,
    select: false
    // select: false // hide the password, and not store it in the db
  },
  passwordConfirm: {
    type: String,
    required: [true, 'A user must have a confirmation password'],
    // this will only work on SAVE / CREATE
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Passwords should match!!'
    }
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  nTours: {
    type: Number,
    select: false
  }
});

// ^ we can use virtuals to add data and modify it based on the schema that we have
// userSchema.virtual('LoudName').get(function () {
//   return `${this.name.toUpperCase()}`;
// });

// & Virtual Populate
userSchema.virtual('tours', {
  ref: 'Tour',
  foreignField: 'guides',
  localField: '_id'
});

userSchema.pre('save', async function (next) {
  // info: About to save in db (first)...

  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  // crypt and store the password
  this.password = await bcrypt.hash(this.password, 12);

  // remove the passwordConfirm
  this.passwordConfirm = undefined;
  next();
});

// update passwordChangeAt when the user changed the password
userSchema.pre('save', function (next) {
  // info: About to save in db (second)...

  // if the password was not modified => next
  if (!this.isModified('password') || this.isNew) return next();

  // if it was modified then change the date when the password was created
  this.passwordChangeAt = Date.now() - 5000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // const updated = this.getUpdate();

  // include option 'includeInactiveUsers' = [Boolean] to toggle inactive users compiling
  if (!this.options.includeInactiveUsers) {
    this.where({ active: true });
  }
  next();
});

// userSchema.post('save', function () {
//   this.constructor.getToursOnThisUser(this._id);
// });

userSchema.methods.checkPassword = async function (
  userPassword,
  hashedTargetPassword
) {
  // 1. compare those two pass
  const isPassMatch = await bcrypt.compare(userPassword, hashedTargetPassword);
  return isPassMatch ? true : false;
};

// review: UNDERSTAND THIS
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    const changeAt = parseInt(this.passwordChangeAt.getTime() / 1000, 10);

    if (changeAt > JWTTimestamp) {
      return true;
    }
  }

  return false; // false - means 'not changed'
};

userSchema.methods.createPasswordResetToken = function () {
  // generate a unique and secure token.
  // review: CryptoJS.lib.WordArray(32) - Generates a secure random 32-byte token
  // review: toString(CryptoJS.enc.Hex) - Converts the token to a hexadecimal string.
  const resetToken = crypto.randomBytes(32).toString('hex');

  // store a hashed version of this token in the user's database record for future validation.
  // review: CryptoJS.SHA256(resetToken).toString(CryptoJS.enc.Hex) - Creates a SHA-256 hash of the reset token and converts it to a hexadecimal string.
  this.passwordResetToken = CryptoJS.SHA256(resetToken).toString(
    CryptoJS.enc.Hex
  );

  // set the expire time for the reset token (give user 10min)
  this.passwordResetExpire = addMinutes(Date.now(), 10);

  return resetToken;
};

const User = model('User', userSchema);
module.exports = User;
