const Users = require('../models/user');

var findAll = function(req, cb)
{
    Users.find().exec(function(err, users){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (users)
        {
            result.success = true;
            result.error = undefined;
            result.data =  users;
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
var findById = function(req, cb)
{
    Users.findById(req.body.id).exec(function(err, user){
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

var addUser = function(req, cb)
{
    var user = new User({
        username : req.body.username,
        password : req.body.password,
        email : req.body.email,
        twoFactorEnabled : true,
        phoneNumber : req.body.phoneNumber,
        first_name : req.body.first_name,
        last_name : req.body.last_name,
        age : req.body.age,
        city_code : req.body.city_code,
        address : req.body.address,
        approved : false,
        roles : req.body.roles,
        language : req.body.language,
        notification : true,
        device : req.body.device
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
        //Publish shopper registered event
        result.success = true;
        result.error = undefined;
        result.data =  user;
        cb(result); 
    });
};

var deleteUser = function(req, cb)
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
                //Publish shopper account deleted event
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

var updateUser = function(req, cb)
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
            user.userId = req.body.userId,
            user.userSecret = req.body.userSecret,
            user.redirectUris = req.body.redirectUris,
            user.name = req.body.name,
            user.description = req.body.description,
            user.longDesc = req.body.longDesc,
            user.icon = req.body.icon,
            user.homepage = req.body.homepage,
            user.category = req.body.category,
            user.type = req.body.type,
            user.owner = req.body.owner
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
                //Publish shopper profile updated event
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

exports.findAll = findAll;
exports.findById = findById;
exports.register = addUser;
exports.delete = deleteUser;
exports.update = updateUser;