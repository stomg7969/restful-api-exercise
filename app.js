// If you don't remember installing anything or how it works, explanation is provided in ecommerce exercise.
// ... code ~/Development/code/udemy/nodejs/ecommerce-exercise/
// create a repo without any initializing.
// git init, git add ., git commit as usual.
// copy SSH from the repo then git remote add origin <repo url> && git remote -v
// git push -u origin master

// npm init to create package.json
// npm install --save express
// npm install --save-dev nodemon
// ... "start": "nodemon app.js" in scripts.
// npm install --save body-parser
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = `mongodb+srv://${process.env.mongoID}:${process.env.mongoPW}@cluster0-kl0m7.mongodb.net/messages?retryWrites=true&w=majority`;

const path = require('path');
// const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
// const helmet = require('helmet')
// const compression = require('compression');
// const morgan = require('morgan');

// No more routes (deleted) when using GraphQL ==> npm install --save graphql express-graphql
const graphqlHttp = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const { clearImage } = require('./helper/file');
// fileStorage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname)
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/gif') {
    cb(null, true); // accept file.
  } else {
    cb(null, false);
  }
}
// Server protector.
// app.use(helmet());
// app.use(compression());
// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
// app.use(morgan('combined', { stream: accessLogStream }));

// application/json
app.use(bodyParser.json()) // it used to be bodyParser.urlencoded
app.use(multer({ storage, fileFilter }).single('image'));
// Trigger .static() middleware when any requests to the images folder. Then creates an absolute path.
app.use('/images', express.static(path.join(__dirname, 'images')));
// CORS
app.use((req, res, next) => {
  // every response we send will have these headers.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(auth);
// graphql image. this works because we have multer already.
app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Not Authenticated.');
  }
  if (!req.file) {
    return res.status(200).json({ message: "No file provided." });
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(201).json({ message: 'File stored.', filePath: req.file.path });
});
// These call routes.
// app.use('/feed', feedRoutes);
// app.use('/auth', authRoutes);
// GraphQL from here.
app.use('/graphql', graphqlHttp({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  customFormatErrorFn(err) {
    if (!err.originalError) {
      return err;
    }
    const data = err.originalError.data;
    const message = err.message || 'An error occurred.';
    const code = err.originalError.code || 500;
    return {
      message,
      status: code,
      data
    }
  }
}));
// Error middleware that collects any incoming errors. (throw error || next(err)).
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});
mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(r => {
    app.listen(8080);
  })
  .catch(err => console.log('error?', err));