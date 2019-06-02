var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const SALT_WORK_FACTOR = 10;

var user = new Schema({
    username : {type:String, required : true, unique : true},
    password : {type:String, required : true},
    roles : {type:Array},
    lastlogin : {type : Date},
    access_token : {type : String},
    active : {type : Boolean, default : true},
    emailConfirmed : {type : Boolean, default : false},
    account_type : {type:String, enum : ['free', 'advanced', 'premium'], default : "free"},
    profile : {type : Object}
}, { toJSON: { virtuals: true } });

user.pre('save', function(next) {
    var sh = this;
    // only hash the password if it has been modified (or is new)
    if (!sh.isModified('password')) return next();
    if (!sh.password) return next();
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(sh.password, salt, function(){}, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            sh.password = hash;
            next();
        });
    });
});


user.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

user.methods.comparePasswordSync = function(candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password);
};

user.methods.viewModel = function(cb) {
    return {
        id : this._id,
        username : this.username,
    roles : this.roles,
    emailConfirmed : this.emailConfirmed,
    lastlogin : this.lastlogin,
    active : this.active,
    account_type : this.account_type,
    profile : this.profile
    }
};

user.methods.integrationModel = function(cb) {
    return {
        id : this._id,
        username : this.username,
        roles : this.roles,
        emailConfirmed : this.emailConfirmed,
        lastlogin : this.lastlogin,
        active : this.active,
        account_type : this.account_type,
        access_token : this.access_token,
        profile : this.profile
    }
};
user.methods.confirmEmail = function(cb) {
    this.emailConfirmed = true;
    this.save((err)=>{
        if (cb)
            cb(err);
    });
    
};
module.exports = mongoose.model("AdminUsers", user);