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
            Resident.findOne({_id: req.body.userId})
            .then(function(user, err){
              console.log(user)
              res.json({survey: list, success: true, completedSurveys: user.surveys})
            })
        
    })
    }
    else{
        res.json({message: "No Survey Found" , success: false})
    }
  })
})
router.post('/surveyResults', (req,res)=>{ 

    const promiseArr =[];
    Question.find({
      surveyId: req.body.surveyId
    }).lean()
    .then(function(questions, err) {
      if(err){
        res.json({message: "Network Errors" , success: false})
      }
      if(questions){
        console.log(questions);
        _.forEach(questions, function(question, index){
          promiseArr.push(new Promise(function(resolve, reject){
          UserAnswers.find({
            questionId: question._id
          })
          .populate('optionId')
          .lean()
          .then(function(userAnswers, err){
            question.answers = userAnswers;
            resolve(question)
          })
        }))
        })
        Promise.all(promiseArr)
        .then(function(data, err){

          res.json({data: data , success: true})
          
        });
      }else{
        res.json({message: "Please press again" , success: false})
      }
    })
})

router.post('/submitSurveys', (req, res) => {
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
       Resident.update({_id:  req.body.userId},
        {$push: 
          { surveys: data[0].surveyId
          }
        }, {
        new: true
        })
        .then(function(survey, err){
          console.log("yesssssss", survey)
        res.json({message: "Survey Completed Successfully", success: true})
      })
    })
})


module.exports = router;