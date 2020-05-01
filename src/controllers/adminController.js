var User = require('../models/adminuser');
var jwt = require('jsonwebtoken');
var async = require('async');
const config = require('../config/config');
var mongoose = require('mongoose');
var Space = require('../models/space');
var Tokens = require('../models/token');
var signupevent = require('../events/onAdminUserRegistered');
var tokencreatedevent = require('../events/onAdminTokenCreated');
var userloggedout = require('../events/onAdminUserLoggedout');
var broker = require('../rpcserver');

var findById = function (req, cb) {
    async.parallel({
        "user": function (callback) {
            User.findById(req.body.id).exec(callback)
        },
        "spaces": function (callback) {
            Space.find({
                owner: req.body.id
            }).exec(callback)
        }
    }, (err, results) => {
        var result = {
            success: false,
            data: null,
            error: null
        };
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
        } else {
            if (results.user) {
                result.success = true;
                result.error = undefined;
                var output = results.user.viewModel();
                output.spaces = [];
                console.log(results.spaces);
                if (results.spaces) {
                    results.spaces.forEach(space => {
                        output.spaces.push(space.viewModel());
                    });
                }
                result.data = output;
                cb(result);
                return;
            } else {
                result.success = false;
                result.data = undefined;
                result.error = "User not found";
                cb(result);
                return;
            }
        }
    })
};


var generateToken = function (client, authenticated, expireTime, scope) {
    var token;
    token = jwt.sign({
            clientId: client,
            scope: scope,
            authenticated: authenticated
        },
        config.secret, {
            expiresIn: expireTime
        }
    );
    return token;
};
var token = function (req, cb) {
    console.log(req);
    var result = {
        success: false,
        data: null,
        error: null,
        access_token: null
    };
    User.findOne({
        username: req.body.username
    }).exec(function (err, user) {
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = "Invalid username or password.";
            cb(result);
            return;
        }
        if (user) {
            // if (!user.emailConfirmed)
            // {
            //     result.success = false;
            //     result.data =  undefined;
            //     result.error = "Your email not confirmed yet. Please continue from the link in your email.";
            //     cb(result);  
            //     return;
            // }
            user.comparePassword(req.body.password, (err, isMatch) => {
                if (isMatch) {
                    token = jwt.sign({
                        id: user._id,
                        account_type: user.account_type
                    }, config.secret, {
                        expiresIn: process.env.AUTHENTICATIONTOKEN_EXPIRE_TIME || 30 * 24 * 60 * 60 // expires in 5 minutes
                    });
                    user.lastlogin = new Date();
                    user.access_token = token;
                    user.save(function (err) {
                        if (err) {
                            result.success = false;
                            result.data = undefined;
                            result.error = err;
                            cb(result);
                            return;
                        }
                        tokencreatedevent.onAdminTokenCreated().call(user.integrationModel());
                        //Successfull. 
                        result.success = true;
                        result.error = undefined;
                        result.data = user;
                        result.access_token = token;
                        cb(result);
                    });

                } else {
                    result.success = false;
                    result.data = undefined;
                    result.error = "Invalid password";
                    cb(result);
                    return;
                }
            });
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
        }
    });
};

var logout = function (req, cb) {
    User.findById(req.body.id).exec(function (err, user) {
        var result = {
            success: false,
            data: null,
            error: null
        };
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
        }
        if (user) {
            user.access_token = undefined;
            user.save(function (err) {
                if (err) {
                    result.success = false;
                    result.data = undefined;
                    result.error = err;
                    cb(result);
                    return;
                }
                //Successfull. 
                //Publish user logged out event
                userloggedout.onAdminUserLoggedout().call(user);
            });
            return;
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
            return;
        }
    });
};
var findByUserName = function (req, cb) {
    console.log(req.body.username);
    User.findOne({
        'username': req.body.username
    }).exec(function (err, user) {
        var result = {
            success: false,
            data: null,
            error: null
        };
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
        }
        if (user) {
            result.success = true;
            result.error = undefined;
            result.data = user;
            cb(result);
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
            return;
        }
    });
};
var registerUser = function (req, cb) {
    var user = new User({
        username: req.body.username,
        password: req.body.password,
        account_type: req.body.account_type,
        roles: ["owner"],
        profile: {
            first_name: req.body.first_name ? req.body.first_name : null,
            last_name: req.body.last_name ? req.body.last_name : null,
            avatar: req.body.avatar ? req.body.avatar : null,
        }
    });
    user.save(function (err) {
        var result = {
            success: false,
            data: null,
            error: null
        };
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
        }
        //Successfull. 
        //Publish user registered event
        user.password = undefined;
        user.access_token = generateToken(user._id, true, 5 * 60 * 60, "verify");
        signupevent.onAdminUserRegistered().call(user);
        result.success = true;
        result.error = undefined;
        result.data = user;
        cb(result);
    });
};

