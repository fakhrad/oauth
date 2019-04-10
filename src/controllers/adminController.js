var User = require('../models/adminuser'); 
var jwt = require('jsonwebtoken');
var async = require('async');
const config = require('../config/config');
var mongoose = require('mongoose'); 

var findById = function(req, cb)
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
        }
    });
};

var token = function(req, cb)
{
    var result = {success : false, data : null, error : null, access_token : null };
    User.findOne({ username: req.body.username, password: req.body.password }).exec(function(err, user){
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
            user.comparePassword(req.body.password, (err, isMatch)=>{
                if (isMatch)
                {
                    var token = auth.generateAccessToken(cl, user);
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
    console.log(req);
    var user = new User({
        username : req.body.username,
        password : req.body.password,
        first_name : req.body.first_name ? req.body.first_name : null,
        last_name : req.body.last_name ? req.body.last_name : null,
        avatar : req.body.avatar ? req.body.avatar : null,
        roles : ["admin"]
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
            user.avatar = req.body.avatar.filename;
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
                    result.data =  user;
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
            user.first_name = req.body.first_name;
            user.last_name = req.body.last_name;
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
                    result.data =  user;
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
            User.deleteOne(user, function(err){
                if(err)
                {
                    result.success = false;
                    result.data =  undefined;
                    result.error = err;
                    cb(result);       
                    return; 
                }
                //Successfull. 
                //Publish user account deleted event
                result.success = true;
                result.data =  {"message" : "Deleted successfully"};
                result.error = undefined;
                cb(result);       
                return; 
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


//Export functions
exports.token = token;
exports.findbyemail = findByUserName;
exports.registeruser = registerUser;
exports.changeavatar = changeAvatar;
exports.findbyId = findById;
exports.updateprofile = updateProfile;
exports.deleteaccount = deleteaccount;
