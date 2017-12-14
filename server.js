//----------------PACKAGES----------------
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');



//----------------MODELS----------------
const models = require('./models/models');
const Estate = models.Estate;
const Resident = models.Resident;
const Poll = models.Poll;
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'telosppj123';


// -----------------ROUTES -----------------
const authRoutes = require('./routes/auth');
const noticeRoutes = require('./routes/notice');
const surveyRoutes = require('./routes/survey');
const meetingRoutes = require('./routes/meeting')


// ----------------- AWS -----------------
const AWS = require('aws-sdk');
let s3 = new AWS.S3({
  accessKeyId: process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET
});
const fs = require("fs");
const s3Bucket = new AWS.S3( { params: {Bucket: 'telospdf'} } )
var cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  console.log(req.headers);
  var token = req.headers['authorization'];
  console.log(token);
  if (!token){
    console.log("token failiure");
    res.json({
      success : false,
      message : "Invalid login"
    })
  }
  // token = token.replace('Bearer ', '');
  jwt.verify(token, 'telosresidentserver', function(err, user) {
    if (err) {
      console.log(err)
      res.json({
        success: false,
        message: 'Please register Log in using a valid email to submit posts'
      });
      next();
    } else {
      req.user = user; //set the user to req so other routes can use it
      next();
    }
  });
});

//----------------ROUTING----------------
app.use('/', authRoutes);
app.use('/', noticeRoutes);
app.use('/', surveyRoutes);
app.use('/', meetingRoutes);


app.listen(process.env.PORT || 3000, function(){
  console.log("app successfully listening on port 3000");
})
