const express = require('express');
const router = express.Router();
var crypto = require('crypto');
var tokenSecret = 'piQqgR98eAJJtF[92mRoAnV]U3}sUhtPd$z&vW]>h7%Us3R24ZL)Kb3)'
const models = require('../models/models');
const Estate = models.Estate;
const User = models.User;
const Resident = models.Resident;
const Tender = models.Tender;
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

router.post('/submitTender', (req, res) => {
    const body = req.body
    console.log(body, "bd", req.payload)
    var originalBlob = body.file;  
    if (originalBlob && originalBlob !== '' && typeof(originalBlob !== "number" && originalBlob !== null)) {
      if(body.fileType == "application/pdf"){
      var base64Data  = originalBlob;
      var buf         = new Buffer(base64Data, 'base64');
      var newName     = (new Date()).valueOf();
      var newfilename = newName +'.pdf';   
      var data = {
                Bucket: BucketName,
                Key: 'tenderNotice/'+newfilename,
                Body: originalBlob,
                ContentType: 'application/pdf',
                ContentDisposition: 'inline',
                ACL: "public-read"
            }; 
            bucket.putObject(data, function (err, data) {
                if (err) {
                    console.log('Error uploading data: ', err);
                } else {
                  console.log("doneeeeeeeeeeeeee", data)
                  saveTender(avatarS3Url);
                }
            });
      }
     else{
      var regex       = /^data:.+\/(.+);base64,(.*)$/;
      var matches     = originalBlob.match(regex);
      var base64Data  = matches && matches.length && matches[2] ? matches[2] : '';
      var buf         = new Buffer(base64Data, 'base64');
      var newName     = (new Date()).valueOf();
      var newfilename = newName +'.png';   
     
      console.log("h1")
      bucket.putObject({
        Body: buf,
        Key: 'tenderNotice/'+newfilename,
        ACL: 'public-read'
      }, function(err, data1) {
        if (err) {
          console.log(err)
        }
        if(data1) {
          console.log("h12")
          avatarS3Url = "https://s3-ap-southeast-1.amazonaws.com/telospdf/tenderNotice/"+newfilename
          saveTender(avatarS3Url);
        }
      })
    }
    } else {
      avatarS3Url = ''
      saveTender(avatarS3Url);
    }
    function saveTender(avatarS3Url){
    const data = {}
    data.noticeTitle = body.noticeTitle
    data.projectCategory = body.noticeTitle
    data.description = body.noticeTitle
    data.effectiveUntil = body.noticeTitle
    data.image = avatarS3Url
    const tender = new Tender(data);
      tender.save(function(err, tender){
        if(err){
        res.json({success : false, message: "網絡連接問題 |Network Error"});
      }
      if(tender){
        console.log("helloo")
        res.json({success : true, message: "Tender Saved Successfully"});
      }
      })
    }
})

router.get('/currentTender', (req, res) => {
  console.log("hello")
    const body = req.body
    Tender.find()
    .then(function(tenders ,err){
       console.log(tenders, "tenders")
      if(err) res.send(err);
      if(tenders){
        console.log(tenders, "tenders")
      res.json({success: true, tenders: tenders })
      }
    })
})

module.exports = router;
