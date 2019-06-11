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
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');
// application/json
app.use(bodyParser.json()) // it used to be bodyParser.urlencoded
// Trigger .static() middleware when any requests to the images folder. Then creates an absolute path.
app.use('/images', express.static(path.join(__dirname, 'images')));
// CORS
app.use((req, res, next) => {
  // every response we send will have these headers.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
app.use('/feed', feedRoutes); // this calls routes.
// Error middleware that collects any incoming errors. (throw error || next(err)).
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message });
});
mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(r => app.listen(8080))
  .catch(err => console.log('erorrrrrrrr?????', err));