const express = require('express');
const router = express.Router();
const models = require('../models/models');
const Meeting = models.Meeting;
const Poll = models.Poll;
const _ = require('lodash');
const forEach = require('async-foreach').forEach;
const dateFormat = require('dateformat');
const BucketName = 'telospdf';
let currDate = new Date(); 
var Promise = require('bluebird');
var moment = require("moment");
const Resident = models.Resident;

var AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: 'AKIAIMLMZLII2XCKU6UA',
  secretAccessKey: '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',
  region: 'ap-southeast-1'
});

const bucket = new AWS.S3({params: {Bucket: BucketName}});

/*Finding the past meeeting*/
router.get('/pastMeetings', (req, res) => {
  const estateName = "HKU" // req.user.estateName
    Meeting.find({estate: estateName}).populate('polls').lean().then(function(meetings, err){
        const promiseArr = []
        var pastMeetings = []

          if(meetings.length > 0) {
            promiseArr.push(new Promise(function(resolve, reject){
               forEach(meetings, function(item, key, a){
                  if( item.fileLinks && item.fileLinks.length > 0) {
                      let fileLinks = [];
                      var titleLink = ''
                      var fileLinksLink = ''
                        if(item.title){
                        titleLink = item.title
                        titleLink = titleLink.trim();
                        }
                        if(item.fileLinks[0]){
                            fileLinksLink = item.fileLinks[0]
                            fileLinksLink = fileLinksLink.trim();
                        }
                          let Key = `${req.user.estateName}/${titleLink}/${fileLinksLink}`;
                          fileLinks.push({
                            name: item.fileLinks[0],
                            url: "https://"+BucketName+".s3.amazonaws.com/"+Key
                          })
                          item.fileLinks = fileLinks;
                    }   
                    if(item.polls){
                        forEach(item.polls, function(poll, key, a){ 
                            var pollEndTime = moment(new Date(poll.endTime));
                            item.polls[key].endTime = pollEndTime.format("MM-DD-YYYY");
                        let polefileLinks = []; 
                        if(poll.fileLinks){ 
                            forEach(poll.fileLinks, function(name, key, a){ 
                                let fileLinks = [];
                              var titleLink = ''
                              var fileLinksLink = ''
                              if(poll.title){
                              titleLink = poll.title
                              titleLink = titleLink.trim();
                        }
                        if(name){
                            fileLinksLink = name
                            fileLinksLink = fileLinksLink.trim();
                        }
                          let Key = `${req.user.estateName}/${titleLink}/${fileLinksLink}`;
                          polefileLinks.push({
                            name: name,
                            url: "https://"+BucketName+".s3.amazonaws.com/"+Key
                          })
                          poll.fileLinks = polefileLinks;
                        })
                       }
                    })
                   }
                    var startTime = moment.utc(new Date(item.startTime));
                    item.startTime =  startTime.format("MM/DD/YYYY hh:mm a");
                    console.log(item)
                    if(Date.parse(new Date(item.endTime)) < Date.parse(new Date)){
                      var endTime = moment.utc(new Date(item.endTime));
                    item.endTime =  endTime.format("MM/DD/YYYY hh:mm a");
                    pastMeetings.push(item)
                    }
                    resolve(pastMeetings)
                })
            }))
            Promise.all(promiseArr)
              .then(function(data){
               res.json({pastMeetings: data[0], success: true})             
              })
        }
         else{
              res.json({message: "No Meetings Found", success: true})
          }
    })
})
/*Finding the current meeeting*/
router.get('/currentMeetings', (req, res) => {
  const estateName = "HKU" // req.user.estateName
    Meeting.find({estate: estateName}).populate('polls').lean().then(function(meetings, err){
        const promiseArr = []
        const proxyAppointed = []
        var currentMeetings = []
        //check whether telos is appointed
        if(meetings.length > 0) {
            promiseArr.push(new Promise(function(resolve, reject){
               forEach(meetings, function(item, key, a){
                if( item.fileLinks && item.fileLinks.length > 0) {
                      let fileLinks = [];
                      var titleLink = ''
                      var fileLinksLink = ''
                        if(item.title){
                        titleLink = item.title
                        titleLink = titleLink.trim();
                        }
                        if(item.fileLinks[0]){
                            fileLinksLink = item.fileLinks[0]
                            fileLinksLink = fileLinksLink.trim();
                        }
                        let Key = `${req.user.estateName}/${titleLink}/${fileLinksLink}`;
                        fileLinks.push({
                          name: item.fileLinks[0],
                          url: "https://"+BucketName+".s3.amazonaws.com/"+Key
                        })
                        item.fileLinks = fileLinks;
                }   
                if(item.polls){
                  forEach(item.polls, function(poll, key, a){ 
                      var pollEndTime = moment(new Date(poll.endTime));
                      item.polls[key].endTime = pollEndTime.format("MM-DD-YYYY");
                  let polefileLinks = []; 
                  if(poll.fileLinks){ 
                      forEach(poll.fileLinks, function(name, key, a){ 
                          let fileLinks = [];
                        var titleLink = ''
                        var fileLinksLink = ''
                        if(poll.title){
                        titleLink = poll.title
                        titleLink = titleLink.trim();
                        }
                        if(name){
                            fileLinksLink = name
                            fileLinksLink = fileLinksLink.trim();
                        }
                          let Key = `${req.user.estateName}/${titleLink}/${fileLinksLink}`;
                          polefileLinks.push({
                            name: name,
                            url: "https://"+BucketName+".s3.amazonaws.com/"+Key
                          })
                        poll.fileLinks = polefileLinks;
                      })
                  }
                  })
               }     
                     var startTime = moment.utc(new Date(item.startTime));
                     item.startTime =  startTime.format("MM/DD/YYYY hh:mm a");
                      if(item.view > 0 ){
                        console.log("hhhh")
                        Resident.update({email: req.email,
                          $push: {
                            proxyAppointed: item._id
                          }
                          })
                        .then(function(Resident, err){
                          console.log(Resident)
                        })
                      }
                      if(Date.parse(new Date(item.endTime)) > Date.parse(new Date)){
                        var endTime = moment.utc(new Date(item.endTime));
                      item.endTime =  endTime.format("MM/DD/YYYY hh:mm a");
                      currentMeetings.push(item)
                      }
                    resolve(currentMeetings)
                })
            }))
            Promise.all(promiseArr)
            .then(function(data){
              res.json({currentMeetings: data[0], success: true})             
            })
        }
       else{
            res.json({message: "No Meetings Found", success: true})
        }
    })
})
/*Voting for a particular Meeting's Poll*/
router.post('/vote', (req, res) => {
  const residentId = "5a335e49fbb210c93ff37d66"
  const body = { hkid: "0",
  pollId: "5a3221dfc508057f5352d86c",
  choice: "Hello" }
   Resident.findOne({_id: residentId,  hkid:  body.hkid })
   .then(function(data, err){
    if(data){
         Poll.update({_id: body.pollId},
        {$set: 
          { votingResults: {choice: body.choice, resident: residentId} ,
          }
        }, {
        new: true
        })
        .then(function(poll, err){
        Resident.update({_id: residentId},
        {$push: 
          { polls: body.pollId,
          }
        }, {
        new: true
        })
        .then(function(pass, err){
          res.json({
            success : true,
              // token: 'JWT ' + generateToken(userInfo),
            message: "choice has just been saved"
          });
        })
      })
    }else{
      res.json({
          success : true,
            // token: 'JWT ' + generateToken(userInfo),
          message: "HKID Does Not Match"
        });
    }
   })
})

module.exports = router;