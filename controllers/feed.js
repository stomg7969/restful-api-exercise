const { validationResult } = require('express-validator/check');
const fs = require('fs');
const path = require('path');

const Post = require('../models/post');
const User = require('../models/user');
// Async Await way instead of using .then()
exports.getPosts = async (req, res, next) => {
  // if req.query.page is undefined, set to 1 as default.
  const currentPage = req.query.page || 1;
  const numberOfPostsPerPage = 2;
  /*
  let totalItems;
  Post.find()
    .estimatedDocumentCount()
    .then(count => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * numberOfPostsPerPage)
        .limit(numberOfPostsPerPage);
    })
    .then(posts => {
      res.status(200)
        .json({
          message: 'Fetched posts successfully.',
          posts: posts,
          totalItems: totalItems
        });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
  */

  try {
    const totalItems = await Post.find().estimatedDocumentCount;
    const posts = await Post.find()
      .populate('creator')
      .skip((currentPage - 1) * numberOfPostsPerPage) // If I am on first page, then it becomes 0, so no skipping. if page 2, then skip that amount.
      .limit(numberOfPostsPerPage); // limit the amount rendered.

    res.status(200).json({ posts, totalItems });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);

  }
};
exports.getPost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('No post found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: 'Success', post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.createPost = async (req, res, next) => {
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
  let creator;
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: req.userId
    // userId is stored from decoding jwt token in the middleware is-auth.js
  });
  // imageUrl is brought by Multer. It is not a json format. 
  // So in the frontend, I have use FormData() object (by browser side javascript offers).
  // by storing it, formData.append() will allow us to append data to the object.
  // lastly, when fetching, formData will automatically set the headers.
  // Also, body just becomes formData. (no Stringify.)
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();

    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: {
        _id: user._id,
        name: user.name
      }
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);

  }
};
exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    throw error;
  }
  const { postId } = req.params;
  const { title, content } = req.body;
  let imageUrl = req.body.image; // keep existing image
  // either we use file we already have or use newly uploaded file.
  if (req.file) {
    // change to new image if there is new image uploaded
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('No file picked.');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      // post.creator is ObjectId. so It returns id, but I can still get an access like name and email and so on.
      const error = new Error('Not authorized.');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      // If image is newly uploaded, it will not be the same as post.imageUrl.
      // so, it will trigger this function whenever I upload a new image. Then delete the old image.
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;

    const result = await post.save();

    res.status(200).json({ post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId)

    if (!post) {
      const error = new Error('No file picked.');
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      // post.creator is ObjectId. so It returns id, but I can still get an access like name and email and so on.
      const error = new Error('Not authorized.');
      error.statusCode = 403;
      throw error;
    }
    // Check if it's the right user --> delete post --> delete image.
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId); // No need to store if not going to use it.

    const user = await User.findById(req.userId);

    user.posts.pull(postId); // Reason for this line is to also delete association. Before this when deleting post, 
    // ... it deletes posts, but not the id that is associated to the user.
    await user.save();

    res.status(200).json({ message: 'Post deleted' })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};