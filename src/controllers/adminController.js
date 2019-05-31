var User = require('../models/adminuser'); 
var jwt = require('jsonwebtoken');
var async = require('async');
const config = require('../config/config');
var mongoose = require('mongoose'); 
var Space = require('../models/space');
var signupevent = require('../events/onAdminUserRegistered');

var findById = function(req, cb)
{
    async.parallel(
        {
            "user" : function(callback) {User.findById(req.body.id).exec(callback)},
            "spaces" : function(callback) {Space.find({owner : req.body.id}).exec(callback)}
        }, (err, results)=>{
            var result = {success : false, data : null, error : null };
            if (err)
            {
                result.success = false;
                result.data =  undefined;
                result.error = err;
                cb(result);       
                return; 
            }
            else
            {
                if (results.user)
                {
                    result.success = true;
                    result.error = undefined;
                    var output = results.user.viewModel();
                    output.spaces = [];
                    console.log(spaces);
                    if (result.spaces)
                    {
                        results.spaces.forEach(space => {
                            output.spaces.push(space.viewModel());
                        });
                    }
                    result.data = output;
                    cb(result);
                    return;
                }
                else
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = "User not found";
                    cb(result);       
                    return; 
                }
            }
        }
    )
};

var token = function(req, cb)
{
    console.log(req);
    var result = {success : false, data : null, error : null, access_token : null };
    User.findOne({ username: req.body.username }).exec(function(err, user){
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = "Invalid username or password.";
            cb(result);       
            return; 
        }
        if (user)
        {
            if (!user.emailConfirmed)
            {
                result.success = false;
                result.data =  undefined;
                result.error = "Your email not confirmed yet. Please continue from the link in your email.";
                cb(result);  
                return;
            }
            user.comparePassword(req.body.password, (err, isMatch)=>{
                if (isMatch)
                {
                    token = jwt.sign({ id: user._id, account_type : user.account_type}, config.secret, {
                        expiresIn: process.env.AUTHENTICATIONTOKEN_EXPIRE_TIME || 30 * 24 * 60 * 60 // expires in 5 minutes
                      });
                    user.lastlogin = new Date();
                    user.access_token = token;
                    user.save(function(err){
                        if(err)
                        {
                            result.success = false;
                            result.data =  undefined;
                            result.error = err;
                            cb(result);  
                            return;
                        }
                        //Successfull. 
                        result.success = true;
                        result.error = undefined;
                        result.data =  user;
                        result.access_token = token;
                        cb(result); 
                    });

                }
                else
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = "Invalid password";
                    cb(result);  
                    return;
                }
            });
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result); 
        }
    });
};

var findByUserName = function(req, cb)
{
    console.log(req.body.username);
    User.findOne({'username' : req.body.username}).exec(function(err, user){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (user)
        {
            result.success = true;
            result.error = undefined;
            result.data =  user;
            cb(result); 
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result);       
            return; 
        }
    });
};
var registerUser = function(req, cb)
{
    var user = new User({
        username : req.body.username,
        password : req.body.password,
        account_type : req.body.account_type,
        roles : ["owner"],
        profile : {
            first_name : req.body.first_name ? req.body.first_name : null,
            last_name : req.body.last_name ? req.body.last_name : null,
            avatar : req.body.avatar ? req.body.avatar : null,
        }
    });
    user.save(function(err){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        //Successfull. 
        //Publish user registered event
        signupevent.onAdminUserRegistered().call(user);
        user.password = undefined;
        result.success = true;
        result.error = undefined;
        result.data =  user;
        cb(result);
    });
};

var changeAvatar = function(req, cb)
{
     User.findById(req.body.id).exec(function(err, user){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (user)
        {
            if (user.profile === undefined)
                user.profile = {};
            var p = {};
            p.avatar = req.body.avatar;
            p.first_name = user.profile.first_name;
            p.last_name = user.profile.last_name;

            user.profile = p;
            user.save(function(err){
                if(err)
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = err;
                    cb(result);       
                    return; 
                }
                //Successfull. 
                //Publish user avatar changed event
                User.findById(req.body.id).exec(function(err, user){
                    if(err)
                    {
                        result.success = false;
                        result.data =  undefined;
                        result.error = err;
                        cb(result);       
                        return; 
                    }
                    result.success = true;
                    result.error = undefined;
                    result.data =  user.viewModel();
                    cb(result); 
                });
            });
            return;
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result);       
            return; 
        }
    });
};

var changeNotification = function(req, cb)
{
     User.findById(req.body.id).exec(function(err, user){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (user)
        {
            if (user.profile === undefined)
                user.profile = {};
            var p = {};
            p.notification = req.body.notification;
            p.avatar = user.profile.avatar;
            p.first_name = user.profile.first_name;
            p.last_name = user.profile.last_name;
            user.profile = p;
            user.save(function(err){
                if(err)
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = err;
                    cb(result);       
                    return; 
                }
                //Successfull. 
                //Publish user avatar changed event
                User.findById(req.body.id).exec(function(err, user){
                    if(err)
                    {
                        result.success = false;
                        result.data =  undefined;
                        result.error = err;
                        cb(result);       
                        return; 
                    }
                    result.success = true;
                    result.error = undefined;
                    result.data =  user.viewModel();
                    cb(result); 
                });
            });
            return;
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result);       
            return; 
        }
    });
};