var addUser = function (req, cb) {
    var user = new User({
        username: req.body.username,
        password: req.body.password,
        account_type: req.body.account_type,
        roles: req.body.roles,
        profile: {
            first_name: req.body.first_name ? req.body.first_name : null,
            last_name: req.body.last_name ? req.body.last_name : null,
            avatar: req.body.avatar ? req.body.avatar : null,
        }
    });
    user.save(function (err) {
        var result = {
            success: false,
            data: null,
            error: null
        };
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
        }
        //Successfull. 
        //Add to space users
        if (req.spaceId) {
            Space.findById(req.spaceId).exec((err, space) => {
                if (err) {
                    result.success = false;
                    result.data = undefined;
                    result.error = err;
                    cb(result);
                    return;
                }
                space.users = space.users || [];
                space.users.push(user._id);
                space.save(function (err) {
                    if (err) {
                        result.success = false;
                        result.data = undefined;
                        result.error = err;
                        cb(result);
                        return;
                    }
                    //Successfull. 
                    user.password = undefined;
                    result.success = true;
                    result.error = undefined;
                    result.data = user;
                    cb(result);
                });
            });
        } else {
            user.password = undefined;
            result.success = true;
            result.error = undefined;
            result.data = user;
            cb(result);
        }
    });
};
var changeAvatar = function (req, cb) {
    User.findById(req.body.id).exec(function (err, user) {
        var result = {
            success: false,
            data: null,
            error: null
        };
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
        }
        if (user) {
            if (user.profile === undefined)
                user.profile = {};
            var p = {};
            p.avatar = req.body.avatar;
            p.first_name = user.profile.first_name;
            p.last_name = user.profile.last_name;

            user.profile = p;
            user.save(function (err) {
                if (err) {
                    result.success = false;
                    result.data = undefined;
                    result.error = err;
                    cb(result);
                    return;
                }
                //Successfull. 
                //Publish user avatar changed event
                User.findById(req.body.id).exec(function (err, user) {
                    if (err) {
                        result.success = false;
                        result.data = undefined;
                        result.error = err;
                        cb(result);
                        return;
                    }
                    result.success = true;
                    result.error = undefined;
                    result.data = user.viewModel();
                    cb(result);
                });
            });
            return;
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
            return;
        }
    });
};

var changeNotification = function (req, cb) {
    User.findById(req.body.id).exec(function (err, user) {
        var result = {
            success: false,
            data: null,
            error: null
        };
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
        }
        if (user) {
            if (user.profile === undefined)
                user.profile = {};
            var p = {};
            p.notification = req.body.notification;
            p.avatar = user.profile.avatar;
            p.first_name = user.profile.first_name;
            p.last_name = user.profile.last_name;
            user.profile = p;
            user.save(function (err) {
                if (err) {
                    result.success = false;
                    result.data = undefined;
                    result.error = err;
                    cb(result);
                    return;
                }
                //Successfull. 
                //Publish user avatar changed event
                User.findById(req.body.id).exec(function (err, user) {
                    if (err) {
                        result.success = false;
                        result.data = undefined;
                        result.error = err;
                        cb(result);
                        return;
                    }
                    result.success = true;
                    result.error = undefined;
                    result.data = user.viewModel();
                    cb(result);
                });
            });
            return;
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
            return;
        }
    });
};

