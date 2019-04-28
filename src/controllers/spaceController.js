const Space = require('../models/space');
var uuid = require('uuid/v4')

var findByUserId = function(req, cb)
{
    Space.find({"owner" : req.body.userId}).exec(function(err, space){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (space)
        {
            result.success = true;
            result.error = undefined;
            result.data =  space;
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
    Space.find({"id" : req.body.id}).exec(function(err, space){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (space)
        {
            result.success = true;
            result.error = undefined;
            result.data =  space;
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
var addSpace = function(req, cb)
{
    var space = new Space({
        name : req.body.name,
        description : req.body.description,
        image : req.body.icon,
        type : req.body.type,
        owner : req.body.owner
    });

    space.save(function(err){
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
        result.data =  space;
        cb(result); 
    });
};

var deleteSpace = function(req, cb)
{
     Space.findById(req.body.id).exec(function(err, space){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (space)
        {
            Space.deleteOne(space, function(err){
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

var updateSpace = function(req, cb)
{
     Space.findById(req.body.id).exec(function(err, space){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (space)
        {
            space.name = req.body.name,
            space.description = req.body.description,
            space.image = req.body.image,
            space.homepage = req.body.homepage,
            space.type = req.body.type,
            space.owner = req.body.owner;
            space.save(function(err){
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
                Space.findById(req.body.id).exec(function(err, space){
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
                    result.data =  space;
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

exports.findByUserId = findByUserId;
exports.addSpace = addSpace;
exports.deleteSpace = deleteSpace;
exports.updateSpace = updateSpace;
exports.findbyid = findById;