
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
require('./user');
require('./client');
require('./token');
var config = require('../config/config')
var jwt = require('jsonwebtoken');

var OAuthTokensModel = mongoose.model('Tokens');
var OAuthClientsModel = mongoose.model('Clients');
var OAuthUsersModel = mongoose.model('Users');

/**
 * Get access token.
 */

module.exports.getAccessToken = function(bearerToken) {
  console.log('Get access token started')
  // Adding `.lean()`, as we get a mongoose wrapper object back from `findOne(...)`, and oauth2-server complains.
  return OAuthTokensModel.findOne({ accessToken: bearerToken }).lean();
};

/**
 * Get client.
 */

module.exports.getClient = function(clientId, clientSecret) {
  console.log('Get client started : ' + clientId)

  return OAuthClientsModel.findOne({ clientId: clientId, clientSecret: clientSecret }).lean();
};

/**
 * Get refresh token.
 */

module.exports.getRefreshToken = function(refreshToken) {
  console.log('Get refresh token started')
  return OAuthTokensModel.findOne({ refreshToken: refreshToken }).lean();
};

/**
 * Get user.
 */

module.exports.getUser = function(username, password) {
  console.log('Get user started')
  return OAuthUsersModel.findOne({ username: username, password: password }).lean();
};


module.exports.generateAccessToken = function(client, user, scope)
{
  var token;
  if (user.twoFactorEnabled)
    token = jwt.sign({ clientId : client._id, id: user._id, roles : user.roles, scope : scope, authenticated : false }, config.secret, {
    expiresIn: 300 // expires in 5 minutes
  });
  else
  {
    token = jwt.sign({ clientId : client._id, id: user._id, roles : user.roles, scope : scope, authenticated : true }, config.secret, {
      expiresIn: 86400 // expires in 24 hours
    });
  }
  return token;
}

/**
 * Save token.
 */


module.exports.saveToken = function(token, client, user) {
  var accessToken = new OAuthTokensModel({
    accessToken: token.accessToken,
    accessTokenExpiresOn: token.accessTokenExpiresOn,
    client : client,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    refreshTokenExpiresOn: token.refreshTokenExpiresOn,
    user : user,
    userId: user._id,
  });
  // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
  return new Promise( function(resolve,reject){
    accessToken.save(function(err,data){
      if( err ) reject( err );
      else resolve( data );
    }) ;
  }).then(function(saveResult){
    // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
    saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;
    
    // Unsure what else points to `saveResult` in oauth2-server, making copy to be safe
    var data = new Object();
    for( var prop in saveResult ) data[prop] = saveResult[prop];
    
    // /oauth-server/lib/models/token-model.js complains if missing `client` and `user`. Creating missing properties.
    data.client = data.clientId;
    data.user = data.userId;

    return data;
  });
};

module.exports.saveAuthorizationCode = function(){
  console.log('how is this implemented!?', arguments);
};