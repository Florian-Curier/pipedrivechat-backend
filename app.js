require('dotenv').config();
require('./models/connection');

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var alertsRouter = require('./routes/alerts');
var authRouter = require('./routes/auth');
var dashboardRouter = require('./routes/dashboard');
var messagesRouter = require('./routes/messages');
var triggersRouter = require('./routes/triggers');

var app = express();
const cors = require('cors');
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const fileUpload = require('express-fileupload');
app.use(fileUpload());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/alerts', alertsRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/messages', messagesRouter);
app.use('/triggers', triggersRouter);

module.exports = app;
