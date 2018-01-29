const express = require('express');
const router = express.Router();
const models = require('../models/models');
const Meeting = models.Meeting;
const Poll = models.Poll;
const Resident = models.Resident;
const _ = require('lodash');
const forEach = require('async-foreach').forEach;
const dateFormat = require('dateformat');
var Promise = require('bluebird');
var moment = require("moment");


router.post('/getBadge', (req,res) => {
    const estateName = req.body.estateName;
    // check meetings, check surveys. 


})


module.exports = router