var updateProfile = function (req, cb) {
    User.findById(req.userId).exec(function (err, user) {
        var result = {
            success: false,
            data: null,
            error: null
        };
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
        }
        if (user) {
            if (user.profile === undefined)
                user.profile = {};
            var p = {};
            p.notification = user.profile.notification;
            p.avatar = user.profile.avatar;
            p.first_name = req.body.first_name;
            p.last_name = req.body.last_name;

            user.profile = p;
            user.save(function (err) {
                if (err) {
                    result.success = false;
                    result.data = undefined;
                    result.error = err;
                    cb(result);
                    return;
                }
                //Successfull. 
                //Publish user profile updated event
                User.findById(req.userId).exec(function (err, user) {
                    if (err) {
                        result.success = false;
                        result.data = undefined;
                        result.error = err;
                        cb(result);
                        return;
                    }
                    result.success = true;
                    result.error = undefined;
                    result.data = user.viewModel();
                    cb(result);
                });
            });
            return;
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
            return;
        }
    });
};

var deleteaccount = function (req, cb) {
    console.log(req);
    User.findById(req.body.id).exec(function (err, user) {
        var result = {
            success: false,
            data: null,
            error: null
        };
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
        }
        if (user) {
            User.deleteOne({
                "_id": user._id
            }, function (err) {
                if (err) {
                    result.success = false;
                    result.data = undefined;
                    result.error = err;
                    cb(result);
                    return;
                }
                //Successfull. 
                //Publish user account deleted event and remove all storages
                result.success = true;
                result.data = {
                    "message": "Deleted successfully"
                };
                result.error = undefined;
                cb(result);
                return;
            });
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
            return;
        }
    });
};

var sendVerifyCode = function (email, code) {
    try {
        broker
            .publish("messaging", "sendEmailMessage", {
                body: {
                    to: email,
                    from: "info@reqter.com",
                    subject: "Reqter activation code",
                    text: "Dear Customer,\n\rYour activation code is : " + code.toString()
                }
            });
        console.log("Code(" + code + ") successfully sent to " + email);
    } catch {
        console.log("Error sending code(" + code + ") to " + email);

    }
};

function getNewCode(phoneNumber) {
    var min = 10001;
    var max = 99999;
    var code = Math.floor(Math.random() * (max - min)) + min;
    //Sent code to the phone
    return code;
}

var getforgotpasswordtoken = function (req, cb) {
    console.log(req);
    var result = {
        success: false,
        data: null,
        error: null,
        access_token: undefined
    };
    User.findOne({
        username: req.body.username
    }).exec(function (err, user) {
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = "Invalid username.";
            cb(result);
            return;
        }
        if (user) {
            var accessToken = new Tokens({
                accessToken: generateToken(req.clientId, false, 5 * 60 * 60, "verify"),
                accessTokenExpiresOn: process.env.TEMP_TOKEN_EXPIRE_TIME || 5 * 60 * 60,
                refreshToken: undefined,
                accessTokenExpiresOn: undefined,
                userId: user._id,
                issueDate: new Date(),
                role: "admin"
            });
            accessToken.activation_code = getNewCode();
            accessToken.authenticated = false;
            // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
            return new Promise(function (resolve, reject) {
                accessToken.save(function (err, data) {
                    if (err) reject(err);
                    else resolve(data);
                });
            }).then(function (saveResult) {
                // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
                saveResult =
                    saveResult && typeof saveResult == "object" ?
                    saveResult.toJSON() :
                    saveResult;
                console.log(saveResult);
                //Send activation code to user phone
                // sendVerifyCode(
                //     req.body.username,
                //     saveResult.activation_code
                // );
                cb({
                    success: true,
                    data: {
                        code: saveResult.activation_code,
                        message: "Code generated and sent to your email"
                    }
                });
                return saveResult;
            });
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
        }
    });
};

