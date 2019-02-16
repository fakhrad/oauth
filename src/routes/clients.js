var express = require('express');
var router = express.Router();
var ctrl = require('../controllers/clientController')
/**
 * @api {post} /clients/register Register a client in the platform
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
router.post("/register", oauth.authenticate(), ctrl.addClient());
module.exports = router;