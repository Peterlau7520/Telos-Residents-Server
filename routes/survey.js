const express = require('express');
const router = express.Router();
const forEach = require('async-foreach').forEach;
const dateFormat = require('dateformat');
const models = require('../models/models');
const _ = require('lodash');
var moment = require("moment");
var Promise = require('bluebird');
//Data models
const Estate = models.Estate;
const Survey = models.Survey;
const Question = models.Question;
const Options = models.Options;
const Resident = models.Resident;
const UserAnswers = models.UserAnswers;

router.post('/allSurveys', (req, res) => {
  const promiseArr =[];
  Survey.find({estate: req.body.estateName}).lean()
  .then(function(survey, err) {
    console.log(survey, "survey")
    if(survey.length){
        var todayDate = new Date()
        _.forEach(survey, function(surv, index) {
        promiseArr.push(new Promise(function(resolve, reject){
        Question.find({surveyId: surv._id}).populate('optionIds').lean()
            .then(function(que, err){
            surv.question = que
            resolve(survey)
        })     
        }))
        });
        var list = ''
        Promise.all(promiseArr)
        .then(function(data, err){
            list = data[0]
            console.log(data, "data")
            _.forEach(data[0], function(sur, index) {
            var currentDate = moment(new Date());
            currentDate = currentDate.format("D/MM/YYYY");
            var now1 = moment(new Date(sur.effectiveTo));
            if(!(todayDate > sur.effectiveTo && todayDate != sur.effectiveTo)){
              list[index].status =  "Current"
         }else{
            list[index].status =  'expired'
         }   
            var now = moment(new Date(sur.postDate));
            list[index].postDate =  now.format("D/MM/YYYY");
        })
        // var uniqueList = _.filter(survey, function(item, key, a){ 
        //  Question
        // .find({surveyId: item._id}).populate('optionIds')
        //     .then(function(que, err){
        //     item.question = que
        // })  
        //     return (todayDate != item.effectiveTo && todayDate > item.effectiveTo) ? item._id : ''
        // });
        res.json({survey: list, success: true})
    })
    }
    else{
        res.json({message: "No Survey Found" , success: false})
    }
    })
    })

router.post('/submitSurveys', (req, res) => {
  // const body = { 
  //   surveyId: '5a3248c1a58fd0e0d0e8dcc0',
  //   questions: [{questionId: "5a3248f8a58fd0e0d0e8dd02", optionId: "5a32491da58fd0e0d0e8dd3f"}],
  //   userId: '5a32175c61469e03284a03f2' }
  const promiseArr = []
  const questions = req.body.questions
    promiseArr.push(new Promise(function(resolve, reject){
       _.forEach(questions, function(ques, index) {
        console.log(ques)
          const userAnswer = new UserAnswers({
            questionId: ques.questionId,
            surveyId: req.body.surveyId,
            optionId: ques.optionId,
            userId: req.body.userId
          })
          userAnswer.save()
          .then(function(ans, err){
            resolve(ans)
          })
      })

    }))
    Promise.all(promiseArr)
    .then(function(data, err){
      console.log(data)
      if(err) res.send(err)
        Resident.update({_id: req.body.userId,
          $push: {
            surveys: data[0].surveyId
          }})
        .then(function(survey, err){
        res.json({message: "Survey Completed Successfully", success: true})
      })
    })
})


module.exports = router;