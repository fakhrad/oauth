
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Schema definitions.
 */

mongoose.model('Clients', new Schema({
  clientId: { type: String, required : true, unique : true },
  clientSecret: { type: String },
  redirectUris: { type: Array },
  name : {type : String, required : true, max : 150, min : 3},
  description : {type : String, max : 256},
  longDesc : {type : String},
  icon : {type : String, default : "cogs"},
  homepage : {type : String},
  category : {type : String, required : true},
  type : {type : String, required : true, default : "native"},
  owner : {type : String, required : true}
}));