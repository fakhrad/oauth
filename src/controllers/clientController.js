const Clients = require('../models/client');
var uuid = require('uuid/v4')
const bcrypt = require('bcrypt-nodejs');
const SALT_WORK_FACTOR = 10;
var appadded = require('../events/OnClientAppRegistered');

var findByUSpaceId = function(req, cb)
{
    console.log(req);
    Clients.find({"spaceId" : req.spaceId}).exec(function(err, clients){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (clients)
        {
            result.success = true;
            result.error = undefined;
            result.data =  clients;
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
    Clients.find({"id" : req.body.id}).exec(function(err, client){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (client)
        {
            if (client.owner !== req.userId)
            {
                result.success = false;
                result.data =  {"message" : "Invalid access"};
                result.error = undefined;
                cb(result);       
                return; 
            }
            result.success = true;
            result.error = undefined;
            result.data =  client;
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
var addClient = function(req, cb)
{
    var client = new Clients({
        spaceId : req.spaceId,
        redirectUris: req.body.redirectUris,
        name : req.body.name,
        description : req.body.description,
        longDesc : req.body.longDesc,
        icon : req.body.icon,
        homepage : req.body.homepage,
        category : req.body.category,
        type : req.body.type,
        owner : req.userId,
        grants : req.body.grants
    });

    client.clientId = uuid();
    // only hash the password if it has been modified (or is new)
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return;

        // hash the password using our new salt
        bcrypt.hash(client.clientId, salt, function(){}, function(err, hash) {
            if (err) return ;
            client.clientSecret = hash;
            client.save(function(err){
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
                //Publish app registered event
                appadded.OnClientAppRegistered().call(client);

                result.success = true;
                result.error = undefined;
                result.data =  client;
                cb(result); 
            });
        });
    });
};

var deleteClient = function(req, cb)
{
     Clients.findById(req.body.id).exec(function(err, client){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (client)
        {
            if (client.owner !== req.userId)
            {
                result.success = false;
                result.data =  {"message" : "Invalid access"};
                result.error = undefined;
                cb(result);       
                return; 
            }
            Clients.remove({_id : client._id}, function(err){
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

var updateClient = function(req, cb)
{
     Clients.findById(req.body.id).exec(function(err, client){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        if (client)
        {
            if (client.owner !== req.userId)
            {
                result.success = false;
                result.data =  {"message" : "Invalid access"};
                result.error = undefined;
                cb(result);       
                return; 
            }
            client.redirectUris = req.body.redirectUris,
            client.name = req.body.name,
            client.description = req.body.description,
            client.longDesc = req.body.longDesc,
            client.icon = req.body.icon,
            client.homepage = req.body.homepage,
            client.category = req.body.category,
            client.type = req.body.type,
            client.grants = req.body.grants;
            client.save(function(err){
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
                Clients.findById(req.body.id).exec(function(err, client){
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
                    result.data =  client;
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

exports.findBySpaceId = findByUSpaceId;
exports.addClient = addClient;
exports.deleteClient = deleteClient;
exports.updateClient = updateClient;
exports.findbyid = findById;