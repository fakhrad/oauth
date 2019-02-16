const Clients = require('../models/client');

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
var findById = function(req, cb)
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
    var client = new Client({
        clientId: req.body.clientId,
        clientSecret: req.body.clientSecret,
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
        //Publish shopper registered event
        result.success = true;
        result.error = undefined;
        result.data =  client;
        cb(result); 
    });
};

var deleteClient = function(req, cb)
{
     Client.findById(req.body.id).exec(function(err, client){
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
            Client.deleteOne(client, function(err){
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

var updateClient = function(req, cb)
{
     Client.findById(req.body.id).exec(function(err, client){
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
            client.clientId = req.body.clientId,
            client.clientSecret = req.body.clientSecret,
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
                //Publish shopper profile updated event
                Client.findById(req.body.id).exec(function(err, client){
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
exports.findById = findById;
exports.addClient = addClient;
exports.deleteClient = deleteClient;
exports.updateClient = updateClient;