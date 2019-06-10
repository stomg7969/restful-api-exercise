exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [{ title: 'First Post', content: 'This is the first post.' }]
  });
};
exports.createPost = (req, res, next) => {
  // req.body is coming from body parser.
  const title = req.body.title;
  const content = req.body.content;

  res.status(201).json({
    message: "posting successful.",
    post: {
      id: new Date().toISOString(),
      title,
      content
    }
  });
};