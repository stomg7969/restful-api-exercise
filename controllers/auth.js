const dotenv = require('dotenv');
dotenv.config();
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { email, name, password } = req.body;
  // Must store password encrypted. (hash)
  bcrypt.hash(password, 12)
    .then(hashed => {
      const user = new User({
        email,
        password: hashed,
        name
      });
      return user.save()
    })
    .then(r => {
      res.status(201).json({ message: 'User created', userId: r._id })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
exports.login = (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        const error = new Error('Email not found.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password)
    })
    .then(confirmed => {
      if (!confirmed) {
        const error = new Error('Invalid information');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign({
        email: loadedUser.email,
        userId: loadedUser._id.toString()
      },
        process.env.SECRET_KEY,
        { expiresIn: '1h' } // Make it expire in one hour. Nice security mechanism.
      ); // change to jwt. DO NOT PASS SENSITIVE INFORMATION.
      res.status(200).json({ token, userId: loadedUser._id.toString() });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};