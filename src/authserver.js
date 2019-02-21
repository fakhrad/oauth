'use strict';

/**
 * Module dependencies.
 */

var NodeOAuthServer = require('auth-core');
var Promise = require('bluebird');
var Request = require('auth-core').Request;
var Response = require('auth-core').Response;

/**
 * Constructor.
 */

function authserver(options) {
  options = options || {};

  if (!options.model) {
    throw new error('Missing parameter: `model`');
  }

  this.useErrorHandler = options.useErrorHandler ? true : false;
  delete options.useErrorHandler;

  this.continueMiddleware = options.continueMiddleware ? true : false;
  delete options.continueMiddleware;

  this.server = new NodeOAuthServer(options);
}

/**
 * Authentication Middleware.
 *
 * Returns a middleware that will validate a token.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-7)
 */

authserver.prototype.authenticate = function(req, res, options) {
  var that = this;
  var request = new Request(req);
  var response = new Response(res);
  return Promise.bind(that)
    .then(function() {
      return this.server.authenticate(request, response, options);
    })
    .tap(function(token) {
      res.locals.oauth = { token: token };
      next();
    })
    .catch(function(e) {
      return handleError.call(this, e, req, res, null);
    });
};

/**
 * Authorization Middleware.
 *
 * Returns a middleware that will authorize a client to request tokens.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-3.1)
 */

authserver.prototype.authorize = function(req, res, options) {
  var that = this;
  var request = new Request(req);
  var response = new Response(res);

  return Promise.bind(that)
    .then(function() {
      return this.server.authorize(request, response, options);
    })
    .tap(function(code) {
      res.locals.oauth = { code: code };
      if (this.continueMiddleware) {
        next();
      }
    })
    .then(function() {
      return handleResponse.call(this, req, res, response);
    })
    .catch(function(e) {
      return handleError.call(this, e, req, res, response, next);
    });
};

/**
 * Grant Middleware.
 *
 * Returns middleware that will grant tokens to valid requests.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-3.2)
 */

authserver.prototype.token = function(req, res, options, callback) {
  var that = this;
  var request = new Request(req);
  var response = new Response(res);

  return Promise.bind(that)
    .then(function() {
      return this.server.token(request, response, options);
    })
    .tap(function(token) {
      res.locals = {};
      res.locals.oauth = { token: token };
      if (this.continueMiddleware) {
        next();
      }
    })
    .then(function() {
      return handleResponse.call(this, req, res, response, callback);
    })
    .catch(function(e) {
      return handleError.call(this, e, req, res, response, callback);
    });
};

/**
 * Handle response.
 */
var handleResponse = function(req, res, response, callback) {

  var result = {success : false, data : null, error : null, access_token : null, refresh_token : null, token_type : null };
  if (response.status === 302) {
    result.success = false;
    result.data = response.body;
    callback(result);
  } else {
    result.success = true;
    result.data = response.body;
    result.access_token = response.body.access_token;
    result.refresh_token = response.body.refresh_token;
    result.token_type = response.body.token;
    callback(result);
  }
};

/**
 * Handle error.
 */

var handleError = function(e, req, res, response, callback) {

  if (this.useErrorHandler === true) {
    callback(e);
  } else {
    if (response) {
      res.headers = (response.headers);
    }

    res.status = (e.code);

    callback({ error: e.name, error_description: e.message });
  }
};

/**
 * Export constructor.
 */

module.exports = authserver;