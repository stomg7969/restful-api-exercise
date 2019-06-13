// logics that will be executed for incoming queries.
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();
// User input validator ==> npm install --save validator
const validator = require('validator');

const User = require('../models/user');
const Post = require('../models/post');
const { clearImage } = require('../helper/file');

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
  },
  login: async function ({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('User not found');
      error.code = 401;
      throw error;
    }
    const confirmed = await bcrypt.compare(password, user.password)
    if (!confirmed) {
      const error = new Error('Incorrect password');
      error.code = 401;
      throw error;
    }
    const token = jwt.sign({
      userId: user._id.toString(),
      email: user.email
    }, process.env.SECRET_KEY, { expiresIn: '1h' });
    return {
      token,
      userId: user._id.toString()
    };
  },
  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 3 })) {
      errors.push({ message: 'Invalid Title' });
    } else if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 3 })) {
      errors.push({ message: 'Invalid Content' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('Invalid user.');
      error.code = 401;
      throw error;
    }
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user
    });
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    };
  },
  posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().estimatedDocumentCount();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('creator');
    return {
      posts: posts.map(post => {
        return {
          ...post._doc,
          _id: post.id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString()
        };
      }),
      totalPosts
    }
  },
  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('No Post found');
      error.code = 404;
      throw error;
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    };
  },
  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('No Post found');
      error.code = 404;
      throw error;
    }
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not Authorized');
      error.code = 403;
      throw error;
    }
    const errors = [];
    if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 3 })) {
      errors.push({ message: 'Invalid Title' });
    } else if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 3 })) {
      errors.push({ message: 'Invalid Content' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== 'undefined') {
      post.imageUrl = postInput.imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    };
  },
  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id);
    if (!post) {
      const error = new Error('No Post found');
      error.code = 404;
      throw error;
    }
    // Because I didn't populate('creator'), creator itself becomes an id.
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('Not Authorized');
      error.code = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);
    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();
    return true;
  },
  user: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('No User found');
      error.code = 404;
      throw error;
    }
    return {
      ...user._doc,
      _id: user._id.toString()
    };
  },
  updateStatus: async function ({ status }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated');
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('No User found');
      error.code = 404;
      throw error;
    }
    user.status = status;
    await user.save();
    return {
      ...user._doc,
      _id: user._id.toString()
    };
  }
};
// have to follow the same structure as schema.
// I named userInput in the schema, so I need to use userInput here.