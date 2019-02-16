var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const SALT_WORK_FACTOR = 10;

var user = new Schema({
    username : {type:String, required : true},
    password : {type:String, required : true, select : false},
    email : {type : String , require : false},
    twoFactorEnabled : {type : Boolean},
    phoneNumber : {type:String, required : false},
    first_name : {type : String, max:100},
    last_name : {type : String, max:100},
    activation_code : {type:Number},
    avatar : {type:String},
    age : {type : Number, min : 1, max : 200},
    city_code : {type:Number},
    address : {type : String},
    location : {type:Object},
    approved : {type : Boolean},
    roles : {type:Array},
    rate : {type:Number},
    language : {type : String},
    notification : {type:Boolean},
    token : {type:String},
    device : {type:String},
    lastlogin : {type : Date}
}, { toJSON: { virtuals: true } });

mongoose.model("Users", user);
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

user.
virtual('name').
get(function(){
    return this.first_name + ' ' + this.last_name;
});

user.virtual('city', {
    ref: 'City', // The model to use
    localField: 'city_code', // Find people where `localField`
    foreignField: 'cityCode', // is equal to `foreignField`
    justOne: true
  });