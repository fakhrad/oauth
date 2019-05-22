
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Tokens = require('./token');
var Users = require('./user');

/**
 * Schema definitions.
 */

 const client = new Schema({
    spaceId : {type: Schema.Types.ObjectId, ref: 'Space'},
    clientId: { type: String, unique : true },
    clientSecret: { type: String },
    redirectUris:[String],
    name : {type : String, required : true, max : 150, min : 3, unique : true},
    description : {type : String, max : 256},
    longDesc : {type : String},
    icon : {type : String},
    homepage : {type : String},
    category : {type : String, required : false},
    type : {type : String, required : true, default : "native"},
    grants : [String],
    owner : {type: String, required : true}
});

client.post('delete', function(next) {
    console.log('Removing Tokens and Users');
    Tokens.deleteMany({clientId : this.id}).exec();
    Users.deleteMany({clientId : this.id}).exec();
  });
module.exports = mongoose.model('Clients', client);