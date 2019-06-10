// create a repo without any initializing.
// git init, git add ., git commit as usual.
// copy SSH from the repo then git remote add origin <repo url> && git remote -v
// git push -u origin master

// npm init to create package.json
// npm install --save express
// npm install --save-dev nodemon
// ... "start": "nodemon app.js" in scripts.
// npm install --save body-parser

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');
// application/json
app.use(bodyParser.json()) // it used to be bodyParser.urlencoded

app.use('/feed', feedRoutes); // this calls routes.

app.listen(8080);