var verifyCode = function (req, cb) {
    console.log(req);
    var result = {
        success: false,
        data: null,
        error: null,
        access_token: null
    };
    User.findOne({
        username: req.body.username
    }).exec(function (err, user) {
        if (err) {
            console.log(err);
            result.success = false;
            result.data = undefined;
            result.error = "Invalid username.";
            cb(result);
            return;
        }
        if (user) {
            console.log(user);
            Tokens.findOne({
                userId: user._id,
                activation_code: req.body.code,
                authenticated: false
            }).exec(function (err, tkn) {
                var result = {
                    success: false,
                    message: undefined,
                    error: "Invalid code"
                };
                if (err) {
                    console.log(err);
                    cb(result);
                    return;
                }
                if (tkn) {
                    console.log("token found");

                    var token = generateToken(
                        user._id,
                        true,
                        30 * 24 * 60 * 60,
                        "read/write"
                    );
                    var accessToken = new Tokens({
                        accessToken: token,
                        accessTokenExpiresOn: process.env.TEMP_TOKEN_EXPIRE_TIME || 30 * 24 * 60 * 60,
                        refreshToken: tkn.accessToken,
                        accessTokenExpiresOn: undefined,
                        userId: user._id,
                        authenticated: true
                    });
                    tkn.remove(() => {
                        console.log("Token removed : " + tkn);
                    });
                    console.log("token removed");

                    accessToken.save((err, data) => {
                        if (err) {
                            console.log(err);
                            cb({
                                success: false,
                                error: "Unable to generate token"
                            });
                            return;
                        }
                        cb({
                            success: true,
                            access_token: token,
                            expiresIn: 30 * 24 * 60 * 60
                        });
                    });
                } else {
                    console.log("token not found");

                    cb({
                        success: false,
                        error: "Invalid code"
                    });
                }
            });
        } else {
            result.success = false;
            result.data = undefined;
            result.error = "User not found";
            cb(result);
        }
    });
};
var resetpassword = function (req, cb) {
    console.log(req);
    var result = {
        success: false,
        data: null,
        error: null,
        access_token: null
    };
    User.findById(req.body.id).exec(function (err, user) {
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = "Invalid user.";
            cb(result);
            return;
        }
        if (user) {
            user.password = req.body.newpassword;
            user.save(function (err) {
                if (err) {
                    result.success = false;
                    result.data = undefined;
                    result.error = err;
                    cb(result);
                    return;
                }
                //Successfull. 
                result.success = true;
                result.error = undefined;
                result.data = user.viewModel();
                cb(result);
            });
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
        }
    });
};

var confirmEmail = function (req, cb) {
    var result = {
        success: false,
        data: null,
        error: null,
        access_token: null
    };
    User.findById(req.body.id).exec(function (err, user) {
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = "Invalid user.";
            cb(result);
            return;
        }
        if (user) {
            console.log("confirming email");
            user.confirmEmail((err) => {
                if (err) {
                    result.success = false;
                    result.data = undefined;
                    result.error = err;
                    cb(result);
                    return;
                }
                result.success = true;
                result.data = user.viewModel();
                result.error = undefined;
                cb(result);
                return;
            });
        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
        }
    });
};

var changepassword = function (req, cb) {
    console.log(req);
    var result = {
        success: false,
        data: null,
        error: null,
        access_token: null
    };
    User.findById(req.body.id).exec(function (err, user) {
        if (err) {
            result.success = false;
            result.data = undefined;
            result.error = "Invalid user.";
            cb(result);
            return;
        }
        if (user) {
            user.comparePassword(req.body.oldpassword, (err, isMatch) => {
                if (isMatch) {
                    user.password = req.body.newpassword;
                    user.save(function (err) {
                        if (err) {
                            result.success = false;
                            result.data = undefined;
                            result.error = err;
                            cb(result);
                            return;
                        }
                        //Successfull. 
                        result.success = true;
                        result.error = undefined;
                        result.data = user.viewModel();
                        cb(result);
                    });
                } else {
                    result.success = false;
                    result.data = undefined;
                    result.error = "Invalid old password.";
                    cb(result);
                }
            });

        } else {
            result.success = false;
            result.data = undefined;
            result.error = undefined;
            cb(result);
        }
    });
};
//Export functions
exports.token = token;
exports.findbyemail = findByUserName;
exports.registeruser = registerUser;
exports.adduser = addUser;
exports.changeavatar = changeAvatar;
exports.changenotification = changeNotification;
exports.findbyId = findById;
exports.updateprofile = updateProfile;
exports.deleteaccount = deleteaccount;
exports.getforgotpasswordtoken = getforgotpasswordtoken;
exports.changepassword = changepassword;
exports.resetpassword = resetpassword;
exports.confirmemail = confirmEmail;
exports.logout = logout;
exports.verifyCode = verifyCode;