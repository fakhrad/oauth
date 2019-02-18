var City = require('../models/city'); 

var getcities = function(req, cb)
{
     City.find().exec(function(err, cities){
        var result = {success : false, data : null, error : null };
        if (err)
        {
            result.success = false;
            result.data =  undefined;
            result.error = err;
            cb(result);       
            return; 
        }
        result.success = true;
        result.error = undefined;
        result.data =  cities;
        cb(result); 
    });
};

exports.getcities = getcities;