const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const bcrypt   = require('bcrypt-nodejs');
//const connect = process.env.MONGODB_URI || "mongodb://localhost:27017/telos";
require('dotenv').config()

const connect = process.env.MONGODB_URI /*||"mongodb://upwork:upwork@ds117625.mlab.com:17625/telos"*/
mongoose.connect(connect);

const Schema = mongoose.Schema;
//RESIDENT
const residentSchema = new Schema({
    name: String,
    email: String,
    account: String,
    password: String,
    polls: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Polls'
        }
    ],
    surveys: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Survey'
        }
    ],
    estateName: String,
    unit: String,
    block: String,
    floor: String,
    nature: String,
    numberOfOwners: String,
    shares: String,
    hkid: Array,
    hkidImage: Array,
    signature: Array,
    chopImage: String,
    proxyAppointed: [
    { type: Schema.Types.ObjectId,
            ref: 'Meeting'}
            ], //ALL THE MEETINGS WHERE THEY APPOINT US AS THE PROXY.
    deviceToken: String,
    deviceType: String,
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Post'
        }
    ],
    registered: {type: Boolean , default: false},
    viewedNotice: [{ type: Schema.Types.ObjectId,
            ref: 'Notice'}]
});


//ESTATE
const estateSchema = new Schema({
    estateName: String,
    estateNameDisplay: String,
    estateNameChn: String,
    username: String,
    password: String,
    emailAddress: String,
    chairmanName: String,
    surveys: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Survey'
        }
    ],
    currentMeetings: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Meeting'
        }
    ],
    pastMeetings: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Meeting'
        }
    ],
    currentNotices: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Notice'
        }
    ],
    pastNotices: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Notice'
        }
    ],
    blockArray: []
});

//POLL
const pollSchema = new Schema({
    projectName: String,
    projectNameChn: String,
    pollName: String,
    pollNameChn: String,
    summary: String,
    summaryChn: String,
    fileLinks: Array,
    estateName: String,
    options: Array,
    endTime: String,
    active: Boolean,
    voted: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Resident'
        }
    ],
    finalResult: String,
    results: [{choice: String, percentage: Number}],
    votingResults: [{choice: String, resident: {
            type: Schema.Types.ObjectId,
            ref: 'Resident'
        }}],
    votes: Array,
    pollReport: Array
});

//NOTICE
const noticeSchema = new Schema({
    title: String,
    titleChn: String,
    endTime: String,
    estate: String,
    postDate: String,
    fileLinks: Array,
    active: Boolean,
    targetAudience: [{block: String, floors: Array}],
})

//SURVEY
const surveySchema = new Schema({
    title: String,
    titleChn: String,
    estate: String,
    effectiveTo: Date,
    postDate: {type: Date, default: new Date()},
    targetAudience: [{block: String, floors: Array}],
    NotificationStatus: {type: Boolean, default: false}
})

const questionSchema = new Schema({
    questionEn: String,
    questionChn: String,
    optionIds: [{ type: Schema.ObjectId, ref: 'Options' }],
    surveyId: { type: Schema.ObjectId, ref: 'Survey' },
    order: String,
})

const optionSchema = new Schema({
    questionId: { type: Schema.ObjectId, ref: 'Question' },
    optionNameEn: String,
    optionNameChn: String,
    optionsEn: [],
    optionsChn: []
})

const userAnswersSchema = new Schema({
    questionId: { type: Schema.ObjectId, ref: 'Question' },
    surveyId: { type: Schema.ObjectId, ref: 'Survey' },
    optionId: { type: Schema.ObjectId, ref: 'Options' },
    userId: { type: Schema.ObjectId, ref: 'Resident' },
    estateName: String
})

//MEETING SCHEMA
const meetingSchema = new Schema({
    title: String,
    titleChn: String,
    meetingSummary: String,
    meetingSummaryChn: String,
    startTime: String,
    endTime: String,
    venue: String,
    fileLinks: Array,
    createdAt: { type: Date, default: new Date() },
    polls: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Poll'
        }
    ],
    active: Boolean,
    pollEndTime: String,
    estate:String,
    youtubelink: String,
    views: { type: String, default: 0 },
    guid: String,
    NotificationStatus: { type: Boolean, default: false },
    proxyFullName: String,
})

//FORUM
//POST
const postSchema = new Schema({
    account: String,
    estateName: String,
    content: String,
    postTime: String,
    lastCommentedTime: String,
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment'            
        }
    ],
    postedBy: 
    {
        type: Schema.Types.ObjectId,
        ref: 'Resident'
    }
    ,
    likedBy: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Resident'
        }
    ],

    commentedBy: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Resident'
        }

    ]
})

//COMMENT
const commentSchema = new Schema({
    account: String,
    content: String,
    estateName: String,
    commentedTime: String,
    commentedBy: 
    {
        type: Schema.Types.ObjectId,
        ref: 'Resident'
    }
    ,
    likedBy: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Resident'
        }
    ]
})

//POST REPORT 
const postReport = new Schema({
    postReport: String,
    reportedPost : {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Resident'
    }
})

//COMMENT REPORT
const commentReport = new Schema({
    commentReport: String,
    reportedComment: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Resident'
    }
})

const Resident = mongoose.model('Resident', residentSchema);
const Estate = mongoose.model('Estate', estateSchema);
const Poll = mongoose.model('Poll', pollSchema);
const Notice = mongoose.model('Notice', noticeSchema);
const Survey = mongoose.model('Survey', surveySchema);
const Question = mongoose.model('Question', questionSchema);
const UserAnswers = mongoose.model('UserAnswers', userAnswersSchema)
const Options = mongoose.model('Options', optionSchema);
const Meeting = mongoose.model('Meeting', meetingSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Post = mongoose.model('Post', postSchema);
const PostReport = mongoose.model('PostReport', postReport);
const CommentReport = mongoose.model('CommentReport',commentReport);

module.exports = {
  Resident,
  Estate,
  Poll,
  Notice,
  Meeting,
  Survey,
  Question,
  UserAnswers,
  Options,
  Comment,
  Post,
  PostReport,
  CommentReport
}


// residentSchema.pre('save', function(next){
 
//     var user = this;
//      var SALT_FACTOR = 5;

//      if(!user.isModified('password')){
//          return next();
//      }
 
//      bcrypt.genSalt(SALT_FACTOR, function(err, salt){
 
//          if(err){
//              return next(err);
//          }
 
//         bcrypt.hash(user.password, salt, null, function(err, hash){
 
//              if(err){
//                  return next(err);
//             }
 
//             user.password = hash;
//             next();
 
//          });
 
//     });
 
//  });
 
//  residentSchema.methods.comparePassword = function(passwordAttempt, cb){
 
//     bcrypt.compare(passwordAttempt, this.password, function(err, isMatch){
 
//          if(err){
//              return cb(err);
//          } else {
//              cb(null, isMatch);
//          }
//      });
 
//  }
