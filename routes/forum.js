/**
 * This file serves routes for notices
 */
const express = require('express');
const forEach = require('async-foreach').forEach;
const dateFormat = require('dateformat');
const router = express.Router();
const models = require('../models/models');
const fs = require('fs');
const _ = require('lodash');
var moment = require("moment");

//Data models
const Question = models.Question;
const Options = models.Options;
const Resident = models.Resident;
const Post = models.Post;
const Comment = models.Comment;
const PostReport = models.PostReport;
const CommentReport = models.CommentReport;



router.post('/getForum', (req,res) => {
    //POPULATE ALL THE POSTS AND COMMENTS 



})

router.post('/likeComment', (req,res) => {
    const commentId = req.body.commentId;
    Comment.update({_id: commentId
             }, {
               $push: { 
                  likedBy: req.body.userId,
               }
             },{ 
               new: true 
             })
    .then(function(comm, err){
        res.json()
        //YOUR WORK HERE
    })
})

router.post('/likePost', (req,res) => {
    const postId = req.body.postId;
    Post.update({_id: postId
             }, {
               $push: { 
                  likedBy: req.user._id,
               }
             },{ 
               new: true 
             })
    .then(function(comm, err){
        res.json()
    })
})


router.post('/newPost', (req,res)=>{
    Resident.findOne({
        estateName: req.body.estateName,
        account: req.body.account
    },function(err, user){
        var userContent = req.body.content.trim()
        var post = new Post({
            content: userContent,
            account: user.account,
            postedBy: user._id,
            estateName: user.estateName,
            postTime: new Date(),
            lastCommentedTime: new Date(),
        });
        post.save(function(err, post){
            if(err) res.send(err);
          res.json();

        })
    })
})

router.post('/newComment', (req,res)=>{ 
    const postId = req.body.postId;
    Resident.findOne({
        estateName: req.body.estateName,
        account: req.body.account
    },function(err, user){
        var userComment = req.body.comment.trim()
        new Comment({
            content: userComment,
            commentedTime: new Date(),
            commentedBy: user._id,
            account: user.account,
            estateName: user.estateName
        }).save(function(err, comment){
            Post.update({_id: req.body.postId
             }, {
                $set: {
                lastCommentedTime: new Date()
                },
                $push:{
                comments: comment._id
               },
               $addToSet: { 
                  commentedBy: user._id
               }
             },{ 
               new: true 
             })
            .then(function(post,err){
                if(err) res.send(err);
                res.json()
            })
        })
    })
})

router.post('/reportPost', (req,res)=> {
    const postId = req.body.postId;
    Resident.findOne({
        account: req.body.account
    }, function(err, user){
            new PostReport({
                postReport: req.body.postReport,
                reportedPost: postId,
                reportedBy: user._id
            }).save(function(err, PostReport){
                if(err) res.send(err);
               res.redirect("/getForum")
            })
    })

})


router.post('/reportComment', (req,res)=> {
    const commentId = req.body.commentId;
    Resident.findOne({
        account: req.body.account
    }, function(err, user){
            new CommentReport({
                commentReport: req.body.commentReport,
                reportedComment: commentId,
                reportedBy: user._id
            }).save(function(err, PostReport){
                 if(err) res.send(err);
               res.json()
            })
    })
  })
module.exports = router



