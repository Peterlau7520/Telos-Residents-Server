const express = require('express');
const router = express.Router();
var crypto = require('crypto');
const models = require('../models/models');
const Estate = models.Estate;
const Resident = models.Resident;
const Poll = models.Poll;
const jwt = require('jsonwebtoken');
const bcrypt   = require('bcrypt-nodejs');

function generateToken(user){
  return jwt.sign(user, 'telosresidentserver', {
    expiresIn: 10080
  });
}

exports.genHashPassword = function(pass){
  var SALT_FACTOR = 5;
    bcrypt.genSalt(SALT_FACTOR, function(err, salt){
      console.log("salt", salt)

        if(err){
            return err
        }

        bcrypt.hash(pass, salt, null, function(err, hash){
          console.log(hash, "hash")
            if(err){
                return err;
            }
            return hash;
           

        });
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

/*function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}*/


router.post('/register', (req, res) => {
    console.log("reached route register", req.body);
    //var invite = decrypt(req.body.inviteCode);
    var invite = req.body.inviteCode
    console.log(invite);
    Estate.findOne({'estateName': req.body.estateName}, function(err, estate){
      console.log(estate);
      if(err){
        console.log("1");
        res.json({success : false, message: "Network Error"});
      }
      if(!estate){
        console.log("2");const Estate = models.Estate;

        res.json({success : false , message: "Invalid Estate Name"});
      }
      if(invite.indexOf(estate.inviteCode) == -1){
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
              // unit: unit. Add it back later
              // block: block. Add it back later
              password: req.body.password,
              estateName : estate.estateName
            });
            user.save(function(err, user){
              var userInfo = setUserInfo(user);
              console.log("reached here", 'JWT ' + generateToken(userInfo))
              res.json({
                success: true,
                token: 'JWT ' + generateToken(userInfo),
                user: userInfo
              })
            })
          }
        })
        .catch(err => {
          if(err)res.status(422).send({error: 'Try again'});
        })
      }
    })
  })


router.post('/login', (req, res) => {
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
          message : "Account Does Not Exist"
        });
        // res.status(404).send({error: 'Login Failed. Try again.'});
      }
      else{
        console.log('3');
        user.comparePassword(req.body.password, function(err, isMatch){
          if(!isMatch){
            res.json({success : false, message: "Wrong Password"});
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


router.post('/changePassword', (req, res) => {
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
          message : "Account Does Not Exist"
        });
        // res.status(404).send({error: 'Login Failed. Try again.'});
      }
      else{
        console.log('3');
        user.comparePassword(req.body.oldPassword, function(err, isMatch){
          if(!isMatch){
            res.json({success : false, message: "Old Password Does Not Match"});
          }else{
            var pass = exports.genHashPassword(req.body.password)
            console.log(pass, "pass")
            /*Resident.update({_id: user._id},
             {$set: { password: pass }
            }, {
              new: true
            })
            .then(function(pass, err){
            res.json({
              success : true,
              // token: 'JWT ' + generateToken(userInfo),
              message: "Password Updated Successfully"
            });
          })*/
          }
       })
      }
   })
})
module.exports = router;
