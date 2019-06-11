const { validationResult } = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  Post.find()
    .then(posts => {
      res.status(200).json({ posts });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
exports.getPost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('No post found');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Success', post });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed');
    error.statusCode = 422;
    throw error;
  }
  // req.body is coming from body parser.
  const { title, content } = req.body;
  const post = new Post({
    title,
    content,
    imageUrl: 'images/blue.jpeg',
    creator: { name: 'Nate' }
  });
  post.save()
    .then(r => {
      console.log(r);
      res.status(201).json({
        message: 'Post created successfully!',
        post: r
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};