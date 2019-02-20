const authserver = require('../authserver');
const model = require('../models/authmodel');
const oauth = new authserver({
    model: model,
    allowBearerTokensInQueryString: true,
    accessTokenLifetime: process.env.ACCESSTOKEN_LIFETIME || 4 * 60 * 60,
    allowExtendedTokenAttributes : true
  });
module.exports = oauth;