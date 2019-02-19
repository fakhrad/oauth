const Clients = require('../models/client');
var uuid = require('uuid/v4')
const bcrypt = require('bcrypt-nodejs');
const SALT_WORK_FACTOR = 10;

var findAll = function(req, cb)
{
    Clients.find().exec(function(err, clients){
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
var findByUserId = function(req, cb)
{
    Clients.find({"owner" : req.body.userId}).exec(function(err, client){
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
        redirectUris: req.body.redirectUris,
        name : req.body.name,
        description : req.body.description,
        longDesc : req.body.longDesc,
        icon : req.body.icon,
        homepage : req.body.homepage,
        category : req.body.category,
        type : req.body.type,
        owner : req.body.owner
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
                //Publish user registered event
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
            Clients.deleteOne(client, function(err){
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
            client.redirectUris = req.body.redirectUris,
            client.name = req.body.name,
            client.description = req.body.description,
            client.longDesc = req.body.longDesc,
            client.icon = req.body.icon,
            client.homepage = req.body.homepage,
            client.category = req.body.category,
            client.type = req.body.type,
            client.owner = req.body.owner
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

exports.findAll = findAll;
exports.findByUserId = findByUserId;
exports.addClient = addClient;
exports.deleteClient = deleteClient;
exports.updateClient = updateClient;