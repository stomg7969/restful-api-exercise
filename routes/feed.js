const express = require('express');
const router = express.Router();
// express-validator --> npm install --save express-validator
const { body } = require('express-validator/check');

const feedController = require('../controllers/feed');

// All routes start with /feed/
router.get('/posts', feedController.getPosts);

router.get('/post/:postId', feedController.getPost);
router.post(
  '/post',
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.createPost);

// put / patch
router.put('/post/:postId',
  [
    body('title')
      .trim()
      .isLength({ min: 5 }),
    body('content')
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.updatePost);

module.exports = router;