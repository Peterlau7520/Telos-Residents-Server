const express = require('express');
const router = express.Router();
var crypto = require('crypto');
const models = require('../models/models');
const Estate = models.Estate;
const Resident = models.Resident;
const Poll = models.Poll;
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
    email: request.email,
    account: request.account,
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
    Resident.findOne({'email' : req.body.email}, function(err, user){
      if(err){
        res.json({success : false, message: "Network Error"});
      }
      if(!user){
          res.json({
          success : false,
          message : "Account Does Not Exist"
        });
        // res.status(404).send({error: 'Login Failed. Try again.'});
      }
      else{
        user.comparePassword(req.body.password, function(err, isMatch){
          if(!isMatch){
            res.json({success : false, message: "Wrong Password"});
          }else{
            if(user.registered == true){
              var userInfo = setUserInfo(user);
              res.json({
                success : true,
                // token: 'JWT ' + generateToken(userInfo),
                token:generateToken(userInfo),
                user: userInfo,
                registered: true
              });
            }
            else{
              var userInfo = setUserInfo(user);
              res.json({
                success : true,
                // token: 'JWT ' + generateToken(userInfo),
                token:generateToken(userInfo),
                user: userInfo,
                registered: false,
                nature: user.nature,
                numberOfOwners: user.numberOfOwners,
              });
            }
          }
        })
      }
   })
})


router.post('/changePassword', (req, res) => {
    console.log("reached here", req.body);
    Resident.findOne({'email' : req.body.email}, function(err, user){
      if(err){
        res.json({success : false, message: "Network Error"});
      }
      if(!user){
        res.json({
          success : false,
          message : "Account Does Not Exist"
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
const body = { residentId: "",
  hkidsArray:  [ { file: {}, hkid: "1", ownersName: 'peter'}, { file: {}, hkid: "1", ownersName: 'peter'}] }
const promiseArr = []
var info = req.body;
var avatarS3Url = '';
var originalBlob = info.hkidsArray; 
if (originalBlob && originalBlob !== '' && originalBlob !== null){
  promiseArr.push(new Promise(function(resolve, reject){
    forEach(originalBlob, function(item, key, a){
    var info = item.file.data;
    var name = info.file.name.replace(/ /g,'');
    hkids.push(item.hkid)
      s3.upload({
        Body: info,
        Key: `${req.user.estateName}/${item.hkid}/${item.ownersName}/${name}`,
        ACL: 'public-read'
      }, function(err, data1) {
        if (err) {
          console.log(err)
        }
        if(data1) {
          avatarS3Url = data1.Location
          resolve({image: avatarS3Url, hkids: hkids})
        }
      })

    })
  }))
  Promise.all(promiseArr)
    .then(function(data, err){
      update(req, res, data);
    })
}
else {
      update(req, res, '');
    }
    function update(req, res, data){
      const body = {residentId: "5a335e49fbb210c93ff37d66"}               //req.body
      Resident.update({_id: body.residentId},
        {$set: 
          { hkid: data.hkids,
            hkidImage: data.image,
          }
        }, {
        new: true
        })
        .then(function(pass, err){
        res.json({
          success : true,
            // token: 'JWT ' + generateToken(userInfo),
          message: "Resident Updated Successfully"
        });
      })
    }
})


router.post('/saveSignature', (req, res) => {
  const body = { residentId: "",
  signatureArray:  [ { file: {}, ownersName: 'peter'}, { file: {}, ownersName: 'peter'}] }
const promiseArr = []
var info = req.body;
 var avatarS3Url = '';
var originalBlob = info.signatureArray; 
if (originalBlob && originalBlob !== '' && originalBlob !== null){
  promiseArr.push(new Promise(function(resolve, reject){
    forEach(originalBlob, function(item, key, a){
    var info = item.file.data;
    var name = info.file.name;
      s3.upload({
        Body: buf,
        Key: `${req.user.estateName}/OwnersSignature/${item.ownersName}/${name}`,
        ACL: 'public-read'
      }, function(err, data1) {
        if (err) {
          console.log(err)
        }
        if(data1) {
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
      Resident.update({_id: body.residentId},
        {$set: 
          { signature: fileLinks,
          }
        }, {
        new: true
        })
        .then(function(pass, err){
        res.json({
          success : true,
            // token: 'JWT ' + generateToken(userInfo),
          message: "Resident Updated Successfully"
        });
      })
    }
})

router.post('/saveChop', (req, res) => {
   const body = { residentId: "",
  chopArray:  [ { file: {}, companyName: ''}, { file: {}, companyName: ''}] }
const promiseArr = []
var info = req.body;
 var avatarS3Url = '';
var originalBlob = info.chopArray; 
if (originalBlob && originalBlob !== '' && originalBlob !== null){
  promiseArr.push(new Promise(function(resolve, reject){
    forEach(originalBlob, function(item, key, a){
    var info = item.file.data;
    var name = info.file.name;
      s3.upload({
        Body: buf,
        Key: `${req.user.estateName}/CompanyChop/${item.companyName}/${name}`,
        ACL: 'public-read'
      }, function(err, data1) {
        if (err) {
          console.log(err)
        }
        if(data1) {
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
      Resident.update({_id: body.residentId},
        {$set: 
          { chopImage: fileLinks,
          }
        }, {
        new: true
        })
        .then(function(pass, err){
        res.json({
          success : true,
            // token: 'JWT ' + generateToken(userInfo),
          message: "Resident Updated Successfully"
        });
      })
    }
})




module.exports = router;
