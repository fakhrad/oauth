/**
 * Module dependencies.
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

/**
 * Schema definitions.
 */

mongoose.model(
  "Tokens",
  new Schema({
    accessToken: { type: String },
    accessTokenExpiresOn: { type: Date },
    client: { type: Object }, // `client` and `user` are required in multiple places, for example `getAccessToken()`
    clientId: { type: String },
    refreshToken: { type: String },
    refreshTokenExpiresOn: { type: Date },
    user: { type: Object },
    userId: { type: String },
    authenticated: { type: Boolean },
    activation_code: { type: Number },
    token: { type: String },
    issueDate: { type: Date, default: new Date() }
  })
);
