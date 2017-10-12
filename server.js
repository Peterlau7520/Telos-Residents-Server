const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const models = require('./models/models');
const Estate = models.Estate;
const Resident = models.Resident;
const Poll = models.Poll;


const AWS = require('aws-sdk');
AWS.config.loadFromPath('./key.json');
const s3 = new AWS.S3();
const fs = require("fs");
const s3Bucket = new AWS.S3( { params: {Bucket: 'telospdf'} } )

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
    email: request.email,
    estateName: request.estateName,
    unit: request.unit
  };
}


app.post('/register', (req, res) => {
  var invite = req.body.inviteCode;
  Estate.findOne({'estateName': req.body.estateName}, function(err, estate){
    if(err)res.send('error');
    if(!estate)res.status(422).send({error: 'Invalid estate name'});
    else{
      base = invite.substring(0, estate.offset[0]);
      block = invite.substring(estate.offset[0], estate.offset[0] + 2);
      unit = invite.substring(estate.offset[0] + 2);
      //if(base !== estate.inviteCode)res.status(422).send({error: 'Invalid invite code'});
      Resident.findOne({
        'estateName' : req.body.estateName,
        'unit' : unit,
        'block' : block
      })
      .then(resident => {
        if(resident){
          res.status(422).send({error: 'That unit address has an account'});
        }else{
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
            res.status(201).json({
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
    Resident.findOne({'email' : req.body.email}, function(err, user){
      if(err)res.status(422).send({error: 'Login Failed. Try again.'});
      if(!user)res.status(422).send({error: 'Login Failed. Try again.'});
      user.comparePassword(req.body.password, function(err, isMatch){
        if(!isMatch){
          res.status(422).send({error: 'Login Failed. Try again.'});
        }else{
          var userInfo = setUserInfo(user);
          res.status(200).json({
            token: 'JWT ' + generateToken(userInfo),
            user: userInfo
          });
        }
     })
   })
})

app.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  console.log('in');
  console.log(req.headers);
  var token = req.headers['authorization'];
  if (!token) return next(); //if no token, continue

  token = token.replace('Bearer ', '');

  jwt.verify(token, process.env.JWT_SECRET, function(err, user) {
    if (err) {
      return res.status(401).json({
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
    res.status(200).json({
      estateName: req.user.estateName,
      polls: polls
    });
  })
})

app.get('/viewpoll', (req, res) => {
  var id = req.query.id;
  var promiseArray = []
  Poll.findById(id, function(err, poll){
    for(var i =0 ;i < poll.fileLinks; i++){
      var folder = `${req.user.estateName}/${poll.projectName}`
      var urlPar = {Bucket: 'telospdf', Key: `${folder}/${poll.fileLinks[i]}`};
      var urlPromise = s3Bucket.getSignedUrl('getObject', urlPar);
      promiseArray.push(urlPromise);
    }
    Promise.all(tempArray)
    .then(function(responses){
      console.log(responses);
      res.status(200).json({
        poll : poll,
        links : responses
      });
    })
    .catch(err => {
      console.log(err);
    })

  })
})

app.post('/vote', (req, res) => {
  var id = req.query.id;
  var choice = req.body.choice;
  Poll.findById(id, function(err, poll){
    if(poll.voted.indexOf(req.user.id) !== -1 ){
      res.send('you have already voted')
    }
    else{
      poll.votes.push(option)
    }
    poll.save(function(err, poll){
      res.send("Thanks for voting, your vote has been recorded");
    })
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
