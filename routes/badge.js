const express = require('express');
const router = express.Router();
const models = require('../models/models');
const Meeting = models.Meeting;
const Poll = models.Poll;
const Resident = models.Resident;
const Survey = models.Survey;
const UserAnswers = models.UserAnswers;
const _ = require('lodash');
const forEach = require('async-foreach').forEach;
const dateFormat = require('dateformat');
var Promise = require('bluebird');
var moment = require("moment");


router.get('/getBadge', (req,res) => {
  console.log(req.body, "helooooooo")
  const estateName = "HKU"//req.body.estateName;
  const account = "hku1" //req.body.account
  var getMeetings = new Promise(function(f, r) {
    Resident.aggregate([
    { $match : { estateName : estateName , account: account} },
    { "$group": {
      "_id": null,
      "count": { "$sum": 1 },
      "tags": { "$addToSet": "$proxyAppointed" }
    }},
    { "$addFields": {
      "tags": {
        "$reduce": {
          "input": "$tags",
          "initialValue": [],
          "in": { "$setUnion": [ "$$value", "$$this" ] }
        }
      }
    }}
    ])
    .then(function(data, err){
     //console.log(data[0], "data")
      var proxyAppointed = data[0].tags
      Meeting.find({_id: {$nin: proxyAppointed}, estate: estateName})
      .then(function(meetings, err){
        //console.log(meetings, "meetings")
        if(err) res.send(err);
        var todayDate = new Date()
        var uniqueList1 = _.filter(meetings, function(item, key, a){   
          return (!(todayDate != new Date(item.endTime) && todayDate > new Date(item.endTime))) ? item._id : ''
       });
        //console.log(uniqueList1, "uniqueList")
        f(uniqueList1)
        //console.log(meetings," meetings")
      })
    })
    // check meetings, check surveys. 

})

  var getSurveys = new Promise(function(f, r) {
    UserAnswers.aggregate([
    {$match: { estateName : estateName}},
    { "$group": {
      "_id": null,
      "count": { "$sum": 1 },
      "survey": { "$addToSet": "$surveyId" }
    }}
    ])
    .then(function(data, err){
    console.log(data, "data")
    var surveys = []
    if(data.length != 0){
       surveys = data[0].survey
    }
      Resident.findOne({estateName: estateName, account: account}).populate('surveys')
      .then(function(sur, err){
        console.log(sur, "surrrr")
        var todayDate = new Date()
        var uniqueList = _.filter(sur.surveys, function(item, key, a){   
          return (!(todayDate != new Date(item.effectiveTo) && todayDate > new Date(item.effectiveTo))) ? item._id : ''
       });
        console.log(uniqueList, "uniqueList")
         var list = _.map(uniqueList, '_id');
         console.log(list, "list")
        var unanswered = _.differenceWith(list,surveys, _.isEqual);
        console.log(unanswered, "unanswered")
        if(err) res.send(err);
        f(unanswered)
        //console.log(sur," sur")
      })
    })
    })

    Promise.all([getMeetings, getSurveys])
  .then(function(data) {
    //console.log(data)
    res.json({newMeetings: data[0], newSurveys: data[1]})
   // console.log(data, "data")
  })
})


module.exports = router