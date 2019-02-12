var mongoose = require('mongoose');
var init = function()
{
    var dev_db_url = 'mongodb://fakhrad:logrezaee24359@ds127995.mlab.com:27995/authdb'
    var mongoDB = process.env.DATABASE_URL || dev_db_url;
    mongoose.connect(mongoDB);  
    mongoose.Promise = global.Promise;
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    db.on('connected', ()=>{
      console.log('MongoDb connected');
      
    });
}
module.exports = init;