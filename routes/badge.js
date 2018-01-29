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
  var getMeetings = new Promise(function(f, r) {
    const estateName = req.body.estateName;
    Resident.aggregate([
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
      //console.log(data[0].tags, "data")
      var proxyAppointed = data[0].tags
      Meeting.find({_id: {$nin: proxyAppointed}})
      .then(function(meetings, err){
        if(err) res.send(err);
        f(meetings)
        //console.log(meetings," meetings")
      })
    })
    // check meetings, check surveys. 

})

  var getSurveys = new Promise(function(f, r) {
    UserAnswers.aggregate([
    { "$group": {
      "_id": null,
      "count": { "$sum": 1 },
      "survey": { "$addToSet": "$surveyId" }
    }}
    ])
    .then(function(data, err){
     // console.log(data, "data")
      var surveys = data[0].survey
      Survey.find({_id: {$nin: surveys}})
      .then(function(sur, err){
        if(err) res.send(err);
        f(sur)
        //console.log(meetings," meetings")
      })
    })
    })

    Promise.all([getMeetings, getSurveys])
  .then(function(data) {
    console.log(data)
    res.json({newMeetings: data[0], newSurveys: data[1]})
   // console.log(data, "data")
  })
})


module.exports = router