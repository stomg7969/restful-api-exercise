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
  if (!req.file) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  // req.body is coming from body parser.
  const { title, content } = req.body;
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: { name: 'Nate' }
  });
  // imageUrl is brought by Multer. It is not a json format. 
  // So in the frontend, I have use FormData() object (by browser side javascript offers).
  // by storing it, formData.append() will allow us to append data to the object.
  // lastly, when fetching, formData will automatically set the headers.
  // Also, body just becomes formData. (no Stringify.)
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