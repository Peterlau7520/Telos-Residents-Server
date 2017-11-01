const mongoose = require('mongoose');
const bcrypt   = require('bcrypt-nodejs');
const connect = process.env.MONGODB_URI;


mongoose.connect(connect);

const Schema = mongoose.Schema;

const residentSchema = new Schema({
  name: String,
  email: String,
  password: String,
  estateName: String,
  polls: [{ type: Schema.Types.ObjectId, ref: 'Polls' }],
  unit: String,
  block: String
});

const estateSchema = new Schema({
  estateName: String,
  username: String,
  password: String,
  emailAddress: String,
  chairmanName: String,
  currentPolls: [{ type: Schema.Types.ObjectId, ref: 'Poll' }],
  pastPolls: [{ type: Schema.Types.ObjectId, ref: 'Poll' }],
  ivniteCode : String,
});

const pollsSchema = new Schema({
    projectName: String,
    pollName: String,
    summary: String,
    fileLinks: Array,
    estateName: String,
    options: Array,
    endTime: String,
    active: Boolean,
    voted: [{type: Schema.Types.ObjectId, ref: 'Resident'}],
    votes: Array
});

residentSchema.pre('save', function(next){

    var user = this;
    var SALT_FACTOR = 5;

    if(!user.isModified('password')){
        return next();
    }

    bcrypt.genSalt(SALT_FACTOR, function(err, salt){

        if(err){
            return next(err);
        }

        bcrypt.hash(user.password, salt, null, function(err, hash){

            if(err){
                return next(err);
            }

            user.password = hash;
            next();

        });

    });

});

residentSchema.methods.comparePassword = function(passwordAttempt, cb){

    bcrypt.compare(passwordAttempt, this.password, function(err, isMatch){

        if(err){
            return cb(err);
        } else {
            cb(null, isMatch);
        }
    });

}

const Resident = mongoose.model('Resident', residentSchema);
const Estate = mongoose.model('Estate', estateSchema);
const Poll = mongoose.model('Poll', pollsSchema);

module.exports = {
  Resident,
  Estate,
  Poll,
}
