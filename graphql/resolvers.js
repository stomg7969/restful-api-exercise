// logics that will be executed for incoming queries.
const bcrypt = require('bcryptjs');

const User = require('../models/user');

module.exports = {
  createUser({ userInput }, req) {
    // const email = args.userInput.email;
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