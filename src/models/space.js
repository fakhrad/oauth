/**
 * Module dependencies.
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
/**
 * Schema definitions.
 */

const space = new Schema({
  name: { type: String, required: true, max: 150, min: 3 },
  description: { type: String, max: 256 },
  image: { type: Object },
  type: { type: String },
  notification_email: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: "Systemuser", required: true },
  roles: [],
  locales: [],
  webhooks: []
});

space.methods.viewModel = function(cb) {
  return {
    id: this._id,
    roles: this.roles,
    locales: this.locales,
    name: this.name
  };
};
module.exports = mongoose.model("Space", space);
