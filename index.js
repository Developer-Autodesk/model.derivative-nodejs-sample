'use strict';

var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var app = express();
var morgan = require('morgan');

// this session will be used to save the oAuth token
app.use(cookieParser());

app.use(session({
  secret: 'autodeskderivativeservice',
  resave: false,
  saveUninitialized: false
}));

var port = process.env.PORT || 8000;

// serve static files
app.use(express.static(__dirname + '/views/static'));

// set ejs as view engine
app.set('view engine', 'ejs');

var api = require('./routes/api');
app.use('/api', api); // redirect API calls

app.use(morgan('combined'));


app.get('/', (req, res) => {
  res.render('index');
});

app.listen(port);
console.log('App is listening at port ' + port);
