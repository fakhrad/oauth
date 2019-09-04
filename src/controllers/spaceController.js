const Space = require("../models/space");
var uuid = require("uuid/v4");

var findByUserId = function(req, cb) {
  Space.find({ owner: req.body.userId }).exec(function(err, space) {
    var result = { success: false, data: null, error: null };
    if (err) {
      result.success = false;
      result.data = undefined;
      result.error = err;
      cb(result);
      return;
    }
    if (space) {
      result.success = true;
      result.error = undefined;
      result.data = space;
      cb(result);
    } else {
      result.success = false;
      result.data = undefined;
      result.error = undefined;
      cb(result);
    }
  });
};

var findById = function(req, cb) {
  Space.find({ id: req.body.id }).exec(function(err, space) {
    var result = { success: false, data: null, error: null };
    if (err) {
      result.success = false;
      result.data = undefined;
      result.error = err;
      cb(result);
      return;
    }
    if (space) {
      result.success = true;
      result.error = undefined;
      result.data = space;
      cb(result);
    } else {
      result.success = false;
      result.data = undefined;
      result.error = undefined;
      cb(result);
    }
  });
};
var addSpace = function(req, cb) {
  var space = new Space({
    name: req.body.name,
    description: req.body.description,
    image: req.body.icon,
    type: req.body.type,
    notification_email: req.body.notification_email,
    owner: req.body.owner
  });

  space.save(function(err) {
    var result = { success: false, data: null, error: null };
    if (err) {
      result.success = false;
      result.data = undefined;
      result.error = err;
      cb(result);
      return;
    }
    //Successfull.
    //Publish user registered event
    result.success = true;
    result.error = undefined;
    result.data = space;
    cb(result);
  });
};

var deleteSpace = function(req, cb) {
  Space.findById(req.body.id).exec(function(err, space) {
    var result = { success: false, data: null, error: null };
    if (err) {
      result.success = false;
      result.data = undefined;
      result.error = err;
      cb(result);
      return;
    }
    if (space) {
      Space.deleteOne(space, function(err) {
        if (err) {
          result.success = false;
          result.data = undefined;
          result.error = err;
          cb(result);
          return;
        }
        //Successfull.
        //Publish user account deleted event
        result.success = true;
        result.data = { message: "Deleted successfully" };
        result.error = undefined;
        cb(result);
        return;
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

var updateSpace = function(req, cb) {
  Space.findById(req.body.id).exec(function(err, space) {
    var result = { success: false, data: null, error: null };
    if (err) {
      result.success = false;
      result.data = undefined;
      result.error = err;
      cb(result);
      return;
    }
    if (space) {
      (space.name = req.body.name),
        (space.description = req.body.description),
        (space.image = req.body.image),
        (space.homepage = req.body.homepage),
        (space.type = req.body.type),
        (notification_email = req.body.notification_email),
        (space.owner = req.body.owner);
      space.save(function(err) {
        if (err) {
          result.success = false;
          result.data = undefined;
          result.error = err;
          cb(result);
          return;
        }
        //Successfull.
        //Publish user profile updated event
        Space.findById(req.body.id).exec(function(err, space) {
          if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
          }
          result.success = true;
          result.error = undefined;
          result.data = space;
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

var setLocales = function(req, cb) {
  Space.findById(req.body.id).exec(function(err, space) {
    console.log(space);
    var result = { success: false, data: null, error: null };
    if (err) {
      result.success = false;
      result.data = undefined;
      result.error = err;
      cb(result);
      return;
    }
    if (space) {
      (space.locales = req.body.locales), console.log("save space");
      space.save(function(err) {
        if (err) {
          result.success = false;
          result.data = undefined;
          result.error = err;
          cb(result);
          return;
        }
        console.log("return to user");
        //Successfull.
        //Publish user profile updated event
        Space.findById(req.body.id).exec(function(err, space) {
          if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
          }
          result.success = true;
          result.error = undefined;
          result.data = space;
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

var setWebhooks = function(req, cb) {
  Space.findById(req.body.id).exec(function(err, space) {
    console.log(space);
    var result = { success: false, data: null, error: null };
    if (err) {
      result.success = false;
      result.data = undefined;
      result.error = err;
      cb(result);
      return;
    }
    if (space) {
      (space.webhooks = req.body.webhooks),
        space.save(function(err) {
          if (err) {
            result.success = false;
            result.data = undefined;
            result.error = err;
            cb(result);
            return;
          }
          //Successfull.
          //Publish user profile updated event
          Space.findById(req.body.id).exec(function(err, space) {
            if (err) {
              result.success = false;
              result.data = undefined;
              result.error = err;
              cb(result);
              return;
            }
            result.success = true;
            result.error = undefined;
            result.data = space;
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

var getWebhooks = function(req, cb) {
  Space.findById(req.body.id).exec(function(err, space) {
    var result = { success: false, data: null, error: null };
    if (err) {
      result.success = false;
      result.data = undefined;
      result.error = err;
      cb(result);
      return;
    }
    if (space) {
      result.success = true;
      result.error = undefined;
      console.log(space);
      if (space.webhooks) result.data = space.webhooks;
      else result.data = [];
      cb(result);
    } else {
      result.success = false;
      result.data = undefined;
      result.error = undefined;
      cb(result);
    }
  });
};

var createUserSpace = function(req, cb) {
  ///Create user first app
  console.log("Create space for user");
  var space = req.body;
  console.log(space);
  Space.insertMany([space], (err, docs) => {
    if (err) {
      console.log(err);
    }
    if (cb) {
      var result = { success: false, data: null, error: null };
      if (err) {
        result.success = false;
        result.data = undefined;
        result.error = err;
        cb(result);
        return;
      }
      if (space) {
        result.success = true;
        result.error = undefined;
        result.data = docs;
        cb(result);
      } else {
        result.success = false;
        result.data = undefined;
        result.error = undefined;
        cb(result);
      }
    }
    console.log("space imported successfully");
  });
};
exports.createuserspace = createUserSpace;
exports.findByUserId = findByUserId;
exports.addSpace = addSpace;
exports.deleteSpace = deleteSpace;
exports.updateSpace = updateSpace;
exports.findbyid = findById;
exports.setLocales = setLocales;
exports.setWebhooks = setWebhooks;
exports.getWebhooks = getWebhooks;
