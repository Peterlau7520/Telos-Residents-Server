const express = require('express');
const router = express.Router();
var crypto = require('crypto');
const models = require('../models/models');
const Estate = models.Estate;
const Resident = models.Resident;
const Poll = models.Poll;
const forEach = require('async-foreach').forEach;
const jwt = require('jsonwebtoken');
const bcrypt   = require('bcrypt-nodejs');
const BucketName = 'telospdf';
var AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: 'AKIAIMLMZLII2XCKU6UA',
  secretAccessKey: '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',
  region: 'ap-southeast-1'
});
const bucket = new AWS.S3({params: {Bucket: BucketName}});
function generateToken(user){
  return jwt.sign(user, 'telosresidentserver', {
    expiresIn: 10000080
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
    account: request.account,
    estateName: request.estateName,
    unit: request.unit,
    nature: request.nature,
    registered: request.registered,
    numberOfOwners: request.numberOfOwners,
    proxyAppointed: request.proxyAppointed
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
    Estate.findOne({'account': req.body.account}, function(err, estate){
      console.log(estate);
      if(err){
        res.json({success : false, message: "Network Error"});
      }
      if(!estate){
        const Estate = models.Estate;
        res.json({success : false , message: "Invalid Estate Name"});
      }
      if(invite.indexOf(estate.inviteCode) == -1){
        console.log(invite, estate.inviteCode);
        res.json({success : false , message: "Invalid Invite Code"});
      }
      else{
        Resident.findOne({
          'estateName' : req.body.estateName,
          'unit' : req.body.unit,
          'block' : req.body.block,
        })
        .then(resident => {
          if(resident){
            res.json({success : false ,  message : "Your unit is already registered."});
          }else{
            user = new Resident({
              name: req.body.name,
              email: req.body.email,
              unit: req.body.unit,
              password: req.body.password,
              estateName : estate.estateName,
              shares: req.body.shares,
              block: req.body.block,
              floor: req.body.floor,
              nature: req.body.nature
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
    Resident.findOne({'account' : req.body.account}, function(err, user){
      if(err){
        res.json({success : false, message: "網絡連接有誤 | Network Error"});
      }
      if(!user){
          res.json({
          success : false,
          message : "賬戶不存在 | Account does not exist"
        });
      }
      else{
          console.log(user.password);
          if(req.body.password !== user.password){
            res.json({success : false, message: "密碼不正確 | Wrong Password"});
          }else{
              var userInfo = setUserInfo(user);
              res.json({
                success : true,
                token:generateToken(userInfo),
                user: userInfo
              });
          }

      }
   })
})


router.post('/changePassword', (req, res) => {
    console.log("reached here", req.body);
    Resident.findOne({'account' : req.body.account}, function(err, user){
      if(err){
        res.json({success : false, message: "網絡連接有誤 | Network Error"});
      }
      if(!user){
        res.json({
          success : false,
          message : "賬戶不存在 | Account does not exist"
        });
        // res.status(404).send({error: 'Login Failed. Try again.'});
      }
      else{
        user.comparePassword(req.body.oldPassword, function(err, isMatch){
          if(!isMatch){
            res.json({success : false, message: "Old Password Does Not Match"});
          }else{
            const saltRounds = 5;
            var salt = bcrypt.genSaltSync(saltRounds);
            var hash = bcrypt.hashSync(req.body.password, salt);
            console.log(hash, "pass")
            Resident.update({_id: user._id},
             {$set: { password: hash }
            }, {
              new: true
            })
            .then(function(pass, err){
            res.json({
              success : true,
              // token: 'JWT ' + generateToken(userInfo),
              message: "Password Updated Successfully"
            });
          })
          }
       })
      }
   })
})


router.post('/saveHKID', (req, res) => {
console.log(req.body, "reqqqq")
var hkids = []
const promiseArr = []
var info = req.body;
var avatarS3Url = [];
//var originalBlob = info.hkidsArray; 
if (req.body.hkids && req.body.hkids !== '' && req.body.hkids !== null){
  forEach(req.body.hkids, function(item, key, a){
  promiseArr.push(new Promise(function(resolve, reject){
    var originalBlob = item.image
    var regex       = /^data:.+\/(.+);base64,(.*)$/;
    var matches     = originalBlob.match(regex);
    var base64Data  = matches && matches.length && matches[2] ? matches[2] : '';
    var buf         = new Buffer(base64Data, 'base64');
    hkids.push(item.hkid)
      bucket.upload({
        Body: buf,
        Key: `HKIDs/${item.hkid}/HKId.png`,
        ACL: 'public-read'
      }, function(err, data1) {
        if (err) {
          console.log(err)
        }
        if(data1) {
          avatarS3Url.push(data1.Location)
          console.log(avatarS3Url, "avatarS3Url")
          resolve({image: avatarS3Url, hkids: hkids})
        }
      })
  }))
   })
  Promise.all(promiseArr)
    .then(function(data, err){
      update(req, res, data[0]);
    })
}
else {
      update(req, res, '');
    }
    function update(req, res, data){
      console.log("reeeeee", req.body.account)
      Resident.update({account: req.body.account},
        {$set: 
          { hkid: data.hkids,
            hkidImage: data.image,
          }
        }, {
        new: true
        })
        .then(function(pass, err){
          console.log(pass, "pass")
        res.json({
          success : true,
            // token: 'JWT ' + generateToken(userInfo),
          message: "Resident Updated Successfully"
        });
      })
    }
})


router.post('/saveSignature', (req, res) => {
  console.log(req.body, "rrrrr")
const promiseArr = []
 var avatarS3Url = '';
if (req.body.signatures && req.body.signatures !== '' && req.body.signatures !== null){
  promiseArr.push(new Promise(function(resolve, reject){
    forEach(req.body.signatures, function(item, key, a){
      console.log(key, "key")
    var originalBlob = item.image
    var regex       = /^data:.+\/(.+);base64,(.*)$/;
    var matches     = originalBlob.match(regex);
    var base64Data  = matches && matches.length && matches[2] ? matches[2] : '';
    var buf         = new Buffer(base64Data, 'base64');
      bucket.upload({
        Body: buf,
        Key: `${item.estate}/OwnersSignature/${item.account}/signature${key}.png`,
        ACL: 'public-read'
      }, function(err, data1) {
        if (err) {
          console.log(err)
        }
        if(data1) {
          console.log(data1)
          avatarS3Url = data1.Location
          resolve(avatarS3Url)
        }
      })

    })
  }))
}
else {
      update(req, res, '');
    }
    Promise.all(promiseArr)
    .then(function(data, err){
      update(req, res, data);
    })
    function update(req, res, fileLinks){
      const body = {residentId: "5a335e49fbb210c93ff37d66"} //req.body
      Resident.update({account: req.body.signatures[0].account},
        {$set: 
          { 
            signature: fileLinks,
          },
          $push:{
            proxyAppointed: req.body.meeting_id
          }
        }, {
        new: true
        })
        .then(function(pass, err){
          console.log("pass", pass)
          res.json({
            success : true,
              // token: 'JWT ' + generateToken(userInfo),
            message: "Resident Updated Successfully"
          });
      })
    }
})

router.post('/saveChop', (req, res) => {
  console.log("r", req.body)
   const body = { residentId: "",
  chopArray:  [ { file: {}, companyName: ''}, { file: {}, companyName: ''}] }
const promiseArr = []
var info = req.body;
 var avatarS3Url = '';
if (req.body && req.body !== '' && req.body !== null){
  promiseArr.push(new Promise(function(resolve, reject){
    var originalBlob = req.body.image
    var regex       = /^data:.+\/(.+);base64,(.*)$/;
    var matches     = originalBlob.match(regex);
    var base64Data  = matches && matches.length && matches[2] ? matches[2] : '';
    var buf         = new Buffer(base64Data, 'base64');
   /* var info = item.file.data;
    var name = info.file.name;*/
      bucket.upload({
        Body: buf,
        Key: `CompanyChop/${req.body.account}/CHOP.png`,
        ACL: 'public-read'
      }, function(err, data1) {
        if (err) {
          console.log(err)
        }
        if(data1) {
          console.log("data1", data1)
          avatarS3Url = data1.Location
          resolve(avatarS3Url)
        }
      })
      }))
}
else {
      update(req, res, '');
    }
    Promise.all(promiseArr)
    .then(function(data, err){
      update(req, res, data);
    })
    function update(req, res, fileLinks){
      Resident.update({account: req.body.account},
        {$set: 
          { chopImage: fileLinks,
          }
        }, {
        new: true
        })
        .then(function(pass, err){
          console.log(pass, "pass")
        res.json({
          success : true,
            // token: 'JWT ' + generateToken(userInfo),
          message: "Comapny Chop Updated Successfully"
        });
      })
    }
})




module.exports = router;
