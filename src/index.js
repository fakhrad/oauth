const authserver = require('./authserver');
const model = require('./models/authmodel');
var mongoose = require('mongoose');
console.log('OAuth service starting...')
var init = function()
{
    var dev_db_url = 'mongodb://fakhrad:logrezaee24359@ds026018.mlab.com:26018/mivapp-shopper'
    var mongoDB = process.env.MIVAPP_FILES_DB_URL || dev_db_url;
    mongoose.connect(mongoDB);  
    mongoose.Promise = global.Promise;
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    db.on('connected', ()=>{
      console.log('MongoDb connected');
      
    });
}
init();
const oauth = new authserver({
  model: model,
  allowBearerTokensInQueryString: true,
  accessTokenLifetime: process.env.ACCESSTOKEN_LIFETIME || 4 * 60 * 60
});
console.log('Oauth service started.');
module.exports = oauth;
