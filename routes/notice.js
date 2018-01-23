const express = require('express');
const router = express.Router();
const models = require('../models/models');
const Notice = models.Notice;
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
  accessKeyId: 'AKIAIMLMZLII2XCKU6UA',
  secretAccessKey: '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',
  region: 'ap-southeast-1'
});

const bucket = new AWS.S3({params: {Bucket: BucketName}});
router.post('/noticeBoard', (req, res) => {
  console.log(req.body);
   Notice
  .find({estate: req.body.estateName})
  .lean()
  .then(function(notices, err) {
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
                  name: item.fileLinks[0],
                  url: "https://"+BucketName+".s3.amazonaws.com/"+Key + '.pdf'
                })
              item.fileLinks = fileLinks;
            }
    return (!(todayDate != new Date(item.endTime) && todayDate > new Date(item.endTime))) ? item._id : ''
       });
       uniqueList.sort(compareDate);
       uniqueList2.sort(compareDate);
      res.json({message: "Notices Found", success: true, notices: uniqueList2});
    }else{
            res.json({message: "暫時沒有通告 | No Notices Found", success: false});
    }
  })
})

module.exports = router;