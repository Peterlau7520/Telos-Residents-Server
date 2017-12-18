const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const bcrypt   = require('bcrypt-nodejs');
const connect = process.env.MONGODB_URI || "mongodb://localhost:27017/telos";

//const connect = process.env.MONGODB_URI ||"mongodb://upwork:upwork@ds117625.mlab.com:17625/telos"
mongoose.connect(connect);

const Schema = mongoose.Schema;

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
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Post'
        }
    ],
    registered: {type: Boolean , default: false},
});


const estateSchema = new Schema({
  estateName: String,
  username: String,
  password: String,
  emailAddress: String,
  chairmanName: String,
  currentPolls: [{ type: Schema.Types.ObjectId, ref: 'Poll' }],
  pastPolls: [{ type: Schema.Types.ObjectId, ref: 'Poll' }],
  inviteCode : String,
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
    ]
});

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
})

const questionSchema = new Schema({
    questionEn: String,
    questionChn: String,
    optionIds: [{ type: Schema.ObjectId, ref: 'Options' }],
    surveyId: { type: Schema.ObjectId, ref: 'Survey' },
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
    optionId: { type: Schema.ObjectId, ref: 'Option' },
    userId: { type: Schema.ObjectId, ref: 'User' },
})

//MEETING SCHEMA
const meetingSchema = new Schema({
    title: String,
    titleChn: String,
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
}
