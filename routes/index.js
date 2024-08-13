var express = require('express');
var router = express.Router();
const Message = require('../models/messages')
const Alert = require('../models/alerts')
const User = require('../models/users')
const { isValidObjectId } = require('mongoose');
const { refreshGoogleToken, refreshPipedriveToken } = require('../modules/refreshTokens');
const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');


const CLOUDINARY_URL = process.env.CLOUDINARY_URL


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


module.exports = router;
