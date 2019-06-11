const express = require('express');
const router = express.Router();
// express-validator --> npm install --save express-validator
const { body } = require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

// put / post
router.put(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return User.findOne({ email: value })
          .then(userObj => {
            // checks if email already is taken. If yes, reject the promise.
            if (userObj) {
              return Promise.reject('Email address already taken');
            }
          })
      })
      .normalizeEmail(),
    body('password').trim().isLength({ min: 2 }),
    body('name').trim().not().isEmpty() // .not + .isEmpty === should not be empty.
  ],
  authController.signup
);

module.exports = router;