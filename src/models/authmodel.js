
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
require('./user');
require('./client');
require('./token');
var config = require('../config/config')
var jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const async = require('async')
const SALT_WORK_FACTOR = 10;

var OAuthTokensModel = mongoose.model('Tokens');
var OAuthClientsModel = mongoose.model('Clients');
var OAuthUsersModel = mongoose.model('Users');

/**
 * Get access token.
 */

module.exports.getAccessToken = function(bearerToken) {
  console.log('Get access token started')
  // Adding `.lean()`, as we get a mongoose wrapper object back from `findOne(...)`, and auth-core complains.
  return OAuthTokensModel.findOne({ accessToken: bearerToken }).lean();
};

/**
 * Get client.
 */

module.exports.getClient = function(clientId, clientSecret) {
  console.log('Get client started : ' + clientId)

  if (clientSecret)
    return OAuthClientsModel.findOne({ clientId: clientId, clientSecret: clientSecret }).lean();
  else
    return OAuthClientsModel.findOne({ clientId: clientId }).lean();
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

module.exports.getUser = async function(clientId, username, password) {
  console.log('Get user started');
  var user = await OAuthUsersModel.findOne({clientId : clientId, username: username }).lean();
  if (!user)
    return undefined;
  var b = bcrypt.compareSync(password, user.password);
  if (b)
  {
    return user;
  }
  return undefined;
}


module.exports.generateAccessToken = function(client, user, scope)
{
  var token;
  if(user)
  {
    if (user.twoFactorEnabled && !user.activation_code)
    {
        token = jwt.sign({ clientId : client._id, id: user._id, authenticated : false }, config.secret, {
        expiresIn: process.env.AUTHENTICATIONCODE_EXPIRE_TIME || 300 // expires in 5 minutes
      });
    }
    else
    {
      token = jwt.sign({ clientId : client._id, id: user._id, roles :ser.roles, scope : scope, authenticated : true }, config.secret, {
        expiresIn: process.env.TOKEN_EXPIRE_TIME || 86400// expires in 24 hours
      });
    }
  }
  else
  {
    token = jwt.sign({ clientId : client._id, scope : scope, authenticated : true }, config.secret, {
      expiresIn: process.env.TOKEN_EXPIRE_TIME || 86400 * 30// expires in 24 hours
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
    accessTokenExpiresOn: token.accessTokenExpiresAt,
    client : client,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    accessTokenExpiresOn: token.refreshTokenExpiresAt,
    user : user,
    userId: user ? user._id : undefined,
    twoFactorEnabled : user ? user.twoFactorEnabled : false
  });
  if (token.activation_code)
  {
    accessToken.activation_code = token.activation_code;
    accessToken.authenticated = token.authenticated;
  }
  else
  {
    accessToken.authenticated = true;
  }
  // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
  return new Promise( function(resolve,reject){
    accessToken.save(function(err,data){
      if( err ) reject( err );
      else resolve( data );
    }) ;
  }).then(function(saveResult){
    // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
    saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;
    
    // Unsure what else points to `saveResult` in auth-core, making copy to be safe
    var data = new Object();
    for( var prop in saveResult ) data[prop] = saveResult[prop];
    
    // /oauth-server/lib/models/token-model.js complains if missing `client` and `user`. Creating missing properties.
    data.client = data.clientId;
    if (saveResult.authenticated === false)
      data.activation_code = saveResult.activation_code;
    data.user = data.userId;

    return data;
  });
};

module.exports.saveAuthorizationCode = function(){
  var accessToken = new OAuthTokensModel({
    accessToken: token.accessToken,
    accessTokenExpiresOn: token.accessTokenExpiresOn,
    client : client,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    refreshTokenExpiresOn: token.refreshTokenExpiresOn,
    user : user,
    userId: user ? user._id : undefined,
    twoFactorEnabled : user ? user.twoFactorEnabled : false
  });
  if (user.twoFactorEnabled)
  {
    accessToken.authenticated = false;
    accessToken.activation_code = getNewCode(accessToken.userId);
  }
  // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
  return new Promise( function(resolve,reject){
    accessToken.save(function(err,data){
      if( err ) reject( err );
      else resolve( data );
    }) ;
  }).then(function(saveResult){
    // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
    saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;
    
    // Unsure what else points to `saveResult` in auth-core, making copy to be safe
    var data = new Object();
    for( var prop in saveResult ) data[prop] = saveResult[prop];
    
    // /oauth-server/lib/models/token-model.js complains if missing `client` and `user`. Creating missing properties.
    data.client = data.clientId;
    if (saveResult.authenticated === false)
      data.activation_code = saveResult.activation_code;
    data.user = data.userId;

    return data;
  });
};

module.exports.getAuthorizationCode = function(code){
  console.log('auth code');
  return OAuthTokensModel.findOne({ accessToken: code }).lean();
}

module.exports.revokeAuthorizationCode = function(code){
  OAuthTokensModel.findOneAndRemove({ accessToken: code });
  console.log('auth code revoked');
  return code;
}