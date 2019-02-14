var express = require('express');
var router = express.Router();
var oauth = require('../config/init-auth')
/**
 * @api {post} /oauth/token Get token(login)
 * @apiName Token
 * @apiGroup Oauth
 *
 *
 * @apiSuccessExample Success Response 
HTTP/1.1 200 OK
{
    
}
 *
* @apiErrorExample Servr Error
HTTP/1.1 500 Internal server error
 {
    "success": false,
    "error" : {
       //error details
    }
 }

 */
router.post("/token", oauth.token());
module.exports = router;