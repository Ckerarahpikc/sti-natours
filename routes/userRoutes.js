const router = require('express').Router();

const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');
const tourController = require('./../controllers/tourController');

// router.route('/top-5-cheap').get();

// & Auth Controller
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);

// note: this feature is nice, so we use the protect middeware on the route, by doing this we basically saying that all the routes that goes after this one (router.use(protect)) will have the protect middleware on it, now we do not need to add it manually on every route we have
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);

// & User Controller
// note: now we can use 'router.use()' here also, where we need to restrict all routes for specifcally users
router.use(authController.restrictTo('all'));

router.get('/', userController.getAllUsers);
// updating => name / email
router.patch(
  '/updateMe',
  userController.getImage,
  userController.resizeImage,
  userController.updateMe
);
// disableMe => unable to login or signin until admin / leader updates you (turn your account on)
router.route('/disableMe').delete(userController.disableMe);
router.route('/deleteMe').delete(userController.deleteCurrentUser);
router.route('/me').get(userController.getMe, userController.getUser);
router.use(authController.restrictTo('admin', 'leader'));
// updating => active / role
router.patch('/:id/updateUser', userController.updateUserActivityData);
router
  .route('/:id')
  .get(userController.getUser)
  .delete(userController.deleteUser);
// get tours for kind of user
router.route('/:id/tours').get(tourController.getUserTours);

module.exports = router;
