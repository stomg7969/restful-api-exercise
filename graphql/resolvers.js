// logics that will be executed for incoming queries.
const bcrypt = require('bcryptjs');
// User input validator ==> npm install --save validator
const validator = require('validator');

const User = require('../models/user');

module.exports = {
  createUser({ userInput }, req) {
    // const email = args.userInput.email; or just get {userInput} out of the arg.
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'Email is invalid.' });
    }
    if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 2 })) {
      errors.push({ message: 'Password too short!' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    return User.findOne({ email: userInput.email })
      .then(user => {
        if (user) {
          const error = new Error('User already exists');
          throw error;
        }
      })
      .then(r => {
        return bcrypt.hash(userInput.password, 12);
      })
      .then(hashed => {
        const user = new User({
          email: userInput.email,
          name: userInput.name,
          password: hashed
        });
        return user.save();
      })
      .then(createdUser => {
        return {
          ...createdUser._doc,
          // _doc==> stripping out all the other properties that come back with ...
          // ... the document and only retrieving the fields that belong in the schema.
          _id: createdUser._id.toString()
        };
      })
  }
};
// have to follow the same structure as schema.
// I named userInput in the schema, so I need to use userInput here.