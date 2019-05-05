
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Schema definitions.
 */

 const client = new Schema({
    spaceId : {type: Schema.Types.ObjectId, ref: 'Space'},
    clientId: { type: String, unique : true },
    clientSecret: { type: String },
    redirectUris: { type: Array },
    name : {type : String, required : true, max : 150, min : 3, unique : true},
    description : {type : String, max : 256},
    longDesc : {type : String},
    icon : {type : String, default : "cogs"},
    homepage : {type : String},
    category : {type : String, required : true},
    type : {type : String, required : true, default : "native"},
    owner : {type: Schema.Types.ObjectId, ref: 'Systemuser' , required : true}
});

module.exports = mongoose.model('Clients', client);