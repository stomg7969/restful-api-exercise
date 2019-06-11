const { validationResult } = require('express-validator/check');

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [{
      _id: '1',
      title: 'First Post',
      content: 'This is the first post.',
      imageUrl: 'images/blue.jpeg',
      creator: {
        name: 'Nate'
      },
      createdAt: new Date()
    }]
  });
};
exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation Failed',
      errors: errors.array()
    });
  }
  // req.body is coming from body parser.
  const title = req.body.title;
  const content = req.body.content;

  res.status(201).json({
    message: "posting successful.",
    post: {
      _id: new Date().toISOString(),
      title,
      content,
      creator: { name: 'Nate' },
      createdAt: new Date()
    }
  });
};