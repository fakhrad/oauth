var User = require('../models/user'); 
var jwt = require('jsonwebtoken');
var async = require('async');
const config = require('../config/config');

var requestCode = function(req, cb)
{
    async.parallel({
        "owner" : function(callback) {User.findOne({phoneNumber : req.body.phoneNumber}).exec(callback)}
    }, function(err, results){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        else{
            code = getNewCode(req.body.phoneNumber);
            if (results.owner != null)
            {
                results.owner.activation_code = code;
                results.owner.save(function(err){
                    if(err)
                    {
                        result.success = false;
                        result.data =  undefined;
                        result.error = err;
                        cb(result);  
                        return;
                    }
                });
            }
            result.success = true;
            if (results.owner)
                result.data =  results.owner;
            else
                result.data = {activation_code : code};
            result.error = undefined;
            cb(result); 
        }
    });
};

var verifycode = function(req, cb)
{
    User.findOne({'phoneNumber' : req.body.phoneNumber}).exec(function(err, user){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (user && user.activation_code == req.body.code)
        {
            var token = jwt.sign({ id: user._id, roles : user.roles }, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            });
            user.token = token;
            user.activation_code = undefined;
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
                //Publish user logged in event
                result.success = true;
                result.error = undefined;
                result.data =  user;
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

var changeUserCity = function(req, cb)
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
            user.city_code = req.body.citycode;
            user.save(function(err){
                if(err)
                {
                    cb(err, undefined);
                }
                //Successfull. 
                //Publish user city changed event
                service.publish("usercitychanged", user);
                User.findById(req.body.id).exec(function(err, user){
                    if(err)
                    {
                        result.success = false;
                        result.data =  undefined;
                        result.error = err;
                        cb(result);       
                        return; 
                    }
                    console.log(user);
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
        }
    });
};

var token = function(req, cb)
{
    User.findOne({'username' : req.body.email}).exec(function(err, user){
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
            user.comparePassword(req.body.password, (err, isMatch)=>{
                if (isMatch)
                {
                    if (req.body.deviceToken)
                    {
                        user.device = req.body.deviceToken ? req.body.deviceToken : null;
                    }
                    if (user.twoFactorEnabled)
                    {
                        code = getNewCodeAndSend(req.body.phoneNumber);
                        user.activation_code = code;
                    }
                    user.lastlogin = new Date();
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
                        //Publish user login request event
                        //console.log('new code ' + code)
                        result.success = true;
                        result.error = undefined;
                        result.data =  user;
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

var findByPhoneNumber = function(req, cb)
{
    console.log(req.body.phoneNumber);
    User.findOne({'phoneNumber' : req.body.phoneNumber}).exec(function(err, user){
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
function getNewCode(phoneNumber)
{
    var min = 1000;
    var max = 9999;
    var code = Math.floor(Math.random() * (max - min)) + min;
    //Sent code to the phone
    return code;
}

var registerUser = function(req, cb)
{
    var sh = new User({
        username : req.body.username,
        password : req.body.password,
        email : req.body.email,
        phoneNumber : req.body.phoneNumber,
        birth_date : req.body.birth_date,
        password : req.body.password,
        first_name : req.body.first_name ? req.body.first_name : null,
        last_name : req.body.last_name ? req.body.last_name : null,
        activation_code : getNewCode(req.body.phoneNumber),
        avatar : req.body.avatar ? req.body.avatar : null,
        city_code : req.body.city_code ? req.body.city_code : null,
        roles : ["user"],
        device : req.body.deviceToken ? req.body.deviceToken : null,
    });

    sh.save(function(err){
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
        result.data =  sh;
        cb(result); 
    });
};

var changePhoneNumber = function(req, cb)
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
        if (user && user.activation_code === req.body.code)
        {
            user.phoneNumber = req.body.phoneNumber;
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
                //Publish user phonenumber changed event
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

var changeLanguage = function(req, cb)
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
            user.language = req.body.language;
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
                //Publish user language changed event
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

var changenotification = function(req, cb)
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
            user.notification = req.body.notification;
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
                //Publish user notification changed event
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
            user.address = req.body.address;
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

var locationchanged = function(req, cb)
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
            user.location = req.body.location;
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
                //Publish user location changed event
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
exports.findbyphone = findByPhoneNumber;
exports.registeruser = registerUser;
exports.changecity = changeUserCity;
exports.findById = findById;
exports.requestcode = requestCode;
exports.changenumber = changePhoneNumber;
exports.changeavatar = changeAvatar;
exports.updateprofile = updateProfile;
exports.changelanguage = changeLanguage;
exports.verifycode = verifycode;
exports.changenotification = changenotification;
exports.deleteaccount = deleteaccount;
exports.locationchanged = locationchanged;