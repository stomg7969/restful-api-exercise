const express = require('express');
const router = express.Router();
// express-validator --> npm install --save express-validator
const { body } = require('express-validator/check');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

// All routes start with /feed/
router.get('/posts', isAuth, feedController.getPosts);

router.get('/post/:postId', isAuth, feedController.getPost);
router.post(
  '/post',
  isAuth,
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.createPost
);

// put / patch
router.put(
  '/post/:postId',
  isAuth,
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.updatePost
);
router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;