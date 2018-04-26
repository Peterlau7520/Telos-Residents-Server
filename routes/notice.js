const express = require('express');
const router = express.Router();
const models = require('../models/models');
const Notice = models.Notice;
const Resident = models.Resident;
const _ = require('lodash');
const forEach = require('async-foreach').forEach;
const dateFormat = require('dateformat');
const BucketName = 'telospdf';
var AWS = require('aws-sdk');

function compareDate(noticeA,noticeB){
  if (noticeA.postDate > noticeB.postDate)
      return -1;
  if (noticeA.postDate < noticeB.postDate)
      return 1;
  return 0;
}


AWS.config.update({
    accessKeyId: process.env.AWS_accessKeyId,
    secretAccessKey: process.env.AWS_secretAccessKey,
    region: 'ap-southeast-1'
});

const bucket = new AWS.S3({params: {Bucket: BucketName}});
router.post('/noticeBoard', (req, res) => {
  console.log(req.body, "rrrrrrrrrr");
   Notice
  .find({estate: req.body.estateName})
  .lean()
  .then(function(notices, err) {
    var allNotices = _.map(notices, '_id');
    if(notices.length){
    var todayDate = new Date()
    var uniqueList = _.filter(notices, function(item, key, a){   
    return (todayDate != new Date(item.endTime) && todayDate > new Date(item.endTime)) ? item._id : ''
       });
    var result = _.map(uniqueList, '_id');
    var uniqueList2 = _.filter(notices, function(item, key, a){   
        if(item.fileLinks.length > 0) {
              let fileLinks = [];
                var date = item.postDate.split(" ").join("");
                let Key = `${req.body.estateName}/Notices/${item._id}`
                //let Key = `${req.body.estateName}/Notices/${item.title.replace(/ /g,'')}/${date}/${item.fileLinks[0]}`;
                fileLinks.push({
                  name: 'document.pdf',
                  url: "https://"+BucketName+".s3.amazonaws.com/"+ Key //'.pdf'
                })
              item.fileLinks = fileLinks;
            }
    return (!(todayDate != new Date(item.endTime) && todayDate > new Date(item.endTime))) ? item._id : ''
       });
       uniqueList.sort(compareDate);
       uniqueList2.sort(compareDate);
       //console.log(allNotices, "allNotices")
       Resident.findOne({estateName: req.body.estateName, account: req.body.account})
       .then(function(Resident, err){
        if(err) res.send(err)
          //console.log(Resident, "Residentss")
        var unread = _.differenceWith(allNotices ,Resident.viewedNotice, _.isEqual);
        //console.log(unread, "unread")
      res.json({message: "Notices Found", success: true, notices: uniqueList2,viewedNotice:Resident.viewedNotice, unreadNotices:unread  });
      })
    }else{
            res.json({message: "暫時沒有通告 | No Notices Found", success: false});
    }
  })
})

router.post('/viewedNotice', (req, res) => {
  const data = req.body //{noticeId: "5a586acc77a69431a09f7146", account: "hku1"}
  Resident.findOneAndUpdate({account: data.account
             }, {
               $addToSet: { 
                  viewedNotice: data.noticeId,
               }
             },{ 
               new: true 
             })
  .then(function(Resident, err){
    if(err) res.send(err);
    res.json({message: "updated successfully", viewedNotices: Resident.viewedNotice})
    //console.log(Resident, "re")
  })
})
module.exports = router;