var updateProfile = function(req, cb)
{
     User.findById(req.userId).exec(function(err, user){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (user)
        {
            if (user.profile === undefined)
                user.profile = {};
            var p = {};
            p.notification = user.profile.notification;
            p.avatar = user.profile.avatar;
            p.first_name = req.body.first_name;
            p.last_name = req.body.last_name;

            user.profile = p;
            user.save(function(err){
                if(err)
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = err;
                    cb(result);       
                    return; 
                }
                //Successfull. 
                //Publish user profile updated event
                User.findById(req.userId).exec(function(err, user){
                    if(err)
                    {
                        result.success = false;
                        result.data =  undefined;
                        result.error = err;
                        cb(result);       
                        return; 
                    }
                    result.success = true;
                    result.error = undefined;
                    result.data =  user.viewModel();
                    cb(result); 
                });
            });
            return;
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result);       
            return; 
        }
    });
};

var deleteaccount = function(req, cb)
{
    console.log(req);
     User.findById(req.body.id).exec(function(err, user){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (user)
        {
            User.deleteOne({"_id" : user._id}, function(err){
                if(err)
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = err;
                    cb(result);       
                    return; 
                }
                //Successfull. 
                //Publish user account deleted event and remove all storages
                result.success = true;
                result.data =  {"message" : "Deleted successfully"};
                result.error = undefined;
                cb(result);       
                return; 
            });
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result);       
            return; 
        }
    });
};

var getforgotpasswordtoken = function(req, cb)
{
    console.log(req);
    var result = {success : false, data : null, error : null, access_token : null };
    User.findOne({ username: req.body.username }).exec(function(err, user){
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = "Invalid username.";
            cb(result);       
            return; 
        }
        if (user)
        {
            token = jwt.sign({ id: user._id, clientId : user.clientId }, config.secret, {
                expiresIn: process.env.AUTHENTICATIONTOKEN_EXPIRE_TIME || 24 * 60 * 60 // expires in 1 day
              });
            user.access_token = token;
            user.save(function(err){
                if(err)
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = err;
                    cb(result);  
                    return;
                }
                //Successfull. 
                result.success = true;
                result.error = undefined;
                result.data =  user;
                result.access_token = token;
                cb(result); 
            });
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result); 
        }
    });
};

var resetpassword = function(req, cb)
{
    console.log(req);
    var result = {success : false, data : null, error : null, access_token : null };
    User.findById(req.body.id).exec(function(err, user){
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = "Invalid user.";
            cb(result);       
            return; 
        }
        if (user)
        {
            user.password = req.body.newpassword;
            user.save(function(err){
                if(err)
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = err;
                    cb(result);  
                    return;
                }
                //Successfull. 
                result.success = true;
                result.error = undefined;
                result.data =  user.viewModel();
                cb(result); 
            });
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result); 
        }
    });
};

var confirmEmail = function(req, cb)
{
    var result = {success : false, data : null, error : null, access_token : null };
    User.findById(req.body.id).exec(function(err, user){
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = "Invalid user.";
            cb(result);       
            return; 
        }
        if (user)
        {
         console.log("confirming email");
         user.confirmEmail((err)=>{
                if (err)
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = err;
                    cb(result);       
                    return; 
                }
                result.success = true;
                result.data =  user.viewModel();
                result.error = undefined;
                cb(result);       
                return; 
            });
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result); 
        }
    });
};

var changepassword = function(req, cb)
{
    console.log(req);
    var result = {success : false, data : null, error : null, access_token : null };
    User.findById(req.body.id).exec(function(err, user){
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = "Invalid user.";
            cb(result);       
            return; 
        }
        if (user)
        {
            user.comparePassword(req.body.oldpassword, (err, isMatch)=>{
                if (isMatch)
                {
                    user.password = req.body.newpassword;
                    user.save(function(err){
                        if(err)
                        {
                            result.success = false;
                            result.data =  undefined;
                            result.error = err;
                            cb(result);  
                            return;
                        }
                        //Successfull. 
                        result.success = true;
                        result.error = undefined;
                        result.data =  user.viewModel();
                        cb(result); 
                    });
                }
                else
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = "Invalid old password.";
                    cb(result); 
                }
            });
            
        }
        else
        {
            result.success = false;
            result.data =  undefined;
            result.error = undefined;
            cb(result); 
        }
    });
};
//Export functions
exports.token = token;
exports.findbyemail = findByUserName;
exports.registeruser = registerUser;
exports.changeavatar = changeAvatar;
exports.changenotification = changeNotification;
exports.findbyId = findById;
exports.updateprofile = updateProfile;
exports.deleteaccount = deleteaccount;
exports.getforgotpasswordtoken = getforgotpasswordtoken;
exports.changepassword = changepassword;
exports.resetpassword = resetpassword;
exports.confirmemail = confirmEmail;
