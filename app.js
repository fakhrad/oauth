const dbinit = require('./src/config/init-db');
var express = require('express');
var cors = require('cors')
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var compression = require('compression');
var routes = require('./src/routes/oauth');
var oauth = require('./src/config/init-auth')

dbinit();
console.log('Authentication service started.');

var app = express();
app.oauth = oauth;

app.use(compression()); //Compress all routes
app.use(helmet());
app.use(cors());


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/oauth', routes);
module.exports = app;
