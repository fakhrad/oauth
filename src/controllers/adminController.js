var User = require('../models/adminuser'); 
var spaceCtrl = require('./spaceController');
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
        avatar : req.body.avatar ? req.body.avatar : null,
        roles : ["admin"],
        profile : {
            first_name : req.body.first_name ? req.body.first_name : null,
            last_name : req.body.last_name ? req.body.last_name : null
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
        user.password = undefined;
        result.success = true;
        result.error = undefined;
        result.data =  user;
        ///Create user first app
        var space = {};
        space.name = "Your Space Name";
        space.owner = result.data._id;
        space.type = result.data.account_type;
        spaceCtrl.addSpace({body : space}, (spres)=>{
            if (!spres.success)
            {
                User.findOneAndDelete({username : user.username}, ()=>{
                    cb(spres);       
                    return; 
                })
            }
            cb(result); 
        });
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

var authcode = function(req, cb)
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
                expiresIn: process.env.AUTHENTICATIONTOKEN_EXPIRE_TIME || 30 * 24 * 60 * 60 // expires in 5 minutes
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

//Export functions
exports.token = token;
exports.findbyemail = findByUserName;
exports.registeruser = registerUser;
exports.changeavatar = changeAvatar;
exports.findbyId = findById;
exports.updateprofile = updateProfile;
exports.deleteaccount = deleteaccount;
exports.authcode = authcode;
