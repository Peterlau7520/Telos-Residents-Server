const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const models = require('./models/models');
const Estate = models.Estate;
const Resident = models.Resident;
const Poll = models.Poll;
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = 'telosppj123';


function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}


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


function generateToken(user){
  return jwt.sign(user, 'telosresidentserver', {
    expiresIn: 10080
  });
}

function setUserInfo(request){
  return {
    _id: request._id,
    name: request.name,
    email: request.email,
    estateName: request.estateName,
    unit: request.unit
  };
}


app.post('/register', (req, res) => {
  console.log("reached route register", req.body);
  var invite = decrypt(req.body.inviteCode);
  console.log(invite);
  Estate.findOne({'estateName': req.body.estateName}, function(err, estate){
    if(err){
      console.log("1");
      res.json({success : false, message: "Network Error"});
    }
    if(!estate){
      console.log("2");
      res.json({success : false , message: "Invalid Estate Name"});
    }
    if(estate.inviteCode.indexOf(invite) == -1){
      console.log(invite, estate.inviteCode);
      res.json({success : false , message: "Invalid Invite Code"});
    }
    else{
      console.log("3", estate);

      Resident.findOne({
        'estateName' : req.body.estateName,
        'unit' : req.body.unit,
        'block' : req.body.block
      })
      .then(resident => {
        if(resident){
          res.json({success : false ,  message : "Your unit is already registered."});
        }else{
          console.log("Req.body in register", req.body);
          user = new Resident({
            name: req.body.name,
            email: req.body.email,
            unit: unit,
            block: block,
            password: req.body.password,
            estateName : estate.estateName
          });
          user.save(function(err, user){
            var userInfo = setUserInfo(user);
            console.log("reached here", userInfo)
            res.json({
              success: true,
              token: 'JWT ' + generateToken(userInfo),
              user: userInfo
            })
          })
        }
      })
      .catch(err => {
        if(err)es.status(422).send({error: 'Try again'});
      })
    }
  })
})

app.post('/login', (req, res) => {
    console.log("reached here", req.body);
    Resident.findOne({'email' : req.body.email}, function(err, user){
      if(err){
        console.log('1');
        res.json({success : false, message: "Network Error"});
      }
      if(!user){
        console.log('2');
        res.json({
          success : false,
          message : "User not found"
        });
        // res.status(404).send({error: 'Login Failed. Try again.'});
      }
      else{
        console.log('3');

        user.comparePassword(req.body.password, function(err, isMatch){
          if(!isMatch){
            res.json({success : false, message: "incorrect password"});
          }else{
            var userInfo = setUserInfo(user);
            res.json({
              success : true,
              // token: 'JWT ' + generateToken(userInfo),
              token:generateToken(userInfo),
              user: userInfo
            });
          }
       })
      }
   })
})

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
      res.json({
        success: false,
        message: 'Please register Log in using a valid email to submit posts'
      });
    } else {
      req.user = user; //set the user to req so other routes can use it
      next();
    }
  });
});


app.get('/getPolls', (req, res) => {
  // console.log('innnnnn')
  Estate.findOne({'estateName': req.user.estateName})
  .populate('currentPolls')
  .exec(function(err, estate){
    let polls = estate.currentPolls;
    for(var i = 0; i < polls.length; i++){
      if( new Date(polls[i].endTime) < new Date() ){
        var temp = polls.splice(i,1);
        estate.pastPolls.push(temp[0]);
      }
    }
    estate.save();
    // console.log(polls);
    res.json({
      success: true,
      estateName: req.user.estateName,
      polls: polls
    });
  })
})

app.get('/viewpoll', (req, res) => {
  console.log("whats up");
  var id = req.query.id;
  console.log(id);
  var promiseArray = []
  Poll.findById(id, function(err, poll){
    console.log(poll);
    for(var i =0 ;i < poll.fileLinks.length; i++){
      console.log(req.user.estateName, poll.projectName, poll.fileLinks[i])
      var folder = `${req.user.estateName}/${poll.projectName}`;
      console.log("folder", folder);
      var urlPar = {Bucket: 'telospdf', Key: `${folder}/${poll.fileLinks[i]}`};
      var urlPromise = s3Bucket.getSignedUrl('getObject', urlPar);
      promiseArray.push(urlPromise);
    }
    Promise.all(promiseArray)
    .then(function(responses){
      console.log(responses);
      res.json({
        poll : poll,
        links : responses
      });
    })
    .catch(err => {
      console.log(err);
    })

  })
})

// /vote?id={poll.id}&choice={choice}

app.post('/vote', (req, res) => {
  console.log("reached vote");
  var pollId = req.query.id;
  var userId = req.user._id;
  var choice = req.query.choice;
  console.log(pollId, choice);
  Poll.findById(pollId, function(err, poll){
    console.log(poll, userId);
    if(poll.voted.indexOf(userId) !== -1 ){
      res.json({
        success: false,
        message: "You have already voted"
      })
    }
    else{
      poll.votes.push(choice);
      poll.voted.push(userId);
      console.log("Req.body", req.body);
      console.log("Req.user", req.user);
      poll.results.push({
        name: req.user.name,
        choice: choice
      })
      poll.save(function(err, poll){
          res.json({
            success: true,
            message: "Thanks for your vote."
          });
      })
    }

  })
})

app.get('/pastPolls', (req, res) => {

  Estate.findOne({'estateName' : req.user.estateName})
  .populate('pastPolls')
  .exec(function(err, estate){
    res.status(200).json({
      estateName: req.user.estateName,
      polls: estate.pastPolls
    });
  })

})

app.listen(process.env.PORT || 3000, function(){
  console.log("app successfully listening on port 3000");
})
