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


//Sort function
function sortPosts(postA,postB){
    if (new Date(postA.lastCommentedTime) > new Date(postB.lastCommentedTime))
        return -1;
    if (new Date(postA.lastCommentedTime) < new Date(postB.lastCommentedTime))
        return 1;
    return 0;
  }
  function sortComments(postA,postB){
    if (new Date(postA.commentedTime) > new Date(postB.commentedTime))
        return -1;
    if (new Date(postA.commentedTime) < new Date(postB.commentedTime))
        return 1;
    return 0;
  }
router.post('/getForum', (req,res) => {
    Post.find({
        estateName: req.body.estateName
    })
    .populate('comments')
    .populate('postedBy')
    .populate('commentedBy')
    .then(function(posts,err) {
        if(err){
            res.json({
                success: false,
                message: "網絡鏈接問題 | Network errors"
            })
        }
        posts.sort(sortPosts)
        res.json({
            success:true,
            posts: posts,
            message: "Retrieved forum successfully"
        })
    })
})

router.post('/getCommentsByPostId', function(req,res){
    const postId = req.body.postId;
    console.log(req.body);
    Post.find({
        _id: postId,
        estateName: req.body.estateName
    })
    .populate('comments')
    .populate('commentedBy')
    .then(function(post, err){
        post[0].comments.sort(sortComments);
        if(err){
            res.json({
                success: false,
                message: "網絡鏈接問題 | Network errors"
            })
        }
        res.json({
            success:true,
            post: post,
            message: "Retrieve comments successfully"
        })
    })
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
        if(err){
            res.json({
                success: false,
                message: "網絡鏈接問題 | Network errors"
            })
        }
        res.json({
            success:true,
            message: "Liked successfully"
        })
    })
})

router.post('/likePost', (req,res) => {
    const postId = req.body.postId;
    Post.update({_id: postId
             }, {
               $push: { 
                  likedBy: req.body.userId,
               }
             },{ 
               new: true 
             })
    .then(function(comm, err){
        if(err){
            res.json({
                success: false,
                message: "網絡鏈接問題 | Network errors"
            })
        }
        res.json({
            success:true,
            message: "Liked successfully"
        })
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
            if(err){
                res.json({
                    success: false,
                    message: "網絡鏈接問題 | Network errors"
                })
            }
            res.json({
                success:true,
                message: "Posted successfully"
            })

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
                if(err){
                    res.json({
                        success: false,
                        message: "網絡鏈接問題 | Network errors"
                    })
                }
                res.json({
                    success:true,
                    message: "Commented successfully"
                })
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
                if(err){
                    res.json({
                        success: false,
                        message: "網絡鏈接問題 | Network errors"
                    })
                }
                res.json({
                    success:true,
                    message: "Reported successfully"
                })
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
                if(err){
                    res.json({
                        success: false,
                        message: "Network errors"
                    })
                }
                res.json({
                    success:true,
                    message: "Reported successfully"
                })
            })
    })
  })
module.exports = router



